"""
Dashboard Get Profile Lambda - Returns user profile by UUID
Removes sensitive fields (password hash/salt)
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from shared_commerce import get_commerce_table, resolve_origin  # type: ignore


def _json_response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response with CORS headers"""
    origin = cors_origin or (os.environ.get("CORS_ALLOW_ORIGIN") or "*")
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
    """
    Get user profile by userId
    
    Authorization: userId comes from authorizer context
    
    Response:
        {
            "profile": {
                "userId": "uuid",
                "email": "user@example.com",
                "displayName": "John Doe",
                "shippingAddress": {...},
                "dashboardSettings": {...},
                // ... (no passwordHash/passwordSalt)
            }
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
        return _json_response(200, {"ok": True}, cors_origin=cors_origin)

    # Get userId from authorizer context
    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId")
    
    if not user_id:
        logger.warning("No userId in authorizer context")
        return _json_response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    logger.info(f"Fetching profile for user: {user_id}")

    # Fetch profile from DynamoDB
    table = get_commerce_table()
    
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
            ConsistentRead=True
        )
        
        logger.debug(f"DynamoDB response: {json.dumps(response.get('ResponseMetadata', {}))}")
        
    except Exception as exc:
        logger.exception(f"Failed to read profile for {user_id}: {exc}")
        return _json_response(500, {"error": "Database error"}, cors_origin=cors_origin)

    item = response.get("Item")
    
    if not item:
        logger.warning(f"Profile not found for user: {user_id}")
        return _json_response(404, {"error": "Profile not found"}, cors_origin=cors_origin)

    # Remove internal/sensitive fields
    item.pop("PK", None)
    item.pop("SK", None)
    item.pop("passwordHash", None)
    item.pop("passwordSalt", None)
    item.pop("hashAlgorithm", None)
    item.pop("hashIterations", None)
    
    logger.info(f"Returning profile for user: {user_id}")
    
    return _json_response(200, {"profile": item}, cors_origin=cors_origin)
