"""
Dashboard Revoke Session Lambda - Logout single or all sessions
Supports both "Logout" (current device) and "Logout All Devices"
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict, Tuple

from shared_commerce import get_commerce_table, now_utc_iso, resolve_origin  # type: ignore


def _parse_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], str | None]:
    """Parse and validate request body"""
    try:
        body = event.get("body") or "{}"
        if isinstance(body, str):
            return json.loads(body or "{}"), None
        if isinstance(body, bytes):
            return json.loads(body.decode("utf-8")), None
        return body, None
    except json.JSONDecodeError as exc:
        return {}, f"Invalid JSON: {exc}"


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    """Build JSON response"""
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
    """
    Revoke session(s) - Logout functionality
    
    Modes:
    1. Revoke current session (default logout)
    2. Revoke specific session by ID
    3. Revoke all sessions (logout all devices)
    
    Request body:
        {
            "sessionId": "specific-session-id",   // Optional: revoke specific session
            "revokeAll": true,                     // Optional: revoke all sessions
            "keepCurrent": true                    // Optional: keep current session when revokeAll=true
        }
    
    Response:
        {
            "message": "Session revoked",
            "revokedCount": 1  // Number of sessions revoked
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
        return _response(200, {"ok": True}, cors_origin=cors_origin)

    # Parse request body
    body, error = _parse_body(event)
    if error:
        return _response(400, {"error": error}, cors_origin=cors_origin)

    # Get userId and sessionId from authorizer context
    authorizer = (event.get("requestContext") or {}).get("authorizer", {})
    user_id = authorizer.get("userId")
    current_session_id = authorizer.get("sessionId")
    
    if not user_id:
        logger.warning("No userId in authorizer context")
        return _response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    table = get_commerce_table()
    now_iso = now_utc_iso()

    # Determine which session(s) to revoke
    target_session_id = body.get("sessionId")
    revoke_all = body.get("revokeAll", False)
    keep_current = body.get("keepCurrent", False)

    # Mode 1: Revoke specific session
    if target_session_id and not revoke_all:
        logger.info(f"Revoking specific session {target_session_id} for user {user_id}")
        
        try:
            table.transact_write_items(
                TransactItems=[
                    {
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"SESSION#{target_session_id}", "SK": "METADATA"},
                            "UpdateExpression": "SET #status = :status, revokedAt = :now, revokedReason = :reason",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {
                                ":status": "revoked",
                                ":now": now_iso,
                                ":reason": "user_logout"
                            },
                            "ConditionExpression": "userId = :user_id",  # Ensure session belongs to user
                            "ExpressionAttributeValues": {
                                **{":status": "revoked", ":now": now_iso, ":reason": "user_logout"},
                                ":user_id": user_id
                            }
                        }
                    },
                    {
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"USER#{user_id}", "SK": f"SESSION#{target_session_id}"},
                            "UpdateExpression": "SET #status = :status",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {":status": "revoked"}
                        }
                    }
                ]
            )
            
            logger.info(f"Revoked session {target_session_id}")
            return _response(200, {"message": "Session revoked", "revokedCount": 1}, cors_origin=cors_origin)
            
        except Exception as exc:
            if "ConditionalCheckFailed" in str(exc):
                logger.warning(f"Session {target_session_id} not found or doesn't belong to user {user_id}")
                return _response(404, {"error": "Session not found"}, cors_origin=cors_origin)
            
            logger.exception(f"Failed to revoke session {target_session_id}: {exc}")
            return _response(500, {"error": "Failed to revoke session"}, cors_origin=cors_origin)

    # Mode 2: Revoke all sessions
    if revoke_all:
        logger.info(f"Revoking all sessions for user {user_id} (keepCurrent={keep_current})")
        
        try:
            # Query all active sessions
            current_time = int(time.time())
            
            response = table.query(
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
                FilterExpression="#status = :status",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":pk": f"USER#{user_id}",
                    ":sk_prefix": "SESSION#",
                    ":status": "active"
                }
            )
            
            sessions = response.get("Items", [])
            revoked_count = 0
            
            # Revoke each session (in batches of 25 - DynamoDB limit)
            for i in range(0, len(sessions), 25):
                batch = sessions[i:i+25]
                transact_items = []
                
                for session in batch:
                    session_id = session.get("sessionId")
                    
                    # Skip current session if keepCurrent=true
                    if keep_current and session_id == current_session_id:
                        logger.debug(f"Keeping current session {session_id}")
                        continue
                    
                    # Revoke session
                    transact_items.append({
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"SESSION#{session_id}", "SK": "METADATA"},
                            "UpdateExpression": "SET #status = :status, revokedAt = :now, revokedReason = :reason",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {
                                ":status": "revoked",
                                ":now": now_iso,
                                ":reason": "logout_all_devices"
                            }
                        }
                    })
                    
                    # Update session index
                    transact_items.append({
                        "Update": {
                            "TableName": table.table_name,
                            "Key": {"PK": f"USER#{user_id}", "SK": f"SESSION#{session_id}"},
                            "UpdateExpression": "SET #status = :status",
                            "ExpressionAttributeNames": {"#status": "status"},
                            "ExpressionAttributeValues": {":status": "revoked"}
                        }
                    })
                    
                    revoked_count += 1
                
                # Execute batch
                if transact_items:
                    table.transact_write_items(TransactItems=transact_items)
            
            logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
            
            return _response(
                200,
                {
                    "message": "All sessions revoked" if not keep_current else "All other sessions revoked",
                    "revokedCount": revoked_count
                },
                cors_origin=cors_origin
            )
            
        except Exception as exc:
            logger.exception(f"Failed to revoke all sessions for {user_id}: {exc}")
            return _response(500, {"error": "Failed to revoke sessions"}, cors_origin=cors_origin)

    # Mode 3: Revoke current session (default logout)
    logger.info(f"Revoking current session {current_session_id} for user {user_id}")
    
    try:
        table.transact_write_items(
            TransactItems=[
                {
                    "Update": {
                        "TableName": table.table_name,
                        "Key": {"PK": f"SESSION#{current_session_id}", "SK": "METADATA"},
                        "UpdateExpression": "SET #status = :status, revokedAt = :now, revokedReason = :reason",
                        "ExpressionAttributeNames": {"#status": "status"},
                        "ExpressionAttributeValues": {
                            ":status": "revoked",
                            ":now": now_iso,
                            ":reason": "user_logout"
                        }
                    }
                },
                {
                    "Update": {
                        "TableName": table.table_name,
                        "Key": {"PK": f"USER#{user_id}", "SK": f"SESSION#{current_session_id}"},
                        "UpdateExpression": "SET #status = :status",
                        "ExpressionAttributeNames": {"#status": "status"},
                        "ExpressionAttributeValues": {":status": "revoked"}
                    }
                }
            ]
        )
        
        logger.info(f"Revoked current session {current_session_id}")
        return _response(200, {"message": "Logged out", "revokedCount": 1}, cors_origin=cors_origin)
        
    except Exception as exc:
        logger.exception(f"Failed to revoke current session {current_session_id}: {exc}")
        return _response(500, {"error": "Failed to logout"}, cors_origin=cors_origin)
