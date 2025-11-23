"""Babes Club cart quote Lambda entrypoint (commerce shared layer integration)."""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    COMMERCE_TABLE_ENV,
    DEFAULT_COMMERCE_TABLE,
    DEFAULT_QUOTE_TTL_MINUTES,
    QUOTE_TTL_ENV,
    QUOTE_SIGNATURE_SECRET_ENV,
    QUOTE_SIGNATURE_SECRET_PARAMETER_ENV,
    ensure_decimal,
    error_response,
    get_commerce_table,
    get_env_int,
    get_latest_quote_for_hash,
    get_secure_parameter,
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


_QUOTE_SECRET_CACHE: str | None = None


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


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        logger.info("cart-quote event: %s", json.dumps(event)[:1000])
    except Exception:  # pragma: no cover - safeguard logging only
        logger.warning("cart-quote event logging failed")

    method = (event.get("httpMethod") or "POST").upper()
    if method == "OPTIONS":
        return json_response(200, {"ok": True})
    if method != "POST":
        return error_response(405, "Method not allowed")

    payload, parse_error = parse_json_body(event)
    if parse_error:
        return parse_error

    items = payload.get("items") or []
    if not isinstance(items, list) or not items:
        return error_response(400, "Request must include a non-empty 'items' array")

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

    return json_response(200, response_payload)
