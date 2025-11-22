"""Placeholder NFT sync Lambda for internal usage."""

from __future__ import annotations

import json
from typing import Any, Dict


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    body = event.get("body") or {}
    if isinstance(body, str) and body:
        try:
            body = json.loads(body)
        except json.JSONDecodeError:  # pragma: no cover
            body = {"raw": body}
    response = {
        "message": "NFT sync placeholder",
        "request": body,
    }
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(response),
    }
