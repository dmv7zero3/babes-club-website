"""Babes Club Stripe Nightly Sync Lambda - Order Reconciliation Job.

AWS_Lambda_Functions/babes-website-stripe-nightly-sync/lambda_function.py

This Lambda runs on a schedule (typically nightly via EventBridge) to reconcile
Stripe checkout sessions with DynamoDB order snapshots. It serves as a safety net
to catch any orders that may have been missed by the webhook handler.

Trigger: CloudWatch Events (EventBridge) schedule
Recommended: cron(0 2 * * ? *)  # 2:00 AM UTC daily

Environment Variables:
    COMMERCE_TABLE: DynamoDB table name (required)
    STRIPE_SECRET / STRIPE_SECRET_PARAMETER: Stripe API key (required)
    SYNC_LOOKBACK_HOURS: Hours to look back for sessions (default: 25)
    SYNC_MAX_SESSIONS: Maximum sessions to process per run (default: 500)
    SYNC_DRY_RUN: If "true", don't write to DynamoDB (for testing)
    ORDER_TTL_DAYS: Days until order records expire, 0 = never (default: 0)

Updated: 2025-11-26 - Full rewrite for production use
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

import stripe
from boto3.dynamodb.conditions import Key, Attr

from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    get_commerce_table,
    get_stripe_secret,
    ensure_decimal,
    get_env_int,
)


# =============================================================================
# Configuration
# =============================================================================

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)

# Environment variable names
SYNC_LOOKBACK_HOURS_ENV = "SYNC_LOOKBACK_HOURS"
SYNC_MAX_SESSIONS_ENV = "SYNC_MAX_SESSIONS"
SYNC_DRY_RUN_ENV = "SYNC_DRY_RUN"
ORDER_TTL_DAYS_ENV = "ORDER_TTL_DAYS"

# Defaults
DEFAULT_LOOKBACK_HOURS = 25  # Slightly more than 24h to handle edge cases
DEFAULT_MAX_SESSIONS = 500
DEFAULT_ORDER_TTL_DAYS = 0  # No expiration

# Stripe initialization flag
_STRIPE_INITIALIZED = False


# =============================================================================
# Helper Functions
# =============================================================================

def _initialize_stripe() -> bool:
    """Initialize Stripe API with secret key."""
    global _STRIPE_INITIALIZED
    if _STRIPE_INITIALIZED:
        return True
    
    secret = get_stripe_secret(optional=False)
    if not secret:
        logger.error("Stripe secret not configured")
        return False
    
    stripe.api_key = secret
    _STRIPE_INITIALIZED = True
    return True


def _get_env_bool(name: str, default: bool = False) -> bool:
    """Get boolean environment variable."""
    value = os.environ.get(name, "").lower()
    if value in ("true", "1", "yes", "on"):
        return True
    if value in ("false", "0", "no", "off"):
        return False
    return default


def _to_plain_dict(value: Any) -> Dict[str, Any]:
    """Convert Stripe object to plain dictionary."""
    if value is None:
        return {}
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()
    if hasattr(value, "to_dict"):
        return value.to_dict()
    if isinstance(value, dict):
        return value
    return {}


def _generate_order_number(stripe_session_id: str) -> str:
    """Generate human-readable order number from Stripe session ID.
    
    Format: BC-{last 8 chars uppercase}
    """
    if not stripe_session_id:
        return f"BC-{int(time.time())}"
    
    suffix = stripe_session_id[-8:].upper()
    suffix = re.sub(r"[^A-Z0-9]", "", suffix)
    return f"BC-{suffix}"


def _safe_get_attr(obj: Any, *attrs: str, default: Any = None) -> Any:
    """Safely get nested attributes from an object."""
    current = obj
    for attr in attrs:
        if current is None:
            return default
        if isinstance(current, dict):
            current = current.get(attr)
        elif hasattr(current, attr):
            current = getattr(current, attr, None)
        else:
            return default
    return current if current is not None else default


# =============================================================================
# Sync State Management
# =============================================================================

def _get_sync_state(table) -> Dict[str, Any]:
    """Retrieve the last sync state from DynamoDB."""
    try:
        response = table.get_item(
            Key={"PK": "SYSTEM", "SK": "STRIPE_ORDER_SYNC"}
        )
        return response.get("Item", {})
    except Exception as exc:
        logger.warning("Failed to retrieve sync state: %s", exc)
        return {}


def _update_sync_state(
    table,
    sync_started_at: str,
    sync_completed_at: str,
    processed: int,
    created: int,
    skipped: int,
    errors: int,
    lookback_start: int,
    lookback_end: int,
    dry_run: bool = False,
) -> None:
    """Update sync state in DynamoDB."""
    if dry_run:
        logger.info("[DRY RUN] Would update sync state")
        return
    
    try:
        table.put_item(Item=ensure_decimal({
            "PK": "SYSTEM",
            "SK": "STRIPE_ORDER_SYNC",
            "lastSyncStartedAt": sync_started_at,
            "lastSyncCompletedAt": sync_completed_at,
            "lastSyncProcessed": processed,
            "lastSyncCreated": created,
            "lastSyncSkipped": skipped,
            "lastSyncErrors": errors,
            "lastLookbackStart": lookback_start,
            "lastLookbackEnd": lookback_end,
            "updatedAt": sync_completed_at,
        }))
    except Exception as exc:
        logger.error("Failed to update sync state: %s", exc)


# =============================================================================
# Order Existence Check
# =============================================================================

def _order_exists_for_session(table, user_id: str, stripe_session_id: str) -> bool:
    """Check if an order snapshot already exists for this Stripe session.
    
    Uses a query with filter to find orders by stripeSessionId.
    """
    try:
        response = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ORDER#"),
            FilterExpression=Attr("stripeSessionId").eq(stripe_session_id),
            ProjectionExpression="PK, SK, stripeSessionId",
            Limit=1,
        )
        return len(response.get("Items", [])) > 0
    except Exception as exc:
        logger.warning("Error checking order existence for %s: %s", stripe_session_id, exc)
        # Return True to be safe (don't create duplicate)
        return True


def _order_exists_by_event(table, stripe_session_id: str) -> bool:
    """Check if a webhook event was already processed for this session.
    
    This is a backup check using the EVENT# records.
    """
    try:
        # Look for any checkout.session.completed event for this session
        response = table.query(
            IndexName="sessionId-index",  # Requires GSI on sessionId
            KeyConditionExpression=Key("sessionId").eq(stripe_session_id),
            FilterExpression=Attr("eventType").eq("checkout.session.completed") & Attr("orderCreated").eq(True),
            Limit=1,
        )
        return len(response.get("Items", [])) > 0
    except Exception:
        # GSI might not exist, fall back to direct query approach
        return False


# =============================================================================
# Line Items Fetching
# =============================================================================

def _fetch_line_items(stripe_session_id: str) -> List[Dict[str, Any]]:
    """Fetch and normalize line items from Stripe."""
    try:
        response = stripe.checkout.Session.list_line_items(
            stripe_session_id,
            limit=100,
            expand=["data.price.product"]
        )
        
        items = []
        for item in response.get("data", []):
            price = _to_plain_dict(_safe_get_attr(item, "price"))
            product = _to_plain_dict(_safe_get_attr(price, "product"))
            product_metadata = _to_plain_dict(_safe_get_attr(product, "metadata"))
            
            normalized = {
                "name": item.get("description") or product.get("name", "Item"),
                "quantity": item.get("quantity", 1),
                "unitPrice": price.get("unit_amount", 0),
                "currency": (item.get("currency") or price.get("currency") or "usd").lower(),
                "amountTotal": item.get("amount_total", 0),
                "amountSubtotal": item.get("amount_subtotal", 0),
                "stripePriceId": price.get("id"),
                "stripeProductId": product.get("id") if isinstance(product.get("id"), str) else None,
            }
            
            # Add product metadata
            if product_metadata.get("sku"):
                normalized["sku"] = product_metadata["sku"]
            if product_metadata.get("collection"):
                normalized["collectionId"] = product_metadata["collection"]
            if product_metadata.get("variant_id"):
                normalized["variantId"] = product_metadata["variant_id"]
            if product_metadata.get("color"):
                normalized["color"] = product_metadata["color"]
            
            items.append(normalized)
        
        return items
        
    except stripe.error.StripeError as exc:
        logger.warning("Failed to fetch line items for %s: %s", stripe_session_id, exc)
        return []


# =============================================================================
# Order Snapshot Creation
# =============================================================================

def _create_order_snapshot_from_session(
    session: Dict[str, Any],
    table,
    processed_at: str,
    dry_run: bool = False,
) -> Tuple[bool, Optional[str]]:
    """Create an order snapshot from a Stripe checkout session.
    
    Returns:
        Tuple of (success: bool, order_number: Optional[str])
    """
    session_id = session.get("id")
    metadata = _to_plain_dict(session.get("metadata"))
    
    # Extract user ID
    user_id = metadata.get("userId") or metadata.get("user_id")
    customer_details = _to_plain_dict(session.get("customer_details"))
    customer_email = customer_details.get("email") or session.get("customer_email")
    
    if not user_id:
        if customer_email:
            user_id = customer_email
        else:
            logger.warning("Session %s has no userId or email, skipping", session_id)
            return False, None
    
    # Check if order already exists
    if _order_exists_for_session(table, user_id, session_id):
        logger.debug("Order already exists for session %s", session_id)
        return False, None
    
    # Generate order number
    order_number = _generate_order_number(session_id)
    
    # Fetch line items
    line_items = _fetch_line_items(session_id)
    
    # Build order snapshot
    created_timestamp = session.get("created", int(time.time()))
    
    order_item: Dict[str, Any] = {
        "PK": f"USER#{user_id}",
        "SK": f"ORDER#{created_timestamp}#{session_id}",
        "orderId": session_id,
        "orderNumber": order_number,
        "userId": user_id,
        "status": "completed",
        "amount": session.get("amount_total", 0),
        "amountSubtotal": session.get("amount_subtotal", 0),
        "currency": (session.get("currency") or "usd").lower(),
        "items": line_items,
        "itemCount": len(line_items),
        "createdAt": datetime.fromtimestamp(created_timestamp, timezone.utc).isoformat(),
        "updatedAt": processed_at,
        "completedAt": processed_at,
        "syncedAt": processed_at,
        "source": "nightly_sync",  # Distinguish from webhook-created orders
        
        # Stripe references
        "stripeSessionId": session_id,
        "stripePaymentIntentId": session.get("payment_intent"),
        "stripeCustomerId": session.get("customer"),
        "stripePaymentStatus": session.get("payment_status"),
        
        # Customer info
        "customerEmail": customer_email,
    }
    
    # Add customer phone if available
    customer_phone = customer_details.get("phone")
    if customer_phone:
        order_item["customerPhone"] = customer_phone
    
    # Add shipping address if available
    shipping_details = _to_plain_dict(session.get("shipping_details"))
    if shipping_details:
        shipping_address = _to_plain_dict(shipping_details.get("address"))
        order_item["shippingAddress"] = {
            "name": shipping_details.get("name"),
            "line1": shipping_address.get("line1"),
            "line2": shipping_address.get("line2"),
            "city": shipping_address.get("city"),
            "state": shipping_address.get("state"),
            "postalCode": shipping_address.get("postal_code"),
            "country": shipping_address.get("country"),
        }
    
    # Add quote reference if available
    quote_signature = metadata.get("quoteSignature") or metadata.get("quote_signature")
    if quote_signature:
        order_item["quoteSignature"] = quote_signature
    
    # Add TTL if configured
    ttl_days = get_env_int(ORDER_TTL_DAYS_ENV, DEFAULT_ORDER_TTL_DAYS)
    if ttl_days > 0:
        order_item["expiresAt"] = int(time.time()) + (ttl_days * 86400)
    
    # Write to DynamoDB
    if dry_run:
        logger.info("[DRY RUN] Would create order: %s for user %s", order_number, user_id)
        return True, order_number
    
    try:
        table.put_item(Item=ensure_decimal(order_item))
        logger.info(
            "Created order snapshot: orderNumber=%s userId=%s amount=%s items=%d (via sync)",
            order_number,
            user_id,
            order_item["amount"],
            len(line_items),
        )
        return True, order_number
    except Exception as exc:
        logger.error("Failed to create order snapshot for %s: %s", session_id, exc)
        return False, None


# =============================================================================
# Main Sync Logic
# =============================================================================

def _run_sync(
    table,
    lookback_hours: int,
    max_sessions: int,
    dry_run: bool,
) -> Dict[str, Any]:
    """Execute the sync process.
    
    Returns a summary dictionary with sync results.
    """
    sync_started_at = datetime.now(timezone.utc).isoformat()
    now_ts = int(time.time())
    since_ts = now_ts - (lookback_hours * 3600)
    
    logger.info(
        "Starting sync: lookback=%dh, since=%s, max=%d, dry_run=%s",
        lookback_hours,
        datetime.fromtimestamp(since_ts, timezone.utc).isoformat(),
        max_sessions,
        dry_run,
    )
    
    # Counters
    processed = 0
    created = 0
    skipped = 0
    errors = 0
    created_orders: List[str] = []
    
    try:
        # Query Stripe for completed checkout sessions
        sessions = stripe.checkout.Session.list(
            created={"gte": since_ts, "lte": now_ts},
            status="complete",
            limit=100,
            expand=["data.customer_details", "data.shipping_details"],
        )
        
        for session in sessions.auto_paging_iter():
            if processed >= max_sessions:
                logger.warning("Reached max sessions limit (%d), stopping", max_sessions)
                break
            
            processed += 1
            session_dict = _to_plain_dict(session)
            session_id = session_dict.get("id")
            
            try:
                success, order_number = _create_order_snapshot_from_session(
                    session=session_dict,
                    table=table,
                    processed_at=sync_started_at,
                    dry_run=dry_run,
                )
                
                if success and order_number:
                    created += 1
                    created_orders.append(order_number)
                else:
                    skipped += 1
                    
            except Exception as exc:
                logger.error("Error processing session %s: %s", session_id, exc)
                errors += 1
    
    except stripe.error.StripeError as exc:
        logger.error("Stripe API error during sync: %s", exc)
        errors += 1
    
    sync_completed_at = datetime.now(timezone.utc).isoformat()
    
    # Update sync state
    _update_sync_state(
        table=table,
        sync_started_at=sync_started_at,
        sync_completed_at=sync_completed_at,
        processed=processed,
        created=created,
        skipped=skipped,
        errors=errors,
        lookback_start=since_ts,
        lookback_end=now_ts,
        dry_run=dry_run,
    )
    
    return {
        "syncStartedAt": sync_started_at,
        "syncCompletedAt": sync_completed_at,
        "lookbackHours": lookback_hours,
        "lookbackWindow": {
            "from": datetime.fromtimestamp(since_ts, timezone.utc).isoformat(),
            "to": datetime.fromtimestamp(now_ts, timezone.utc).isoformat(),
        },
        "processed": processed,
        "created": created,
        "skipped": skipped,
        "errors": errors,
        "createdOrders": created_orders[:20],  # Limit to first 20 for response size
        "dryRun": dry_run,
    }


# =============================================================================
# Lambda Handler
# =============================================================================

def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    Stripe Order Sync Lambda Handler.
    
    Triggered by:
        - CloudWatch Events (EventBridge) schedule (nightly)
        - Manual invocation via AWS Console or CLI
        - API Gateway (optional admin endpoint)
    
    Event payload (optional):
        {
            "lookbackHours": 48,      # Override default lookback
            "maxSessions": 100,       # Override max sessions
            "dryRun": true            # Preview without writing
        }
    """
    logger.info("Stripe order sync started, event: %s", json.dumps(event, default=str))
    
    # Determine trigger source
    trigger_source = "manual"
    if event.get("source") == "aws.events":
        trigger_source = "scheduled"
    elif event.get("detail-type"):
        trigger_source = f"eventbridge:{event.get('detail-type')}"
    elif event.get("httpMethod"):
        trigger_source = "api"
    
    # Initialize Stripe
    if not _initialize_stripe():
        error_response = {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "Stripe configuration error",
                "message": "Failed to initialize Stripe API",
            }),
        }
        logger.error("Sync aborted: Stripe not initialized")
        return error_response
    
    # Get configuration (event overrides > env vars > defaults)
    lookback_hours = (
        event.get("lookbackHours") or
        get_env_int(SYNC_LOOKBACK_HOURS_ENV, DEFAULT_LOOKBACK_HOURS)
    )
    max_sessions = (
        event.get("maxSessions") or
        get_env_int(SYNC_MAX_SESSIONS_ENV, DEFAULT_MAX_SESSIONS)
    )
    dry_run = (
        event.get("dryRun") if event.get("dryRun") is not None
        else _get_env_bool(SYNC_DRY_RUN_ENV, False)
    )
    
    # Get DynamoDB table
    table = get_commerce_table()
    
    # Run sync
    try:
        result = _run_sync(
            table=table,
            lookback_hours=lookback_hours,
            max_sessions=max_sessions,
            dry_run=dry_run,
        )
        result["trigger"] = trigger_source
        result["status"] = "success"
        
        logger.info(
            "Sync completed: processed=%d, created=%d, skipped=%d, errors=%d",
            result["processed"],
            result["created"],
            result["skipped"],
            result["errors"],
        )
        
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(result, default=str),
        }
        
    except Exception as exc:
        logger.exception("Sync failed with unexpected error: %s", exc)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "status": "error",
                "error": str(exc),
                "trigger": trigger_source,
            }),
        }