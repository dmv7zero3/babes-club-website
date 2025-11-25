import json
import os
import logging
import boto3
from datetime import datetime, timezone

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("COMMERCE_TABLE")
if not TABLE_NAME:
    raise RuntimeError("COMMERCE_TABLE environment variable is required")
commerce_table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    # EventBridge event: payload is in event["detail"]
    detail = event.get("detail", {})
    event_id = detail.get("id")
    event_type = detail.get("type")
    data_object = (detail.get("data") or {}).get("object") or {}
    session_id = data_object.get("id") or data_object.get("session_id")
    customer_id = data_object.get("customer")
    customer_email = data_object.get("customer_email")
    amount_total = data_object.get("amount_total")

    logger.info({
        "event_id": event_id,
        "event_type": event_type,
        "session_id": session_id,
        "customer_id": customer_id,
        "customer_email": customer_email,
        "amount_total": amount_total,
        "raw_event": event
    })

    # Deduplication: check if event already processed
    existing = commerce_table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"}).get("Item")
    if existing:
        return {"statusCode": 200, "body": json.dumps({"status": "already-processed"})}

    processed_at = datetime.now(timezone.utc).isoformat()
    ttl_days = int(os.environ.get("EVENT_TTL_DAYS", "90"))
    ttl_seconds = int(datetime.now(timezone.utc).timestamp()) + ttl_days * 86400

    # Store event metadata
    commerce_table.put_item(
        Item={
            "PK": f"EVENT#{event_id}",
            "SK": "METADATA",
            "eventType": event_type,
            "processedAt": processed_at,
            "sessionId": session_id,
            "customerId": customer_id,
            "customerEmail": customer_email,
            "amountTotal": amount_total,
            "status": "received",
            "expiresAt": ttl_seconds,
        }
    )

    # Example: update session status if session_id is present
    if session_id:
        commerce_table.update_item(
            Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"},
            UpdateExpression="SET #status = :status, updatedAt = :updatedAt",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": "completed" if event_type == "checkout.session.completed" else "received",
                ":updatedAt": processed_at,
            },
        )

    return {"statusCode": 200, "body": json.dumps({"status": "processed", "eventId": event_id, "sessionId": session_id})}
