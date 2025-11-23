"""
Login Lambda - Authenticates via EMAIL# lookup → USER# profile
Enforces max 5 concurrent sessions per user
"""

from __future__ import annotations

import base64
import hashlib
import json
import time
import uuid
from typing import Any, Dict

from shared_commerce import (
    get_commerce_table,
    get_env_int,
    get_password_pepper,
    now_utc_iso,
    resolve_origin,
)  # type: ignore


def verify_password(profile: Dict[str, Any], password: str) -> bool:
    """Verify password against stored hash"""
    try:
        stored_hash_b64 = profile.get("passwordHash")
        salt_b64 = profile.get("passwordSalt")
        iterations = profile.get("hashIterations", 150_000)
        
        if not stored_hash_b64 or not salt_b64:
            return False
        
        salt = base64.b64decode(salt_b64)
        stored_hash = base64.b64decode(stored_hash_b64)
        
        pepper = get_password_pepper(optional=True) or ""
        password_bytes = (password + pepper).encode("utf-8")
        
        computed_hash = hashlib.pbkdf2_hmac("sha256", password_bytes, salt, iterations)
        
        return computed_hash == stored_hash
        
    except Exception:
        return False


def _error(status_code: int, message: str, cors_origin: str | None) -> Dict[str, Any]:
    """Build error response"""
    origin = cors_origin or "*"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps({"error": message}),
    }


def _build_response(status_code: int, payload: Dict[str, Any], cors_origin: str | None) -> Dict[str, Any]:
    """Build success response"""
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


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    Login handler - Authenticates user and creates session
    
    Flow:
    1. Lookup EMAIL#{email} → get userId
    2. Fetch USER#{userId} profile
    3. Verify password
    4. Check session limit (max 5)
    5. Create new session
    
    Request body:
        {
            "email": "user@example.com",
            "password": "securepass123"
        }
    
    Response:
        {
            "token": "session-id",
            "expiresAt": 1234567890,
            "user": {
                "userId": "uuid",
                "email": "user@example.com",
                "displayName": "John Doe",
                "lastLoginAt": "2025-11-22T21:28:24.990Z"
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
        return _build_response(200, {"ok": True}, cors_origin)

    # Parse request body
    try:
        raw_body = event.get("body", "{}")
        body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
    except (json.JSONDecodeError, TypeError):
        return _error(400, "Invalid request body", cors_origin)

    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    if not email or not password:
        return _error(400, "Email and password are required", cors_origin)

    email_lower = email.lower()

    # Get request metadata
    request_context = event.get("requestContext") or {}
    identity = request_context.get("identity") or {}
    headers = event.get("headers") or {}
    
    ip = identity.get("sourceIp") or "unknown"
    agent = headers.get("User-Agent") or "unknown"
    issued_at = now_utc_iso()

    table = get_commerce_table()

    # 1. Lookup user by email
    try:
        email_lookup = table.get_item(
            Key={"PK": f"EMAIL#{email_lower}", "SK": "LOOKUP"}
        ).get("Item")
        
        if not email_lookup:
            logger.info(f"Login attempt with unknown email: {email_lower}")
            return _error(401, "Invalid email or password", cors_origin)
        
        user_id = email_lookup["userId"]
        
    except Exception as exc:
        logger.error(f"Failed to lookup email {email_lower}: {exc}")
        return _error(500, "Database error", cors_origin)

    # 2. Fetch user profile
    try:
        profile_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        
        profile = profile_response.get("Item")
        if not profile:
            logger.error(f"Email lookup exists but profile missing for {user_id}")
            return _error(500, "Account data inconsistent", cors_origin)
        
    except Exception as exc:
        logger.error(f"Failed to fetch profile for {user_id}: {exc}")
        return _error(500, "Database error", cors_origin)

    # 3. Check account status
    status = profile.get("status", "active")
    if status != "active":
        logger.info(f"Login attempt for {status} account: {email_lower}")
        return _error(423, "Account is not active", cors_origin)

    # 4. Verify password
    if not verify_password(profile, password):
        logger.info(f"Invalid password for {email_lower}")
        return _error(401, "Invalid email or password", cors_origin)

    # 5. Check active session count (max 5)
    try:
        current_time = int(time.time())
        
        sessions_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            FilterExpression="status = :status AND expiresAt > :now",
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk_prefix": "SESSION#",
                ":status": "active",
                ":now": current_time
            }
        )
        
        active_sessions = sessions_response.get("Items", [])
        
        # If at limit (5), revoke oldest session
        if len(active_sessions) >= 5:
            oldest_session = min(active_sessions, key=lambda s: s.get("issuedAt", ""))
            oldest_session_id = oldest_session["sessionId"]
            
            logger.info(f"Session limit reached for {user_id}, revoking oldest: {oldest_session_id}")
            
            # Revoke oldest session
            table.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"SESSION#{oldest_session_id}", "SK": "METADATA"},
                            "UpdateExpression": "SET #status = :status, revokedAt = :now, revokedReason = :reason",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {
                                ":status": "revoked",
                                ":now": issued_at,
                                ":reason": "session_limit_exceeded"
                            }
                        }
                    },
                    {
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"USER#{user_id}", "SK": f"SESSION#{oldest_session_id}"},
                            "UpdateExpression": "SET #status = :status",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {":status": "revoked"}
                        }
                    }
                ]
            )
        
    except Exception as exc:
        # Non-critical - log but continue with login
        logger.warning(f"Failed to check/revoke sessions for {user_id}: {exc}")

    # 6. Create new session
    session_id = uuid.uuid4().hex
    session_ttl_minutes = get_env_int("SESSION_TTL_MINUTES", 12 * 60)  # 12 hours
    max_session_days = 30
    
    inactivity_expire = int(time.time()) + (session_ttl_minutes * 60)
    absolute_expire = int(time.time()) + (max_session_days * 24 * 3600)
    expires_at = min(inactivity_expire, absolute_expire)

    session_item = {
        "PK": f"SESSION#{session_id}",
        "SK": "METADATA",
        
        "sessionId": session_id,
        "userId": user_id,
        "status": "active",
        
        # User snapshot (for fast auth)
        "email": profile.get("email"),
        "emailLower": profile.get("emailLower"),
        "roles": profile.get("roles", ["member"]),
        
        # Lifecycle
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "lastAccessedAt": issued_at,
        
        # Security metadata
        "ip": ip,
        "userAgent": agent,
        
        # DynamoDB TTL
        "ttl": expires_at
    }

    session_index = {
        "PK": f"USER#{user_id}",
        "SK": f"SESSION#{session_id}",
        
        "sessionId": session_id,
        "status": "active",
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "lastAccessedAt": issued_at,
        "ip": ip,
        "userAgent": agent,
        "ttl": expires_at
    }

    # 7. Write session and update lastLoginAt
    try:
        table.transact_write_items(
            TransactItems=[
                # Create session
                {
                    "Put": {
                        "TableName": table.table_name,
                        "Item": session_item
                    }
                },
                # Create session index
                {
                    "Put": {
                        "TableName": table.table_name,
                        "Item": session_index
                    }
                },
                # Update lastLoginAt on profile
                {
                    "Update": {
                        "TableName": table.table_name,
                        "Key": {"PK": f"USER#{user_id}", "SK": "PROFILE"},
                        "UpdateExpression": "SET lastLoginAt = :login, updatedAt = :login",
                        "ExpressionAttributeValues": {
                            ":login": issued_at
                        }
                    }
                }
            ]
        )
        
        logger.info(f"Successfully logged in user: {user_id} ({email})")
        
    except Exception as exc:
        logger.exception(f"Failed to create session for {user_id}: {exc}")
        return _error(500, "Unable to create session", cors_origin)

    # 8. Return session token
    response_payload = {
        "token": session_id,
        "expiresAt": expires_at,
        "user": {
            "userId": user_id,
            "email": profile.get("email"),
            "displayName": profile.get("displayName"),
            "lastLoginAt": issued_at
        }
    }

    return _build_response(200, response_payload, cors_origin)
