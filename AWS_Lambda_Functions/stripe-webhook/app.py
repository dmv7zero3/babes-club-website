"""Lambda handler for processing Stripe webhook events and updating checkout sessions."""

from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict

import boto3


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


dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("COMMERCE_TABLE")
if not TABLE_NAME:
    raise RuntimeError("COMMERCE_TABLE environment variable is required")

commerce_table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, _context):
    method = event.get("httpMethod", "POST").upper()
    if method == "OPTIONS":
        return _json_response(200, {"ok": True})
    if method != "POST":
        return _error(405, "Method not allowed")

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _error(400, "Request body must be valid JSON")

    event_id = body.get("id")
    event_type = body.get("type")
    if not isinstance(event_id, str) or not isinstance(event_type, str):
        return _error(400, "Stripe event id and type are required")

    existing = commerce_table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"}).get("Item")
    if existing:
        return _json_response(200, {"status": "already-processed"})

    data_object = (body.get("data") or {}).get("object") or {}
    session_id = data_object.get("id") or data_object.get("session_id")
    if not isinstance(session_id, str):
        session_id = None

    status_map = {
        "checkout.session.completed": "completed",
        "checkout.session.expired": "expired",
    }
    derived_status = status_map.get(event_type, "received")

    processed_at = datetime.now(timezone.utc).isoformat()
    ttl_days = _get_env_int("EVENT_TTL_DAYS", 90)
    ttl_seconds = int(time.time()) + ttl_days * 86400

    if session_id:
        session_pointer = commerce_table.get_item(Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"}).get("Item")
        if session_pointer:
            quote_signature = session_pointer.get("quoteSignature")
            if quote_signature:
                commerce_table.update_item(
                    Key={"PK": f"QUOTE#{quote_signature}", "SK": f"SESSION#{session_id}"},
                    UpdateExpression="SET #status = :status, updatedAt = :updatedAt",
                    ExpressionAttributeNames={"#status": "status"},
                    ExpressionAttributeValues={
                        ":status": derived_status,
                        ":updatedAt": processed_at,
                    },
                )

            commerce_table.update_item(
                Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"},
                UpdateExpression="SET #status = :status, updatedAt = :updatedAt",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": derived_status,
                    ":updatedAt": processed_at,
                },
            )

    commerce_table.put_item(
        Item={
            "PK": f"EVENT#{event_id}",
            "SK": "METADATA",
            "eventType": event_type,
            "processedAt": processed_at,
            "sessionId": session_id,
            "status": derived_status,
            "expiresAt": ttl_seconds,
        }
    )

    return _json_response(200, {"status": derived_status, "sessionId": session_id})
