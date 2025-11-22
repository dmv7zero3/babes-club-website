from __future__ import annotations

import logging
from typing import Any, Dict

from shared_commerce import get_commerce_table, put_session_records  # type: ignore

logger = logging.getLogger(__name__)


def fetch_user_profile(email_lower: str) -> Dict[str, Any] | None:
    table = get_commerce_table()
    user_pk = f"USER#{email_lower}"
    resp = table.get_item(Key={"PK": user_pk, "SK": "PROFILE"})
    return resp.get("Item")


def write_session_and_pointer(session_item: Dict[str, Any], pointer_item: Dict[str, Any]) -> None:
    # Delegate to shared helper to keep session write logic consistent across lambdas.
    # The shared `put_session_records` performs the same batched put operation.
    put_session_records(session_item, pointer_item)


def update_last_login(user_pk: str, issued_at: str) -> None:
    table = get_commerce_table()
    try:
        table.update_item(
            Key={"PK": user_pk, "SK": "PROFILE"},
            UpdateExpression="SET lastLoginAt = :login, updatedAt = :login",
            ExpressionAttributeValues={":login": issued_at},
        )
    except Exception as exc:  # pragma: no cover - non-blocking update
        logger.warning("Failed to update lastLoginAt for '%s': %s", user_pk, exc)
