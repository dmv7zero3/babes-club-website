"""Babes Club Stripe webhook Lambda entrypoint (commerce shared layer integration).

Updated: 2025-11-26 - Added order snapshot creation on checkout.session.completed

This Lambda:
1. Verifies Stripe webhook signatures
2. Records idempotent event markers in DynamoDB
3. Updates session status for checkout events
4. Creates OrderSnapshot records for completed checkouts (NEW)
"""

from __future__ import annotations

import base64
import binascii
import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import stripe  # type: ignore[attr-defined]
from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    CORS_ALLOW_ORIGIN_ENV,
    EVENT_TTL_ENV,
    STRIPE_WEBHOOK_TOLERANCE_ENV,
    get_commerce_table,
    get_env_int,
    get_session_pointer,
    get_stripe_secret,
    get_stripe_webhook_secret,
    ensure_decimal,
    json_response,
    now_utc_iso,
    record_event,
    update_session_status,
)


logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


# =============================================================================
# Constants
# =============================================================================

ORDER_TTL_DAYS_ENV = "ORDER_TTL_DAYS"
DEFAULT_ORDER_TTL_DAYS = 0  # 0 means no TTL (orders persist indefinitely)

COMPLETION_EVENTS = {
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
}


# =============================================================================
# Helper Functions (existing)
# =============================================================================

def _redact_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy of the event without bodies or sensitive headers."""
    request_context = event.get("requestContext") or {}
    headers = event.get("headers") or {}

    redacted = {
        "httpMethod": event.get("httpMethod"),
        "path": event.get("path"),
        "queryStringParameters": event.get("queryStringParameters"),
        "requestContext": {
            "identity": request_context.get("identity", {}),
            "requestId": request_context.get("requestId"),
        },
        "headers": {
            key: value
            for key, value in headers.items()
            if key.lower() in {"user-agent", "x-forwarded-for", "x-api-gateway-key"}
        },
    }

    return redacted


_ALLOWED_ORIGINS_CACHE: list[str] | None = None
_STRIPE_INITIALIZED = False


def _get_allowed_origins() -> list[str]:
    global _ALLOWED_ORIGINS_CACHE  # pylint: disable=global-statement
    if _ALLOWED_ORIGINS_CACHE is not None:
        return _ALLOWED_ORIGINS_CACHE

    raw = os.getenv(CORS_ALLOW_ORIGIN_ENV, "")
    if not raw:
        _ALLOWED_ORIGINS_CACHE = []
        return _ALLOWED_ORIGINS_CACHE

    tokens = [token.strip() for token in re.split(r"[,\s]+", raw) if token.strip()]
    _ALLOWED_ORIGINS_CACHE = tokens
    return tokens


def _resolve_cors_origin(event: Dict[str, Any]) -> str:
    allowed = _get_allowed_origins()
    if not allowed:
        return os.getenv(CORS_ALLOW_ORIGIN_ENV, "*")

    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")
    if origin and origin in allowed:
        return origin

    return allowed[0]


def _build_response(status_code: int, payload: Dict[str, Any], cors_origin: str) -> Dict[str, Any]:
    response = json_response(status_code, payload, cors_origin=cors_origin)
    response.setdefault("headers", {})["Vary"] = "Origin"
    return response


def _error(status_code: int, message: str, cors_origin: str) -> Dict[str, Any]:
    return _build_response(status_code, {"error": message}, cors_origin)


def _initialize_stripe_if_needed() -> bool:
    global _STRIPE_INITIALIZED  # pylint: disable=global-statement
    if _STRIPE_INITIALIZED:
        return True

    secret = get_stripe_secret(optional=True)
    if not secret:
        return False

    stripe.api_key = secret
    _STRIPE_INITIALIZED = True
    return True


def _get_raw_body(event: Dict[str, Any]) -> str:
    body = event.get("body")
    is_base64 = event.get("isBase64Encoded", False)

    if body is None:
        return ""

    if isinstance(body, str):
        if is_base64:
            decoded = base64.b64decode(body)
            return decoded.decode("utf-8")
        return body

    if isinstance(body, (bytes, bytearray)):
        data = bytes(body)
        if is_base64:
            data = base64.b64decode(data)
        return data.decode("utf-8")

    return json.dumps(body)


def _extract_signature_header(event: Dict[str, Any]) -> str | None:
    headers = event.get("headers") or {}
    for key in ("Stripe-Signature", "stripe-signature", "STRIPE-SIGNATURE"):
        value = headers.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    for key, value in headers.items():
        if isinstance(key, str) and key.lower() == "stripe-signature" and isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _to_plain_dict(value: Any) -> Dict[str, Any]:
    if hasattr(value, "to_dict_recursive"):
        return value.to_dict_recursive()  # type: ignore[no-any-return]
    if isinstance(value, dict):
        return value
    if hasattr(value, "items"):
        try:
            return dict(value.items())  # type: ignore[call-arg]
        except Exception:  # pragma: no cover - defensive fallback
            return {}
    return {}


def _summarize_event_object(data_object: Dict[str, Any]) -> Dict[str, Any]:
    metadata_raw = data_object.get("metadata")
    metadata_summary: Dict[str, Any] = {}
    if isinstance(metadata_raw, dict):
        for key, value in metadata_raw.items():
            try:
                metadata_summary[str(key)] = str(value)[:500]
            except Exception:  # pragma: no cover - defensive conversion
                continue

    customer_details = _to_plain_dict(data_object.get("customer_details")) if data_object.get("customer_details") else {}
    customer_email = customer_details.get("email") or data_object.get("customer_email")

    summary = {
        "status": data_object.get("status"),
        "paymentStatus": data_object.get("payment_status"),
        "amountTotal": data_object.get("amount_total"),
        "amountSubtotal": data_object.get("amount_subtotal"),
        "currency": data_object.get("currency"),
        "customer": data_object.get("customer"),
        "customerEmail": customer_email,
        "paymentIntent": data_object.get("payment_intent"),
        "metadata": metadata_summary or None,
    }

    return {key: value for key, value in summary.items() if value is not None}


# =============================================================================
# NEW: Order Snapshot Creation
# =============================================================================

def _generate_order_number(stripe_session_id: str) -> str:
    """Generate a human-readable order number from Stripe session ID.
    
    Format: BC-{last 8 chars of session ID uppercase}
    Example: BC-A1B2C3D4
    """
    if not stripe_session_id:
        return f"BC-{int(time.time())}"
    
    suffix = stripe_session_id[-8:].upper()
    # Remove any non-alphanumeric characters
    suffix = re.sub(r"[^A-Z0-9]", "", suffix)
    return f"BC-{suffix}"


def _fetch_line_items_from_stripe(stripe_session_id: str) -> List[Dict[str, Any]]:
    """Fetch line items from Stripe API for the given session.
    
    Returns a list of normalized line item dictionaries.
    """
    if not _initialize_stripe_if_needed():
        logger.warning("Cannot fetch line items: Stripe not initialized")
        return []
    
    try:
        line_items_response = stripe.checkout.Session.list_line_items(
            stripe_session_id,
            limit=100,
            expand=["data.price.product"]
        )
        
        items = []
        for item in line_items_response.get("data", []):
            price_obj = _to_plain_dict(item.get("price")) if item.get("price") else {}
            product_obj = _to_plain_dict(price_obj.get("product")) if price_obj.get("product") else {}
            product_metadata = _to_plain_dict(product_obj.get("metadata")) if product_obj.get("metadata") else {}
            
            normalized_item = {
                "name": item.get("description") or product_obj.get("name", "Item"),
                "quantity": item.get("quantity", 1),
                "unitPrice": price_obj.get("unit_amount", 0),
                "currency": (item.get("currency") or price_obj.get("currency") or "usd").lower(),
                "amountTotal": item.get("amount_total", 0),
                "amountSubtotal": item.get("amount_subtotal", 0),
                "stripePriceId": price_obj.get("id"),
                "stripeProductId": product_obj.get("id") if isinstance(product_obj.get("id"), str) else None,
            }
            
            # Add SKU and other metadata if available
            if product_metadata.get("sku"):
                normalized_item["sku"] = product_metadata["sku"]
            if product_metadata.get("collection"):
                normalized_item["collectionId"] = product_metadata["collection"]
            if product_metadata.get("variant_id"):
                normalized_item["variantId"] = product_metadata["variant_id"]
            if product_metadata.get("color"):
                normalized_item["color"] = product_metadata["color"]
            
            items.append(normalized_item)
        
        return items
        
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        logger.warning("Failed to fetch line items from Stripe: %s", exc)
        return []


def _get_quote_data(quote_signature: str, table: Any) -> Optional[Dict[str, Any]]:
    """Retrieve cached quote data from DynamoDB.
    
    Returns the quote item with pricing summary and request items.
    """
    if not quote_signature:
        return None
    
    try:
        response = table.get_item(
            Key={"PK": f"QUOTE#{quote_signature}", "SK": "CACHE"},
            ConsistentRead=False
        )
        return response.get("Item")
    except Exception as exc:
        logger.warning("Failed to retrieve quote data for %s: %s", quote_signature, exc)
        return None


def _create_order_snapshot(
    stripe_session_id: str,
    data_object: Dict[str, Any],
    metadata: Dict[str, Any],
    quote_signature: Optional[str],
    processed_at: str,
    table: Any,
) -> Optional[Dict[str, Any]]:
    """Create an order snapshot record in DynamoDB.
    
    This function:
    1. Extracts userId from metadata (required) or falls back to customer email
    2. Fetches line items from Stripe API
    3. Enriches with cached quote data if available
    4. Writes the order snapshot to DynamoDB
    
    Returns the created order item or None if creation failed.
    """
    # Extract user identifier
    user_id = metadata.get("userId") or metadata.get("user_id")
    customer_details = _to_plain_dict(data_object.get("customer_details")) if data_object.get("customer_details") else {}
    customer_email = customer_details.get("email") or data_object.get("customer_email")
    
    # Fallback to email if no userId
    if not user_id:
        if customer_email:
            user_id = customer_email
            logger.info("No userId in metadata, using customer email as identifier: %s", customer_email)
        else:
            logger.warning("Cannot create order snapshot: no userId or customer email available")
            return None
    
    # Generate order number
    order_number = _generate_order_number(stripe_session_id)
    
    # Fetch line items from Stripe
    line_items = _fetch_line_items_from_stripe(stripe_session_id)
    
    # Get quote data for enrichment
    quote_data = _get_quote_data(quote_signature, table) if quote_signature else None
    
    # Extract pricing from quote or Stripe data
    pricing_summary = {}
    if quote_data:
        pricing_summary = _to_plain_dict(quote_data.get("pricingSummary")) if quote_data.get("pricingSummary") else {}
    
    # Build order snapshot
    timestamp = int(time.time())
    order_id = stripe_session_id  # Use Stripe session ID as order ID
    
    order_item: Dict[str, Any] = {
        "PK": f"USER#{user_id}",
        "SK": f"ORDER#{timestamp}#{order_id}",
        "orderId": order_id,
        "orderNumber": order_number,
        "userId": user_id,
        "status": "completed",
        "amount": data_object.get("amount_total", 0),
        "amountSubtotal": data_object.get("amount_subtotal", 0),
        "currency": (data_object.get("currency") or "usd").lower(),
        "items": line_items,
        "itemCount": len(line_items),
        "createdAt": processed_at,
        "updatedAt": processed_at,
        "completedAt": processed_at,
        
        # Stripe references
        "stripeSessionId": stripe_session_id,
        "stripePaymentIntentId": data_object.get("payment_intent"),
        "stripeCustomerId": data_object.get("customer"),
        "stripePaymentStatus": data_object.get("payment_status"),
        
        # Customer info
        "customerEmail": customer_email,
    }
    
    # Add shipping address if available
    shipping_details = _to_plain_dict(data_object.get("shipping_details")) if data_object.get("shipping_details") else {}
    if shipping_details:
        shipping_address = _to_plain_dict(shipping_details.get("address")) if shipping_details.get("address") else {}
        order_item["shippingAddress"] = {
            "name": shipping_details.get("name"),
            "line1": shipping_address.get("line1"),
            "line2": shipping_address.get("line2"),
            "city": shipping_address.get("city"),
            "state": shipping_address.get("state"),
            "postalCode": shipping_address.get("postal_code"),
            "country": shipping_address.get("country"),
        }
    
    # Add customer phone if available
    customer_phone = customer_details.get("phone") or data_object.get("customer_phone")
    if customer_phone:
        order_item["customerPhone"] = customer_phone
    
    # Add quote reference and enrichment
    if quote_signature:
        order_item["quoteSignature"] = quote_signature
    
    if pricing_summary:
        order_item["pricingSummary"] = pricing_summary
        
        # Include discount info if available
        discounts = pricing_summary.get("discounts")
        if discounts:
            total_discount = sum(
                d.get("discountCents", 0) for d in discounts
                if isinstance(d, dict)
            )
            if total_discount > 0:
                order_item["totalDiscountCents"] = total_discount
                order_item["discounts"] = discounts
    
    # Add metadata (excluding internal fields)
    filtered_metadata = {
        k: v for k, v in metadata.items()
        if k not in {"quoteSignature", "quote_signature", "normalizedHash", "normalized_hash", "userId", "user_id"}
    }
    if filtered_metadata:
        order_item["metadata"] = filtered_metadata
    
    # Add TTL if configured
    ttl_days = get_env_int(ORDER_TTL_DAYS_ENV, DEFAULT_ORDER_TTL_DAYS)
    if ttl_days > 0:
        order_item["expiresAt"] = timestamp + (ttl_days * 86400)
    
    # Write to DynamoDB
    try:
        table.put_item(Item=ensure_decimal(order_item))
        logger.info(
            "Created order snapshot: orderNumber=%s userId=%s amount=%s items=%d",
            order_number,
            user_id,
            order_item["amount"],
            len(line_items)
        )
        return order_item
    except Exception as exc:
        logger.exception("Failed to create order snapshot: %s", exc)
        return None


# =============================================================================
# Main Handler
# =============================================================================

def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        logger.debug("stripe-webhook event (redacted): %s", json.dumps(_redact_event(event)))
    except Exception:  # pragma: no cover - defensive logging only
        logger.warning("stripe-webhook event logging failed")

    cors_origin = _resolve_cors_origin(event)

    method = (event.get("httpMethod") or "POST").upper()
    if method == "OPTIONS":
        return _build_response(200, {"ok": True}, cors_origin)
    if method != "POST":
        return _error(405, "Method not allowed", cors_origin)

    try:
        raw_body = _get_raw_body(event)
    except (ValueError, UnicodeDecodeError, binascii.Error) as exc:  # pragma: no cover - defensive decoding
        logger.warning("Failed to decode Stripe webhook body", extra={"error": str(exc)})
        return _error(400, "Invalid request body", cors_origin)

    signature_header = _extract_signature_header(event)
    if not signature_header:
        return _error(400, "Missing Stripe-Signature header", cors_origin)

    webhook_secret = get_stripe_webhook_secret(optional=False)
    if not webhook_secret:
        logger.error("Stripe webhook secret is not configured")
        return _error(500, "Webhook service misconfigured", cors_origin)

    tolerance_env = os.getenv(STRIPE_WEBHOOK_TOLERANCE_ENV)
    try:
        tolerance = int(tolerance_env) if tolerance_env else 300
    except (TypeError, ValueError):
        tolerance = 300

    try:
        stripe_event = stripe.Webhook.construct_event(
            payload=raw_body,
            sig_header=signature_header,
            secret=webhook_secret,
            tolerance=tolerance,
        )
    except stripe.error.SignatureVerificationError as exc:  # type: ignore[attr-defined]
        logger.warning("Stripe signature verification failed", extra={"error": str(exc)})
        return _error(400, "Invalid Stripe signature", cors_origin)
    except (ValueError, TypeError) as exc:
        logger.warning("Stripe webhook payload invalid", extra={"error": str(exc)})
        return _error(400, "Invalid Stripe payload", cors_origin)

    event_dict = stripe_event.to_dict_recursive() if hasattr(stripe_event, "to_dict_recursive") else dict(stripe_event)
    event_id = event_dict.get("id")
    event_type = event_dict.get("type")

    if not isinstance(event_id, str) or not event_id:
        return _error(400, "Stripe event id is required", cors_origin)
    if not isinstance(event_type, str) or not event_type:
        return _error(400, "Stripe event type is required", cors_origin)

    table = get_commerce_table()

    # Check for duplicate event (idempotency)
    existing = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"}).get("Item")
    if existing:
        return _build_response(200, {"status": existing.get("status", "already-processed")}, cors_origin)

    data_object_raw = ((event_dict.get("data") or {}).get("object") or {})
    data_object = _to_plain_dict(data_object_raw)

    session_id_raw = data_object.get("id") or data_object.get("session_id")
    session_id = session_id_raw if isinstance(session_id_raw, str) and session_id_raw else None

    status_map = {
        "checkout.session.completed": "completed",
        "checkout.session.expired": "expired",
        "checkout.session.async_payment_failed": "failed",
        "checkout.session.async_payment_succeeded": "completed",
        "checkout.session.async_payment_pending": "pending",
        "checkout.session.canceled": "canceled",
    }
    derived_status = status_map.get(event_type, "received")

    processed_at = now_utc_iso()
    ttl_days = get_env_int(EVENT_TTL_ENV, 90)
    expires_at = int(time.time()) + max(1, ttl_days) * 86400

    # Resolve quote signature from session pointer or metadata
    quote_signature: str | None = None
    session_pointer: Dict[str, Any] | None = None
    if session_id:
        session_pointer = get_session_pointer(session_id, table=table)
        if session_pointer:
            quote_signature_raw = session_pointer.get("quoteSignature")
            if isinstance(quote_signature_raw, str) and quote_signature_raw:
                quote_signature = quote_signature_raw

    metadata_from_event = _to_plain_dict(data_object.get("metadata")) if data_object.get("metadata") else {}
    if not quote_signature:
        meta_quote_signature = metadata_from_event.get("quoteSignature") or metadata_from_event.get("quote_signature")
        if isinstance(meta_quote_signature, str) and meta_quote_signature:
            quote_signature = meta_quote_signature

    # Fetch additional session data from Stripe if needed
    remote_session_data: Dict[str, Any] | None = None
    if session_id and (not quote_signature or not metadata_from_event):
        if _initialize_stripe_if_needed():
            try:
                remote_session_obj = stripe.checkout.Session.retrieve(
                    session_id,
                    expand=["customer", "shipping_details"]
                )
                remote_session_data = _to_plain_dict(remote_session_obj)
            except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
                logger.debug("Unable to retrieve Stripe session", extra={"error": str(exc)})

    if remote_session_data:
        remote_metadata = _to_plain_dict(remote_session_data.get("metadata")) if remote_session_data.get("metadata") else {}
        if not metadata_from_event and remote_metadata:
            metadata_from_event = remote_metadata
        if not quote_signature:
            meta_quote_signature = remote_metadata.get("quoteSignature") or remote_metadata.get("quote_signature")
            if isinstance(meta_quote_signature, str) and meta_quote_signature:
                quote_signature = meta_quote_signature
        # Merge remote session data
        data_object.setdefault("url", remote_session_data.get("url"))
        data_object.setdefault("payment_status", remote_session_data.get("payment_status"))
        data_object.setdefault("status", remote_session_data.get("status"))
        data_object.setdefault("amount_total", remote_session_data.get("amount_total"))
        data_object.setdefault("amount_subtotal", remote_session_data.get("amount_subtotal"))
        data_object.setdefault("currency", remote_session_data.get("currency"))
        data_object.setdefault("customer", remote_session_data.get("customer"))
        data_object.setdefault("customer_email", remote_session_data.get("customer_email"))
        data_object.setdefault("payment_intent", remote_session_data.get("payment_intent"))
        data_object.setdefault("shipping_details", remote_session_data.get("shipping_details"))
        data_object.setdefault("customer_details", remote_session_data.get("customer_details"))

    customer_details = _to_plain_dict(data_object.get("customer_details")) if data_object.get("customer_details") else {}
    customer_email = customer_details.get("email") or data_object.get("customer_email")

    # Build status attributes for session update
    status_attributes = {
        "stripeStatus": data_object.get("status"),
        "stripePaymentStatus": data_object.get("payment_status"),
        "stripeCustomerId": data_object.get("customer"),
        "stripeCustomerEmail": customer_email,
        "stripePaymentIntentId": data_object.get("payment_intent"),
        "stripeAmountTotal": data_object.get("amount_total"),
        "stripeAmountSubtotal": data_object.get("amount_subtotal"),
        "stripeCurrency": data_object.get("currency"),
        "stripeMetadata": metadata_from_event or None,
        "stripeCheckoutUrl": data_object.get("url"),
    }

    if event_type in COMPLETION_EVENTS:
        status_attributes["stripeCompletedAt"] = processed_at

    cleaned_status_attributes = {k: v for k, v in status_attributes.items() if v is not None}

    # Update session status
    if quote_signature and session_id:
        update_session_status(
            quote_signature,
            session_id,
            derived_status,
            processed_at,
            table=table,
            extra_session_attributes=ensure_decimal(cleaned_status_attributes) if cleaned_status_attributes else None,
        )

    # ==========================================================================
    # NEW: Create order snapshot for completed checkouts
    # ==========================================================================
    order_snapshot = None
    if event_type in COMPLETION_EVENTS and session_id:
        logger.info("Processing checkout completion for session: %s", session_id)
        order_snapshot = _create_order_snapshot(
            stripe_session_id=session_id,
            data_object=data_object,
            metadata=metadata_from_event,
            quote_signature=quote_signature,
            processed_at=processed_at,
            table=table,
        )
        if order_snapshot:
            logger.info(
                "Order snapshot created successfully: orderNumber=%s orderId=%s",
                order_snapshot.get("orderNumber"),
                order_snapshot.get("orderId")
            )
        else:
            logger.warning("Failed to create order snapshot for session: %s", session_id)

    # Record event for idempotency
    event_item = ensure_decimal(
        {
            "PK": f"EVENT#{event_id}",
            "SK": "METADATA",
            "eventType": event_type,
            "processedAt": processed_at,
            "sessionId": session_id,
            "status": derived_status,
            "quoteSignature": quote_signature,
            "expiresAt": expires_at,
            "stripeSummary": _summarize_event_object(data_object),
            "signatureVerified": True,
            # NEW: Track order creation
            "orderCreated": order_snapshot is not None,
            "orderNumber": order_snapshot.get("orderNumber") if order_snapshot else None,
        }
    )

    record_event(event_item, table=table)

    # Build response
    response_payload: Dict[str, Any] = {
        "status": derived_status,
        "sessionId": session_id,
        "eventId": event_id,
    }
    if quote_signature:
        response_payload["quoteSignature"] = quote_signature
    if order_snapshot:
        response_payload["orderNumber"] = order_snapshot.get("orderNumber")
        response_payload["orderId"] = order_snapshot.get("orderId")

    return _build_response(200, response_payload, cors_origin)
