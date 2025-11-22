import json
import logging

logger = logging.getLogger(__name__)


def get_body_from_event(event):
    """Extract and parse request body from Lambda event."""
    try:
        body = event.get("body")
        if isinstance(body, str):
            return json.loads(body)
        if body:
            return body
        if not event.get("headers"):
            return event
        return {}
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse request body", extra={"error": str(exc)})
        return {}
