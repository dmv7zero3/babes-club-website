"""Babes Club checkout session Lambda entrypoint (commerce shared layer integration)."""

from __future__ import annotations

import json
import logging
import os
import re
import time
        'arn:aws:lambda:us-east-1:752567131183:layer:babesclub-shared-commerce:7',
from typing import Any, Dict, Iterable, List, Optional

import stripe  # type: ignore[attr-defined]
from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    CORS_ALLOW_ORIGIN_ENV,
    SESSION_TTL_ENV,
    CHECKOUT_SUCCESS_URL_ENV,
    CHECKOUT_CANCEL_URL_ENV,
    CHECKOUT_MODE_ENV,
    CHECKOUT_ALLOW_PROMOTION_CODES_ENV,
    CHECKOUT_AUTOMATIC_TAX_ENV,
    check_rate_limit,
    ensure_decimal,
    get_commerce_table,
    get_env_int,
    get_latest_quote_for_hash,
    get_quote_pointer,
    get_stripe_secret,
    json_response,
    normalize_decimal_tree,
    now_utc_iso,
    parse_json_body,
    put_session_records,
)


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


def _redact_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of the event without the request body or sensitive headers."""

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


def _initialize_stripe_if_needed(*, required: bool = False) -> bool:
    global _STRIPE_INITIALIZED  # pylint: disable=global-statement
    if _STRIPE_INITIALIZED:
        return True

    secret = get_stripe_secret(optional=not required)
    if not secret:
        return False

    stripe.api_key = secret
    _STRIPE_INITIALIZED = True
    return True


def _coerce_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        token = value.strip().lower()
        if token in {"1", "true", "yes", "on"}:
            return True
        if token in {"0", "false", "no", "off"}:
            return False
    if isinstance(value, (int, float)):
        return bool(value)
    return None


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    coerced = _coerce_bool(raw)
    return coerced if coerced is not None else default


def _parse_quantity(value: Any) -> int:
    try:
        quantity = int(value)
    except (TypeError, ValueError):
        quantity = 1
    return max(1, quantity)


def _resolve_url(payload: Dict[str, Any], key: str, env_name: str, default_value: str) -> str:
    candidate = payload.get(key)
    if isinstance(candidate, str) and candidate.strip():
        return candidate.strip()
    env_value = os.getenv(env_name)
    if env_value:
        return env_value
    return default_value


def _resolve_checkout_mode(payload: Dict[str, Any]) -> str:
    mode_candidate = payload.get("mode") or os.getenv(CHECKOUT_MODE_ENV) or "payment"
    if isinstance(mode_candidate, str):
        normalized = mode_candidate.strip().lower()
        if normalized in {"payment", "setup", "subscription"}:
            return normalized
    return "payment"


def _sanitize_metadata(raw_metadata: Any, *, limit: int = 20) -> Dict[str, str]:
    if not isinstance(raw_metadata, dict):
        return {}
    sanitized: Dict[str, str] = {}
    for key, value in raw_metadata.items():
        if len(sanitized) >= limit:
            break
        try:
            str_key = str(key)
            str_val = str(value) if value is not None else ""
        except Exception:  # pragma: no cover - defensive conversion
            continue
        if not str_key:
            continue
        sanitized[str_key[:40]] = str_val[:500]
    return sanitized


def _build_line_items(items: Iterable[Any], *, default_currency: str) -> List[Dict[str, Any]]:
    line_items: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue

        price_id = item.get("stripePriceId") or item.get("priceId") or item.get("stripe_price_id")
        quantity = _parse_quantity(item.get("quantity") or item.get("qty") or 1)

        if isinstance(price_id, str) and price_id.strip():
            line_items.append({"price": price_id.strip(), "quantity": quantity})
            continue

        amount_raw = item.get("unitAmount") or item.get("price") or item.get("amount")
        currency = item.get("currency") or default_currency
        name = item.get("name") or item.get("title") or "Item"

        try:
            unit_amount = int(round(float(amount_raw) * 100))
        except (TypeError, ValueError):
            unit_amount = None

        if unit_amount is None or unit_amount <= 0 or not isinstance(currency, str):
            continue

        price_data: Dict[str, Any] = {
            "currency": currency.lower(),
            "unit_amount": unit_amount,
            "product_data": {"name": str(name)},
        }

        description = item.get("description")
        if isinstance(description, str) and description.strip():
            price_data["product_data"]["description"] = description.strip()[:1000]

        image = item.get("image") or item.get("imageUrl")
        if isinstance(image, str) and image.strip():
            price_data["product_data"]["images"] = [image.strip()]

        line_items.append({"price_data": price_data, "quantity": quantity})

    return line_items


def _extract_rate_limit_key(event: Dict[str, Any], quote_signature: str | None = None) -> str:
    headers = event.get("headers") or {}
    request_context = event.get("requestContext") or {}
    identity = request_context.get("identity") or {}

    source_ip = identity.get("sourceIp")
    if isinstance(source_ip, str) and source_ip:
        return f"checkout:{source_ip}"

    forwarded = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For")
    if isinstance(forwarded, str) and forwarded:
        return f"checkout:{forwarded.split(',')[0].strip()}"

    if quote_signature:
        return f"checkout-quote:{quote_signature}"

    return "checkout:unknown"


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        logger.debug("checkout-create-session event (redacted): %s", json.dumps(_redact_event(event)))
    except Exception:  # pragma: no cover - defensive logging only
        logger.warning("checkout-create-session event logging failed")

    cors_origin = _resolve_cors_origin(event)

    method = (event.get("httpMethod") or "POST").upper()
    if method == "OPTIONS":
        return _build_response(200, {"ok": True}, cors_origin)
    if method != "POST":
        return _error(405, "Method not allowed", cors_origin)

    payload, parse_error = parse_json_body(event)
    if parse_error:
        status_code = parse_error.get("statusCode", 400)
        try:
            body_payload = json.loads(parse_error.get("body", "{}"))
        except json.JSONDecodeError:
            body_payload = {"error": "Invalid request"}
        return _build_response(status_code, body_payload, cors_origin)

    quote_signature = payload.get("quoteSignature")
    if not isinstance(quote_signature, str) or not quote_signature.strip():
        return _error(400, "quoteSignature is required", cors_origin)

    limited, limit_message = check_rate_limit(_extract_rate_limit_key(event, quote_signature))
    if not limited:
        return _error(429, limit_message or "Too many requests", cors_origin)

    table = get_commerce_table()

    pointer = get_quote_pointer(quote_signature, table=table)
    if not pointer:
        return _error(404, "Quote not found or expired", cors_origin)

    normalized_hash = pointer.get("normalizedHash")
    if not isinstance(normalized_hash, str) or not normalized_hash:
        return _error(500, "Quote metadata missing normalized hash", cors_origin)

    expires_at_raw = pointer.get("expiresAt")
    now_seconds = int(time.time())
    try:
        pointer_expires_at = int(expires_at_raw)
    except (TypeError, ValueError):
        pointer_expires_at = None

    if pointer_expires_at and pointer_expires_at <= now_seconds:
        return _error(410, "Quote has expired", cors_origin)

    quote_item = get_latest_quote_for_hash(normalized_hash, table=table)
    if not quote_item:
        return _error(404, "Quote cache not found", cors_origin)

    if not _initialize_stripe_if_needed(required=True):
        logger.error("Stripe secret missing; checkout session cannot be created")
        return _error(500, "Checkout service is temporarily unavailable", cors_origin)

    quote_items_raw = quote_item.get("requestItems") or []
    quote_items = normalize_decimal_tree(quote_items_raw) if quote_items_raw else []
    if not isinstance(quote_items, list):
        quote_items = []

    pricing_summary_raw = normalize_decimal_tree(quote_item.get("pricingSummary", {}))
    default_currency = pricing_summary_raw.get("currency") if isinstance(pricing_summary_raw, dict) else None
    if not isinstance(default_currency, str) or not default_currency:
        default_currency = payload.get("currency") if isinstance(payload.get("currency"), str) else "CAD"

    line_items = _build_line_items(quote_items, default_currency=default_currency)
    if not line_items:
        return _error(400, "Quote items are missing Stripe pricing details", cors_origin)

    session_id = f"sess_{uuid.uuid4().hex}"
    created_at = now_utc_iso()

    session_ttl_minutes = get_env_int(SESSION_TTL_ENV, 60 * 24)
    session_expires_at = now_seconds + max(1, session_ttl_minutes) * 60

    client_return_override = payload.get("checkoutUrlOverride")
    if isinstance(client_return_override, str) and client_return_override.strip():
        client_return_url = client_return_override.strip()
    else:
        client_return_url = f"https://thebabesclub.com/checkout?session_id={session_id}"

    success_url = _resolve_url(
        payload,
        "successUrl",
        CHECKOUT_SUCCESS_URL_ENV,
        "https://thebabesclub.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    )
    cancel_url = _resolve_url(
        payload,
        "cancelUrl",
        CHECKOUT_CANCEL_URL_ENV,
        "https://thebabesclub.com/checkout/cancel",
    )

    mode = _resolve_checkout_mode(payload)

    allow_promo_codes = _env_bool(CHECKOUT_ALLOW_PROMOTION_CODES_ENV, default=False)
    promo_override = _coerce_bool(payload.get("allowPromotionCodes"))
    if promo_override is not None:
        allow_promo_codes = promo_override

    automatic_tax_enabled = _env_bool(CHECKOUT_AUTOMATIC_TAX_ENV, default=False)
    automatic_tax_override = _coerce_bool(payload.get("automaticTax"))
    if automatic_tax_override is not None:
        automatic_tax_enabled = automatic_tax_override

    customer_email = payload.get("customerEmail")
    if not isinstance(customer_email, str) or not customer_email.strip():
        customer_email = None
    else:
        customer_email = customer_email.strip()

    customer_id = payload.get("customerId")
    if not isinstance(customer_id, str) or not customer_id.strip():
        customer_id = None
    else:
        customer_id = customer_id.strip()

    metadata = _sanitize_metadata(payload.get("metadata"))
    metadata.setdefault("quoteSignature", quote_signature)
    metadata.setdefault("normalizedHash", normalized_hash)

    session_args: Dict[str, Any] = {
        "mode": mode,
        "line_items": line_items,
        "success_url": success_url,
        "cancel_url": cancel_url,
        "client_reference_id": quote_signature,
        "metadata": metadata,
    }

    if allow_promo_codes:
        session_args["allow_promotion_codes"] = True
    if automatic_tax_enabled:
        session_args["automatic_tax"] = {"enabled": True}
    if customer_email:
        session_args["customer_email"] = customer_email
    if customer_id:
        session_args["customer"] = customer_id

    payment_method_types = payload.get("paymentMethodTypes")
    if isinstance(payment_method_types, list):
        sanitized_pm = [str(pm).strip() for pm in payment_method_types if isinstance(pm, (str, bytes)) and str(pm).strip()]
        if sanitized_pm:
            session_args["payment_method_types"] = sanitized_pm

    payment_intent_data = payload.get("paymentIntentData")
    if isinstance(payment_intent_data, dict) and payment_intent_data:
        session_args["payment_intent_data"] = payment_intent_data

    phone_collection = payload.get("phoneNumberCollection")
    if isinstance(phone_collection, dict):
        boolean_override = _coerce_bool(phone_collection.get("enabled"))
        if boolean_override is not None:
            session_args["phone_number_collection"] = {"enabled": boolean_override}

    shipping_address_collection = payload.get("shippingAddressCollection")
    if isinstance(shipping_address_collection, dict) and shipping_address_collection.get("allowed_countries"):
        session_args["shipping_address_collection"] = shipping_address_collection

    if mode == "payment":
        stripe_max_window = int(time.time()) + 24 * 60 * 60
        session_args["expires_at"] = min(session_expires_at, stripe_max_window)

    try:
        checkout_session = stripe.checkout.Session.create(**session_args)
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        logger.exception("Stripe checkout session creation failed: %s", exc)
        return _error(502, "Unable to create Stripe checkout session", cors_origin)

    stripe_session_id = checkout_session.get("id")
    stripe_checkout_url = checkout_session.get("url") or client_return_url
    stripe_status = checkout_session.get("status")
    stripe_mode = checkout_session.get("mode")
    stripe_payment_status = checkout_session.get("payment_status")
    stripe_expires_at = checkout_session.get("expires_at")

    quote_summary = {
        "pricingSummary": quote_item.get("pricingSummary", {}),
        "normalizedHash": normalized_hash,
        "quoteCreatedAt": quote_item.get("createdAt"),
    }

    session_item = {
        "PK": f"QUOTE#{quote_signature}",
        "SK": f"SESSION#{session_id}",
        "status": "created",
        "createdAt": created_at,
        "checkoutUrl": client_return_url,
        "stripeCheckoutUrl": stripe_checkout_url,
        "stripeSessionId": stripe_session_id,
        "stripeStatus": stripe_status,
        "stripeMode": stripe_mode,
        "stripePaymentStatus": stripe_payment_status,
        "quoteSummary": ensure_decimal(quote_summary),
        "stripe": ensure_decimal(
            {
                "sessionId": stripe_session_id,
                "url": stripe_checkout_url,
                "status": stripe_status,
                "mode": stripe_mode,
                "paymentStatus": stripe_payment_status,
                "expiresAt": stripe_expires_at,
                "lineItems": line_items,
                "metadata": metadata,
                "successUrl": success_url,
                "cancelUrl": cancel_url,
            }
        ),
        "expiresAt": session_expires_at,
    }

    pointer_item = {
        "PK": f"SESSION#{session_id}",
        "SK": "METADATA",
        "quoteSignature": quote_signature,
        "status": "created",
        "createdAt": created_at,
        "expiresAt": session_expires_at,
        "stripeSessionId": stripe_session_id,
        "stripeCheckoutUrl": stripe_checkout_url,
        "stripeStatus": stripe_status,
    }

    put_session_records(session_item, pointer_item, table=table)

    normalized_quote = normalize_decimal_tree(quote_item)

    response_payload = {
        "sessionId": session_id,
        "quoteSignature": quote_signature,
        "quote": normalized_quote,
        "expiresAt": session_expires_at,
        "checkoutUrl": stripe_checkout_url,
        "clientReturnUrl": client_return_url,
        "stripeSessionId": stripe_session_id,
        "stripeStatus": stripe_status,
        "stripeMode": stripe_mode,
        "stripePaymentStatus": stripe_payment_status,
    }

    if stripe_expires_at:
        response_payload["stripeExpiresAt"] = stripe_expires_at

    if customer_email:
        response_payload["customerEmail"] = customer_email
    if customer_id:
        response_payload["customerId"] = customer_id

    return _build_response(200, response_payload, cors_origin)
