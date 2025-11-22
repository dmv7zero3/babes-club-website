"""Placeholder handler for the dashboard profile GET endpoint."""

from __future__ import annotations


import json
import os
import uuid
import logging
from typing import Any, Dict

from shared_commerce import resolve_origin, get_commerce_table  # type: ignore

logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)
logger.setLevel(logging.INFO)


def _json_response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    origin = cors_origin or (os.environ.get("CORS_ALLOW_ORIGIN") or "*")
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """Return a stubbed profile payload until the DynamoDB integration is finished.

    This handler also responds to preflight OPTIONS requests with the proper CORS headers.
    """

    # Respond to preflight using centralized resolver

    method = (event.get("httpMethod") or "GET").upper()
    cors_origin = resolve_origin(event)
    logger.info("Lambda handler invoked. Method: %s, Origin: %s", method, cors_origin)
    if method == "OPTIONS":
        logger.info("OPTIONS preflight received")
        return _json_response(200, {"ok": True}, cors_origin=cors_origin)

    try:
        logger.info("Profile GET event: %s", json.dumps(event))
    except Exception as exc:
        logger.error("Failed to serialize event for logging: %s", exc)

    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId")
    logger.info("Extracted userId from authorizer: %s", user_id)
    if not user_id:
        logger.warning("No userId found in requestContext.authorizer. Event: %s", json.dumps(event))
        return _json_response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    # Require UUID-formatted userId (canonical identity: USER#<uuid>)
    try:
        uuid_obj = uuid.UUID(str(user_id))
    except Exception as exc:
        logger.warning("Invalid userId format: %s, error: %s", user_id, exc)
        return _json_response(400, {"error": "Invalid userId format; expected UUID"}, cors_origin=cors_origin)

    user_pk = f"USER#{str(uuid_obj)}"
    logger.info("Looking up profile with PK: %s, SK: PROFILE", user_pk)

    table = get_commerce_table()
    try:
        resp = table.get_item(Key={"PK": user_pk, "SK": "PROFILE"}, ConsistentRead=True)
        logger.info("DynamoDB get_item response: %s", json.dumps(resp))
    except Exception as exc:  # pragma: no cover - runtime/permissions issues
        logger.error("Failed to read profile for PK: %s, error: %s", user_pk, exc)
        return _json_response(500, {"error": f"Failed to read profile: {exc}"}, cors_origin=cors_origin)

    item = (resp or {}).get("Item")
    if not item:
        logger.warning("Profile not found for PK: %s. DynamoDB response: %s", user_pk, json.dumps(resp))
        return _json_response(404, {"error": "Profile not found"}, cors_origin=cors_origin)

    # Remove storage internals before returning
    item.pop("PK", None)
    item.pop("SK", None)
    logger.info("Returning profile: %s", json.dumps(item))

    return _json_response(200, {"profile": item}, cors_origin=cors_origin)
