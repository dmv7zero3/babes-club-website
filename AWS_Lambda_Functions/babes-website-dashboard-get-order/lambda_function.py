"""Babes Club Dashboard Get Order Lambda.

Fetches a single order detail for the authenticated user.
Queries DynamoDB first, falls back to Stripe API if not found.

AWS_Lambda_Functions/babes-website-dashboard-get-order/lambda_function.py
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

import stripe

from boto3.dynamodb.conditions import Key, Attr

from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    get_commerce_table,
    get_stripe_secret,
    resolve_origin,
    ensure_decimal,
)


# =============================================================================
# Configuration
# =============================================================================

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)

ORDER_TTL_DAYS_ENV = "ORDER_TTL_DAYS"
DEFAULT_ORDER_TTL_DAYS = 0  # No expiration by default

_STRIPE_INITIALIZED = False


# =============================================================================
# Helper Functions
# =============================================================================

def _json_serializer(obj: Any) -> Any:
    """Handle Decimal and other non-JSON-serializable types."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _json_response(
    payload: Dict[str, Any],
    status: int = 200,
    cors_origin: str = "*"
) -> Dict[str, Any]:
    """Build a JSON response with CORS headers."""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Vary": "Origin",
        },
        "body": json.dumps(payload, default=_json_serializer),
    }


def _error_response(
    message: str,
    status: int,
    cors_origin: str = "*"
) -> Dict[str, Any]:
    """Build an error response."""
    return _json_response({"error": message}, status=status, cors_origin=cors_origin)


def _initialize_stripe() -> bool:
    """Initialize Stripe API with secret key."""
    global _STRIPE_INITIALIZED
    if _STRIPE_INITIALIZED:
        return True
    
    secret = get_stripe_secret(optional=True)
    if not secret:
        logger.error("Stripe secret not configured")
        return False
    
    stripe.api_key = secret
    _STRIPE_INITIALIZED = True
    return True


def _to_plain_dict(value: Any) -> Dict[str, Any]:
    """Safely convert Stripe objects to plain dictionaries."""
    if value is None:
        return {}
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()
    if hasattr(value, "to_dict"):
        return value.to_dict()
    if isinstance(value, dict):
        return value
    return {}


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


def _generate_order_number(stripe_session_id: str) -> str:
    """Generate human-readable order number from Stripe session ID."""
    if not stripe_session_id:
        return f"BC-{int(time.time())}"
    
    suffix = stripe_session_id[-8:].upper()
    suffix = re.sub(r"[^A-Z0-9]", "", suffix)
    if not suffix:
        suffix = str(int(time.time()))[-8:]
    return f"BC-{suffix}"


def _normalize_order(item: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a DynamoDB order item for API response."""
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
        "customerPhone": item.get("customerPhone"),
        "shippingAddress": item.get("shippingAddress"),
        "stripePaymentIntentId": item.get("stripePaymentIntentId"),
        "stripePaymentStatus": item.get("stripePaymentStatus"),
        "pricingSummary": item.get("pricingSummary"),
        "discounts": item.get("discounts"),
    }


def _fetch_order_from_dynamodb(
    table,
    user_id: str,
    order_id: str
) -> Optional[Dict[str, Any]]:
    """Query DynamoDB for an order by userId and orderId."""
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ORDER#"),
            FilterExpression=Attr("orderId").eq(order_id),
            Limit=1,
        )
        items = response.get("Items", [])
        if items:
            logger.info("Order found in DynamoDB: orderId=%s userId=%s", order_id, user_id)
            return items[0]
        return None
    except Exception as exc:
        logger.warning("DynamoDB query failed for order %s: %s", order_id, exc)
        return None


def _fetch_order_from_stripe(
    order_id: str,
    user_id: str
) -> Optional[Dict[str, Any]]:
    """
    Fetch order from Stripe API and validate ownership.
    
    SECURITY: We validate that the order's userId metadata matches the
    authenticated user to prevent cross-user access.
    """
    if not _initialize_stripe():
        logger.error("Cannot fetch from Stripe: not initialized")
        return None
    
    try:
        session = stripe.checkout.Session.retrieve(
            order_id,
            expand=["line_items", "line_items.data.price.product", "customer", "shipping_details"]
        )
    except stripe.error.InvalidRequestError as exc:
        logger.info("Stripe session not found: %s - %s", order_id, exc)
        return None
    except stripe.error.StripeError as exc:
        logger.warning("Stripe API error retrieving %s: %s", order_id, exc)
        return None
    
    session_dict = _to_plain_dict(session)
    metadata = _to_plain_dict(session_dict.get("metadata"))
    
    # ==========================================================================
    # SECURITY: Validate order ownership
    # ==========================================================================
    order_user_id = metadata.get("userId") or metadata.get("user_id")
    customer_details = _to_plain_dict(session_dict.get("customer_details"))
    customer_email = customer_details.get("email") or session_dict.get("customer_email")
    
    # If order has userId in metadata, it must match
    if order_user_id and order_user_id != user_id:
        logger.warning(
            "Cross-user access attempt: authenticated=%s, order_owner=%s, orderId=%s",
            user_id,
            order_user_id,
            order_id
        )
        return None
    
    # If no userId in metadata, check if user_id matches customer email
    # (for guest checkout where email was used as userId)
    if not order_user_id and customer_email and customer_email != user_id:
        logger.warning(
            "Cross-user access attempt (email mismatch): authenticated=%s, customer_email=%s, orderId=%s",
            user_id,
            customer_email,
            order_id
        )
        return None
    
    # If we can't verify ownership at all, deny access
    if not order_user_id and not customer_email:
        logger.warning(
            "Cannot verify order ownership: no userId or email in order %s",
            order_id
        )
        return None
    
    logger.info("Order ownership verified via Stripe: orderId=%s userId=%s", order_id, user_id)
    
    # Build normalized order from Stripe session
    line_items_data = session_dict.get("line_items", {}).get("data", [])
    created_timestamp = session_dict.get("created", int(time.time()))
    
    items = []
    for item in line_items_data:
        price = _to_plain_dict(item.get("price"))
        product = _to_plain_dict(price.get("product"))
        product_metadata = _to_plain_dict(product.get("metadata"))
        
        normalized_item = {
            "name": item.get("description") or product.get("name", "Item"),
            "quantity": item.get("quantity", 1),
            "unitPrice": price.get("unit_amount", 0),
            "currency": (item.get("currency") or price.get("currency") or "usd").lower(),
            "amountTotal": item.get("amount_total", 0),
            "stripePriceId": price.get("id"),
            "stripeProductId": product.get("id") if isinstance(product.get("id"), str) else None,
        }
        
        if product_metadata.get("sku"):
            normalized_item["sku"] = product_metadata["sku"]
        if product_metadata.get("collection"):
            normalized_item["collectionId"] = product_metadata["collection"]
        if product_metadata.get("color"):
            normalized_item["color"] = product_metadata["color"]
        
        items.append(normalized_item)
    
    # Build shipping address if available
    shipping_address = None
    shipping_details = _to_plain_dict(session_dict.get("shipping_details"))
    if shipping_details:
        address = _to_plain_dict(shipping_details.get("address"))
        shipping_address = {
            "name": shipping_details.get("name"),
            "line1": address.get("line1"),
            "line2": address.get("line2"),
            "city": address.get("city"),
            "state": address.get("state"),
            "postalCode": address.get("postal_code"),
            "country": address.get("country"),
        }
    
    order_item = {
        "orderId": session_dict.get("id"),
        "orderNumber": _generate_order_number(session_dict.get("id", "")),
        "userId": user_id,
        "status": "completed" if session_dict.get("status") == "complete" else session_dict.get("status"),
        "amount": session_dict.get("amount_total", 0),
        "amountSubtotal": session_dict.get("amount_subtotal", 0),
        "currency": (session_dict.get("currency") or "usd").lower(),
        "createdAt": datetime.fromtimestamp(created_timestamp, tz=timezone.utc).isoformat(),
        "completedAt": datetime.fromtimestamp(created_timestamp, tz=timezone.utc).isoformat(),
        "itemCount": len(items),
        "items": items,
        "customerEmail": customer_email,
        "customerPhone": customer_details.get("phone"),
        "shippingAddress": shipping_address,
        "stripeSessionId": session_dict.get("id"),
        "stripePaymentIntentId": session_dict.get("payment_intent"),
        "stripePaymentStatus": session_dict.get("payment_status"),
        "stripeCustomerId": session_dict.get("customer"),
        "source": "stripe_fallback",
    }
    
    return order_item


def _cache_order_to_dynamodb(
    table,
    order_item: Dict[str, Any],
    user_id: str
) -> bool:
    """Cache an order fetched from Stripe to DynamoDB."""
    try:
        # Parse createdAt to get timestamp for SK
        created_at = order_item.get("createdAt", "")
        if isinstance(created_at, str) and created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                timestamp = int(dt.timestamp())
            except ValueError:
                timestamp = int(time.time())
        else:
            timestamp = int(time.time())
        
        order_id = order_item.get("orderId", "")
        
        # Build DynamoDB item
        db_item = {
            "PK": f"USER#{user_id}",
            "SK": f"ORDER#{timestamp}#{order_id}",
            **order_item,
        }
        
        # Add TTL if configured
        ttl_days = int(os.environ.get(ORDER_TTL_DAYS_ENV, DEFAULT_ORDER_TTL_DAYS))
        if ttl_days > 0:
            db_item["expiresAt"] = int(time.time()) + (ttl_days * 86400)
        
        table.put_item(Item=ensure_decimal(db_item))
        logger.info("Cached order to DynamoDB: orderId=%s userId=%s", order_id, user_id)
        return True
        
    except Exception as exc:
        logger.warning("Failed to cache order to DynamoDB: %s", exc)
        return False


# =============================================================================
# Main Handler
# =============================================================================

def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    Get a single order for the authenticated user.
    
    Path Parameters:
        orderId: Stripe Checkout Session ID
    
    Returns:
        {"order": {...}} or {"error": "..."}
    """
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
    
    # Get orderId from path
    path_params = event.get("pathParameters") or {}
    order_id = path_params.get("orderId")
    
    if not order_id:
        return _error_response("Missing orderId", 400, cors_origin)
    
    # Validate orderId format (basic sanity check)
    if not isinstance(order_id, str) or len(order_id) > 100:
        return _error_response("Invalid orderId", 400, cors_origin)
    
    table = get_commerce_table()
    
    # Step 1: Try DynamoDB first
    order = _fetch_order_from_dynamodb(table, user_id, order_id)
    
    if order:
        return _json_response({"order": _normalize_order(order)}, cors_origin=cors_origin)
    
    # Step 2: Fallback to Stripe API
    logger.info("Order not in DynamoDB, trying Stripe: orderId=%s userId=%s", order_id, user_id)
    
    order = _fetch_order_from_stripe(order_id, user_id)
    
    if not order:
        logger.info("Order not found: orderId=%s userId=%s", order_id, user_id)
        return _error_response("Order not found", 404, cors_origin)
    
    # Step 3: Cache to DynamoDB for future requests
    _cache_order_to_dynamodb(table, order, user_id)
    
    return _json_response({"order": _normalize_order(order)}, cors_origin=cors_origin)