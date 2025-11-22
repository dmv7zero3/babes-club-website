"""
Dashboard Update Profile Lambda - Updates user profile with email change support
Enforces 4-day cooldown between email changes
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any, Dict, Tuple

from shared_commerce import (
    get_commerce_table,
    now_utc_iso,
    resolve_origin,
)  # type: ignore


def _parse_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], str | None]:
    """Parse and validate request body"""
    try:
        body = event.get("body") or "{}"
        if isinstance(body, str):
            return json.loads(body or "{}"), None
        if isinstance(body, bytes):
            return json.loads(body.decode("utf-8")), None
        return body, None
    except json.JSONDecodeError as exc:
        return {}, f"Invalid JSON: {exc}"


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response"""
    origin = cors_origin or "*"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


# Fields users can update directly
ALLOWED_FIELDS = {
    "displayName",
    "phone",
    "shippingAddress",
    "dashboardSettings",
    "preferredWallet"
}


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
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
    import logging

    logger = logging.getLogger(__name__)
    if not logger.handlers:
        logging.basicConfig(level=logging.INFO)
    logger.setLevel(logging.INFO)

    # Handle CORS preflight
    method = (event.get("httpMethod") or "POST").upper()
    cors_origin = resolve_origin(event)
    
    if method == "OPTIONS":
        return _response(200, {"ok": True}, cors_origin=cors_origin)

    # Parse request body
    body, error = _parse_body(event)
    if error:
        return _response(400, {"error": error}, cors_origin=cors_origin)

    # Get userId from authorizer context
    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId")
    
    if not user_id:
        logger.warning("No userId in authorizer context")
        return _response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    table = get_commerce_table()

    # Fetch current profile
    try:
        existing_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        existing = existing_response.get("Item")
        
        if not existing:
            logger.warning(f"Profile not found for user: {user_id}")
            return _response(404, {"error": "Profile not found"}, cors_origin=cors_origin)
        
    except Exception as exc:
        logger.exception(f"Failed to read profile for {user_id}: {exc}")
        return _response(500, {"error": "Database error"}, cors_origin=cors_origin)

    # Collect updates for allowed fields
    updates: Dict[str, Any] = {}
    
    for key, val in (body or {}).items():
        if key in ALLOWED_FIELDS:
            updates[key] = val

    # Handle email change separately (special logic)
    new_email = (body.get("email") or "").strip()
    old_email_lower = existing.get("emailLower", "")
    
    if new_email:
        new_email_lower = new_email.lower()
        
        # Skip if email unchanged
        if new_email_lower == old_email_lower:
            logger.info(f"Email unchanged for {user_id}, skipping email update")
            new_email = None  # Don't process email change
        else:
            # Check rate limit (4 days between email changes)
            last_change_str = existing.get("emailChangedAt")
            
            if last_change_str:
                try:
                    last_change = datetime.fromisoformat(last_change_str.replace("Z", "+00:00"))
                    now = datetime.now(last_change.tzinfo)
                    time_since_change = now - last_change
                    
                    if time_since_change < timedelta(days=4):
                        days_remaining = 4 - time_since_change.days
                        logger.info(f"Email change rate limit hit for {user_id}")
                        return _response(
                            429,
                            {
                                "error": f"Please wait {days_remaining} more day(s) before changing your email again",
                                "daysRemaining": days_remaining
                            },
                            cors_origin=cors_origin
                        )
                except Exception as exc:
                    logger.warning(f"Failed to parse emailChangedAt: {exc}")

            # Check if new email is available
            try:
                email_check = table.get_item(
                    Key={"PK": f"EMAIL#{new_email_lower}", "SK": "LOOKUP"}
                ).get("Item")
                
                if email_check:
                    logger.info(f"Email {new_email_lower} already in use")
                    return _response(409, {"error": "Email already in use"}, cors_origin=cors_origin)
                
            except Exception as exc:
                logger.exception(f"Failed to check email availability: {exc}")
                return _response(500, {"error": "Database error"}, cors_origin=cors_origin)

            # Email change is valid - add to updates
            updates["email"] = new_email
            updates["emailLower"] = new_email_lower
            updates["emailChangedAt"] = now_utc_iso()

    # Check if there's anything to update
    if not updates:
        logger.info(f"No updates provided for {user_id}")
        return _response(400, {"error": "No fields to update"}, cors_origin=cors_origin)

    # Always update timestamp
    updates["updatedAt"] = now_utc_iso()

    # Build update transaction
    transact_items = []

    # 1. Update profile
    expr_parts = []
    expr_values: Dict[str, Any] = {}
    
    for key, val in updates.items():
        placeholder = f":{key}"
        expr_parts.append(f"{key} = {placeholder}")
        expr_values[placeholder] = val

    update_expr = "SET " + ", ".join(expr_parts)

    transact_items.append({
        "Update": {
            "TableName": table.table_name,
            "Key": {"PK": f"USER#{user_id}", "SK": "PROFILE"},
            "UpdateExpression": update_expr,
            "ExpressionAttributeValues": expr_values
        }
    })

    # 2. If email changed, update EMAIL# lookups
    if new_email:
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
                "ConditionExpression": "attribute_not_exists(PK)"  # Ensure still available
            }
        })

        # Delete old email lookup
        if old_email_lower:
            transact_items.append({
                "Delete": {
                    "TableName": table.table_name,
                    "Key": {"PK": f"EMAIL#{old_email_lower}", "SK": "LOOKUP"}
                }
            })

    # Execute transaction
    try:
        table.transact_write_items(TransactItems=transact_items)
        logger.info(f"Successfully updated profile for {user_id}")
        
        if new_email:
            logger.info(f"Email changed for {user_id}: {old_email_lower} → {new_email_lower}")
        
    except Exception as exc:
        # Check if it's a conditional check failure (email taken during update)
        if "ConditionalCheckFailed" in str(exc):
            logger.warning(f"Email {new_email_lower} taken during update for {user_id}")
            return _response(409, {"error": "Email already in use"}, cors_origin=cors_origin)
        
        logger.exception(f"Failed to update profile for {user_id}: {exc}")
        return _response(500, {"error": "Failed to update profile"}, cors_origin=cors_origin)

    # Fetch updated profile
    try:
        updated_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        updated_item = updated_response.get("Item", {})
        
    except Exception as exc:
        logger.warning(f"Failed to fetch updated profile: {exc}")
        updated_item = {}

    # Remove sensitive fields
    updated_item.pop("PK", None)
    updated_item.pop("SK", None)
    updated_item.pop("passwordHash", None)
    updated_item.pop("passwordSalt", None)
    updated_item.pop("hashAlgorithm", None)
    updated_item.pop("hashIterations", None)

    return _response(200, {"profile": updated_item}, cors_origin=cors_origin)
