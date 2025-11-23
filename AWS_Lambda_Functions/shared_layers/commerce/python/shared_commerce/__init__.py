"""Shared commerce utilities for MarketBrewer Lambda functions."""

from .constants import (
    COMMERCE_TABLE_ENV,
    DEFAULT_COMMERCE_TABLE,
    DEFAULT_QUOTE_TTL_MINUTES,
    QUOTE_TTL_ENV,
    SESSION_TTL_ENV,
    EVENT_TTL_ENV,
    QUOTE_SIGNATURE_SECRET_ENV,
    QUOTE_SIGNATURE_SECRET_PARAMETER_ENV,
    CORS_ALLOW_ORIGIN_ENV,
    CHECKOUT_SUCCESS_URL_ENV,
    CHECKOUT_CANCEL_URL_ENV,
    CHECKOUT_MODE_ENV,
    CHECKOUT_ALLOW_PROMOTION_CODES_ENV,
    CHECKOUT_AUTOMATIC_TAX_ENV,
    STRIPE_SECRET_ENV,
    STRIPE_SECRET_PARAMETER_ENV,
    STRIPE_WEBHOOK_SECRET_ENV,
    STRIPE_WEBHOOK_SECRET_PARAMETER_ENV,
    STRIPE_WEBHOOK_TOLERANCE_ENV,
)
from .env import (
    get_required_env,
    get_env_int,
    get_secure_parameter,
    get_stripe_secret,
    get_stripe_webhook_secret,
)
from .utils import json_response, error_response, ensure_decimal, normalize_decimal_tree, now_utc_iso, parse_json_body
from .signing import normalize_items, compute_signature, hash_normalized_cart
from .storage import (
    get_commerce_table,
    get_quote_pointer,
    get_latest_quote_for_hash,
    put_quote_records,
    put_session_records,
    get_session_pointer,
    update_session_status,
    record_event,
)
from .validation import (
    QuoteMetadata,
    CURRENT_QUOTE_VERSION,
    parse_quote_metadata,
    is_quote_metadata_valid,
    is_quote_expired,
)

from .rate_limiting import check_rate_limit
from .cors import resolve_origin
from .security import derive_hash

# Add get_password_pepper implementation here
import os
def get_password_pepper(optional: bool = False) -> str | None:
    """
    Get password pepper from environment variable.
    Pepper is a secret value added to all passwords before hashing.
    Args:
        optional: If True, returns None if not set. If False, raises error.
    Returns:
        Pepper string or None
    """
    pepper = os.environ.get("PASSWORD_PEPPER") or os.environ.get("AUTH_PASSWORD_PEPPER")
    if not pepper and not optional:
        raise ValueError("PASSWORD_PEPPER environment variable not set")
    return pepper or ""
from .event_utils import redact_event, extract_ip_and_agent

__all__ = [
    "COMMERCE_TABLE_ENV",
    "DEFAULT_COMMERCE_TABLE",
    "DEFAULT_QUOTE_TTL_MINUTES",
    "QUOTE_TTL_ENV",
    "SESSION_TTL_ENV",
    "EVENT_TTL_ENV",
    "QUOTE_SIGNATURE_SECRET_ENV",
    "QUOTE_SIGNATURE_SECRET_PARAMETER_ENV",
    "CORS_ALLOW_ORIGIN_ENV",
    "CHECKOUT_SUCCESS_URL_ENV",
    "CHECKOUT_CANCEL_URL_ENV",
    "CHECKOUT_MODE_ENV",
    "CHECKOUT_ALLOW_PROMOTION_CODES_ENV",
    "CHECKOUT_AUTOMATIC_TAX_ENV",
    "STRIPE_SECRET_ENV",
    "STRIPE_SECRET_PARAMETER_ENV",
    "STRIPE_WEBHOOK_SECRET_ENV",
    "STRIPE_WEBHOOK_SECRET_PARAMETER_ENV",
    "STRIPE_WEBHOOK_TOLERANCE_ENV",
    "get_required_env",
    "get_env_int",
    "get_secure_parameter",
    "get_stripe_secret",
    "get_stripe_webhook_secret",
    "json_response",
    "error_response",
    "ensure_decimal",
    "normalize_decimal_tree",
    "now_utc_iso",
    "parse_json_body",
    "normalize_items",
    "compute_signature",
    "hash_normalized_cart",
    "get_commerce_table",
    "get_quote_pointer",
    "get_latest_quote_for_hash",
    "put_quote_records",
    "put_session_records",
    "get_session_pointer",
    "update_session_status",
    "record_event",
    "QuoteMetadata",
    "CURRENT_QUOTE_VERSION",
    "parse_quote_metadata",
    "is_quote_metadata_valid",
    "is_quote_expired",
    "check_rate_limit",
    "resolve_origin",
    "derive_hash",
    "get_password_pepper",
    "redact_event",
    "extract_ip_and_agent",
]
