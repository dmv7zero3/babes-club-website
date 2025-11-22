import json
import logging
from datetime import datetime

logger = logging.getLogger()

def get_body_from_event(event):
    """Extract and parse request body from Lambda event"""
    try:
        # If body is a string (which is common with API Gateway)
        if isinstance(event.get('body'), str):
            return json.loads(event['body'])
        # If body is already parsed (direct invocation or test)
        elif event.get('body'):
            return event['body']
        # If the event itself is the body (direct invocation)
        elif not event.get('headers'):
            return event
        # Default empty object
        else:
            return {}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse request body: {str(e)}")
        return {}