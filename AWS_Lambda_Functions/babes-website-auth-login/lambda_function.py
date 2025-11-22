"""
Authorizer Lambda - Validates session tokens and resets inactivity timer
Returns IAM policy with userId in context
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Dict, Optional

import boto3

# DynamoDB setup (direct - no shared layer dependency for authorizer)
COMMERCE_TABLE = os.getenv("COMMERCE_TABLE") or "babesclub-commerce"
_dynamodb = boto3.resource("dynamodb")

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)


def get_session_metadata(session_id: str) -> dict | None:
    """Fetch session metadata with consistent read"""
    table = _dynamodb.Table(COMMERCE_TABLE)
    
    try:
        response = table.get_item(
            Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"},
            ConsistentRead=True  # Strong consistency for auth
        )
        return response.get("Item")
    except Exception as exc:
        LOGGER.exception(f"Failed to read session {session_id}: {exc}")
        return None


def update_session_expiry(session_id: str, user_id: str, new_expiry: int) -> None:
    """
    Reset session expiry timer (async - doesn't block auth)
    Updates both SESSION# and session index
    """
    table = _dynamodb.Table(COMMERCE_TABLE)
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%S.%fZ", time.gmtime())
    
    try:
        # Update both session and index in parallel
        table.transact_write_items(
            TransactItems=[
                {
                    "Update": {
                        "TableName": COMMERCE_TABLE,
                        "Key": {"PK": f"SESSION#{session_id}", "SK": "METADATA"},
                        "UpdateExpression": "SET expiresAt = :expiry, lastAccessedAt = :now, #ttl = :expiry",
                        "ExpressionAttributeNames": {"#ttl": "ttl"},
                        "ExpressionAttributeValues": {
                            ":expiry": new_expiry,
                            ":now": now_iso
                        }
                    }
                },
                {
                    "Update": {
                        "TableName": COMMERCE_TABLE,
                        "Key": {"PK": f"USER#{user_id}", "SK": f"SESSION#{session_id}"},
                        "UpdateExpression": "SET expiresAt = :expiry, lastAccessedAt = :now, #ttl = :expiry",
                        "ExpressionAttributeNames": {"#ttl": "ttl"},
                        "ExpressionAttributeValues": {
                            ":expiry": new_expiry,
                            ":now": now_iso
                        }
                    }
                }
            ]
        )
        LOGGER.debug(f"Updated session expiry for {session_id} to {new_expiry}")
    except Exception as exc:
        # Non-blocking - log but don't fail auth
        LOGGER.warning(f"Failed to update session expiry for {session_id}: {exc}")


def _extract_token(event: Dict[str, Any]) -> Optional[str]:
    """Extract bearer token from various event formats"""
    
    # TOKEN authorizer format
    token = event.get("authorizationToken")
    if token:
        token = token.strip()
        parts = token.split(None, 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return token

    # REQUEST authorizer format - check headers
    headers = event.get("headers") or {}
    for key in ("authorization", "Authorization"):
        value = headers.get(key)
        if value:
            token = value.strip()
            parts = token.split(None, 1)
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
            return token

    # Fallback to multiValueHeaders
    mvh = event.get("multiValueHeaders") or {}
    for key in ("authorization", "Authorization"):
        vals = mvh.get(key)
        if vals and len(vals) > 0:
            token = vals[0].strip()
            parts = token.split(None, 1)
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]
            return token

    return None


def _generate_policy(
    principal_id: str,
    effect: str,
    method_arn: str,
    context: Dict[str, str]
) -> Dict[str, Any]:
    """Generate IAM policy for API Gateway"""
    
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "execute-api:Invoke",
                "Effect": effect,
                "Resource": method_arn
            }
        ]
    }
    
    return {
        "principalId": principal_id,
        "policyDocument": policy_document,
        "context": context  # Available in downstream lambdas
    }


def lambda_handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    """
    Authorize API Gateway requests via session validation
    
    Flow:
    1. Extract session token from Authorization header
    2. Fetch session metadata from DynamoDB
    3. Validate session (status, expiry)
    4. Reset inactivity timer (async)
    5. Return Allow/Deny policy with userId in context
    
    Event:
        {
            "authorizationToken": "Bearer {sessionId}",
            "methodArn": "arn:aws:execute-api:..."
        }
    
    Response:
        {
            "principalId": "{sessionId}",
            "policyDocument": {...},
            "context": {
                "userId": "{uuid}",
                "sessionId": "{sessionId}"
            }
        }
    """
    
    LOGGER.debug(f"Authorizer invoked: {json.dumps({'methodArn': event.get('methodArn')})}")
    
    # Extract token
    token = _extract_token(event)
    if not token:
        LOGGER.info("No authorization token provided")
        raise Exception("Unauthorized")  # Returns 401

    # Fetch session
    try:
        session = get_session_metadata(token)
    except Exception as exc:
        LOGGER.exception(f"Failed to read session: {exc}")
        raise Exception("Unauthorized")

    if not session:
        LOGGER.info(f"Session not found: {token[:8]}...")
        return _generate_policy(
            principal_id=token,
            effect="Deny",
            method_arn=event["methodArn"],
            context={"reason": "session_not_found"}
        )

    # Validate expiry
    expires_at = session.get("expiresAt", 0)
    current_time = int(time.time())
    
    if expires_at > 0 and expires_at <= current_time:
        LOGGER.info(f"Session expired: {token[:8]}... (expiresAt: {expires_at}, now: {current_time})")
        return _generate_policy(
            principal_id=token,
            effect="Deny",
            method_arn=event["methodArn"],
            context={"reason": "session_expired"}
        )

    # Validate status
    status = session.get("status", "")
    if status != "active":
        LOGGER.info(f"Session not active: {token[:8]}... (status: {status})")
        return _generate_policy(
            principal_id=token,
            effect="Deny",
            method_arn=event["methodArn"],
            context={"reason": "session_inactive", "status": str(status)}
        )

    # Get userId
    user_id = session.get("userId")
    if not user_id:
        LOGGER.error(f"Session missing userId: {token[:8]}...")
        return _generate_policy(
            principal_id=token,
            effect="Deny",
            method_arn=event["methodArn"],
            context={"reason": "missing_userId"}
        )

    # Reset inactivity timer (12 hours from now, up to 30-day absolute max)
    issued_at = session.get("issuedAt", "")
    try:
        # Parse issuedAt to get absolute expiry
        import datetime
        issued_dt = datetime.datetime.fromisoformat(issued_at.replace("Z", "+00:00"))
        issued_timestamp = int(issued_dt.timestamp())
        
        # Calculate new expiry
        inactivity_timeout_hours = int(os.getenv("SESSION_INACTIVITY_HOURS", "12"))
        max_session_days = int(os.getenv("SESSION_MAX_DAYS", "30"))
        
        inactivity_expire = current_time + (inactivity_timeout_hours * 3600)
        absolute_expire = issued_timestamp + (max_session_days * 24 * 3600)
        
        new_expiry = min(inactivity_expire, absolute_expire)
        
        # Update expiry (async - doesn't block response)
        if new_expiry != expires_at:
            update_session_expiry(token, user_id, new_expiry)
        
    except Exception as exc:
        # Non-critical - log but don't fail auth
        LOGGER.warning(f"Failed to reset session timer: {exc}")

    # Allow request with userId in context
    LOGGER.debug(f"Authorized user {user_id} via session {token[:8]}...")
    
    return _generate_policy(
        principal_id=token,
        effect="Allow",
        method_arn=event["methodArn"],
        context={
            "userId": str(user_id),
            "sessionId": str(token)
        }
    )
