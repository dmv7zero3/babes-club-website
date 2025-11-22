"""Utility helpers shared across commerce Lambda handlers."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Tuple

from .constants import CORS_ALLOW_ORIGIN_ENV

JsonDict = Dict[str, Any]


def json_response(status_code: int, payload: JsonDict, *, cors_origin: str | None = None) -> JsonDict:
    """Return an API Gateway compatible JSON response."""
    origin = cors_origin if cors_origin is not None else os.getenv(CORS_ALLOW_ORIGIN_ENV, "*")
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def error_response(status_code: int, message: str) -> JsonDict:
    """Return a JSON error payload with the provided HTTP status code."""
    return json_response(status_code, {"error": message})


def now_utc_iso() -> str:
    """Return the current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def parse_json_body(event: Dict[str, Any]) -> Tuple[JsonDict, JsonDict | None]:
    """Parse a JSON body from an API Gateway event.

    Returns a tuple of (payload, error_response). If parsing fails, *payload* will
    be an empty dictionary and *error_response* contains the response to return.
    """
    body = event.get("body")
    if isinstance(body, dict):
        return body, None
    if body is None:
        return {}, None
    if isinstance(body, str):
        try:
            return json.loads(body), None
        except json.JSONDecodeError:
            return {}, error_response(400, "Request body must be valid JSON")
    return {}, error_response(400, "Unsupported request body type")


def ensure_decimal(value: Any) -> Any:
    """Recursively convert ints/floats to Decimal for DynamoDB compatibility."""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return Decimal(str(value))
    if isinstance(value, list):
        return [ensure_decimal(v) for v in value]
    if isinstance(value, dict):
        return {k: ensure_decimal(v) for k, v in value.items()}
    return value


def normalize_decimal_tree(value: Any) -> Any:
    """Convert Decimal objects in *value* back into native Python types."""
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return [normalize_decimal_tree(v) for v in value]
    if isinstance(value, dict):
        return {k: normalize_decimal_tree(v) for k, v in value.items()}
    return value
