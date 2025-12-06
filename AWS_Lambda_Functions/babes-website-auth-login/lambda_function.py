"""
Login Lambda - UUID-based schema (Production Ready)
Handles all DynamoDB type conversions properly
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
import uuid
from decimal import Decimal
from typing import Any, Dict

from shared_commerce import (
    get_commerce_table,
    get_env_int,
    now_utc_iso,
    resolve_origin,
)

# Import JWT utility from shared layer
from shared_commerce.jwt_utils import create_jwt

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
    """Verify password against stored hash"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        stored_hash_b64 = profile.get("passwordHash")
        salt_b64 = profile.get("passwordSalt")
        iterations = int(profile.get("hashIterations", 150_000))  # Convert Decimal to int
        
        if not stored_hash_b64 or not salt_b64:
            logger.error("Missing passwordHash or passwordSalt")
            return False
        
        salt = base64.b64decode(salt_b64)
        stored_hash = base64.b64decode(stored_hash_b64)
        pepper = get_password_pepper(optional=True) or ""
        
        computed_hash = derive_hash(password, salt, iterations, pepper)
        
        return hmac.compare_digest(computed_hash, stored_hash)
        
    except Exception as exc:
        logger.exception(f"Password verification error: {exc}")
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
            logger.info(f"Login attempt with unknown email: {email_lower}")
            return _error(401, "Invalid email or password", cors_origin)
        
        user_id = email_lookup["userId"]
        logger.info(f"Found userId: {user_id}")
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
            logger.error(f"Email lookup exists but profile missing for {user_id}")
            return _error(500, "Account data inconsistent", cors_origin)
        
        logger.info(f"Found profile for {user_id}")
        
    except Exception as exc:
        logger.error(f"Failed to fetch profile: {exc}")
        return _error(500, "Database error", cors_origin)

    # 3. Check account status
    if profile.get("status") != "active":
        logger.warning(f"Account not active: {profile.get('status')}")
        return _error(423, "Account is not active", cors_origin)

    # 4. Verify password
    logger.info("Verifying password...")
    if not verify_password(profile, password):
        logger.info(f"Invalid password for {email_lower}")
        return _error(401, "Invalid email or password", cors_origin)
    
    logger.info("Password verified successfully!")

    # 5. Issue JWT tokens (access + refresh)
    jwt_payload = {
        "userId": user_id,
        "email": str(profile.get("email", "")),
        "role": "customer",
        "displayName": str(profile.get("displayName", "")),
    }
    access_token = create_jwt(jwt_payload)

    # Issue refresh token with longer TTL (e.g., 30 days)
    from shared_commerce.jwt_utils import create_refresh_token
    refresh_token = create_refresh_token(jwt_payload, expires_in=30*24*3600)  # 30 days

    return _build_response(200, {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "userId": user_id,
            "email": str(profile.get("email", "")),
            "displayName": str(profile.get("displayName", "")),
            "role": "customer",
            "lastLoginAt": issued_at
        }
    }, cors_origin)