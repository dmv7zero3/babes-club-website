"""Placeholder handler that returns mock order listings."""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from shared_commerce import resolve_origin  # type: ignore


def _json_response(payload: Dict[str, Any], status: int = 200, cors_origin: str | None = None) -> Dict[str, Any]:
    origin = cors_origin or (os.environ.get("CORS_ALLOW_ORIGIN") or "*")
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    # Preflight handling
    method = (event.get("httpMethod") or "GET").upper()
    cors_origin = resolve_origin(event)
    if method == "OPTIONS":
        return _json_response({"ok": True}, status=200, cors_origin=cors_origin)

    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId", "anonymous")
    orders = [
        {
            "orderId": "ORDER-PLACEHOLDER",
            "status": "processing",
            "amount": 123.45,
            "currency": "CAD",
        }
    ]
    return _json_response({"orders": orders, "nextCursor": None, "userId": user_id}, cors_origin=cors_origin)
