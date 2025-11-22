"""Data access helpers for the commerce DynamoDB table."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any, Dict, Optional

import boto3
from boto3.dynamodb.conditions import Key

from .constants import COMMERCE_TABLE_ENV, DEFAULT_COMMERCE_TABLE

_dynamodb = boto3.resource("dynamodb")
Table = Any


@lru_cache(maxsize=8)
def get_commerce_table(table_name: Optional[str] = None) -> Table:
    """Return (and memoize) the DynamoDB Table resource for commerce data."""
    resolved_name = table_name or os.getenv(COMMERCE_TABLE_ENV) or DEFAULT_COMMERCE_TABLE
    return _dynamodb.Table(resolved_name)


def put_quote_records(quote_item: Dict[str, Any], pointer_item: Dict[str, Any], *, table: Table | None = None) -> None:
    table = table or get_commerce_table()
    with table.batch_writer() as batch:
        batch.put_item(Item=quote_item)
        batch.put_item(Item=pointer_item)


def get_quote_pointer(quote_signature: str, *, table: Table | None = None) -> Dict[str, Any] | None:
    table = table or get_commerce_table()
    response = table.get_item(Key={"PK": f"QUOTE#{quote_signature}", "SK": "METADATA"})
    return response.get("Item")


def get_latest_quote_for_hash(normalized_hash: str, *, table: Table | None = None) -> Dict[str, Any] | None:
    table = table or get_commerce_table()
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"CART#{normalized_hash}"),
        ScanIndexForward=False,
        Limit=1,
    )
    items = response.get("Items") or []
    return items[0] if items else None


def put_session_records(session_item: Dict[str, Any], pointer_item: Dict[str, Any], *, table: Table | None = None) -> None:
    table = table or get_commerce_table()
    with table.batch_writer() as batch:
        batch.put_item(Item=session_item)
        batch.put_item(Item=pointer_item)


def get_session_pointer(session_id: str, *, table: Table | None = None) -> Dict[str, Any] | None:
    table = table or get_commerce_table()
    response = table.get_item(Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"})
    return response.get("Item")


def update_session_status(
    quote_signature: str,
    session_id: str,
    status: str,
    updated_at: str,
    *,
    table: Table | None = None,
    extra_session_attributes: Dict[str, Any] | None = None,
    extra_pointer_attributes: Dict[str, Any] | None = None,
) -> None:
    table = table or get_commerce_table()

    def _build_update_parts(attributes: Dict[str, Any] | None, start_index: int = 1) -> tuple[str, Dict[str, str], Dict[str, Any], int]:
        if not attributes:
            return "", {}, {}, start_index
        expression = ""
        names: Dict[str, str] = {}
        values: Dict[str, Any] = {}
        index = start_index
        for key, value in attributes.items():
            if value is None:
                continue
            placeholder_name = f"#attr{index}"
            placeholder_value = f":val{index}"
            expression += f", {placeholder_name} = {placeholder_value}"
            names[placeholder_name] = key
            values[placeholder_value] = value
            index += 1
        return expression, names, values, index

    session_expression = "SET #status = :status, updatedAt = :updatedAt"
    session_names: Dict[str, str] = {"#status": "status"}
    session_values: Dict[str, Any] = {":status": status, ":updatedAt": updated_at}

    extra_expr, extra_names, extra_values, next_index = _build_update_parts(extra_session_attributes)
    session_expression += extra_expr
    session_names.update(extra_names)
    session_values.update(extra_values)

    pointer_attributes = extra_pointer_attributes if extra_pointer_attributes is not None else extra_session_attributes
    pointer_expression = "SET #status = :status, updatedAt = :updatedAt"
    pointer_names: Dict[str, str] = {"#status": "status"}
    pointer_values: Dict[str, Any] = {":status": status, ":updatedAt": updated_at}

    pointer_expr, pointer_extra_names, pointer_extra_values, _ = _build_update_parts(pointer_attributes, start_index=next_index)
    pointer_expression += pointer_expr
    pointer_names.update(pointer_extra_names)
    pointer_values.update(pointer_extra_values)

    table.update_item(
        Key={"PK": f"QUOTE#{quote_signature}", "SK": f"SESSION#{session_id}"},
        UpdateExpression=session_expression,
        ExpressionAttributeNames=session_names,
        ExpressionAttributeValues=session_values,
    )
    table.update_item(
        Key={"PK": f"SESSION#{session_id}", "SK": "METADATA"},
        UpdateExpression=pointer_expression,
        ExpressionAttributeNames=pointer_names,
        ExpressionAttributeValues=pointer_values,
    )


def record_event(event_item: Dict[str, Any], *, table: Table | None = None) -> None:
    table = table or get_commerce_table()
    table.put_item(Item=event_item)
