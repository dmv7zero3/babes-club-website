#!/usr/bin/env python3
"""Provision Stripe keys into AWS Systems Manager Parameter Store.

This helper stores the publishable key as a plain String and the secret key
as a SecureString so Lambdas can resolve them at runtime.
"""

from __future__ import annotations

import argparse
import getpass
import sys
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError


def _prompt(text: str, *, secret: bool = False) -> str:
    if secret:
        value = getpass.getpass(text)
    else:
        value = input(text)
    if not value:
        raise SystemExit("Aborted: value cannot be empty")
    return value


def _put_parameter(client, *, name: str, value: str, secure: bool) -> None:
    try:
        client.put_parameter(
            Name=name,
            Value=value,
            Type="SecureString" if secure else "String",
            Overwrite=True,
            Tier="Standard",
        )
    except (ClientError, BotoCoreError) as exc:
        raise SystemExit(f"Failed to store parameter '{name}': {exc}") from exc


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--secret-name",
        default="/marketbrewer/babes-club/stripe/secret",
        help="Parameter name for the Stripe secret key (SecureString).",
    )
    parser.add_argument(
        "--secret-value",
        help="Stripe secret key value. If omitted, you will be prompted securely.",
    )
    parser.add_argument(
        "--publishable-name",
        default="/marketbrewer/babes-club/stripe/publishable",
        help="Parameter name for the Stripe publishable key (String).",
    )
    parser.add_argument(
        "--publishable-value",
        help="Stripe publishable key value. If omitted, you will be prompted.",
    )
    parser.add_argument(
        "--profile",
        help="Optional named AWS profile to use (same as AWS_PROFILE).",
    )
    parser.add_argument(
        "--region",
        default="us-east-1",
        help="AWS region where the parameters should be stored (default: us-east-1).",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)

    session_kwargs = {"region_name": args.region}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    session = boto3.Session(**session_kwargs)
    ssm = session.client("ssm")

    secret_value = args.secret_value or _prompt("Stripe secret key: ", secret=True)
    publishable_value = args.publishable_value or _prompt("Stripe publishable key: ")

    _put_parameter(ssm, name=args.secret_name, value=secret_value, secure=True)
    _put_parameter(ssm, name=args.publishable_name, value=publishable_value, secure=False)

    print("\nStored parameters:")
    print(f"  Secret     -> {args.secret_name} (SecureString)")
    print(f"  Publishable-> {args.publishable_name} (String)")
    print("Use these names when configuring Lambda environment variables.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
