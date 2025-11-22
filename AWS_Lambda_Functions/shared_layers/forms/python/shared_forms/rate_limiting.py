"""IP-based rate limiting helpers for form submissions."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import Optional, Tuple

import boto3

logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")

RATE_LIMIT_TABLE_ENV = "RATE_LIMIT_TABLE"
DEFAULT_RATE_LIMIT_TABLE = "career-form-rate-limits"
MAX_PER_HOUR_ENV = "MAX_SUBMISSIONS_PER_HOUR"
MAX_PER_DAY_ENV = "MAX_SUBMISSIONS_PER_DAY"
DEFAULT_MAX_PER_HOUR = 5
DEFAULT_MAX_PER_DAY = 10


class RateLimiter:
    def __init__(self, table_name: Optional[str] = None, hourly_limit: Optional[int] = None, daily_limit: Optional[int] = None) -> None:
        self.table_name = table_name or os.getenv(RATE_LIMIT_TABLE_ENV, DEFAULT_RATE_LIMIT_TABLE)
        self.hourly_limit = hourly_limit or int(os.getenv(MAX_PER_HOUR_ENV, DEFAULT_MAX_PER_HOUR))
        self.daily_limit = daily_limit or int(os.getenv(MAX_PER_DAY_ENV, DEFAULT_MAX_PER_DAY))
        try:
            self.table = dynamodb.Table(self.table_name)
        except Exception as exc:  # pragma: no cover - environment dependent
            logger.error("Failed to initialize DynamoDB table", extra={"table": self.table_name, "error": str(exc)})
            self.table = None

    def _get_keys(self, ip_address: str) -> Tuple[str, str]:
        now = datetime.now()
        hour_key = f"{ip_address}_{now.strftime('%Y%m%d%H')}"
        day_key = f"{ip_address}_{now.strftime('%Y%m%d')}"
        return hour_key, day_key

    def _get_count(self, key: str) -> int:
        try:
            response = self.table.get_item(Key={"rate_limit_key": key})
            return response.get("Item", {}).get("submission_count", 0)
        except Exception as exc:  # pragma: no cover - network call
            logger.error("Error fetching rate limit count", extra={"key": key, "error": str(exc)})
            return 0

    def _update_count(self, key: str, new_count: int, expires_at: int, ip_address: str) -> bool:
        try:
            self.table.put_item(
                Item={
                    "rate_limit_key": key,
                    "submission_count": new_count,
                    "ip_address": ip_address,
                    "expires_at": expires_at,
                    "last_updated": datetime.now().isoformat(),
                }
            )
            return True
        except Exception as exc:  # pragma: no cover - network call
            logger.error("Error updating rate limit count", extra={"key": key, "error": str(exc)})
            return False

    def check_rate_limit(self, ip_address: str) -> Tuple[bool, Optional[str]]:
        if not self.table:
            logger.warning("Rate limiting table unavailable; allowing request")
            return True, None

        if not ip_address or ip_address == "unknown":
            logger.warning("Unknown IP address; allowing request")
            return True, None

        try:
            now = datetime.now()
            hour_key, day_key = self._get_keys(ip_address)

            hourly_count = self._get_count(hour_key)
            if hourly_count >= self.hourly_limit:
                return False, f"Too many submissions this hour ({hourly_count}/{self.hourly_limit}). Please wait."

            daily_count = self._get_count(day_key)
            if daily_count >= self.daily_limit:
                return False, f"Daily submission limit reached ({daily_count}/{self.daily_limit}). Try again tomorrow."

            hour_expiry = int((now + timedelta(hours=2)).timestamp())
            day_expiry = int((now + timedelta(days=2)).timestamp())

            if not self._update_count(hour_key, hourly_count + 1, hour_expiry, ip_address):
                logger.error("Failed to update hourly rate limit counter", extra={"ip": ip_address})
            if not self._update_count(day_key, daily_count + 1, day_expiry, ip_address):
                logger.error("Failed to update daily rate limit counter", extra={"ip": ip_address})

            return True, None
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Rate limiting error", extra={"ip": ip_address, "error": str(exc)})
            return True, None

    def get_rate_limit_status(self, ip_address: str) -> dict:
        if not self.table or not ip_address or ip_address == "unknown":
            return {
                "hourly_usage": 0,
                "daily_usage": 0,
                "hourly_limit": self.hourly_limit,
                "daily_limit": self.daily_limit,
            }
        try:
            hour_key, day_key = self._get_keys(ip_address)
            hourly_count = self._get_count(hour_key)
            daily_count = self._get_count(day_key)
            return {
                "hourly_usage": hourly_count,
                "daily_usage": daily_count,
                "hourly_limit": self.hourly_limit,
                "daily_limit": self.daily_limit,
                "hourly_remaining": max(0, self.hourly_limit - hourly_count),
                "daily_remaining": max(0, self.daily_limit - daily_count),
            }
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Error retrieving rate limit status", extra={"ip": ip_address, "error": str(exc)})
            return {
                "hourly_usage": 0,
                "daily_usage": 0,
                "hourly_limit": self.hourly_limit,
                "daily_limit": self.daily_limit,
            }


def check_rate_limit(ip_address: str) -> Tuple[bool, Optional[str]]:
    limiter = RateLimiter()
    return limiter.check_rate_limit(ip_address)


def get_rate_limit_status(ip_address: str) -> dict:
    limiter = RateLimiter()
    return limiter.get_rate_limit_status(ip_address)
