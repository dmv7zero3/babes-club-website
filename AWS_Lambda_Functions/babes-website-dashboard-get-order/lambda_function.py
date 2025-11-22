"""Placeholder handler for fetching a single dashboard order."""

from __future__ import annotations

import json
from typing import Any, Dict


def _response(status_code: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    path_params = event.get("pathParameters") or {}
    order_id = path_params.get("orderId", "UNKNOWN")
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
    )
