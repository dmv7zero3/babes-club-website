"""Cart normalization and signature helpers."""

from __future__ import annotations

import hashlib
import json
from typing import Any, Dict, List


def normalize_items(items: List[Dict[str, Any]]) -> str:
    """Return a deterministic JSON string representing cart items."""
    cleaned: List[Dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        normalized = {key: item[key] for key in sorted(item.keys()) if item[key] is not None}
        cleaned.append(normalized)
    cleaned.sort(key=lambda entry: json.dumps(entry, sort_keys=True))
    return json.dumps(cleaned, separators=(",", ":"), sort_keys=True)


def compute_signature(normalized_cart: str, secret: str, timestamp: str) -> str:
    """Compute a stable signature for the cart contents and timestamp."""
    seed = f"{normalized_cart}|{timestamp}|{secret}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


def hash_normalized_cart(normalized_cart: str) -> str:
    """Return a SHA256 hash of the normalized cart payload."""
    return hashlib.sha256(normalized_cart.encode("utf-8")).hexdigest()
