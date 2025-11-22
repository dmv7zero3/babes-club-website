"""Placeholder NFT holdings handler."""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from shared_commerce import resolve_origin  # type: ignore


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
    method = (event.get("httpMethod") or "GET").upper()
    cors_origin = resolve_origin(event)
    if method == "OPTIONS":
        return _json_response(200, {"ok": True}, cors_origin=cors_origin)

    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId", "anonymous")
    payload = {
        "nfts": [
            {
                "tokenId": "token-placeholder",
                "collectionId": "collection-placeholder",
                "name": "Placeholder NFT",
                "thumbnailUrl": None,
                "lastSyncedAt": None,
            }
        ],
        "userId": user_id,
    }
    return _json_response(200, payload, cors_origin=cors_origin)
