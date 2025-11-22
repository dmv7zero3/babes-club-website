import logging
import time
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")


def save_form_submission(form_data: Dict[str, Any], table_name: str, *, form_prefix: str = "FORM") -> str:
    """Persist a form submission to DynamoDB and return the generated ID."""
    table = dynamodb.Table(table_name)
    timestamp = int(time.time() * 1000)
    form_id = f"{form_prefix}_{timestamp}"

    try:
        item = {
            "formID": form_id,
            "timestamp": timestamp,
            "data": form_data,
        }
        table.put_item(Item=item)
        logger.info("Form submission persisted", extra={"form_id": form_id, "table": table_name})
        return form_id
    except ClientError as exc:  # pragma: no cover - network call
        logger.error("Failed to save form submission", extra={"error": str(exc)})
        raise


def save_career_to_dynamodb(form_data: Dict[str, Any], table_name: str) -> str:
    """Backward compatible wrapper that mirrors the original function name."""
    return save_form_submission(form_data, table_name, form_prefix="CAREER")
