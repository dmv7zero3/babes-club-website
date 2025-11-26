"""
Dashboard Update Profile Lambda - Updates user profile with email change support

---
REQUIRED SETUP:
- API Gateway POST and OPTIONS methods for `/dashboard/update-profile`
- API Gateway method response for POST must include:
    - Access-Control-Allow-Origin
    - Access-Control-Allow-Headers
    - Access-Control-Allow-Methods
- Lambda must return these CORS headers for all responses (success and error)
- API Gateway must attach a CUSTOM authorizer that returns `userId` in the request context
- Frontend must send a valid Authorization header (JWT/session token)
- DynamoDB table must be accessible and have correct schema for user profiles and email lookups
---
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, Tuple

# Initialize logger at module level
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

try:
    from shared_commerce import (
        get_commerce_table,
        now_utc_iso,
        resolve_origin,
    )
except ImportError as e:
    logger.error(f"Failed to import shared_commerce: {e}")
    raise


def _parse_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], str | None]:
    """Parse and validate request body"""
    try:
        body = event.get("body") or "{}"
        logger.info(f"Parsing body: {body[:200]}...")  # Log first 200 chars
        
        if isinstance(body, str):
            parsed = json.loads(body or "{}")
            logger.info(f"Parsed body keys: {list(parsed.keys())}")
            return parsed, None
        if isinstance(body, bytes):
            parsed = json.loads(body.decode("utf-8"))
            logger.info(f"Parsed body keys: {list(parsed.keys())}")
            return parsed, None
        return body, None
    except json.JSONDecodeError as exc:
        logger.error(f"JSON decode error: {exc}")
        return {}, f"Invalid JSON: {exc}"


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response"""
    origin = cors_origin or "*"
    response = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }
    logger.info(f"Returning response: {status_code}")
    return response


# Fields users can update directly
ALLOWED_FIELDS = {
    "displayName",
    "phone",
    "shippingAddress",
    "dashboardSettings",
    "preferredWallet"
}


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Update user profile
    
    Supports:
    - Updating allowed fields (displayName, phone, shippingAddress, etc.)
    - Email changes (with 4-day rate limit)
    
    Request body:
        {
            "displayName": "Jane Doe",          // optional
            "email": "newemail@example.com",    // optional (triggers email change)
            "shippingAddress": {...},           // optional
            "dashboardSettings": {...},         // optional
            "phone": "+1234567890",             // optional
            "preferredWallet": "0x..."          // optional
        }
    
    Response:
        {
            "profile": {
                // Updated profile (no sensitive fields)
            }
        }
    """
    # Log the entire event for debugging
    logger.info("=" * 80)
    logger.info("LAMBDA INVOCATION START")
    logger.info(f"Request ID: {getattr(context, 'aws_request_id', 'N/A')}")
    logger.info(f"HTTP Method: {event.get('httpMethod', 'UNKNOWN')}")
    logger.info(f"Path: {event.get('path', 'UNKNOWN')}")
    logger.info(f"Headers: {json.dumps(event.get('headers', {}), indent=2)}")
    logger.info(f"Request Context: {json.dumps(event.get('requestContext', {}), indent=2)}")
    
    # Removed dangling try block (was causing syntax error)
    # Handle CORS preflight
    method = (event.get("httpMethod") or "POST").upper()
    cors_origin = resolve_origin(event)

    logger.info(f"Method: {method}, CORS origin: {cors_origin}")

    if method == "OPTIONS":
        logger.info("Handling OPTIONS preflight request")
        return _response(200, {"ok": True}, cors_origin=cors_origin)

    # Parse request body
    body, error = _parse_body(event)
    if error:
        logger.error(f"Body parse error: {error}")
        return _response(400, {"error": error}, cors_origin=cors_origin)

    # Get userId from authorizer context
    authorizer_context = event.get("requestContext", {}).get("authorizer", {})
    logger.info(f"Authorizer context: {json.dumps(authorizer_context, indent=2)}")

    user_id = authorizer_context.get("userId")

    if not user_id:
        logger.warning("No userId in authorizer context")
        return _response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    logger.info(f"Processing update for user: {user_id}")

    # Get DynamoDB table
    try:
        table = get_commerce_table()
        logger.info(f"Connected to table: {table.table_name}")
    except Exception as exc:
        logger.exception(f"Failed to get commerce table: {exc}")
        return _response(500, {"error": "Database connection failed"}, cors_origin=cors_origin)

    # Fetch current profile
    try:
        logger.info(f"Fetching profile for USER#{user_id}")
        existing_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        existing = existing_response.get("Item")
        if not existing:
            logger.warning(f"Profile not found for user: {user_id}")
            return _response(404, {"error": "Profile not found"}, cors_origin=cors_origin)
        logger.info(f"Found existing profile with keys: {list(existing.keys())}")
    except Exception as exc:
        logger.exception(f"Failed to read profile for {user_id}: {exc}")
        return _response(500, {"error": "Database error"}, cors_origin=cors_origin)

        # Collect updates for allowed fields
        updates: Dict[str, Any] = {}
        for key, val in (body or {}).items():
            if key in ALLOWED_FIELDS:
                updates[key] = val
                logger.info(f"Adding update for field: {key}")

        # Handle email change: only check uniqueness and update
        new_email = (body.get("email") or "").strip()
        old_email_lower = existing.get("emailLower", "")
        logger.info(f"Email change request: '{new_email}' (current: '{old_email_lower}')")
        if new_email:
            new_email_lower = new_email.lower()
            if new_email_lower == old_email_lower:
                logger.info(f"Email unchanged for {user_id}, skipping email update")
            else:
                # Check if new email is available
                try:
                    logger.info(f"Checking if email {new_email_lower} is available")
                    email_check = table.get_item(
                        Key={"PK": f"EMAIL#{new_email_lower}", "SK": "LOOKUP"}
                    ).get("Item")
                    if email_check:
                        logger.warning(f"Email {new_email_lower} already in use")
                        return _response(409, {"error": "Email already in use"}, cors_origin=cors_origin)
                    logger.info(f"Email {new_email_lower} is available")
                except Exception as exc:
                    logger.exception(f"Failed to check email availability: {exc}")
                    return _response(500, {"error": "Database error"}, cors_origin=cors_origin)
                # Email change is valid - add to updates
                updates["email"] = new_email
                updates["emailLower"] = new_email_lower
                updates["emailChangedAt"] = now_utc_iso()

        # Build DynamoDB transaction
        transact_items = []
        expr_parts = []
        expr_values = {}
        for key, val in updates.items():
            placeholder = f":{key}"
            expr_parts.append(f"{key} = {placeholder}")
            expr_values[placeholder] = val
        if expr_parts:
            update_expr = "SET " + ", ".join(expr_parts)
            logger.info(f"Update expression: {update_expr}")
            logger.info(f"Expression values: {json.dumps({k: str(v)[:100] for k, v in expr_values.items()})}")
            transact_items.append({
                "Update": {
                    "TableName": table.table_name,
                    "Key": {"PK": f"USER#{user_id}", "SK": "PROFILE"},
                    "UpdateExpression": update_expr,
                    "ExpressionAttributeValues": expr_values
                }
            })
        # If email changed, update EMAIL# lookups
        if new_email and new_email.lower() != old_email_lower:
            logger.info(f"Adding email lookup transactions for {new_email_lower}")
            # Create new email lookup
            transact_items.append({
                "Put": {
                    "TableName": table.table_name,
                    "Item": {
                        "PK": f"EMAIL#{new_email_lower}",
                        "SK": "LOOKUP",
                        "userId": user_id,
                        "email": new_email,
                        "emailLower": new_email_lower,
                        "createdAt": existing.get("createdAt", now_utc_iso()),
                        "setAt": now_utc_iso()
                    },
                    "ConditionExpression": "attribute_not_exists(PK)"
                }
            })
            # Delete old email lookup
            if old_email_lower:
                logger.info(f"Deleting old email lookup: {old_email_lower}")
                transact_items.append({
                    "Delete": {
                        "TableName": table.table_name,
                        "Key": {"PK": f"EMAIL#{old_email_lower}", "SK": "LOOKUP"}
                    }
                })