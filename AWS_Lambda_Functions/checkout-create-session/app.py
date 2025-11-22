"""Lambda handler for creating Stripe checkout sessions tied to cart quotes."""

from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict

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


def _ensure_decimal(value: Any) -> Any:
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: _ensure_decimal(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_ensure_decimal(v) for v in value]
    return value


def _normalize_quote_record(item: Dict[str, Any]) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    for key, value in item.items():
        if isinstance(value, Decimal):
            result[key] = float(value)
        elif isinstance(value, list):
            result[key] = [float(v) if isinstance(v, Decimal) else v for v in value]
        elif isinstance(value, dict):
            result[key] = {
                inner_key: float(inner_val) if isinstance(inner_val, Decimal) else inner_val
                for inner_key, inner_val in value.items()
            }
        else:
            result[key] = value
    return result


dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("COMMERCE_TABLE")
if not TABLE_NAME:
    raise RuntimeError("COMMERCE_TABLE environment variable is required")

commerce_table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, _context):
    if event.get("httpMethod", "POST").upper() != "POST":
        return _error(405, "Method not allowed")

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _error(400, "Request body must be valid JSON")

    quote_signature = body.get("quoteSignature")
    if not isinstance(quote_signature, str) or not quote_signature:
        return _error(400, "quoteSignature is required")

    pointer = commerce_table.get_item(Key={"PK": f"QUOTE#{quote_signature}", "SK": "METADATA"}).get("Item")
    if not pointer:
        return _error(404, "Quote not found or expired")

    normalized_hash = pointer.get("normalizedHash")
    if not normalized_hash:
        return _error(500, "Quote metadata missing normalized hash")

    quote_items = commerce_table.query(
        KeyConditionExpression=Key("PK").eq(f"CART#{normalized_hash}"),
        ScanIndexForward=False,
        Limit=1,
    ).get("Items", [])

    if not quote_items:
        return _error(404, "Quote cache not found")

    quote_item = quote_items[0]

    now = datetime.now(timezone.utc)
    created_at = now.isoformat()
    session_id = f"sess_{uuid.uuid4().hex}"

    ttl_minutes = _get_env_int("SESSION_TTL_MINUTES", 60 * 24)
    ttl_seconds = int(time.time()) + ttl_minutes * 60

    checkout_url = body.get("checkoutUrlOverride") or f"https://thebabesclub.com/checkout?session_id={session_id}"

    session_item = {
        "PK": f"QUOTE#{quote_signature}",
        "SK": f"SESSION#{session_id}",
        "status": "created",
        "createdAt": created_at,
        "checkoutUrl": checkout_url,
        "quoteSummary": _ensure_decimal({
            "pricingSummary": quote_item.get("pricingSummary", {}),
            "normalizedHash": normalized_hash,
        }),
        "expiresAt": ttl_seconds,
    }

    pointer_item = {
        "PK": f"SESSION#{session_id}",
        "SK": "METADATA",
        "quoteSignature": quote_signature,
        "status": "created",
        "createdAt": created_at,
        "expiresAt": ttl_seconds,
    }

    with commerce_table.batch_writer() as batch:
        batch.put_item(Item=session_item)
        batch.put_item(Item=pointer_item)

    response_payload = {
        "sessionId": session_id,
        "checkoutUrl": checkout_url,
        "quoteSignature": quote_signature,
        "quote": _normalize_quote_record(quote_item),
    }

    return _json_response(200, response_payload)
