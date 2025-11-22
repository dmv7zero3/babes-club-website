"""Placeholder for the scheduled Stripe reconciliation job."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    summary = {
        "runStartedAt": datetime.now(timezone.utc).isoformat(),
        "processedSessions": 0,
        "newSnapshots": 0,
        "notes": "stub implementation",
        "trigger": event.get("source", "manual"),
    }
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(summary),
    }
