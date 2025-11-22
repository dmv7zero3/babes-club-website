import logging
import os

import boto3
from botocore.exceptions import ClientError

from .email_templates import (
    get_career_confirmation_template,
    get_career_notification_template,
)

logger = logging.getLogger(__name__)

ses = boto3.client("ses")

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "accounting@nashandsmashed.com")
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "accounting@nashandsmashed.com")


def send_notification_email(form_data, form_id, website_name, website_url, to_addresses=None):
    """Send notification email to specified addresses only."""

    recipients = to_addresses or [RECIPIENT_EMAIL]
    if not recipients:
        recipients = [RECIPIENT_EMAIL]
        logger.info("Notification recipients missing, falling back to default")

    subject, body_html, body_text = get_career_notification_template(
        form_data=form_data,
        form_id=form_id,
        website_name=website_name,
        website_url=website_url,
    )

    try:
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={"ToAddresses": recipients},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html},
                },
            },
            ReplyToAddresses=[form_data.get("email", SENDER_EMAIL)],
        )
        logger.info(
            "Notification email sent",
            extra={
                "recipient_count": len(recipients),
                "message_id": response.get("MessageId"),
            },
        )
        return True
    except ClientError as exc:  # pragma: no cover - network call
        logger.error("SES error during notification email", extra={"error": str(exc)})
        return False


def send_confirmation_email(form_data, website_name, website_url):
    """Send confirmation email to the job applicant."""

    subject, body_html, body_text = get_career_confirmation_template(
        form_data=form_data,
        website_name=website_name,
        website_url=website_url,
    )

    recipient = form_data.get("email")
    if not recipient:
        logger.warning("Skipping confirmation email: applicant email missing")
        return False

    try:
        response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={"ToAddresses": [recipient]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": body_text},
                    "Html": {"Data": body_html},
                },
            },
        )
        logger.info(
            "Confirmation email sent",
            extra={"recipient": recipient, "message_id": response.get("MessageId")},
        )
        return True
    except ClientError as exc:  # pragma: no cover - network call
        logger.error("SES error during confirmation email", extra={"error": str(exc)})
        return False
