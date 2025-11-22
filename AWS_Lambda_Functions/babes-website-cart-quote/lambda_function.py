"""Babes Club cart quote Lambda entrypoint (commerce shared layer integration)."""

from __future__ import annotations

import json
import logging
import os
import re
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Iterable

import stripe  # type: ignore[attr-defined]
from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    COMMERCE_TABLE_ENV,
    DEFAULT_COMMERCE_TABLE,
    DEFAULT_QUOTE_TTL_MINUTES,
    CORS_ALLOW_ORIGIN_ENV,
    QUOTE_TTL_ENV,
    QUOTE_SIGNATURE_SECRET_ENV,
    QUOTE_SIGNATURE_SECRET_PARAMETER_ENV,
    ensure_decimal,
    get_commerce_table,
    get_env_int,
    get_latest_quote_for_hash,
    get_secure_parameter,
    get_stripe_secret,
    compute_signature,
    hash_normalized_cart,
    json_response,
    normalize_decimal_tree,
    normalize_items,
    parse_json_body,
    put_quote_records,
)


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


def _redact_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of the event without the request body to avoid logging PII."""

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


_QUOTE_SECRET_CACHE: str | None = None
_ALLOWED_ORIGINS_CACHE: list[str] | None = None
_STRIPE_INITIALIZED = False


def _get_quote_signature_secret() -> str:
    global _QUOTE_SECRET_CACHE  # pylint: disable=global-statement
    if _QUOTE_SECRET_CACHE:
        return _QUOTE_SECRET_CACHE

    direct_value = os.getenv(QUOTE_SIGNATURE_SECRET_ENV)
    if direct_value:
        _QUOTE_SECRET_CACHE = direct_value
        return direct_value

    parameter_name = os.getenv(QUOTE_SIGNATURE_SECRET_PARAMETER_ENV)
    if parameter_name:
        secret_value = get_secure_parameter(parameter_name)
        _QUOTE_SECRET_CACHE = secret_value
        return secret_value

    raise RuntimeError(
        "Quote signature secret is not configured. Set 'QUOTE_SIGNATURE_SECRET' or 'QUOTE_SIGNATURE_SECRET_PARAMETER'."
    )


def _get_table_name() -> str:
    return os.getenv(COMMERCE_TABLE_ENV, DEFAULT_COMMERCE_TABLE)


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


def _parse_quantity(value: Any) -> int:
    try:
        quantity = int(value)
    except (TypeError, ValueError):
        quantity = 1
    return max(1, quantity)


def _iter_price_ids(items: Iterable[Any]) -> Dict[str, int]:
    price_counts: Dict[str, int] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        price_id = item.get("stripePriceId") or item.get("priceId") or item.get("stripe_price_id")
        if not isinstance(price_id, str) or not price_id.strip():
            continue
        quantity = _parse_quantity(item.get("quantity") or item.get("qty") or 1)
        price_counts[price_id.strip()] = price_counts.get(price_id.strip(), 0) + quantity
    return price_counts


def _fetch_stripe_pricing(items: list[Any]) -> Dict[str, Any] | None:
    price_counts = _iter_price_ids(items)
    if not price_counts:
        return None

    if not _initialize_stripe_if_needed():
        logger.info("Stripe secret not configured; skipping Stripe price validation")
        return None

    subtotal_cents = 0
    currency: str | None = None
    validated_prices: list[Dict[str, Any]] = []

    for price_id, quantity in price_counts.items():
        try:
            price = stripe.Price.retrieve(price_id)
        except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
            logger.warning("Failed to retrieve Stripe price '%s': %s", price_id, exc)
            continue

        unit_amount = price.get("unit_amount")
        if unit_amount is None:
            unit_decimal = price.get("unit_amount_decimal")
            try:
                unit_amount = int(float(unit_decimal)) if unit_decimal is not None else None
            except (TypeError, ValueError):
                unit_amount = None

        if unit_amount is None:
            logger.warning("Stripe price '%s' missing unit amount; skipping", price_id)
            continue

        currency_code = price.get("currency")
        if isinstance(currency_code, str):
            currency_code = currency_code.upper()
            if currency and currency != currency_code:
                logger.warning(
                    "Stripe price currency mismatch between '%s' and '%s'", currency, currency_code
                )
            currency = currency or currency_code

        subtotal_cents += int(unit_amount) * quantity
        validated_prices.append(
            {
                "priceId": price_id,
                "quantity": quantity,
                "unitAmount": int(unit_amount) / 100,
                "currency": currency_code,
            }
        )

    if subtotal_cents <= 0:
        return None

    return {
        "subtotal": subtotal_cents / 100,
        "currency": currency or "CAD",
        "validatedPriceCount": len(validated_prices),
        "validatedPrices": validated_prices,
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        logger.debug("cart-quote event (redacted): %s", json.dumps(_redact_event(event)))
    except Exception:  # pragma: no cover - safeguard logging only
        logger.warning("cart-quote event logging failed")

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

    items = payload.get("items") or []
    if not isinstance(items, list) or not items:
        return _error(400, "Request must include a non-empty 'items' array", cors_origin)

    normalized_cart = normalize_items(items)
    normalized_hash = hash_normalized_cart(normalized_cart)

    now_iso = datetime.now(timezone.utc).isoformat()
    ttl_minutes = get_env_int(QUOTE_TTL_ENV, DEFAULT_QUOTE_TTL_MINUTES)
    ttl_seconds = int(time.time()) + ttl_minutes * 60

    secret = _get_quote_signature_secret()
    quote_signature = compute_signature(normalized_cart, secret, now_iso)

    table_name = _get_table_name()
    table = get_commerce_table(table_name)

    pricing_summary = {
        "items": len(items),
        "subtotal": payload.get("subtotal", 0),
        "currency": payload.get("currency", "CAD"),
    }

    stripe_pricing = _fetch_stripe_pricing(items)
    if stripe_pricing:
        if not payload.get("subtotal"):
            pricing_summary["subtotal"] = stripe_pricing["subtotal"]
            pricing_summary["currency"] = stripe_pricing["currency"]
        pricing_summary["stripeSubtotal"] = stripe_pricing["subtotal"]
        pricing_summary["stripeCurrency"] = stripe_pricing["currency"]
        pricing_summary["stripeValidatedPrices"] = stripe_pricing["validatedPriceCount"]

    quote_item = {
        "PK": f"CART#{normalized_hash}",
        "SK": f"QUOTE#{now_iso}#{uuid.uuid4().hex}",
        "quoteSignature": quote_signature,
        "normalizedHash": normalized_hash,
        "createdAt": now_iso,
        "requestItems": ensure_decimal(items),
        "pricingSummary": ensure_decimal(pricing_summary),
        "expiresAt": ttl_seconds,
    }

    if stripe_pricing:
        quote_item["stripePricing"] = ensure_decimal(stripe_pricing)

    pointer_item = {
        "PK": f"QUOTE#{quote_signature}",
        "SK": "METADATA",
        "normalizedHash": normalized_hash,
        "quoteCreatedAt": now_iso,
        "expiresAt": ttl_seconds,
    }

    put_quote_records(quote_item, pointer_item, table=table)

    latest_quote = get_latest_quote_for_hash(normalized_hash, table=table) or quote_item

    pricing = normalize_decimal_tree(latest_quote.get("pricingSummary", {}))
    subtotal = pricing.get("subtotal", 0.0)
    try:
        subtotal_value = float(subtotal)
    except (TypeError, ValueError):
        subtotal_value = 0.0

    items_count_raw = pricing.get("items", len(items))
    try:
        items_count = int(items_count_raw)
    except (TypeError, ValueError):
        items_count = len(items)

    currency_value = pricing.get("currency") or payload.get("currency", "CAD")
    if not isinstance(currency_value, str):
        currency_value = str(currency_value)

    response_payload = {
        "quoteSignature": quote_signature,
        "quoteCreatedAt": latest_quote.get("createdAt", now_iso),
        "normalizedHash": normalized_hash,
        "pricingSummary": {
            "items": items_count,
            "subtotal": subtotal_value,
            "currency": currency_value,
        },
        "expiresAt": ttl_seconds,
    }

    if stripe_pricing:
        response_payload["stripePricing"] = normalize_decimal_tree(stripe_pricing)

    return _build_response(200, response_payload, cors_origin)
