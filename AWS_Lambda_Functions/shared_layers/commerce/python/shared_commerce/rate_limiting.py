"""Optional DynamoDB-backed rate limiting for commerce endpoints."""

from __future__ import annotations

import logging
import os
import time
from typing import Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

RATE_LIMIT_TABLE_ENV = "COMMERCE_RATE_LIMIT_TABLE"
MAX_REQUESTS_PER_MIN_ENV = "COMMERCE_RATE_LIMIT_MAX_PER_MIN"
DEFAULT_MAX_REQUESTS_PER_MIN = 120
WINDOW_SECONDS = 60

dynamodb = boto3.resource("dynamodb")


class NoOpRateLimiter:
    def check(self, key: str) -> Tuple[bool, Optional[str]]:
        return True, None


class DynamoRateLimiter:
    def __init__(self, table_name: str, max_requests_per_min: int) -> None:
        self.table = dynamodb.Table(table_name)
        self.max_requests = max_requests_per_min

    def check(self, key: str) -> Tuple[bool, Optional[str]]:
        now = int(time.time())
        window_key = f"{key}:{now // WINDOW_SECONDS}"
        ttl = now + WINDOW_SECONDS * 2
        try:
            response = self.table.update_item(
                Key={"rateLimitKey": window_key},
                UpdateExpression="SET requests = if_not_exists(requests, :zero) + :one, expiresAt = :ttl",
                ExpressionAttributeValues={
                    ":zero": 0,
                    ":one": 1,
                    ":ttl": ttl,
                },
                ReturnValues="UPDATED_NEW",
            )
            current = response.get("Attributes", {}).get("requests", 0)
            if current > self.max_requests:
                return False, "Too many requests. Please slow down."
            return True, None
        except ClientError as exc:  # pragma: no cover - defensive logging
            logger.warning("Rate limit check failed", extra={"error": str(exc)})
            return True, None


def get_rate_limiter() -> NoOpRateLimiter | DynamoRateLimiter:
    table_name = os.getenv(RATE_LIMIT_TABLE_ENV)
    if not table_name:
        return NoOpRateLimiter()
    max_per_min = os.getenv(MAX_REQUESTS_PER_MIN_ENV)
    try:
        max_requests = int(max_per_min) if max_per_min else DEFAULT_MAX_REQUESTS_PER_MIN
    except ValueError:
        max_requests = DEFAULT_MAX_REQUESTS_PER_MIN
    return DynamoRateLimiter(table_name, max_requests)


def check_rate_limit(key: str) -> Tuple[bool, Optional[str]]:
    return get_rate_limiter().check(key)
