"""
Signup Lambda - UUID-based schema
Creates: USER#{uuid} + EMAIL#{email} + SESSION#{sessionId}
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import time
import uuid
from typing import Any, Dict

# Import from shared layer
from shared_commerce import (
    get_commerce_table,
    get_env_int,
    now_utc_iso,
    resolve_origin,
)

def get_password_pepper(optional: bool = False) -> str:
    """Get password pepper from environment"""
    pepper = os.environ.get("PASSWORD_PEPPER") or os.environ.get("AUTH_PASSWORD_PEPPER") or ""
    if not pepper and not optional:
        raise ValueError("PASSWORD_PEPPER not set")
    return pepper

def derive_hash(password: str, salt: bytes, iterations: int, pepper: str) -> bytes:
    """PBKDF2-SHA256 password hashing"""
    password_bytes = (password + pepper).encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password_bytes, salt, iterations)

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
    display_name = (body.get("displayName") or "").strip()

    # Validate
    if not email or not password:
        return _error(400, "Email and password are required", cors_origin)
    if len(password) < 8:
        return _error(400, "Password must be at least 8 characters", cors_origin)
    if "@" not in email:
        return _error(400, "Invalid email format", cors_origin)

    email_lower = email.lower()
    request_context = event.get("requestContext") or {}
    identity = request_context.get("identity") or {}
    headers = event.get("headers") or {}
    ip = identity.get("sourceIp") or "unknown"
    agent = headers.get("User-Agent") or "unknown"
    issued_at = now_utc_iso()

    table = get_commerce_table()

    # Check if email already taken
    try:
        existing = table.get_item(
            Key={"PK": f"EMAIL#{email_lower}", "SK": "LOOKUP"}
        ).get("Item")
        if existing:
            logger.info(f"Signup attempt with existing email: {email_lower}")
            return _error(409, "Email already registered", cors_origin)
    except Exception as exc:
        logger.error(f"Failed to check email: {exc}")
        return _error(500, "Database error", cors_origin)

    # Generate user ID and hash password
    user_id = uuid.uuid4().hex
    salt = os.urandom(16)
    pepper = get_password_pepper(optional=True) or ""
    iterations = get_env_int("AUTH_HASH_ITERATIONS", 150_000)
    
    raw_hash = derive_hash(password, salt, iterations, pepper)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(raw_hash).decode("ascii")

    # Create user profile (UUID-keyed)
    user_profile = {
        "PK": f"USER#{user_id}",
        "SK": "PROFILE",
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        "passwordHash": hash_b64,
        "passwordSalt": salt_b64,
        "hashAlgorithm": "pbkdf2_sha256",
        "hashIterations": iterations,
        "displayName": display_name or email.split("@")[0],
        "shippingAddress": {
            "line1": "", "city": "", "state": "", "postalCode": "", "country": "US"
        },
        "dashboardSettings": {
            "showOrderHistory": True,
            "showNftHoldings": True,
            "emailNotifications": True
        },
        "status": "active",
        "roles": ["member"],
        "createdAt": issued_at,
        "updatedAt": issued_at,
        "emailChangedAt": issued_at,
    }

    # Create email lookup
    email_lookup = {
        "PK": f"EMAIL#{email_lower}",
        "SK": "LOOKUP",
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        "createdAt": issued_at,
        "setAt": issued_at
    }

    # Create session (auto-login)
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
        "email": email,
        "emailLower": email_lower,
        "roles": ["member"],
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

    # Write all in transaction
    try:
        table.transact_write_items(
            TransactItems=[
                {"Put": {"TableName": table.table_name, "Item": user_profile}},
                {
                    "Put": {
                        "TableName": table.table_name,
                        "Item": email_lookup,
                        "ConditionExpression": "attribute_not_exists(PK)"
                    }
                },
                {"Put": {"TableName": table.table_name, "Item": session_item}},
                {"Put": {"TableName": table.table_name, "Item": session_index}},
            ]
        )
        logger.info(f"Created user: {user_id} ({email})")
    except Exception as exc:
        if "ConditionalCheckFailed" in str(exc):
            return _error(409, "Email already registered", cors_origin)
        logger.exception(f"Failed to create user: {exc}")
        return _error(500, "Unable to create account", cors_origin)

    return _build_response(201, {
        "token": session_id,
        "expiresAt": expires_at,
        "user": {
            "userId": user_id,
            "email": email,
            "displayName": user_profile["displayName"]
        }
    }, cors_origin)