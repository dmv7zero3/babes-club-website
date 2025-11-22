"""Password hashing and pepper helpers for Babes Club Lambdas."""

import base64
import hashlib
import os
from typing import Optional


def get_password_pepper(optional: bool = False) -> Optional[str]:
    """Return the configured password pepper from env, or None if not set and optional."""
    return os.getenv("AUTH_PASSWORD_PEPPER") if optional else os.environ["AUTH_PASSWORD_PEPPER"]


def derive_hash(password: str, salt: bytes, iterations: int = 150_000, pepper: str = "") -> bytes:
    """Derive a PBKDF2-SHA256 hash for the given password, salt, and pepper."""
    if not isinstance(password, str):
        raise TypeError("Password must be a string")
    if not isinstance(salt, bytes):
        raise TypeError("Salt must be bytes")
    if not isinstance(iterations, int) or iterations < 1:
        raise ValueError("Iterations must be a positive integer")
    password_bytes = (password + pepper).encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", password_bytes, salt, iterations)
