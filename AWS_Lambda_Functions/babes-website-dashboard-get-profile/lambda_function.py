"""Babes Club Dashboard Get Profile Lambda.

Returns the authenticated user's profile, filtering out sensitive fields
like password hash and salt.

AWS_Lambda_Functions/babes-website-dashboard-get-profile/lambda_function.py
"""

from __future__ import annotations

import json
import logging
import os
from decimal import Decimal
from typing import Any, Dict, Optional, Set

from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    get_commerce_table,
    resolve_origin,
)


# =============================================================================
# Configuration
# =============================================================================

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)

# Fields that should never be returned to the client
SENSITIVE_FIELDS: Set[str] = {
    # DynamoDB keys
    "PK",
    "SK",
    # Password/auth fields
    "passwordHash",
    "passwordSalt",
    "hashAlgorithm",
    "hashIterations",
    # Other internal fields
    "expiresAt",  # TTL field
}


# =============================================================================
# Helper Functions
# =============================================================================

def _json_serializer(obj: Any) -> Any:
    """Handle Decimal and other non-JSON-serializable types."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _json_response(
    status_code: int,
    payload: Dict[str, Any],
    cors_origin: str | None = None
) -> Dict[str, Any]:
    """Build JSON response with CORS headers."""
    origin = cors_origin or os.environ.get("CORS_ALLOW_ORIGIN", "*")
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Vary": "Origin",
        },
        "body": json.dumps(payload, default=_json_serializer),
    }


def _error_response(
    message: str,
    status: int,
    cors_origin: str | None = None
) -> Dict[str, Any]:
    """Build an error response."""
    return _json_response(status, {"error": message}, cors_origin=cors_origin)


def _get_user_id(event: Dict[str, Any]) -> Optional[str]:
    """Extract userId from the API Gateway authorizer context."""
    request_context = event.get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}
    
    user_id = (
        authorizer.get("userId") or
        authorizer.get("user_id") or
        authorizer.get("sub") or
        (authorizer.get("claims") or {}).get("sub")
    )
    
    if user_id and isinstance(user_id, str):
        return user_id.strip()
    
    return None


def _sanitize_profile(item: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive fields from profile before returning to client.
    
    Uses a denylist approach - explicitly removes known sensitive fields.
    This is safer than an allowlist for profiles since new fields 
    should generally be visible.
    """
    return {
        key: value
        for key, value in item.items()
        if key not in SENSITIVE_FIELDS
    }


# =============================================================================
# Main Handler
# =============================================================================

def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    Get user profile by userId.
    
    Authorization: userId comes from JWT authorizer context.
    
    Response:
        {
            "profile": {
                "userId": "uuid",
                "email": "user@example.com",
                "displayName": "John Doe",
                "shippingAddress": {...},
                "dashboardSettings": {...},
                "stripeCustomerId": "cus_...",
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-11-26T12:00:00Z"
            }
        }
    """
    cors_origin = resolve_origin(event)
    
    # Handle CORS preflight
    method = (event.get("httpMethod") or "GET").upper()
    if method == "OPTIONS":
        return _json_response(200, {"ok": True}, cors_origin=cors_origin)
    
    # Validate HTTP method
    if method != "GET":
        return _error_response("Method not allowed", 405, cors_origin)
    
    # Get userId from authorizer context
    user_id = _get_user_id(event)
    
    if not user_id:
        logger.warning("No userId in authorizer context")
        return _error_response("Unauthorized", 401, cors_origin)
    
    logger.info("Fetching profile for user: %s", user_id)
    
    # Fetch profile from DynamoDB
    table = get_commerce_table()
    
    try:
        response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
            ConsistentRead=True
        )
    except Exception as exc:
        logger.exception("Failed to read profile for %s: %s", user_id, exc)
        return _error_response("Database error", 500, cors_origin)
    
    item = response.get("Item")
    
    if not item:
        logger.warning("Profile not found for user: %s", user_id)
        return _error_response("Profile not found", 404, cors_origin)
    
    # Remove sensitive fields
    profile = _sanitize_profile(item)
    
    logger.info("Returning profile for user: %s", user_id)
    
    return _json_response(200, {"profile": profile}, cors_origin=cors_origin)