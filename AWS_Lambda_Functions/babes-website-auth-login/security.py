from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import os
from typing import Any, Dict

from shared_commerce import get_secure_parameter  # type: ignore

PASSWORD_PEPPER_ENV = "AUTH_PASSWORD_PEPPER"
PASSWORD_PEPPER_PARAMETER_ENV = "AUTH_PASSWORD_PEPPER_PARAMETER"
DEFAULT_HASH_ITERATIONS = 150_000
SUPPORTED_HASH = "pbkdf2_sha256"


_PASSWORD_PEPPER: str | None = None


def get_password_pepper(optional: bool = False) -> str | None:
    global _PASSWORD_PEPPER
    if _PASSWORD_PEPPER is not None:
        return _PASSWORD_PEPPER
    direct = os.getenv(PASSWORD_PEPPER_ENV)
    if direct:
        _PASSWORD_PEPPER = direct
        return direct
    param = os.getenv(PASSWORD_PEPPER_PARAMETER_ENV)
    if param:
        resolved = get_secure_parameter(param)
        _PASSWORD_PEPPER = resolved
        return resolved
    if optional:
        return None
    raise RuntimeError("Password pepper not configured")


def _decode_base64(value: Any) -> bytes | None:
    if not isinstance(value, str):
        return None
    try:
        return base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError):
        return None


def derive_hash(password: str, salt: bytes, iterations: int, pepper: str) -> bytes:
    material = (password + pepper).encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", material, salt, iterations)


def verify_password(user_item: Dict[str, Any], password: str) -> bool:
    algorithm = (user_item.get("hashAlgorithm") or SUPPORTED_HASH).lower()
    if algorithm != SUPPORTED_HASH:
        return False
    salt = _decode_base64(user_item.get("passwordSalt"))
    stored_hash = _decode_base64(user_item.get("passwordHash"))
    if not salt or not stored_hash:
        return False
    iterations_raw = user_item.get("hashIterations")
    try:
        iterations = int(iterations_raw)
    except (TypeError, ValueError):
        iterations = DEFAULT_HASH_ITERATIONS
    pepper = get_password_pepper(optional=True) or ""
    
    # DEBUG: Log what we're comparing
    derived = derive_hash(password, salt, max(iterations, 1), pepper)
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Password verification - Iterations: {iterations}, Pepper: '{pepper}', Salt length: {len(salt)}, Stored hash length: {len(stored_hash)}, Derived hash length: {len(derived)}")
    logger.info(f"Stored hash (base64): {user_item.get('passwordHash')[:20]}...")
    logger.info(f"Derived hash (base64): {base64.b64encode(derived).decode('ascii')[:20]}...")
    
    if len(derived) != len(stored_hash):
        return False
    return hmac.compare_digest(derived, stored_hash)


def sanitize_user_payload(user_item: Dict[str, Any], last_login_at: str) -> Dict[str, Any]:
    roles_raw = user_item.get("roles")
    if isinstance(roles_raw, (list, tuple)):
        roles = [str(role) for role in roles_raw]
    elif isinstance(roles_raw, set):
        roles = [str(role) for role in roles_raw]
    elif roles_raw:
        roles = [str(roles_raw)]
    else:
        roles = []
    profile = user_item.get("profile") if isinstance(user_item.get("profile"), dict) else None
    return {
        "userId": user_item.get("userId"),
        "email": user_item.get("email"),
        "status": user_item.get("status", "active"),
        "roles": roles,
        "profile": profile,
        "lastLoginAt": last_login_at,
    }
