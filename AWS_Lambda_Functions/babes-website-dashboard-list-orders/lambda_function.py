"""Babes Club Dashboard List Orders Lambda.

Returns a paginated list of orders for the authenticated user.
Queries DynamoDB for order snapshots (PK=USER#{userId}, SK=ORDER#{timestamp}).

AWS_Lambda_Functions/babes-website-dashboard-list-orders/lambda_function.py
"""

from __future__ import annotations

import base64
import json
import logging
import os
from decimal import Decimal
from typing import Any, Dict, List, Optional

from boto3.dynamodb.conditions import Key

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

# Pagination defaults
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MIN_PAGE_SIZE = 1

ORDER_PAGE_SIZE_ENV = "ORDER_PAGE_SIZE"


# =============================================================================
# Helper Functions
# =============================================================================

def _json_response(
    payload: Dict[str, Any],
    status: int = 200,
    cors_origin: str | None = None
) -> Dict[str, Any]:
    """Build a JSON response with CORS headers."""
    origin = cors_origin or os.environ.get("CORS_ALLOW_ORIGIN", "*")
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Vary": "Origin",
        },
        "body": json.dumps(payload, default=_json_serializer),
    }


def _json_serializer(obj: Any) -> Any:
    """Handle Decimal and other non-JSON-serializable types."""
    if isinstance(obj, Decimal):
        # Convert to int if whole number, else float
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _error_response(
    message: str,
    status: int,
    cors_origin: str | None = None
) -> Dict[str, Any]:
    """Build an error response."""
    return _json_response({"error": message}, status=status, cors_origin=cors_origin)


def _get_page_size(query_params: Dict[str, Any]) -> int:
    """Extract and validate page size from query parameters."""
    default = int(os.environ.get(ORDER_PAGE_SIZE_ENV, DEFAULT_PAGE_SIZE))
    
    raw_limit = query_params.get("limit")
    if raw_limit is None:
        return min(max(default, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    
    try:
        limit = int(raw_limit)
        # Clamp to valid range
        return min(max(limit, MIN_PAGE_SIZE), MAX_PAGE_SIZE)
    except (ValueError, TypeError):
        return default


def _decode_cursor(cursor: str | None) -> Optional[Dict[str, Any]]:
    """Decode pagination cursor from base64 JSON.
    
    Returns None if cursor is invalid or missing.
    """
    if not cursor:
        return None
    
    try:
        decoded = base64.b64decode(cursor).decode("utf-8")
        start_key = json.loads(decoded)
        
        # Validate structure - must have PK and SK
        if not isinstance(start_key, dict):
            logger.warning("Invalid cursor structure: not a dict")
            return None
        if "PK" not in start_key or "SK" not in start_key:
            logger.warning("Invalid cursor structure: missing PK or SK")
            return None
        
        # Validate PK format (prevent injection)
        pk = start_key.get("PK", "")
        if not isinstance(pk, str) or not pk.startswith("USER#"):
            logger.warning("Invalid cursor PK format")
            return None
        
        return start_key
        
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.warning("Failed to decode cursor: %s", exc)
        return None


def _encode_cursor(last_key: Dict[str, Any] | None) -> Optional[str]:
    """Encode DynamoDB LastEvaluatedKey as base64 JSON cursor."""
    if not last_key:
        return None
    
    try:
        encoded = base64.b64encode(
            json.dumps(last_key, default=str).encode("utf-8")
        ).decode("utf-8")
        return encoded
    except (ValueError, TypeError) as exc:
        logger.warning("Failed to encode cursor: %s", exc)
        return None


def _normalize_order(item: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a DynamoDB order item for API response.
    
    Extracts only the fields needed by the frontend.
    """
    return {
        "orderId": item.get("orderId"),
        "orderNumber": item.get("orderNumber"),
        "status": item.get("status"),
        "amount": item.get("amount"),
        "amountSubtotal": item.get("amountSubtotal"),
        "currency": item.get("currency"),
        "createdAt": item.get("createdAt"),
        "completedAt": item.get("completedAt"),
        "itemCount": item.get("itemCount"),
        "items": item.get("items", []),
        "customerEmail": item.get("customerEmail"),
        "shippingAddress": item.get("shippingAddress"),
    }


def _get_user_id(event: Dict[str, Any]) -> Optional[str]:
    """Extract userId from the API Gateway authorizer context."""
    request_context = event.get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}
    
    # Try different authorizer formats
    user_id = (
        authorizer.get("userId") or
        authorizer.get("user_id") or
        authorizer.get("sub") or  # Cognito
        (authorizer.get("claims") or {}).get("sub")  # JWT claims
    )
    
    if user_id and isinstance(user_id, str):
        return user_id.strip()
    
    return None


# =============================================================================
# Main Handler
# =============================================================================

def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    List orders for the authenticated user.
    
    Query Parameters:
        limit: Number of orders to return (1-100, default 20)
        cursor: Pagination token from previous response
    
    Returns:
        {
            "orders": [...],
            "nextCursor": "..." or null
        }
    """
    # Resolve CORS origin
    cors_origin = resolve_origin(event)
    
    # Handle preflight
    method = (event.get("httpMethod") or "GET").upper()
    if method == "OPTIONS":
        return _json_response({"ok": True}, cors_origin=cors_origin)
    
    # Validate HTTP method
    if method != "GET":
        return _error_response("Method not allowed", 405, cors_origin)
    
    # Get authenticated user
    user_id = _get_user_id(event)
    if not user_id:
        logger.warning("Unauthorized request: no userId in authorizer context")
        return _error_response("Unauthorized", 401, cors_origin)
    
    # Parse query parameters
    query_params = event.get("queryStringParameters") or {}
    limit = _get_page_size(query_params)
    cursor = query_params.get("cursor")
    
    # Decode pagination cursor
    exclusive_start_key = _decode_cursor(cursor)
    
    # Validate cursor belongs to this user (security check)
    if exclusive_start_key:
        cursor_user = exclusive_start_key.get("PK", "").replace("USER#", "")
        if cursor_user != user_id:
            logger.warning(
                "Cursor user mismatch: cursor=%s, authenticated=%s",
                cursor_user,
                user_id
            )
            # Don't use tampered cursor, start from beginning
            exclusive_start_key = None
    
    # Query DynamoDB
    table = get_commerce_table()
    
    query_args: Dict[str, Any] = {
        "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ORDER#"),
        "ScanIndexForward": False,  # Newest first (descending by SK)
        "Limit": limit,
    }
    
    if exclusive_start_key:
        query_args["ExclusiveStartKey"] = exclusive_start_key
    
    try:
        response = table.query(**query_args)
    except Exception as exc:
        logger.exception("DynamoDB query failed for user %s: %s", user_id, exc)
        return _error_response("Failed to retrieve orders", 500, cors_origin)
    
    # Normalize orders for response
    items = response.get("Items", [])
    orders = [_normalize_order(item) for item in items]
    
    # Encode pagination cursor
    next_cursor = _encode_cursor(response.get("LastEvaluatedKey"))
    
    logger.info(
        "Listed orders: userId=%s count=%d hasMore=%s",
        user_id,
        len(orders),
        next_cursor is not None
    )
    
    return _json_response({
        "orders": orders,
        "nextCursor": next_cursor,
    }, cors_origin=cors_origin)