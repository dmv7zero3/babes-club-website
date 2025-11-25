"""Placeholder scheduled NFT refresh job."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    origin = event.get("headers", {}).get("origin", "*")
    try:
        summary = {
            "runStartedAt": datetime.now(timezone.utc).isoformat(),
            "walletsProcessed": 0,
            "nftsUpdated": 0,
            "notes": "stub implementation",
            "trigger": event.get("source", "manual"),
        }
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            },
            "body": json.dumps(summary),
        }
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            },
            "body": json.dumps({"error": f"Internal error: {exc}"}),
        }
