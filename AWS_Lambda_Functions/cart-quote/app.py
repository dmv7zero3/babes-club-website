"""Lambda handler for creating cart quotes and caching them in DynamoDB."""

from __future__ import annotations

import hashlib
import json
import os
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List

import boto3
from boto3.dynamodb.conditions import Key


def _json_response(status_code: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": os.getenv("CORS_ALLOW_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
    return {"statusCode": status_code, "headers": headers, "body": json.dumps(payload)}


def _error(status_code: int, message: str) -> Dict[str, Any]:
    return _json_response(status_code, {"error": message})


def _get_env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _as_decimal(value: Any) -> Any:
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, list):
        return [_as_decimal(v) for v in value]
    if isinstance(value, dict):
        return {k: _as_decimal(v) for k, v in value.items()}
    return value


def _normalize_items(items: List[Dict[str, Any]]) -> str:
    """Create a deterministic representation of cart items for hashing."""
    cleaned: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        cleaned_item = {
            key: item[key]
            for key in sorted(item.keys())
            if item[key] is not None
        }
        cleaned.append(cleaned_item)
    cleaned.sort(key=lambda entry: json.dumps(entry, sort_keys=True))
    return json.dumps(cleaned, separators=(",", ":"), sort_keys=True)


def _compute_signature(normalized_cart: str, secret: str, timestamp: str) -> str:
    seed = f"{normalized_cart}|{timestamp}|{secret}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("COMMERCE_TABLE")
if not TABLE_NAME:
    raise RuntimeError("COMMERCE_TABLE environment variable is required")

commerce_table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, _context):
    if event.get("httpMethod", "POST").upper() != "POST":
        return _error(405, "Method not allowed")

    try:
        data = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _error(400, "Request body must be valid JSON")

    items = data.get("items") or []
    if not isinstance(items, list) or not items:
        return _error(400, "Request must include a non-empty 'items' array")

    normalized_cart = _normalize_items(items)
    now = datetime.now(timezone.utc)
    created_at = now.isoformat()
    ttl_minutes = _get_env_int("QUOTE_TTL_MINUTES", 15)
    ttl_seconds = int(time.time()) + ttl_minutes * 60

    secret = os.getenv("QUOTE_SIGNATURE_SECRET", "")
    signature = _compute_signature(normalized_cart, secret, created_at)

    cart_hash = hashlib.sha256(normalized_cart.encode("utf-8")).hexdigest()
    quote_id = f"QUOTE#{created_at}#{uuid.uuid4().hex}"

    pricing_summary = {
        "items": len(items),
        "subtotal": _as_decimal(data.get("subtotal", 0)),
        "currency": data.get("currency", "CAD"),
    }

    quote_item = {
        "PK": f"CART#{cart_hash}",
        "SK": quote_id,
        "quoteSignature": signature,
        "normalizedHash": cart_hash,
        "createdAt": created_at,
        "requestItems": _as_decimal(items),
        "pricingSummary": pricing_summary,
        "expiresAt": ttl_seconds,
    }

    pointer_item = {
        "PK": f"QUOTE#{signature}",
        "SK": "METADATA",
        "normalizedHash": cart_hash,
        "quoteCreatedAt": created_at,
        "expiresAt": ttl_seconds,
    }

    with commerce_table.batch_writer() as batch:
        batch.put_item(Item=quote_item)
        batch.put_item(Item=pointer_item)

    latest_query = commerce_table.query(
        KeyConditionExpression=Key("PK").eq(f"CART#{cart_hash}"),
        ScanIndexForward=False,
        Limit=1,
    )
    latest = latest_query.get("Items", [quote_item])[0]

    subtotal_value = pricing_summary["subtotal"]
    if isinstance(subtotal_value, Decimal):
        subtotal_output = float(subtotal_value)
    else:
        subtotal_output = float(subtotal_value or 0)

    response_payload = {
        "quoteSignature": signature,
        "quoteCreatedAt": latest.get("createdAt", created_at),
        "normalizedHash": cart_hash,
        "pricingSummary": {
            "items": pricing_summary["items"],
            "subtotal": subtotal_output,
            "currency": pricing_summary["currency"],
        },
        "expiresAt": ttl_seconds,
    }

    return _json_response(200, response_payload)