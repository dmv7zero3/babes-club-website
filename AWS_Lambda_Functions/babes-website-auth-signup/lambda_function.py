"""
Signup Lambda - Creates user with UUID-based identity
Creates: USER#{uuid} profile + EMAIL#{email} lookup + SESSION#{sessionId}
"""

from __future__ import annotations

import base64
import json
import os
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


def derive_hash(password: str, salt: bytes, iterations: int, pepper: str) -> bytes:
    """PBKDF2-SHA256 password hashing"""
    import hashlib
    
    password_bytes = (password + pepper).encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password_bytes, salt, iterations)


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


def to_dynamodb(item):
    if isinstance(item, str):
        return {"S": item}
    elif isinstance(item, bool):
        return {"BOOL": item}
    elif isinstance(item, int):
        return {"N": str(item)}
    elif isinstance(item, dict):
        return {"M": {k: to_dynamodb(v) for k, v in item.items()}}
    elif isinstance(item, list):
        return {"L": [to_dynamodb(v) for v in item]}
    elif item is None:
        return {"NULL": True}
    else:
        return {"S": str(item)}

def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """
    Signup handler - Creates new user account
    
    Request body:
        {
            "email": "user@example.com",
            "password": "securepass123",
            "displayName": "John Doe"  // optional
        }
    
    Response:
        {
            "token": "session-id",
            "expiresAt": 1234567890,
            "user": {
                "userId": "uuid",
                "email": "user@example.com",
                "displayName": "John Doe"
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
    display_name = (body.get("displayName") or "").strip()

    # Validate input
    if not email or not password:
        return _error(400, "Email and password are required", cors_origin)

    if len(password) < 8:
        return _error(400, "Password must be at least 8 characters", cors_origin)

    if "@" not in email:
        return _error(400, "Invalid email format", cors_origin)

    email_lower = email.lower()

    # Get request metadata
    request_context = event.get("requestContext") or {}
    identity = request_context.get("identity") or {}
    headers = event.get("headers") or {}
    
    ip = identity.get("sourceIp") or "unknown"
    agent = headers.get("User-Agent") or "unknown"
    issued_at = now_utc_iso()

    table = get_commerce_table()
    import boto3
    client = boto3.client("dynamodb")

    # 1. Check if email is already registered
    try:
        existing = table.get_item(
            Key={"PK": f"EMAIL#{email_lower}", "SK": "LOOKUP"}
        ).get("Item")
        
        if existing:
            logger.info(f"Signup attempt with existing email: {email_lower}")
            return _error(409, "Email already registered", cors_origin)
    except Exception as exc:
        logger.error(f"Failed to check email existence: {exc}")
        return _error(500, "Database error", cors_origin)

    # 2. Generate user ID and hash password
    user_id = uuid.uuid4().hex  # 32-char hex string (no hyphens)
    
    salt = os.urandom(16)
    pepper = get_password_pepper(optional=True) or ""
    iterations = get_env_int("AUTH_HASH_ITERATIONS", 150_000)
    
    raw_hash = derive_hash(password, salt, iterations, pepper)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(raw_hash).decode("ascii")

    # 3. Create user profile (UUID-based, single source of truth)
    user_profile = {
        "PK": f"USER#{user_id}",
        "SK": "PROFILE",
        
        # Identity
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        
        # Authentication
        "passwordHash": hash_b64,
        "passwordSalt": salt_b64,
        "hashAlgorithm": "pbkdf2_sha256",
        "hashIterations": iterations,
        
        # Profile
        "displayName": display_name or email.split("@")[0],
        
        # Shipping (empty by default)
        "shippingAddress": {
            "line1": "",
            "city": "",
            "state": "",
            "postalCode": "",
            "country": "US"
        },
        
        # Dashboard settings (defaults)
        "dashboardSettings": {
            "showOrderHistory": True,
            "showNftHoldings": True,
            "emailNotifications": True
        },
        
        # Account status
        "status": "active",
        "roles": ["member"],
        
        # Timestamps
        "createdAt": issued_at,
        "updatedAt": issued_at,
        "emailChangedAt": issued_at,  # Track for rate limiting
    }

    # 4. Create email lookup (for login)
    email_lookup = {
        "PK": f"EMAIL#{email_lower}",
        "SK": "LOOKUP",
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        "createdAt": issued_at,
        "setAt": issued_at
    }

    # 5. Create session (auto-login after signup)
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
        "email": email,
        "emailLower": email_lower,
        "roles": ["member"],
        
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

    # 6. Create session index (for listing user's sessions)
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

    # 7. Write all items in a transaction (atomic)
    try:
        transact_items = [
            {
                "Put": {
                    "TableName": table.table_name,
                    "Item": {k: to_dynamodb(v) for k, v in user_profile.items()}
                }
            },
            {
                "Put": {
                    "TableName": table.table_name,
                    "Item": {k: to_dynamodb(v) for k, v in email_lookup.items()},
                    "ConditionExpression": "attribute_not_exists(PK)"
                }
            },
            {
                "Put": {
                    "TableName": table.table_name,
                    "Item": {k: to_dynamodb(v) for k, v in session_item.items()}
                }
            },
            {
                "Put": {
                    "TableName": table.table_name,
                    "Item": {k: to_dynamodb(v) for k, v in session_index.items()}
                }
            }
        ]
        client.transact_write_items(TransactItems=transact_items)
        logger.info(f"Successfully created user: {user_id} ({email})")
    except Exception as exc:
        # Check if it's a conditional check failure (email taken in race condition)
        if "ConditionalCheckFailed" in str(exc):
            logger.warning(f"Race condition: email {email_lower} taken during signup")
            return _error(409, "Email already registered", cors_origin)
        logger.exception(f"Failed to create user {email}: {exc}")
        return _error(500, "Unable to create account", cors_origin)

    # 8. Return session token (auto-login)
    response_payload = {
        "token": session_id,
        "expiresAt": expires_at,
        "user": {
            "userId": user_id,
            "email": email,
            "displayName": user_profile["displayName"]
        }
    }

    return _build_response(201, response_payload, cors_origin)