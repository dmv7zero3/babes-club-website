"""Babes Club Stripe webhook Lambda entrypoint (commerce shared layer integration)."""

from __future__ import annotations

import base64
import binascii
import json
import logging
import os
import re
import time
from typing import Any, Dict

import stripe  # type: ignore[attr-defined]
from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    CORS_ALLOW_ORIGIN_ENV,
    EVENT_TTL_ENV,
    STRIPE_WEBHOOK_TOLERANCE_ENV,
    get_commerce_table,
    get_env_int,
    get_session_pointer,
    get_stripe_secret,
    get_stripe_webhook_secret,
    ensure_decimal,
    json_response,
    now_utc_iso,
    record_event,
    update_session_status,
)


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


def _redact_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of the event without bodies or sensitive headers."""

    request_context = event.get("requestContext") or {}
    headers = event.get("headers") or {}

    redacted = {
        "httpMethod": event.get("httpMethod"),
        "path": event.get("path"),
        "queryStringParameters": event.get("queryStringParameters"),
        "requestContext": {
            "identity": request_context.get("identity", {}),
            "requestId": request_context.get("requestId"),
        },
        "headers": {
            key: value
            for key, value in headers.items()
            if key.lower() in {"user-agent", "x-forwarded-for", "x-api-gateway-key"}
        },
    }

    return redacted


_ALLOWED_ORIGINS_CACHE: list[str] | None = None
_STRIPE_INITIALIZED = False


def _get_allowed_origins() -> list[str]:
    global _ALLOWED_ORIGINS_CACHE  # pylint: disable=global-statement
    if _ALLOWED_ORIGINS_CACHE is not None:
        return _ALLOWED_ORIGINS_CACHE

    raw = os.getenv(CORS_ALLOW_ORIGIN_ENV, "")
    if not raw:
        _ALLOWED_ORIGINS_CACHE = []
        return _ALLOWED_ORIGINS_CACHE

    tokens = [token.strip() for token in re.split(r"[,\s]+", raw) if token.strip()]
    _ALLOWED_ORIGINS_CACHE = tokens
    return tokens


def _resolve_cors_origin(event: Dict[str, Any]) -> str:
    allowed = _get_allowed_origins()
    if not allowed:
        return os.getenv(CORS_ALLOW_ORIGIN_ENV, "*")

    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")
    if origin and origin in allowed:
        return origin

    return allowed[0]


def _build_response(status_code: int, payload: Dict[str, Any], cors_origin: str) -> Dict[str, Any]:
    response = json_response(status_code, payload, cors_origin=cors_origin)
    response.setdefault("headers", {})["Vary"] = "Origin"
    return response


def _error(status_code: int, message: str, cors_origin: str) -> Dict[str, Any]:
    return _build_response(status_code, {"error": message}, cors_origin)


def _initialize_stripe_if_needed() -> bool:
    global _STRIPE_INITIALIZED  # pylint: disable=global-statement
    if _STRIPE_INITIALIZED:
        return True

    secret = get_stripe_secret(optional=True)
    if not secret:
        return False

    stripe.api_key = secret
    _STRIPE_INITIALIZED = True
    return True


def _get_raw_body(event: Dict[str, Any]) -> str:
    body = event.get("body")
    is_base64 = event.get("isBase64Encoded", False)

    if body is None:
        return ""

    if isinstance(body, str):
        if is_base64:
            decoded = base64.b64decode(body)
            return decoded.decode("utf-8")
        return body

    if isinstance(body, (bytes, bytearray)):
        data = bytes(body)
        if is_base64:
            data = base64.b64decode(data)
        return data.decode("utf-8")

    return json.dumps(body)


def _extract_signature_header(event: Dict[str, Any]) -> str | None:
    headers = event.get("headers") or {}
    for key in ("Stripe-Signature", "stripe-signature", "STRIPE-SIGNATURE"):
        value = headers.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    for key, value in headers.items():
        if isinstance(key, str) and key.lower() == "stripe-signature" and isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _to_plain_dict(value: Any) -> Dict[str, Any]:
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()  # type: ignore[no-any-return]
    if isinstance(value, dict):
        return value
    if hasattr(value, "items"):
        try:
            return dict(value.items())  # type: ignore[call-arg]
        except Exception:  # pragma: no cover - defensive fallback
            return {}
    return {}


def _summarize_event_object(data_object: Dict[str, Any]) -> Dict[str, Any]:
    metadata_raw = data_object.get("metadata")
    metadata_summary: Dict[str, Any] = {}
    if isinstance(metadata_raw, dict):
        for key, value in metadata_raw.items():
            try:
                metadata_summary[str(key)] = str(value)[:500]
            except Exception:  # pragma: no cover - defensive conversion
                continue

    customer_details = _to_plain_dict(data_object.get("customer_details")) if data_object.get("customer_details") else {}
    customer_email = customer_details.get("email") or data_object.get("customer_email")

    summary = {
        "status": data_object.get("status"),
        "paymentStatus": data_object.get("payment_status"),
        "amountTotal": data_object.get("amount_total"),
        "amountSubtotal": data_object.get("amount_subtotal"),
        "currency": data_object.get("currency"),
        "customer": data_object.get("customer"),
        "customerEmail": customer_email,
        "paymentIntent": data_object.get("payment_intent"),
        "metadata": metadata_summary or None,
    }

    return {key: value for key, value in summary.items() if value is not None}


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        logger.debug("stripe-webhook event (redacted): %s", json.dumps(_redact_event(event)))
    except Exception:  # pragma: no cover - defensive logging only
        logger.warning("stripe-webhook event logging failed")

    cors_origin = _resolve_cors_origin(event)

    method = (event.get("httpMethod") or "POST").upper()
    if method == "OPTIONS":
        return _build_response(200, {"ok": True}, cors_origin)
    if method != "POST":
        return _error(405, "Method not allowed", cors_origin)

    try:
        raw_body = _get_raw_body(event)
    except (ValueError, UnicodeDecodeError, binascii.Error) as exc:  # pragma: no cover - defensive decoding
        logger.warning("Failed to decode Stripe webhook body", extra={"error": str(exc)})
        return _error(400, "Invalid request body", cors_origin)

    signature_header = _extract_signature_header(event)
    if not signature_header:
        return _error(400, "Missing Stripe-Signature header", cors_origin)

    webhook_secret = get_stripe_webhook_secret(optional=False)
    if not webhook_secret:
        logger.error("Stripe webhook secret is not configured")
        return _error(500, "Webhook service misconfigured", cors_origin)

    tolerance_env = os.getenv(STRIPE_WEBHOOK_TOLERANCE_ENV)
    try:
        tolerance = int(tolerance_env) if tolerance_env else 300
    except (TypeError, ValueError):
        tolerance = 300

    try:
        stripe_event = stripe.Webhook.construct_event(
            payload=raw_body,
            sig_header=signature_header,
            secret=webhook_secret,
            tolerance=tolerance,
        )
    except stripe.error.SignatureVerificationError as exc:  # type: ignore[attr-defined]
        logger.warning("Stripe signature verification failed", extra={"error": str(exc)})
        return _error(400, "Invalid Stripe signature", cors_origin)
    except (ValueError, TypeError) as exc:
        logger.warning("Stripe webhook payload invalid", extra={"error": str(exc)})
        return _error(400, "Invalid Stripe payload", cors_origin)

    event_dict = stripe_event.to_dict_recursive() if hasattr(stripe_event, "to_dict_recursive") else dict(stripe_event)
    event_id = event_dict.get("id")
    event_type = event_dict.get("type")

    if not isinstance(event_id, str) or not event_id:
        return _error(400, "Stripe event id is required", cors_origin)
    if not isinstance(event_type, str) or not event_type:
        return _error(400, "Stripe event type is required", cors_origin)

    table = get_commerce_table()

    existing = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"}).get("Item")
    if existing:
        return _build_response(200, {"status": existing.get("status", "already-processed")}, cors_origin)

    data_object_raw = ((event_dict.get("data") or {}).get("object") or {})
    data_object = _to_plain_dict(data_object_raw)

    session_id_raw = data_object.get("id") or data_object.get("session_id")
    session_id = session_id_raw if isinstance(session_id_raw, str) and session_id_raw else None

    status_map = {
        "checkout.session.completed": "completed",
        "checkout.session.expired": "expired",
        "checkout.session.async_payment_failed": "failed",
        "checkout.session.async_payment_succeeded": "completed",
        "checkout.session.async_payment_pending": "pending",
        "checkout.session.canceled": "canceled",
    }
    derived_status = status_map.get(event_type, "received")

    processed_at = now_utc_iso()
    ttl_days = get_env_int(EVENT_TTL_ENV, 90)
    expires_at = int(time.time()) + max(1, ttl_days) * 86400

    quote_signature: str | None = None
    session_pointer: Dict[str, Any] | None = None
    if session_id:
        session_pointer = get_session_pointer(session_id, table=table)
        if session_pointer:
            quote_signature_raw = session_pointer.get("quoteSignature")
            if isinstance(quote_signature_raw, str) and quote_signature_raw:
                quote_signature = quote_signature_raw

    metadata_from_event = _to_plain_dict(data_object.get("metadata")) if data_object.get("metadata") else {}
    if not quote_signature:
        meta_quote_signature = metadata_from_event.get("quoteSignature") or metadata_from_event.get("quote_signature")
        if isinstance(meta_quote_signature, str) and meta_quote_signature:
            quote_signature = meta_quote_signature

    remote_session_data: Dict[str, Any] | None = None
    if session_id and (not quote_signature or not metadata_from_event):
        if _initialize_stripe_if_needed():
            try:
                remote_session_obj = stripe.checkout.Session.retrieve(session_id)
                remote_session_data = _to_plain_dict(remote_session_obj)
            except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
                logger.debug("Unable to retrieve Stripe session", extra={"error": str(exc)})

    if remote_session_data:
        remote_metadata = _to_plain_dict(remote_session_data.get("metadata")) if remote_session_data.get("metadata") else {}
        if not metadata_from_event and remote_metadata:
            metadata_from_event = remote_metadata
        if not quote_signature:
            meta_quote_signature = remote_metadata.get("quoteSignature") or remote_metadata.get("quote_signature")
            if isinstance(meta_quote_signature, str) and meta_quote_signature:
                quote_signature = meta_quote_signature
        data_object.setdefault("url", remote_session_data.get("url"))
        data_object.setdefault("payment_status", remote_session_data.get("payment_status"))
        data_object.setdefault("status", remote_session_data.get("status"))
        data_object.setdefault("amount_total", remote_session_data.get("amount_total"))
        data_object.setdefault("amount_subtotal", remote_session_data.get("amount_subtotal"))
        data_object.setdefault("currency", remote_session_data.get("currency"))
        data_object.setdefault("customer", remote_session_data.get("customer"))
        data_object.setdefault("customer_email", remote_session_data.get("customer_email"))
        data_object.setdefault("payment_intent", remote_session_data.get("payment_intent"))

    customer_details = _to_plain_dict(data_object.get("customer_details")) if data_object.get("customer_details") else {}
    customer_email = customer_details.get("email") or data_object.get("customer_email")

    status_attributes = {
        "stripeStatus": data_object.get("status"),
        "stripePaymentStatus": data_object.get("payment_status"),
        "stripeCustomerId": data_object.get("customer"),
        "stripeCustomerEmail": customer_email,
        "stripePaymentIntentId": data_object.get("payment_intent"),
        "stripeAmountTotal": data_object.get("amount_total"),
        "stripeAmountSubtotal": data_object.get("amount_subtotal"),
        "stripeCurrency": data_object.get("currency"),
        "stripeMetadata": metadata_from_event or None,
        "stripeCheckoutUrl": data_object.get("url"),
    }

    completion_events = {"checkout.session.completed", "checkout.session.async_payment_succeeded"}
    if event_type in completion_events:
        status_attributes["stripeCompletedAt"] = processed_at

    cleaned_status_attributes = {k: v for k, v in status_attributes.items() if v is not None}

    if quote_signature and session_id:
        update_session_status(
            quote_signature,
            session_id,
            derived_status,
            processed_at,
            table=table,
            extra_session_attributes=ensure_decimal(cleaned_status_attributes) if cleaned_status_attributes else None,
        )

    event_item = ensure_decimal(
        {
            "PK": f"EVENT#{event_id}",
            "SK": "METADATA",
            "eventType": event_type,
            "processedAt": processed_at,
            "sessionId": session_id,
            "status": derived_status,
            "quoteSignature": quote_signature,
            "expiresAt": expires_at,
            "stripeSummary": _summarize_event_object(data_object),
            "signatureVerified": True,
        }
    )

    record_event(event_item, table=table)

    response_payload = {
        "status": derived_status,
        "sessionId": session_id,
        "eventId": event_id,
    }
    if quote_signature:
        response_payload["quoteSignature"] = quote_signature

    return _build_response(200, response_payload, cors_origin)
