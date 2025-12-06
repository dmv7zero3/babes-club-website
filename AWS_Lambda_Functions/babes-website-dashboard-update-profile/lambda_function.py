"""
Babes Club - Update Profile Lambda
Updated: 2025 - Added billingAddress support

Handles authenticated profile updates from the React dashboard.
Supports atomic updates for:
- displayName, phone, shippingAddress, billingAddress, dashboardSettings, preferredWallet
- Email changes with uniqueness check and token refresh

Environment Variables:
- COMMERCE_TABLE: DynamoDB table name
- CORS_ALLOW_ORIGIN: Allowed CORS origins (comma-separated)
- JWT_SECRET: JWT signing secret
- REFRESH_SECRET: Refresh token secret
"""

import json
import logging
import os
from typing import Any, Dict, Tuple

import boto3
from boto3.dynamodb.conditions import Key

# Initialize logger at module level
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ============================================================================
# Helper Functions
# ============================================================================

def get_commerce_table():
    """Get DynamoDB table resource."""
    table_name = os.environ.get("COMMERCE_TABLE", "babesclub-commerce")
    dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return dynamodb.Table(table_name)


def now_utc_iso() -> str:
    """Return current UTC timestamp in ISO format."""
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def get_cors_origin(event: Dict[str, Any]) -> str:
    """Extract and validate CORS origin from request."""
    allowed_origins = os.environ.get("CORS_ALLOW_ORIGIN", "*").split(",")
    request_origin = (event.get("headers") or {}).get("origin", "")
    
    if "*" in allowed_origins:
        return "*"
    if request_origin in allowed_origins:
        return request_origin
    return allowed_origins[0] if allowed_origins else "*"


def create_jwt(payload: Dict[str, Any], expires_in: int = 43200) -> str:
    """Create a JWT token (12 hours default)."""
    import time
    import hmac
    import hashlib
    import base64
    
    secret = os.environ.get("JWT_SECRET", "dev-secret")
    
    header = {"alg": "HS256", "typ": "JWT"}
    
    now = int(time.time())
    payload_with_claims = {
        **payload,
        "iat": now,
        "exp": now + expires_in,
    }
    
    def b64_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")
    
    header_b64 = b64_encode(json.dumps(header).encode())
    payload_b64 = b64_encode(json.dumps(payload_with_claims).encode())
    
    signature = hmac.new(
        secret.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = b64_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def create_refresh_token(payload: Dict[str, Any], expires_in: int = 2592000) -> str:
    """Create a refresh token (30 days default)."""
    import time
    import hmac
    import hashlib
    import base64
    
    secret = os.environ.get("REFRESH_SECRET", os.environ.get("JWT_SECRET", "dev-secret"))
    
    header = {"alg": "HS256", "typ": "JWT"}
    
    now = int(time.time())
    payload_with_claims = {
        **payload,
        "iat": now,
        "exp": now + expires_in,
        "type": "refresh",
    }
    
    def b64_encode(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")
    
    header_b64 = b64_encode(json.dumps(header).encode())
    payload_b64 = b64_encode(json.dumps(payload_with_claims).encode())
    
    signature = hmac.new(
        secret.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = b64_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response with CORS headers."""
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
    """Remove sensitive fields from profile before returning to client."""
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
    
    access_token = create_jwt(jwt_payload)
    refresh_token = create_refresh_token(jwt_payload, expires_in=30*24*3600)
    expires_at = int(time.time()) + 43200  # 12 hours
    
    logger.info(f"Issued new tokens for user {user_id} with email {email}")
    
    return access_token, refresh_token, expires_at


def _validate_address(address: Any, field_name: str) -> Tuple[bool, str | None, Dict[str, Any] | None]:
    """
    Validate an address object.
    
    Returns:
        Tuple of (is_valid, error_message, normalized_address)
    """
    if address is None:
        return True, None, None
    
    if not isinstance(address, dict):
        return False, f"{field_name} must be an object", None
    
    required_fields = ["line1", "city", "state", "postalCode", "country"]
    
    for field in required_fields:
        value = address.get(field, "")
        if not isinstance(value, str) or not value.strip():
            return False, f"{field_name}.{field} is required", None
    
    # Normalize the address
    normalized = {
        "line1": address.get("line1", "").strip(),
        "city": address.get("city", "").strip(),
        "state": address.get("state", "").strip(),
        "postalCode": address.get("postalCode", "").strip(),
        "country": address.get("country", "").strip(),
    }
    
    # Include line2 only if provided
    line2 = address.get("line2", "")
    if isinstance(line2, str) and line2.strip():
        normalized["line2"] = line2.strip()
    
    return True, None, normalized


# ============================================================================
# Allowed Fields Configuration
# ============================================================================

# Fields users can update directly
# UPDATED: Added billingAddress to allowed fields
ALLOWED_FIELDS = {
    "displayName",
    "phone",
    "shippingAddress",
    "billingAddress",  # NEW: Allow billing address updates
    "dashboardSettings",
    "preferredWallet"
}


# ============================================================================
# Lambda Handler
# ============================================================================

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Update user profile.
    
    Supports:
    - Updating allowed fields (displayName, phone, shippingAddress, billingAddress, etc.)
    - Email changes with uniqueness check and token refresh
    - Atomic DynamoDB transactions for email changes
    
    Request Body:
    {
        "displayName": "Jane Doe",           // optional
        "email": "newemail@example.com",     // optional (triggers email change)
        "shippingAddress": { ... },          // optional
        "billingAddress": { ... },           // optional (NEW)
        "dashboardSettings": { ... },        // optional
        "phone": "+1234567890",              // optional
        "preferredWallet": "0x..."           // optional
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
    logger.info("=== UPDATE PROFILE LAMBDA START ===")
    logger.info(f"Event: {json.dumps(event, default=str)}")
    
    cors_origin = get_cors_origin(event)
    
    # Handle OPTIONS preflight
    http_method = event.get("httpMethod", event.get("requestContext", {}).get("http", {}).get("method", ""))
    if http_method == "OPTIONS":
        logger.info("Handling OPTIONS preflight request")
        return _response(200, {"message": "OK"}, cors_origin=cors_origin)
    
    # Parse request body
    try:
        body_str = event.get("body", "{}")
        body = json.loads(body_str) if body_str else {}
        logger.info(f"Parsed body: {json.dumps(body, default=str)}")
    except json.JSONDecodeError as exc:
        logger.error(f"Invalid JSON body: {exc}")
        return _response(400, {"error": "Invalid JSON body"}, cors_origin=cors_origin)
    
    # Extract userId from authorizer context
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
            # Special validation for address fields
            if key in ("shippingAddress", "billingAddress"):
                is_valid, error_msg, normalized = _validate_address(val, key)
                if not is_valid:
                    logger.warning(f"Address validation failed: {error_msg}")
                    return _response(400, {"error": error_msg}, cors_origin=cors_origin)
                if normalized:
                    updates[key] = normalized
                    logger.info(f"Adding update for field: {key}")
            else:
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
            logger.info("Email unchanged, skipping email update")
        else:
            # Check if new email is already in use
            try:
                email_check = table.get_item(
                    Key={"PK": f"EMAIL#{new_email_lower}", "SK": "LOOKUP"}
                )
                if email_check.get("Item"):
                    logger.warning(f"Email {new_email_lower} already in use")
                    return _response(409, {"error": "Email already in use"}, cors_origin=cors_origin)
            except Exception as exc:
                logger.exception(f"Failed to check email availability: {exc}")
                return _response(500, {"error": "Database error"}, cors_origin=cors_origin)
            
            # Email is available, add to updates
            updates["email"] = new_email
            updates["emailLower"] = new_email_lower
            updates["emailChangedAt"] = now_utc_iso()
            email_actually_changed = True
            logger.info(f"Email change will be processed: {old_email_lower} -> {new_email_lower}")
    
    # Check if there are any updates
    if not updates:
        logger.warning("No valid fields to update")
        return _response(400, {"error": "No valid fields to update"}, cors_origin=cors_origin)
    
    # Add updatedAt timestamp
    updates["updatedAt"] = now_utc_iso()
    
    # Build transaction items
    transact_items = []
    
    # Build update expression for profile
    expr_parts = []
    expr_values = {}
    expr_names = {}
    
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
        logger.info("Added profile update transaction item")
    
    # If email changed, update EMAIL# lookups
    if email_actually_changed:
        new_email_lower = new_email.lower()
        logger.info("=== EMAIL CHANGE TRANSACTION ===")
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
        
        # Delete old email lookup
        if old_email_lower:
            transact_items.append({
                "Delete": {
                    "TableName": table.table_name,
                    "Key": {"PK": f"EMAIL#{old_email_lower}", "SK": "LOOKUP"}
                }
            })
            logger.info(f"Added DELETE transaction for EMAIL#{old_email_lower}")
        else:
            logger.warning("No old email to delete (old_email_lower was empty)")
    
    # Execute transaction
    if transact_items:
        logger.info(f"=== EXECUTING TRANSACTION ===")
        logger.info(f"Transaction has {len(transact_items)} items:")
        for i, item in enumerate(transact_items):
            op_type = list(item.keys())[0]
            logger.info(f"  Item {i+1}: {op_type}")
        
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
                formatted_items.append({
                    "Put": {
                        "TableName": item["Put"]["TableName"],
                        "Item": {k: serializer.serialize(v) for k, v in item["Put"]["Item"].items()},
                        "ConditionExpression": item["Put"].get("ConditionExpression", "attribute_not_exists(PK)")
                    }
                })
            elif "Delete" in item:
                formatted_items.append({
                    "Delete": {
                        "TableName": item["Delete"]["TableName"],
                        "Key": {k: serializer.serialize(v) for k, v in item["Delete"]["Key"].items()}
                    }
                })
        
        try:
            dynamodb.transact_write_items(TransactItems=formatted_items)
            logger.info("Transaction completed successfully")
        except Exception as exc:
            logger.exception(f"Transaction failed: {exc}")
            return _response(500, {"error": "Failed to update profile"}, cors_origin=cors_origin)
    
    # Fetch updated profile
    try:
        updated_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        updated_profile = updated_response.get("Item", {})
        filtered_profile = _filter_sensitive_fields(updated_profile)
        logger.info(f"Updated profile keys: {list(filtered_profile.keys())}")
    except Exception as exc:
        logger.exception(f"Failed to fetch updated profile: {exc}")
        return _response(500, {"error": "Database error"}, cors_origin=cors_origin)
    
    # Build response
    response_payload: Dict[str, Any] = {"profile": filtered_profile}
    
    # If email changed, issue new tokens
    if email_actually_changed:
        try:
            display_name = filtered_profile.get("displayName", new_email.split("@")[0])
            access_token, refresh_token, expires_at = _issue_new_tokens(
                user_id, new_email, display_name
            )
            response_payload["accessToken"] = access_token
            response_payload["refreshToken"] = refresh_token
            response_payload["expiresAt"] = expires_at
            response_payload["emailChanged"] = True
            logger.info("New tokens issued for email change")
        except Exception as exc:
            logger.exception(f"Failed to issue new tokens: {exc}")
            response_payload["emailChanged"] = True
            response_payload["tokenError"] = "Profile updated but failed to issue new tokens. Please log out and log back in."
    
    logger.info("=== UPDATE PROFILE LAMBDA END ===")
    return _response(200, response_payload, cors_origin=cors_origin)
