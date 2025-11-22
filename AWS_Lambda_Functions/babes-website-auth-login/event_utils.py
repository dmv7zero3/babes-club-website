from __future__ import annotations

from typing import Any, Dict, Tuple


def redact_event(event: Dict[str, Any]) -> Dict[str, Any]:
    request_context = event.get("requestContext") or {}
    headers = event.get("headers") or {}
    redacted_headers = {
        key: value
        for key, value in headers.items()
        if isinstance(key, str)
        and key.lower()
        in {
            "user-agent",
            "x-forwarded-for",
            "cloudfront-viewer-address",
            "x-amzn-trace-id",
        }
    }
    return {
        "httpMethod": event.get("httpMethod"),
        "path": event.get("path"),
        "requestContext": {
            "identity": request_context.get("identity", {}),
            "requestId": request_context.get("requestId"),
        },
        "headers": redacted_headers,
    }


def extract_ip_and_agent(event: Dict[str, Any]) -> Tuple[str | None, str | None]:
    headers = event.get("headers") or {}
    ip = None
    xfwd = headers.get("X-Forwarded-For") or headers.get("x-forwarded-for")
    if isinstance(xfwd, str) and xfwd.strip():
        ip = xfwd.split(",")[0].strip()
    if not ip:
        ip = (event.get("requestContext") or {}).get("identity", {}).get("sourceIp")
    agent = headers.get("User-Agent") or headers.get("user-agent")
    return ip, agent
