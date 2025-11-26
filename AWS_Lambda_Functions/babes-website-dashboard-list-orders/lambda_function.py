"""Placeholder handler that returns mock order listings."""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from shared_commerce import resolve_origin, get_commerce_table  # type: ignore


def _json_response(payload: Dict[str, Any], status: int = 200, cors_origin: str | None = None) -> Dict[str, Any]:
    origin = cors_origin or (os.environ.get("CORS_ALLOW_ORIGIN") or "*")
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    # Preflight handling
    method = (event.get("httpMethod") or "GET").upper()
    cors_origin = resolve_origin(event)
    if method == "OPTIONS":
        return _json_response({"ok": True}, status=200, cors_origin=cors_origin)

    # Get userId from authorizer
    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId")
    if not user_id:
        return _json_response({"error": "Unauthorized"}, status=401, cors_origin=cors_origin)

    # Pagination params
    query_params = event.get("queryStringParameters") or {}
    limit = int(query_params.get("limit", os.environ.get("ORDER_PAGE_SIZE", 20)))
    cursor = query_params.get("cursor")

    table = get_commerce_table()

    # Build DynamoDB query
    key_condition = "PK = :pk AND begins_with(SK, :sk_prefix)"
    expression_values = {
        ":pk": f"USER#{user_id}",
        ":sk_prefix": "ORDER#"
    }
    query_args = {
        "KeyConditionExpression": key_condition,
        "ExpressionAttributeValues": expression_values,
        "ScanIndexForward": False,  # Newest first
        "Limit": limit
    }
    if cursor:
        import base64, json as _json
        query_args["ExclusiveStartKey"] = _json.loads(base64.b64decode(cursor).decode())

    try:
        response = table.query(**query_args)
        items = response.get("Items", [])
        # Normalize orders for frontend
        orders = []
        for item in items:
            orders.append({
                "orderId": item.get("orderId"),
                "orderNumber": item.get("orderNumber"),
                "status": item.get("status"),
                "amount": item.get("amount"),
                "currency": item.get("currency"),
                "createdAt": item.get("createdAt"),
                "itemCount": item.get("itemCount"),
                "items": item.get("items", []),
            })

        next_cursor = None
        if response.get("LastEvaluatedKey"):
            import base64, json as _json
            next_cursor = base64.b64encode(_json.dumps(response["LastEvaluatedKey"]).encode()).decode()

        return _json_response({"orders": orders, "nextCursor": next_cursor}, cors_origin=cors_origin)
    except Exception as exc:
        return _json_response({"error": f"Failed to fetch orders: {exc}"}, status=500, cors_origin=cors_origin)
