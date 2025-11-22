"""Lambda authorizer that validates the X-Api-Gateway-Key header."""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

import boto3
from botocore.exceptions import ClientError

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

HEADER_NAME = "x-api-gateway-key"
EXPECTED_API_KEY = os.environ.get("EXPECTED_API_KEY")
PARAMETER_NAME = os.environ.get("API_KEY_PARAMETER")

_ssm_client: Optional[boto3.client] = None
_cached_secret: Optional[str] = None


def _ensure_secret() -> str:
    """Load the expected API key value either from env or SSM, caching the result."""

    global _cached_secret, _ssm_client

    if EXPECTED_API_KEY:
        _cached_secret = EXPECTED_API_KEY
        return _cached_secret

    if _cached_secret:
        return _cached_secret

    if not PARAMETER_NAME:
        raise RuntimeError(
            "Authorizer misconfigured: set EXPECTED_API_KEY or API_KEY_PARAMETER."
        )

    if _ssm_client is None:
        _ssm_client = boto3.client("ssm")

    try:
        response = _ssm_client.get_parameter(
            Name=PARAMETER_NAME,
            WithDecryption=True,
        )
    except ClientError as exc:
        LOGGER.error("Failed to load SSM parameter %s: %s", PARAMETER_NAME, exc)
        raise RuntimeError("Unable to load API key parameter") from exc

    _cached_secret = response["Parameter"]["Value"]
    return _cached_secret


def _extract_header(event: Dict[str, Any]) -> Optional[str]:
    headers = event.get("headers") or {}
    for key, value in headers.items():
        if key.lower() == HEADER_NAME:
            return value
    return None


def _generate_policy(principal_id: str, effect: str, method_arn: str) -> Dict[str, Any]:
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "execute-api:Invoke",
                "Effect": effect,
                "Resource": method_arn,
            }
        ],
    }

    return {
        "principalId": principal_id,
        "policyDocument": policy_document,
        "context": {"authorized": effect == "Allow"},
    }


def lambda_handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    LOGGER.debug("Authorizer invoked: %s", json.dumps({"methodArn": event.get("methodArn")}))

    expected_key = _ensure_secret()
    provided_key = _extract_header(event)

    if not provided_key or provided_key != expected_key:
        LOGGER.warning("Authorization failed for method %s", event.get("methodArn"))
        raise Exception("Unauthorized")

    return _generate_policy("cart-quote-authorizer", "Allow", event["methodArn"])
