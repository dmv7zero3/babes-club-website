from __future__ import annotations

import re
from typing import Any, Dict, List


SPAM_KEYWORDS = [
    "bitcoin",
    "cryptocurrency",
    "crypto",
    "forex",
    "make money",
    "viagra",
    "cialis",
]

SUSPICIOUS_DOMAINS = [
    "10minutemail.com",
    "tempmail.org",
    "guerrillamail.com",
    "mailinator.com",
]


def sanitize_input(value: str) -> str:
    if not isinstance(value, str):
        return ""
    clean = re.sub(r"<[^>]+>", "", value)
    clean = re.sub(r"javascript:", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def is_honeypot_triggered(body: Dict[str, Any]) -> bool:
    # Honeypot field named 'website'
    val = body.get("website")
    return bool(val)


def detect_spam(body: Dict[str, Any]) -> List[str]:
    indicators: List[str] = []
    text = " ".join([str(v) for v in body.values() if isinstance(v, str)])
    lower = text.lower()
    for kw in SPAM_KEYWORDS:
        if kw in lower:
            indicators.append(kw)
    email = body.get("email", "")
    if email and any(domain in email.lower() for domain in SUSPICIOUS_DOMAINS):
        indicators.append("suspicious_domain")
    # excessive urls
    urls = re.findall(r"https?://[\w\-\.\/\?=&%]+", text)
    if len(urls) > 2:
        indicators.append("too_many_urls")
    return indicators
