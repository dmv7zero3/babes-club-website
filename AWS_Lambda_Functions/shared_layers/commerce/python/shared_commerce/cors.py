from __future__ import annotations

import os
import re
from typing import Dict

from .constants import CORS_ALLOW_ORIGIN_ENV


_ALLOWED_ORIGINS_CACHE: list[str] | None = None


def _get_allowed_origins() -> list[str]:
    global _ALLOWED_ORIGINS_CACHE
    if _ALLOWED_ORIGINS_CACHE is not None:
        return _ALLOWED_ORIGINS_CACHE
    raw = os.getenv(CORS_ALLOW_ORIGIN_ENV, "")
    if not raw:
        _ALLOWED_ORIGINS_CACHE = []
        return _ALLOWED_ORIGINS_CACHE
    tokens = [token.strip() for token in re.split(r"[,\s]+", raw) if token.strip()]
    _ALLOWED_ORIGINS_CACHE = tokens
    return tokens


def resolve_origin(event: Dict) -> str:
    """Return the resolved CORS origin for the given API Gateway event.

    Logic: read allowed origins from `CORS_ALLOW_ORIGIN` env (comma/space-separated).
    If the request Origin header is present and matches an allowed origin, return it.
    Otherwise return the first allowed origin, or the raw env/default '*'.
    """
    allowed = _get_allowed_origins()
    if not allowed:
        return os.getenv(CORS_ALLOW_ORIGIN_ENV, "*")
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin")
    if origin and origin in allowed:
        return origin
    return allowed[0]
