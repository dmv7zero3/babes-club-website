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

# Import JWT utility from shared layer
from shared_commerce.jwt_utils import verify_jwt

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



def _cors_error_response(message: str, origin: str = "*") -> Dict[str, Any]:
    return {
        "statusCode": 401,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps({"error": message}),
    }

def lambda_handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    LOGGER.debug("Authorizer invoked: %s", json.dumps({"methodArn": event.get("methodArn"), "headers": event.get('headers')}))
    LOGGER.info("Authorizer event: %s", json.dumps(event))
    LOGGER.info("Authorizer context: %s", str(_context))
    token = _extract_token(event)
    origin = event.get("headers", {}).get("origin", "*")
    LOGGER.info("Extracted token for validation: %s", token)
    if not token:
        LOGGER.info("No authorization token provided")
        # API Gateway authorizer expects Exception for 401, but we return CORS error for direct invocation/testing
        return _cors_error_response("Unauthorized: No token provided", origin)

    payload = None
    try:
        payload = verify_jwt(token)
        LOGGER.info("JWT payload: %s", json.dumps(payload))
        exp = payload.get("exp")
        user_id = payload.get("userId")
        LOGGER.info(f"JWT exp: {exp}, userId: {user_id}")
    except Exception as exc:
        LOGGER.error("JWT verification error: %s", exc)
        LOGGER.info("JWT validation failed: %s", str(exc))
        return _cors_error_response(f"JWT error: {str(exc)}", origin)

    if not payload:
        LOGGER.info("JWT not valid or expired")
        return _cors_error_response("JWT not valid or expired", origin)

    user_id = payload.get("userId")
    role = payload.get("role", "customer")
    email = payload.get("email", "")
    display_name = payload.get("displayName", "")
    context = {
        "userId": str(user_id),
        "role": str(role),
        "email": str(email),
        "displayName": str(display_name)
    }
    LOGGER.info(f"Authorizer returning Allow for userId: {user_id}, role: {role}")
    return _generate_policy(principal_id=token, effect="Allow", method_arn=event["methodArn"], context=context)

