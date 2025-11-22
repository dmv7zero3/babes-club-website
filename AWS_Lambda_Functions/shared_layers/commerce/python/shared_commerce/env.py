"""Helpers for accessing environment configuration."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Dict, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from .constants import (
    STRIPE_SECRET_ENV,
    STRIPE_SECRET_PARAMETER_ENV,
    STRIPE_WEBHOOK_SECRET_ENV,
    STRIPE_WEBHOOK_SECRET_PARAMETER_ENV,
)


_SSM_CLIENT = None
_SSM_CACHE: Dict[str, str] = {}


def get_required_env(name: str, default: Optional[str] = None) -> str:
    """Fetch an environment variable or raise a runtime error if missing."""
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Required environment variable '{name}' is missing")
    return value


def get_env_int(name: str, default: int) -> int:
    """Return an integer value from the environment, falling back to *default*."""
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def get_ssm_client():
    """Create (and cache) a boto3 SSM client."""
    global _SSM_CLIENT  # pylint: disable=global-statement
    if _SSM_CLIENT is None:
        _SSM_CLIENT = boto3.client("ssm")
    return _SSM_CLIENT


def get_secure_parameter(name: str, *, with_decryption: bool = True, use_cache: bool = True):
    """Return a decrypted SecureString parameter from AWS Systems Manager."""
    if use_cache and name in _SSM_CACHE:
        return _SSM_CACHE[name]

    client = get_ssm_client()
    try:
        response = client.get_parameter(Name=name, WithDecryption=with_decryption)
    except (ClientError, BotoCoreError) as exc:  # pragma: no cover - boto handles specifics
        raise RuntimeError(f"Unable to fetch SSM parameter '{name}'") from exc

    value = response.get("Parameter", {}).get("Value")
    if value is None:
        raise RuntimeError(f"SSM parameter '{name}' did not return a value")

    if use_cache:
        _SSM_CACHE[name] = value

    return value


@lru_cache(maxsize=None)
def _resolve_secret(env_name: str, parameter_env_name: str) -> str:
    direct_value = os.getenv(env_name)
    if direct_value:
        return direct_value

    parameter_name = os.getenv(parameter_env_name)
    if parameter_name:
        return get_secure_parameter(parameter_name)

    raise RuntimeError(
        f"Secret is not configured. Set '{env_name}' or '{parameter_env_name}'."
    )


def _get_secret(env_name: str, parameter_env_name: str, optional: bool) -> Optional[str]:
    try:
        return _resolve_secret(env_name, parameter_env_name)
    except RuntimeError:
        if optional:
            return None
        raise
    except Exception as exc:  # pragma: no cover - boto exceptions already wrapped above
        if optional:
            return None
        raise RuntimeError(f"Unable to resolve secret for '{env_name}'") from exc


def get_stripe_secret(optional: bool = False) -> Optional[str]:
    """Return the configured Stripe API secret key."""

    return _get_secret(STRIPE_SECRET_ENV, STRIPE_SECRET_PARAMETER_ENV, optional)


def get_stripe_webhook_secret(optional: bool = False) -> Optional[str]:
    """Return the configured Stripe webhook signing secret."""

    return _get_secret(STRIPE_WEBHOOK_SECRET_ENV, STRIPE_WEBHOOK_SECRET_PARAMETER_ENV, optional)
