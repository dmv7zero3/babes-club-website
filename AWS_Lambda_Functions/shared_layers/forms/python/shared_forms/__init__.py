"""Shared form-handling utilities for MarketBrewer Lambda functions."""

from .email_services import send_notification_email, send_confirmation_email
from .email_templates import (
    get_career_notification_template,
    get_career_confirmation_template,
)
from .validation import (
    validate_career_request,
    sanitize_form_data,
    detect_spam_content,
    validate_email,
    validate_phone,
)
from .storage import save_career_to_dynamodb
from .utils import get_body_from_event
from .rate_limiting import check_rate_limit, get_rate_limit_status

__all__ = [
    "send_notification_email",
    "send_confirmation_email",
    "get_career_notification_template",
    "get_career_confirmation_template",
    "validate_career_request",
    "sanitize_form_data",
    "detect_spam_content",
    "validate_email",
    "validate_phone",
    "save_career_to_dynamodb",
    "get_body_from_event",
    "check_rate_limit",
    "get_rate_limit_status",
]
