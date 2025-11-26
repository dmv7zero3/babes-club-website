"""Placeholder handler for fetching a single dashboard order."""

from __future__ import annotations

import json
from typing import Any, Dict
import os
import json

from shared_commerce import get_commerce_table, resolve_origin  # type: ignore

def _response(status_code: int, payload: Dict[str, Any], origin: str = "*") -> Dict[str, Any]:
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
    origin = resolve_origin(event)
    method = (event.get("httpMethod") or "GET").upper()
    if method == "OPTIONS":
        return _response(200, {"ok": True}, origin)

    # Auth/user context
    authorizer = (event.get("requestContext") or {}).get("authorizer", {})
    user_id = authorizer.get("userId")
    if not user_id:
        return _response(401, {"error": "Unauthorized"}, origin)

    path_params = event.get("pathParameters") or {}
    order_id = path_params.get("orderId")
    if not order_id:
        return _response(400, {"error": "Missing orderId"}, origin)

    table = get_commerce_table()

    # Query DynamoDB for order snapshot
    try:
        # Query for order with PK=USER#<userId> and SK begins_with ORDER# and orderId match
        response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            FilterExpression="orderId = :order_id",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk_prefix": "ORDER#",
                ":order_id": order_id
            },
            Limit=1
        )
        items = response.get("Items", [])
        if items:
            return _response(200, {"order": items[0]}, origin)
    except Exception as exc:
        # Log error, but continue to Stripe fallback
        pass

    # Fallback: fetch from Stripe API and cache
    try:
        import stripe
        stripe.api_key = os.environ.get("STRIPE_SECRET")
        session = stripe.checkout.Session.retrieve(
            order_id,
            expand=["line_items", "customer"]
        )
        # Build normalized order object
        order_item = {
            "orderId": session.id,
            "orderNumber": f"BC-{session.id[-8:].upper()}",
            "status": session.status,
            "amount": session.amount_total,
            "currency": session.currency,
            "createdAt": session.created,
            "itemCount": len(session.line_items.data) if hasattr(session, "line_items") else 0,
            "items": [
                {
                    "name": item.description,
                    "quantity": item.quantity,
                    "unitPrice": item.price.unit_amount if hasattr(item, "price") else None,
                    "sku": item.price.product.metadata.get("sku") if hasattr(item, "price") and hasattr(item.price, "product") and hasattr(item.price.product, "metadata") else None,
                }
                for item in getattr(session.line_items, "data", [])
            ],
            "customerEmail": getattr(session.customer_details, "email", None),
        }
        # Cache to DynamoDB for future requests
        try:
            timestamp = int(session.created) if hasattr(session, "created") else 0
            table.put_item(Item={
                "PK": f"USER#{user_id}",
                "SK": f"ORDER#{timestamp}#{session.id}",
                **order_item
            })
        except Exception:
            pass
        return _response(200, {"order": order_item}, origin)
    except Exception as exc:
        return _response(404, {"error": f"Order not found: {exc}"}, origin)
