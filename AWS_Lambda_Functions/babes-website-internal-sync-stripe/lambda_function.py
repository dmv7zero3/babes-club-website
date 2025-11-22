"""Placeholder Stripe sync Lambda for internal tooling."""

from __future__ import annotations

import json
from typing import Any, Dict, Tuple


def _load_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], str | None]:
    try:
        raw = event.get("body") or "{}"
        if isinstance(raw, str):
            return json.loads(raw or "{}"), None
        if isinstance(raw, bytes):
            return json.loads(raw.decode("utf-8")), None
        if isinstance(raw, dict):
            return raw, None
        return {}, "Unsupported body type"
    except json.JSONDecodeError as exc:  # pragma: no cover
        return {}, f"Invalid JSON: {exc}"


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    body, error = _load_body(event)
    if error:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": error}),
        }

    response = {
        "message": "Stripe sync placeholder",
        "request": body,
    }
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(response),
    }
