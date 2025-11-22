"""Validation helpers for commerce Lambda payloads."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

CURRENT_QUOTE_VERSION = "v1"


@dataclass
class QuoteMetadata:
    version: str
    issued_at: int
    expires_at: int
    ttl_seconds: int

    @property
    def issued_at_dt(self) -> datetime:
        return datetime.fromtimestamp(self.issued_at / 1000, tz=timezone.utc)

    @property
    def expires_at_dt(self) -> datetime:
        return datetime.fromtimestamp(self.expires_at / 1000, tz=timezone.utc)


def parse_quote_metadata(payload: Dict[str, Any]) -> Optional[QuoteMetadata]:
    quote = payload.get("quote")
    if not isinstance(quote, dict):
        return None

    try:
        issued_at = int(quote.get("issuedAt"))
    except (TypeError, ValueError):
        return None

    ttl_seconds = quote.get("ttlSeconds")
    ttl_value: Optional[int]
    try:
        ttl_value = int(ttl_seconds) if ttl_seconds is not None else None
    except (TypeError, ValueError):
        ttl_value = None

    expires_at_raw = quote.get("expiresAt")
    try:
        expires_at = int(expires_at_raw) if expires_at_raw is not None else None
    except (TypeError, ValueError):
        expires_at = None

    if ttl_value and ttl_value > 0 and not expires_at:
        expires_at = issued_at + ttl_value * 1000
    if not expires_at:
        return None

    if not ttl_value:
        ttl_value = max(1, round((expires_at - issued_at) / 1000))

    version = quote.get("version") or CURRENT_QUOTE_VERSION
    if not isinstance(version, str):
        version = CURRENT_QUOTE_VERSION

    return QuoteMetadata(version=version, issued_at=issued_at, expires_at=expires_at, ttl_seconds=ttl_value)


def is_quote_metadata_valid(metadata: QuoteMetadata) -> bool:
    return metadata.version == CURRENT_QUOTE_VERSION and metadata.expires_at > metadata.issued_at


def is_quote_expired(metadata: QuoteMetadata, *, reference_ts_ms: Optional[int] = None) -> bool:
    reference = reference_ts_ms or int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    return metadata.expires_at <= reference
