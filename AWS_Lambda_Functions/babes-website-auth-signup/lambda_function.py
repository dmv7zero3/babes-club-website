"""Babes Club auth signup Lambda -- scaffold implementation.

This handler validates signup payloads, applies spam/honeypot checks and
rate-limiting, creates a new user record in the commerce table, and issues
an active session (auto-login). It reuses shared layer helpers where
available.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import time
import uuid
from typing import Any, Dict

from shared_commerce import (
    SESSION_TTL_ENV,
    get_env_int,
    json_response,
    now_utc_iso,
    parse_json_body,
    get_commerce_table,
)

from shared_commerce.cors import resolve_origin  # type: ignore
try:
    from event_utils import redact_event, extract_ip_and_agent  # type: ignore
except Exception:
    # Fallbacks for environments where the shared `event_utils` helper
    # module isn't present (e.g., minimal deployment without the layer).
    def redact_event(ev: Dict[str, Any]) -> Any:  # type: ignore
        try:
            ev_copy = dict(ev or {})
            if "body" in ev_copy:
                ev_copy["body"] = "<redacted>"
            return ev_copy
        except Exception:
            return "<redacted>"

    def extract_ip_and_agent(ev: Dict[str, Any]) -> tuple:
        # Try common header names, then fall back to requestContext identity
        headers = (ev or {}).get("headers") or {}
        xff = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For") or headers.get("X-Real-IP")
        ip = ""
        if xff:
            ip = xff.split(",")[0].strip()
        else:
            ip = (ev or {}).get("requestContext", {}).get("identity", {}).get("sourceIp") or ""
        ua = headers.get("user-agent") or headers.get("User-Agent") or ""
        return ip or "0.0.0.0", ua or ""
from security import derive_hash, get_password_pepper  # type: ignore
from shared_commerce.rate_limiting import check_rate_limit  # type: ignore


def is_honeypot_triggered(body: Dict[str, Any]) -> bool:
    # Simple honeypot: reject if `website` field is present
    val = body.get("website")
    return bool(val)


def detect_spam(body: Dict[str, Any]) -> list:
    # Lightweight spam detection used only for logging here
    indicators: list = []
    text = " ".join([str(v) for v in body.values() if isinstance(v, str)])
    lower = text.lower()
    for kw in ("bitcoin", "crypto", "forex", "viagra"):
        if kw in lower:
            indicators.append(kw)
    email = body.get("email", "")
    if isinstance(email, str) and any(dom in email.lower() for dom in ("10minutemail.com", "mailinator.com", "tempmail.org")):
        indicators.append("suspicious_domain")
    return indicators

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


def _build_response(status_code: int, payload: Dict[str, Any], cors_origin: str) -> Dict[str, Any]:
    response = json_response(status_code, payload, cors_origin=cors_origin)
    response.setdefault("headers", {})["Vary"] = "Origin"
    return response


def _error(status_code: int, message: str, cors_origin: str) -> Dict[str, Any]:
    return _build_response(status_code, {"error": message}, cors_origin)


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    try:
        logger.debug("auth-signup event (redacted): %s", redact_event(event))
    except Exception:
        logger.debug("auth-signup event redaction failed")

    cors_origin = resolve_origin(event)
    method = (event.get("httpMethod") or "POST").upper()
    if method == "OPTIONS":
        return _build_response(200, {"ok": True}, cors_origin)
    if method != "POST":
        return _error(405, "Method not allowed", cors_origin)

    payload, parse_error = parse_json_body(event)
    if parse_error:
        status_code = parse_error.get("statusCode", 400)
        body_raw = parse_error.get("body", "{}")
        try:
            body_payload = json.loads(body_raw)
        except json.JSONDecodeError:
            body_payload = {"error": "Invalid request"}
        return _build_response(status_code, body_payload, cors_origin)

    # Honeypot + spam checks
    try:
        if is_honeypot_triggered(payload):
            return _error(400, "Invalid submission detected", cors_origin)
        spam = detect_spam(payload)
        if spam:
            logger.info("Spam indicators detected on signup: %s", spam)
    except Exception:
        logger.debug("Validation checks failed; continuing")

    email_raw = payload.get("email")
    password_raw = payload.get("password")
    display_name = payload.get("displayName") or payload.get("display_name")

    if not isinstance(email_raw, str) or not isinstance(password_raw, str):
        return _error(400, "Email and password are required", cors_origin)

    email = email_raw.strip()
    password = password_raw.strip()
    if not email or not password:
        return _error(400, "Email and password are required", cors_origin)
    email_lower = email.lower()
    if "@" not in email_lower:
        return _error(400, "Email format is invalid", cors_origin)

    # Rate limiting early (by IP)
    ip, agent = extract_ip_and_agent(event)
    allowed, rl_payload = check_rate_limit(ip)
    if not allowed:
        return _error(429, "Too many requests", cors_origin)

    table = get_commerce_table()
    user_pk = f"USER#{email_lower}"
    existing = table.get_item(Key={"PK": user_pk, "SK": "PROFILE"}).get("Item")
    if existing:
        return _error(409, "User already exists", cors_origin)

    # Create password hash
    salt = os.urandom(16)
    pepper = get_password_pepper(optional=True) or ""
    iterations = os.getenv("AUTH_HASH_ITERATIONS")
    try:
        iterations_int = int(iterations) if iterations is not None else 150_000
    except (TypeError, ValueError):
        iterations_int = 150_000

    raw_hash = derive_hash(password, salt, iterations_int, pepper)
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(raw_hash).decode("ascii")

    user_id = uuid.uuid4().hex
    issued_at = now_utc_iso()

    profile = {
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        "createdAt": issued_at,
        "updatedAt": issued_at,
        "displayName": display_name or email.split("@")[0],
    }

    user_item = {
        "PK": user_pk,
        "SK": "PROFILE",
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        "status": "active",
        "roles": [],
        "profile": profile,
        "passwordHash": hash_b64,
        "passwordSalt": salt_b64,
        "hashAlgorithm": "pbkdf2_sha256",
        "hashIterations": iterations_int,
        "createdAt": issued_at,
        "updatedAt": issued_at,
    }

    # Persist user record under the email-keyed PK (for uniqueness) and also
    # create a canonical UUID-keyed profile so downstream code that looks up
    # `USER#<uuid>` can find the profile.
    try:
        table.put_item(Item=user_item)
        # Also write canonical profile under USER#<userId>
        uuid_user_pk = f"USER#{user_id}"
        uuid_user_item = user_item.copy()
        uuid_user_item["PK"] = uuid_user_pk
        table.put_item(Item=uuid_user_item)
    except Exception as exc:
        logger.exception("Failed to create user record: %s", exc)
        return _error(500, "Unable to create user", cors_origin)

    # Issue session (auto-login)
    ttl_minutes = get_env_int(SESSION_TTL_ENV, 12 * 60)
    expires_at = int(time.time()) + max(ttl_minutes, 1) * 60
    session_id = uuid.uuid4().hex

    session_item = {
        "PK": f"SESSION#{session_id}",
        "SK": "METADATA",
        "sessionId": session_id,
        "status": "active",
        "userPk": user_pk,
        "userId": user_id,
        "email": email,
        "emailLower": email_lower,
        "roles": [],
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "ip": ip,
        "userAgent": agent,
    }

    pointer_item = {
        "PK": user_pk,
        "SK": f"SESSION#{session_id}",
        "sessionId": session_id,
        "status": "active",
        "issuedAt": issued_at,
        "expiresAt": expires_at,
    }

    # Persist session pointer
    try:
        with table.batch_writer() as batch:
            batch.put_item(Item=session_item)
            batch.put_item(Item=pointer_item)
    except Exception as exc:
        logger.exception("Failed to persist session: %s", exc)
        return _error(500, "Unable to create session", cors_origin)

    response_payload = {
        "token": session_id,
        "expiresAt": expires_at,
        "user": {"userId": user_id, "email": email, "displayName": profile["displayName"]},
    }

    return _build_response(201, response_payload, cors_origin)
