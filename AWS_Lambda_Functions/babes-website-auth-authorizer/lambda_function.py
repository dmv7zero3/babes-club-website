"""Lambda authorizer that validates session tokens stored in the commerce DynamoDB table.

This authorizer accepts an `Authorization: Bearer <sessionId>` header, looks up
the session metadata at `PK=SESSION#<sessionId>, SK=METADATA`, and if active returns
an IAM policy that allows invocation. The authorizer places the resolved `userId`
into the authorizer context so downstream lambdas can read `event.requestContext.authorizer.userId`.

Notes:
- Uses the shared commerce helper `get_session_pointer` when available.
- Returns 'Unauthorized' by raising an exception so API Gateway returns 401.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

import os
import boto3

# Use DynamoDB directly here instead of relying on the shared layer so the
# authorizer can be deployed independently. The table name falls back to the
# shared default used elsewhere in the project.
COMMERCE_TABLE = os.getenv("COMMERCE_TABLE") or "babesclub-commerce"
_dynamodb = boto3.resource("dynamodb")


def get_session_pointer(session_id: str) -> dict | None:
    table = _dynamodb.Table(COMMERCE_TABLE)
    # Use a strongly-consistent read so immediately-after-signup reads
    # reliably see the newly-created session item.
    resp = table.get_item(Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"}, ConsistentRead=True)
    return resp.get("Item")

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)


def _extract_token(event: Dict[str, Any]) -> Optional[str]:
    # TOKEN authorizer normally receives token in `authorizationToken`.
    token = event.get("authorizationToken")
    if token:
        token = token.strip()
        parts = token.split(None, 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return token

    # Fallback to headers (case-insensitive)
    headers = event.get("headers") or {}
    for key in ("authorization", "Authorization"):
        v = headers.get(key)
        if v:
            token = v.strip()
            parts = token.split(None, 1)
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
            return token

    # Fallback to multiValueHeaders
    mvh = event.get("multiValueHeaders") or {}
    for key in ("authorization", "Authorization"):
        vals = mvh.get(key) or mvh.get(key.lower())
        if vals:
            token = vals[0].strip()
            parts = token.split(None, 1)
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
            return token

    # Also allow `token` query param for testing convenience
    qs = event.get("queryStringParameters") or {}
    return qs.get("token")


def _generate_policy(principal_id: str, effect: str, method_arn: str, context: Dict[str, str]) -> Dict[str, Any]:
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {"Action": "execute-api:Invoke", "Effect": effect, "Resource": method_arn}
        ],
    }
    return {"principalId": principal_id, "policyDocument": policy_document, "context": context}


def lambda_handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    LOGGER.debug("Authorizer invoked: %s", json.dumps({"methodArn": event.get("methodArn"), "headers": event.get('headers')}))
    LOGGER.info("Authorizer event: %s", json.dumps(event))
    LOGGER.info("Authorizer context: %s", str(_context))
    # Extract JWT from headers
    headers = (event.get("headers") or {})
    jwt_token = headers.get("Authorization") or headers.get("authorization")
    LOGGER.info("JWT token from headers: %s", jwt_token)
    token = _extract_token(event)
    if not token:
        LOGGER.info("No authorization token provided")
        # No token -> 401 Unauthorized (raise so API Gateway returns 401)
        raise Exception("Unauthorized")

    # Resolve session metadata
    try:
        session = get_session_pointer(token)
    except Exception as exc:
        LOGGER.exception("Failed to read session for token: %s", exc)
        # Internal issue while reading session -> signal unauthorized (401)
        raise Exception("Unauthorized")

    if not session:
        LOGGER.info("Session not found for token")
        # Explicit Deny -> API Gateway will return 403 Forbidden
        return _generate_policy(principal_id=(token or "unknown"), effect="Deny", method_arn=event["methodArn"], context={"reason": "session_not_found"})

    # Fix 1.3: Token expiry check
    expires_at = session.get("expiresAt", 0)
    if expires_at > 0:
        import time
        current_time = int(time.time())
        if expires_at <= current_time:
            LOGGER.info("Session expired for token (expiresAt: %d, now: %d)", expires_at, current_time)
            return _generate_policy(
                principal_id=(token or "unknown"),
                effect="Deny",
                method_arn=event["methodArn"],
                context={"reason": "session_expired", "expiresAt": str(expires_at)}
            )

    # Expect session to include a `status` and `userId` (or userPk)
    status = session.get("status") or session.get("state") or ""
    if status != "active":
        LOGGER.info("Session not active: %s", status)
        # Inactive session -> explicit Deny (403)
        return _generate_policy(principal_id=(token or "unknown"), effect="Deny", method_arn=event["methodArn"], context={"reason": "session_inactive", "status": str(status)})

    user_id = session.get("userId") or session.get("userPk") or session.get("userIdHash")
    if not user_id:
        LOGGER.info("Session missing userId")
        # Malformed session -> explicit Deny (403)
        return _generate_policy(principal_id=(token or "unknown"), effect="Deny", method_arn=event["methodArn"], context={"reason": "missing_userId"})

    # API Gateway expects context values to be strings
    context = {"userId": str(user_id)}

    return _generate_policy(principal_id=token, effect="Allow", method_arn=event["methodArn"], context=context)

