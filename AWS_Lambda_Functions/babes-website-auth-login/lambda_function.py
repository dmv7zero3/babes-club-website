"""
Login Lambda - UUID-based schema WITH DEBUG LOGGING
Looks up EMAIL#{email} → gets userId → fetches USER#{uuid}
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from typing import Any, Dict

from shared_commerce import (
    get_commerce_table,
    get_env_int,
    now_utc_iso,
    resolve_origin,
)

def get_password_pepper(optional: bool = False) -> str:
    """Get password pepper from environment"""
    import os
    pepper = os.environ.get("PASSWORD_PEPPER") or os.environ.get("AUTH_PASSWORD_PEPPER") or ""
    if not pepper and not optional:
        raise ValueError("PASSWORD_PEPPER not set")
    return pepper

def derive_hash(password: str, salt: bytes, iterations: int, pepper: str) -> bytes:
    """PBKDF2-SHA256 password hashing"""
    password_bytes = (password + pepper).encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password_bytes, salt, iterations)

def verify_password(profile: Dict[str, Any], password: str) -> bool:
    """Verify password against stored hash - WITH DEBUG LOGGING"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        stored_hash_b64 = profile.get("passwordHash")
        salt_b64 = profile.get("passwordSalt")
        iterations = int(profile.get("hashIterations", 150_000))  # Convert Decimal to int
        
        logger.info("=" * 60)
        logger.info("PASSWORD VERIFICATION DEBUG")
        logger.info("=" * 60)
        
        if not stored_hash_b64 or not salt_b64:
            logger.error("❌ Missing passwordHash or passwordSalt in profile")
            return False
        
        salt = base64.b64decode(salt_b64)
        stored_hash = base64.b64decode(stored_hash_b64)
        pepper = get_password_pepper(optional=True) or ""
        
        # Log all inputs
        logger.info(f"Iterations: {iterations}")
        logger.info(f"Pepper: '{pepper}' (length: {len(pepper)})")
        logger.info(f"Salt (base64): {salt_b64}")
        logger.info(f"Salt (bytes): {salt.hex()}")
        logger.info(f"Password: '{password}' (length: {len(password)})")
        logger.info(f"Password (repr): {repr(password)}")
        logger.info(f"Stored hash (base64): {stored_hash_b64}")
        
        # Compute hash
        computed_hash = derive_hash(password, salt, iterations, pepper)
        computed_hash_b64 = base64.b64encode(computed_hash).decode("ascii")
        
        logger.info(f"Computed hash (base64): {computed_hash_b64}")
        logger.info(f"Computed hash (hex): {computed_hash.hex()}")
        logger.info(f"Stored hash (hex): {stored_hash.hex()}")
        
        # Compare
        match = hmac.compare_digest(computed_hash, stored_hash)
        logger.info(f"Hashes match: {match}")
        logger.info("=" * 60)
        
        return match
        
    except Exception as exc:
        logger.exception(f"❌ Password verification exception: {exc}")
        return False

def _error(status_code: int, message: str, cors_origin: str | None) -> Dict[str, Any]:
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
    import logging
    logger = logging.getLogger(__name__)
    if not logger.handlers:
        logging.basicConfig(level=logging.INFO)
    logger.setLevel(logging.INFO)

    # CORS preflight
    method = (event.get("httpMethod") or "POST").upper()
    cors_origin = resolve_origin(event)
    if method == "OPTIONS":
        return _build_response(200, {"ok": True}, cors_origin)

    # Parse body
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
    request_context = event.get("requestContext") or {}
    identity = request_context.get("identity") or {}
    headers = event.get("headers") or {}
    ip = identity.get("sourceIp") or "unknown"
    agent = headers.get("User-Agent") or "unknown"
    issued_at = now_utc_iso()

    table = get_commerce_table()

    # 1. Lookup email → userId
    logger.info(f"Looking up email: {email_lower}")
    try:
        email_lookup = table.get_item(
            Key={"PK": f"EMAIL#{email_lower}", "SK": "LOOKUP"}
        ).get("Item")
        
        if not email_lookup:
            logger.info(f"❌ Login attempt with unknown email: {email_lower}")
            return _error(401, "Invalid email or password", cors_origin)
        
        user_id = email_lookup["userId"]
        logger.info(f"✅ Found userId: {user_id}")
    except Exception as exc:
        logger.error(f"Failed to lookup email: {exc}")
        return _error(500, "Database error", cors_origin)

    # 2. Fetch user profile
    logger.info(f"Fetching profile for USER#{user_id}")
    try:
        profile_response = table.get_item(
            Key={"PK": f"USER#{user_id}", "SK": "PROFILE"}
        )
        profile = profile_response.get("Item")
        
        if not profile:
            logger.error(f"❌ Email lookup exists but profile missing for {user_id}")
            return _error(500, "Account data inconsistent", cors_origin)
        
        logger.info(f"✅ Found profile for {user_id}")
        logger.info(f"Profile has passwordHash: {bool(profile.get('passwordHash'))}")
        logger.info(f"Profile has passwordSalt: {bool(profile.get('passwordSalt'))}")
        logger.info(f"Profile hashIterations: {profile.get('hashIterations')}")
        
    except Exception as exc:
        logger.error(f"Failed to fetch profile: {exc}")
        return _error(500, "Database error", cors_origin)

    # 3. Check account status
    if profile.get("status") != "active":
        logger.warning(f"Account not active: {profile.get('status')}")
        return _error(423, "Account is not active", cors_origin)

    # 4. Verify password
    logger.info("Starting password verification...")
    if not verify_password(profile, password):
        logger.info(f"❌ Invalid password for {email_lower}")
        return _error(401, "Invalid email or password", cors_origin)
    
    logger.info("✅ Password verified successfully!")

    # 5. Check session count (max 5)
    try:
        current_time = int(time.time())
        sessions_response = table.query(
            KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
            FilterExpression="#status = :status AND expiresAt > :now",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":pk": f"USER#{user_id}",
                ":sk_prefix": "SESSION#",
                ":status": "active",
                ":now": current_time
            }
        )
        active_sessions = sessions_response.get("Items", [])
        
        if len(active_sessions) >= 5:
            oldest = min(active_sessions, key=lambda s: s.get("issuedAt", ""))
            oldest_id = oldest["sessionId"]
            logger.info(f"Revoking oldest session: {oldest_id}")
            table.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"SESSION#{oldest_id}", "SK": "METADATA"},
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
                            "Key": {"PK": f"USER#{user_id}", "SK": f"SESSION#{oldest_id}"},
                            "UpdateExpression": "SET #status = :status",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {":status": "revoked"}
                        }
                    }
                ]
            )
    except Exception as exc:
        logger.warning(f"Failed to check sessions: {exc}")

    # 6. Create new session
    session_id = uuid.uuid4().hex
    session_ttl_minutes = get_env_int("SESSION_TTL_MINUTES", 12 * 60)
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
        "email": profile.get("email"),
        "emailLower": profile.get("emailLower"),
        "roles": profile.get("roles", ["member"]),
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "lastAccessedAt": issued_at,
        "ip": ip,
        "userAgent": agent,
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

    # 7. Write session + update lastLoginAt
    try:
        table.transact_write_items(
            TransactItems=[
                {"Put": {"TableName": table.table_name, "Item": session_item}},
                {"Put": {"TableName": table.table_name, "Item": session_index}},
                {
                    "Update": {
                        "TableName": table.table_name,
                        "Key": {"PK": f"USER#{user_id}", "SK": "PROFILE"},
                        "UpdateExpression": "SET lastLoginAt = :login, updatedAt = :login",
                        "ExpressionAttributeValues": {":login": issued_at}
                    }
                }
            ]
        )
        logger.info(f"✅ Successfully logged in user: {user_id} ({email})")
    except Exception as exc:
        logger.exception(f"Failed to create session: {exc}")
        return _error(500, "Unable to create session", cors_origin)

    return _build_response(200, {
        "token": session_id,
        "expiresAt": expires_at,
        "user": {
            "userId": user_id,
            "email": profile.get("email"),
            "displayName": profile.get("displayName"),
            "lastLoginAt": issued_at
        }
    }, cors_origin)