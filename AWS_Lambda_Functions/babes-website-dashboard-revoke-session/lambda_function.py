"""
Dashboard Revoke Session Lambda - Logout single or all sessions
Supports both "Logout" (current device) and "Logout All Devices"
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict, Tuple

from shared_commerce import get_commerce_table, now_utc_iso, resolve_origin  # type: ignore


def _parse_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], str | None]:
    """Parse and validate request body"""
    try:
        body = event.get("body") or "{}"
        if isinstance(body, str):
            return json.loads(body or "{}"), None
        if isinstance(body, bytes):
            return json.loads(body.decode("utf-8")), None
        return body, None
    except json.JSONDecodeError as exc:
        return {}, f"Invalid JSON: {exc}"


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response"""
    origin = cors_origin or "*"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    Revoke session(s) - Logout functionality
    
    Modes:
    1. Revoke current session (default logout)
    2. Revoke specific session by ID
    3. Revoke all sessions (logout all devices)
    
    Request body:
        {
            "sessionId": "specific-session-id",   // Optional: revoke specific session
            "revokeAll": true,                     // Optional: revoke all sessions
            "keepCurrent": true                    // Optional: keep current session when revokeAll=true
        }
    
    Response:
        {
            "message": "Session revoked",
            "revokedCount": 1  // Number of sessions revoked
        }
    """
    import logging

    logger = logging.getLogger(__name__)
    if not logger.handlers:
        logging.basicConfig(level=logging.INFO)
    logger.setLevel(logging.INFO)

    # Handle CORS preflight
    method = (event.get("httpMethod") or "POST").upper()
    cors_origin = resolve_origin(event)
    
    if method == "OPTIONS":
        return _response(200, {"ok": True}, cors_origin=cors_origin)

    # JWT migration: logout is now stateless
    # Just return success, client should delete JWT
    logger.info("JWT logout: stateless, client should delete JWT")
    return _response(200, {"message": "Logged out (JWT stateless)", "revokedCount": 0}, cors_origin=cors_origin)
