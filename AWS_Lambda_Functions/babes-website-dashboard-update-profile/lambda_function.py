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

ENVIRONMENT VARIABLES:
- COMMERCE_TABLE: DynamoDB table name
- CORS_ALLOW_ORIGIN: Allowed origins for CORS
- JWT_SECRET: Secret for signing JWTs (required for email change token refresh)
- REFRESH_SECRET: Secret for signing refresh tokens (required for email change token refresh)
---
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

# Initialize logger at module level
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

try:
    from shared_commerce import (
        get_commerce_table,
        now_utc_iso,
        resolve_origin,
    )
    from shared_commerce.jwt_utils import create_jwt, create_refresh_token
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
    """Build JSON response with CORS headers"""
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


def _filter_sensitive_fields(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive fields from profile before returning to client"""
    sensitive_fields = {
        "passwordHash",
        "passwordSalt",
        "hashAlgorithm",
        "hashIterations",
        "PK",
        "SK",
    }
    return {k: v for k, v in profile.items() if k not in sensitive_fields}


def _issue_new_tokens(user_id: str, email: str, display_name: str, role: str = "customer") -> Tuple[str, str, int]:
    """
    Issue new access and refresh tokens after email change.
    
    Returns:
        Tuple of (access_token, refresh_token, expires_at_timestamp)
    """
    import time
    
    jwt_payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "displayName": display_name,
    }
    
    # Create access token (12 hours default)
    access_token = create_jwt(jwt_payload)
    
    # Create refresh token (30 days)
    refresh_token = create_refresh_token(jwt_payload, expires_in=30*24*3600)
    
    # Calculate expiration timestamp (12 hours from now)
    expires_at = int(time.time()) + 43200  # 12 hours in seconds
    
    logger.info(f"Issued new tokens for user {user_id} with email {email}")
    
    return access_token, refresh_token, expires_at


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
    - Email changes (with availability check and new token issuance)
    
    Request body:
        {
            "displayName": "Jane Doe",          // optional
            "email": "newemail@example.com",    // optional (triggers email change + new tokens)
            "shippingAddress": {...},           // optional
            "dashboardSettings": {...},         // optional
            "phone": "+1234567890",             // optional
            "preferredWallet": "0x..."          // optional
        }
    
    Response (normal update):
        {
            "profile": { ... }
        }
    
    Response (email changed):
        {
            "profile": { ... },
            "accessToken": "new-jwt",
            "refreshToken": "new-refresh-token",
            "expiresAt": 1234567890,
            "emailChanged": true
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

    # Handle email change: check uniqueness and update
    new_email = (body.get("email") or "").strip()
    old_email = existing.get("email", "")
    old_email_lower = existing.get("emailLower", "")
    email_actually_changed = False
    
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
                    # Check if this email belongs to the same user (edge case)
                    if email_check.get("userId") == user_id:
                        logger.info(f"Email {new_email_lower} belongs to same user, proceeding")
                    else:
                        logger.warning(f"Email {new_email_lower} already in use by another user")
                        return _response(409, {"error": "Email already in use"}, cors_origin=cors_origin)
                logger.info(f"Email {new_email_lower} is available")
            except Exception as exc:
                logger.exception(f"Failed to check email availability: {exc}")
                return _response(500, {"error": "Database error"}, cors_origin=cors_origin)
            
            # Email change is valid - add to updates
            updates["email"] = new_email
            updates["emailLower"] = new_email_lower
            updates["emailChangedAt"] = now_utc_iso()
            email_actually_changed = True
            logger.info(f"Email will change from '{old_email_lower}' to '{new_email_lower}'")

    # Check if there's anything to update
    if not updates:
        logger.info("No fields to update")
        return _response(400, {"error": "No valid fields to update"}, cors_origin=cors_origin)

    # Always set updatedAt
    updates["updatedAt"] = now_utc_iso()

    # Build DynamoDB transaction
    try:
        transact_items = []
        
        # Build update expression for profile
        expr_parts = []
        expr_values = {}
        expr_names = {}  # For reserved words
        
        for key, val in updates.items():
            # Handle reserved words in DynamoDB
            attr_name = f"#{key}" if key in {"status", "name", "email"} else key
            placeholder = f":{key}"
            
            if key in {"status", "name", "email"}:
                expr_names[f"#{key}"] = key
            
            expr_parts.append(f"{attr_name} = {placeholder}")
            expr_values[placeholder] = val
        
        if expr_parts:
            update_expr = "SET " + ", ".join(expr_parts)
            logger.info(f"Update expression: {update_expr}")
            logger.info(f"Expression values: {json.dumps({k: str(v)[:100] for k, v in expr_values.items()})}")
            if expr_names:
                logger.info(f"Expression attribute names: {json.dumps(expr_names)}")
            
            update_item = {
                "Update": {
                    "TableName": table.table_name,
                    "Key": {"PK": f"USER#{user_id}", "SK": "PROFILE"},
                    "UpdateExpression": update_expr,
                    "ExpressionAttributeValues": expr_values
                }
            }
            if expr_names:
                update_item["Update"]["ExpressionAttributeNames"] = expr_names
            
            transact_items.append(update_item)
            logger.info(f"Added profile update transaction item")

        # If email changed, update EMAIL# lookups
        if email_actually_changed:
            new_email_lower = new_email.lower()
            logger.info(f"=== EMAIL CHANGE TRANSACTION ===")
            logger.info(f"Old email: {old_email_lower}")
            logger.info(f"New email: {new_email_lower}")
            
            # Create new email lookup
            new_email_item = {
                "PK": f"EMAIL#{new_email_lower}",
                "SK": "LOOKUP",
                "userId": user_id,
                "email": new_email,
                "emailLower": new_email_lower,
                "createdAt": existing.get("createdAt", now_utc_iso()),
                "setAt": now_utc_iso()
            }
            
            transact_items.append({
                "Put": {
                    "TableName": table.table_name,
                    "Item": new_email_item,
                    "ConditionExpression": "attribute_not_exists(PK)"
                }
            })
            logger.info(f"Added PUT transaction for EMAIL#{new_email_lower}")
            
            # Delete old email lookup (CRITICAL FIX)
            if old_email_lower:
                transact_items.append({
                    "Delete": {
                        "TableName": table.table_name,
                        "Key": {"PK": f"EMAIL#{old_email_lower}", "SK": "LOOKUP"}
                    }
                })
                logger.info(f"Added DELETE transaction for EMAIL#{old_email_lower}")
            else:
                logger.warning(f"No old email to delete (old_email_lower was empty)")

        # Execute transaction
        if transact_items:
            logger.info(f"=== EXECUTING TRANSACTION ===")
            logger.info(f"Transaction has {len(transact_items)} items:")
            for i, item in enumerate(transact_items):
                op_type = list(item.keys())[0]
                logger.info(f"  Item {i+1}: {op_type}")
            
            import boto3
            dynamodb = boto3.client("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
            
            # Convert to DynamoDB format for transact_write_items
            from boto3.dynamodb.types import TypeSerializer
            serializer = TypeSerializer()
            
            formatted_items = []
            for item in transact_items:
                if "Update" in item:
                    formatted_update = {
                        "Update": {
                            "TableName": item["Update"]["TableName"],
                            "Key": {k: serializer.serialize(v) for k, v in item["Update"]["Key"].items()},
                            "UpdateExpression": item["Update"]["UpdateExpression"],
                            "ExpressionAttributeValues": {k: serializer.serialize(v) for k, v in item["Update"]["ExpressionAttributeValues"].items()}
                        }
                    }
                    if "ExpressionAttributeNames" in item["Update"]:
                        formatted_update["Update"]["ExpressionAttributeNames"] = item["Update"]["ExpressionAttributeNames"]
                    formatted_items.append(formatted_update)
                    
                elif "Put" in item:
                    put_item = {
                        "TableName": item["Put"]["TableName"],
                        "Item": {k: serializer.serialize(v) for k, v in item["Put"]["Item"].items()}
                    }
                    if "ConditionExpression" in item["Put"]:
                        put_item["ConditionExpression"] = item["Put"]["ConditionExpression"]
                    formatted_items.append({"Put": put_item})
                    
                elif "Delete" in item:
                    formatted_items.append({
                        "Delete": {
                            "TableName": item["Delete"]["TableName"],
                            "Key": {k: serializer.serialize(v) for k, v in item["Delete"]["Key"].items()}
                        }
                    })
            
            logger.info(f"Executing transact_write_items with {len(formatted_items)} formatted items")
            dynamodb.transact_write_items(TransactItems=formatted_items)
            logger.info("Transaction completed successfully")

    except Exception as exc:
        logger.exception(f"Failed to update profile: {exc}")
        # Provide more specific error message
        error_msg = str(exc)
        if "ConditionalCheckFailed" in error_msg:
            return _response(409, {"error": "Email already in use (race condition)"}, cors_origin=cors_origin)
        if "TransactionCanceledException" in error_msg:
            logger.error(f"Transaction cancelled. Reasons may include: duplicate email, missing record, etc.")
            return _response(409, {"error": "Update failed due to conflict"}, cors_origin=cors_origin)
        return _response(500, {"error": "Failed to update profile"}, cors_origin=cors_origin)

    # Fetch updated profile to return
    try:
        logger.info("Fetching updated profile")
        updated_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        updated_profile = updated_response.get("Item", {})
        
        # Filter sensitive fields before returning
        safe_profile = _filter_sensitive_fields(updated_profile)
        
        logger.info(f"Successfully updated profile for user: {user_id}")
        
        # Build response
        response_payload: Dict[str, Any] = {"profile": safe_profile}
        
        # If email changed, issue new tokens
        if email_actually_changed:
            logger.info(f"Email changed - issuing new tokens")
            try:
                display_name = updated_profile.get("displayName", new_email.split("@")[0])
                access_token, refresh_token, expires_at = _issue_new_tokens(
                    user_id=user_id,
                    email=new_email,
                    display_name=display_name,
                    role="customer"
                )
                response_payload["accessToken"] = access_token
                response_payload["refreshToken"] = refresh_token
                response_payload["expiresAt"] = expires_at
                response_payload["emailChanged"] = True
                logger.info(f"New tokens issued successfully")
            except Exception as token_exc:
                logger.exception(f"Failed to issue new tokens: {token_exc}")
                # Profile update succeeded, but token issuance failed
                # Return success but warn about token issue
                response_payload["emailChanged"] = True
                response_payload["tokenError"] = "Profile updated but failed to issue new tokens. Please log out and log back in."
        
        logger.info("=" * 80)
        
        return _response(200, response_payload, cors_origin=cors_origin)
        
    except Exception as exc:
        logger.exception(f"Failed to fetch updated profile: {exc}")
        # Update succeeded but fetch failed - still return success
        return _response(200, {"profile": updates, "note": "Update succeeded"}, cors_origin=cors_origin)