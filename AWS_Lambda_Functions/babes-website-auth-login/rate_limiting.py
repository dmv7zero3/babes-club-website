from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timedelta
from typing import Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

RATE_LIMIT_TABLE = os.getenv("RATE_LIMIT_TABLE", "babesclub-auth-rate-limits")
MAX_SUBMISSIONS_PER_HOUR = int(os.getenv("MAX_SUBMISSIONS_PER_HOUR", "5"))
MAX_SUBMISSIONS_PER_DAY = int(os.getenv("MAX_SUBMISSIONS_PER_DAY", "15"))

dynamo = boto3.resource("dynamodb")


def _hour_key(ip: str) -> str:
    return f"{ip}_{datetime.utcnow().strftime('%Y%m%d%H')}"


def _day_key(ip: str) -> str:
    return f"{ip}_{datetime.utcnow().strftime('%Y%m%d')}"


def check_rate_limit(ip_address: Optional[str]) -> Tuple[bool, Optional[dict]]:
    """Return (allowed, payload). payload contains 'retry_after' or message when blocked."""
    if not ip_address:
        # Unknown IP: fail-open
        return True, None
    table = dynamo.Table(RATE_LIMIT_TABLE)
    now = int(time.time())
    try:
        hour_key = _hour_key(ip_address)
        day_key = _day_key(ip_address)

        # Fetch current counters (table uses PK partition key naming convention)
        # Table uses composite key (PK, SK). Use SK='METADATA' for counter records.
        hour_item = table.get_item(Key={"PK": hour_key, "SK": "METADATA"}).get("Item")
        day_item = table.get_item(Key={"PK": day_key, "SK": "METADATA"}).get("Item")

        hour_count = int(hour_item.get("count", 0)) if hour_item else 0
        day_count = int(day_item.get("count", 0)) if day_item else 0

        if hour_count >= MAX_SUBMISSIONS_PER_HOUR:
            return False, {"message": "Too many requests", "retry_after": 3600}
        if day_count >= MAX_SUBMISSIONS_PER_DAY:
            return False, {"message": "Daily limit reached", "retry_after": 60 * 60 * 24}

        # Increment counters atomically
        ttl_hour = int((datetime.utcnow() + timedelta(hours=2)).timestamp())
        ttl_day = int((datetime.utcnow() + timedelta(days=2)).timestamp())

        # Use partition key "PK" and TTL attribute "expiresAt" to match table schema
        table.update_item(
            Key={"PK": hour_key, "SK": "METADATA"},
            UpdateExpression="SET #c = if_not_exists(#c, :zero) + :inc, expiresAt = :exp",
            ExpressionAttributeNames={"#c": "count"},
            ExpressionAttributeValues={":inc": 1, ":zero": 0, ":exp": ttl_hour},
        )

        table.update_item(
            Key={"PK": day_key, "SK": "METADATA"},
            UpdateExpression="SET #c = if_not_exists(#c, :zero) + :inc, expiresAt = :exp",
            ExpressionAttributeNames={"#c": "count"},
            ExpressionAttributeValues={":inc": 1, ":zero": 0, ":exp": ttl_day},
        )

        return True, None
    except ClientError as exc:
        logger.warning("Rate limit check failed (fail-open): %s", exc)
        return True, None
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected rate limit error")
        return True, None
