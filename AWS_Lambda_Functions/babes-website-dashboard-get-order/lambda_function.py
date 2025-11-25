"""Placeholder handler for fetching a single dashboard order."""

from __future__ import annotations

import json
from typing import Any, Dict



def _response(status_code: int, payload: Dict[str, Any], origin: str = "*") -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    origin = event.get("headers", {}).get("origin", "*")
    path_params = event.get("pathParameters") or {}
    order_id = path_params.get("orderId", "UNKNOWN")
    try:
        return _response(
            200,
            {
                "order": {
                    "orderId": order_id,
                    "status": "placeholder",
                    "items": [],
                    "amount": 0,
                    "currency": "CAD",
                }
            },
            origin,
        )
    except Exception as exc:
        return _response(
            500,
            {"error": f"Internal error: {exc}"},
            origin,
        )
