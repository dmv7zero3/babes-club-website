"""Event redaction and IP/User-Agent extraction helpers for Babes Club Lambdas."""
from typing import Any, Dict, Tuple

def redact_event(ev: Dict[str, Any]) -> Any:
    try:
        ev_copy = dict(ev or {})
        if "body" in ev_copy:
            ev_copy["body"] = "<redacted>"
        return ev_copy
    except Exception:
        return "<redacted>"

def extract_ip_and_agent(ev: Dict[str, Any]) -> Tuple[str, str]:
    headers = (ev or {}).get("headers") or {}
    xff = headers.get("x-forwarded-for") or headers.get("X-Forwarded-For") or headers.get("X-Real-IP")
    ip = ""
    if xff:
        ip = xff.split(",")[0].strip()
    else:
        ip = (ev or {}).get("requestContext", {}).get("identity", {}).get("sourceIp") or ""
    ua = headers.get("user-agent") or headers.get("User-Agent") or ""
    return ip or "0.0.0.0", ua or ""
