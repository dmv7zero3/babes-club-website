"""
Dashboard Update Profile Lambda - Updates user profile with email change support
Enforces 4-day cooldown between email changes
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
    
    try:
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

        # Handle email change separately (special logic)
        new_email = (body.get("email") or "").strip()
        old_email_lower = existing.get("emailLower", "")
        
        logger.info(f"Email change request: '{new_email}' (current: '{old_email_lower}')")
        
        if new_email:
            new_email_lower = new_email.lower()
            
            # Skip if email unchanged
            if new_email_lower == old_email_lower:
                logger.info(f"Email unchanged for {user_id}, skipping email update")
                new_email = None  # Don't process email change
            else:
                logger.info(f"Processing email change: {old_email_lower} -> {new_email_lower}")
                
                # Check rate limit (4 days between email changes)
                last_change_str = existing.get("emailChangedAt")
                
                if last_change_str:
                    try:
                        last_change = datetime.fromisoformat(last_change_str.replace("Z", "+00:00"))
                        now = datetime.now(last_change.tzinfo)
                        time_since_change = now - last_change
                        
                        logger.info(f"Last email change: {last_change}, time since: {time_since_change}")
                        
                        if time_since_change < timedelta(days=4):
                            days_remaining = 4 - time_since_change.days
                            logger.warning(f"Email change rate limit hit for {user_id}, days remaining: {days_remaining}")
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

        # Check if there's anything to update
        if not updates:
            logger.info(f"No updates provided for {user_id}")
            return _response(400, {"error": "No fields to update"}, cors_origin=cors_origin)

        # Always update timestamp
        updates["updatedAt"] = now_utc_iso()

        logger.info(f"Preparing to update {len(updates)} fields: {list(updates.keys())}")

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

        # 2. If email changed, update EMAIL# lookups
        if new_email:
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
                    "ConditionExpression": "attribute_not_exists(PK)"  # Ensure still available
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

        logger.info(f"Executing transaction with {len(transact_items)} items")

        # Execute transaction
        try:
            table.meta.client.transact_write_items(TransactItems=transact_items)
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
            logger.info(f"Fetching updated profile for {user_id}")
            updated_response = table.get_item(
                Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
            )
            updated_item = updated_response.get("Item", {})
            logger.info(f"Retrieved updated profile with {len(updated_item)} fields")
            
        except Exception as exc:
            logger.warning(f"Failed to fetch updated profile: {exc}")
            updated_item = {}

        # Remove sensitive fields
        sensitive_fields = ["PK", "SK", "passwordHash", "passwordSalt", "hashAlgorithm", "hashIterations"]
        for field in sensitive_fields:
            updated_item.pop(field, None)

        logger.info("=" * 80)
        logger.info("LAMBDA INVOCATION COMPLETE - SUCCESS")
        logger.info("=" * 80)

        return _response(200, {"profile": updated_item}, cors_origin=cors_origin)

    except Exception as exc:
        logger.exception(f"Unhandled exception in lambda_handler: {exc}")
        logger.info("=" * 80)
        logger.info("LAMBDA INVOCATION COMPLETE - ERROR")
        logger.info("=" * 80)
        
        # Try to return a proper error response
        try:
            cors_origin = resolve_origin(event)
            return _response(500, {"error": "Internal server error", "details": str(exc)}, cors_origin=cors_origin)
        except:
            # Last resort - return a basic response
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps({"error": "Internal server error"})
            }