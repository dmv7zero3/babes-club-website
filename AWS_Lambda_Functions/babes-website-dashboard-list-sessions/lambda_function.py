"""
Dashboard List Sessions Lambda - Returns active sessions for "Active Sessions" page
Marks current session for UI distinction
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict

from shared_commerce import get_commerce_table, resolve_origin  # type: ignore


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response"""
    origin = cors_origin or "*"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def parse_user_agent(ua: str) -> Dict[str, str]:
    """
    Parse user agent into device/browser info
    Simple parser - can be enhanced with user-agents library if needed
    """
    ua_lower = ua.lower()
    
    # Detect OS
    if "mac os x" in ua_lower:
        os = "macOS"
    elif "windows" in ua_lower:
        os = "Windows"
    elif "linux" in ua_lower:
        os = "Linux"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        os = "iOS"
    elif "android" in ua_lower:
        os = "Android"
    else:
        os = "Unknown"
    
    # Detect browser
    if "chrome" in ua_lower and "edg" not in ua_lower:
        browser = "Chrome"
    elif "firefox" in ua_lower:
        browser = "Firefox"
    elif "safari" in ua_lower and "chrome" not in ua_lower:
        browser = "Safari"
    elif "edg" in ua_lower:
        browser = "Edge"
    else:
        browser = "Unknown"
    
    return {
        "os": os,
        "browser": browser,
        "deviceName": f"{browser} on {os}"
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    List active sessions for current user
    
    Returns all non-expired, non-revoked sessions
    Marks current session with `isCurrent: true`
    
    Response:
        {
            "sessions": [
                {
                    "sessionId": "...",
                    "isCurrent": true,
                    "deviceName": "Chrome on macOS",
                    "ip": "173.79.137.235",
                    "issuedAt": "2025-11-22T21:28:24.990Z",
                    "lastAccessedAt": "2025-11-22T22:15:00.000Z",
                    "expiresAt": 1763890104
                },
                // ... more sessions
            ]
        }
    """
    import logging

    logger = logging.getLogger(__name__)
    if not logger.handlers:
        logging.basicConfig(level=logging.INFO)
    logger.setLevel(logging.INFO)

    # Handle CORS preflight
    method = (event.get("httpMethod") or "GET").upper()
    cors_origin = resolve_origin(event)
    
    if method == "OPTIONS":
        return _response(200, {"ok": True}, cors_origin=cors_origin)

    # Get userId and sessionId from authorizer context
    authorizer = (event.get("requestContext") or {}).get("authorizer", {})
    user_id = authorizer.get("userId")
    current_session_id = authorizer.get("sessionId")
    
    if not user_id:
        logger.warning("No userId in authorizer context")
        return _response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    logger.info(f"Listing sessions for user: {user_id}")

    table = get_commerce_table()
    current_time = int(time.time())

    # Query all session indexes for this user
    try:
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            FilterExpression="#status = :status AND expiresAt > :now",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk_prefix": "SESSION#",
                ":status": "active",
                ":now": current_time
            }
        )
        
        sessions = response.get("Items", [])
        logger.info(f"Found {len(sessions)} active sessions for {user_id}")
        
    except Exception as exc:
        logger.exception(f"Failed to query sessions for {user_id}: {exc}")
        return _response(500, {"error": "Failed to fetch sessions"}, cors_origin=cors_origin)

    # Format sessions for frontend
    formatted_sessions = []
    
    for session in sessions:
        session_id = session.get("sessionId", "")
        user_agent = session.get("userAgent", "")
        
        # Parse user agent for friendly device name
        device_info = parse_user_agent(user_agent) if user_agent else {"deviceName": "Unknown Device"}
        
        formatted_session = {
            "sessionId": session_id,
            "isCurrent": (session_id == current_session_id),
            "deviceName": device_info.get("deviceName", "Unknown Device"),
            "ip": session.get("ip", "Unknown"),
            "issuedAt": session.get("issuedAt"),
            "lastAccessedAt": session.get("lastAccessedAt"),
            "expiresAt": session.get("expiresAt"),
            
            # Optional: Include OS/browser separately for UI
            "os": device_info.get("os"),
            "browser": device_info.get("browser")
        }
        
        formatted_sessions.append(formatted_session)

    # Sort by most recently accessed
    formatted_sessions.sort(key=lambda s: s.get("lastAccessedAt", ""), reverse=True)

    return _response(200, {"sessions": formatted_sessions}, cors_origin=cors_origin)
