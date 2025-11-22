"""Babes Club auth login Lambda -- modular handler."""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, Dict

from shared_commerce import (  # type: ignore  # pylint: disable=import-error
    SESSION_TTL_ENV,
    get_env_int,
    json_response,
    now_utc_iso,
    parse_json_body,
)

from cors import resolve_origin  # type: ignore
from event_utils import redact_event, extract_ip_and_agent  # type: ignore
from security import verify_password, sanitize_user_payload  # type: ignore
from storage import fetch_user_profile, write_session_and_pointer, update_last_login  # type: ignore
from rate_limiting import check_rate_limit  # type: ignore
from validation import is_honeypot_triggered, detect_spam  # type: ignore

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
        logger.debug("auth-login event (redacted): %s", redact_event(event))
    except Exception:  # pragma: no cover - defensive logging
        logger.debug("auth-login event redaction failed")

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
            logger.info("Spam indicators detected: %s", spam)
    except Exception:
        logger.debug("Validation checks failed; continuing")

    email_raw = payload.get("email")
    password_raw = payload.get("password")

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

    # Fetch user and validate
    user_item = fetch_user_profile(email_lower)
    if not user_item:
        logger.info("Login attempt for unknown user '%s'", email_lower)
        return _error(401, "Invalid email or password", cors_origin)

    if str(user_item.get("status", "active")).lower() not in {"active", "pending"}:
        return _error(423, "Account is not active", cors_origin)

    if not verify_password(user_item, password):
        logger.info("Invalid password for '%s'", email_lower)
        return _error(401, "Invalid email or password", cors_origin)

    # Issue session
    issued_at = now_utc_iso()
    ttl_minutes = get_env_int(SESSION_TTL_ENV, 12 * 60)
    expires_at = int(time.time()) + max(ttl_minutes, 1) * 60
    session_id = uuid.uuid4().hex

    session_item = {
        "PK": f"SESSION#{session_id}",
        "SK": "METADATA",
        "sessionId": session_id,
        "status": "active",
        "userPk": f"USER#{email_lower}",
        "userId": user_item.get("userId"),
        "email": user_item.get("email", email),
        "emailLower": email_lower,
        "roles": user_item.get("roles") or [],
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "ip": ip,
        "userAgent": agent,
    }

    pointer_item = {
        "PK": f"USER#{email_lower}",
        "SK": f"SESSION#{session_id}",
        "sessionId": session_id,
        "status": "active",
        "issuedAt": issued_at,
        "expiresAt": expires_at,
    }

    # Persist session and update lastLogin
    write_session_and_pointer(session_item, pointer_item)
    update_last_login(f"USER#{email_lower}", issued_at)

    response_payload = {
        "token": session_id,
        "expiresAt": expires_at,
        "user": sanitize_user_payload(user_item, issued_at),
    }

    return _build_response(200, response_payload, cors_origin)
