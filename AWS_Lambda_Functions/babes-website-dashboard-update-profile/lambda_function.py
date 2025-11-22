"""Profile update handler with DynamoDB persistence and optional Stripe sync."""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, Tuple

import stripe  # type: ignore[attr-defined]
from shared_commerce import (
    get_commerce_table,
    get_stripe_secret,
    now_utc_iso,
    resolve_origin,
)  # type: ignore


def _parse_body(event: Dict[str, Any]) -> Tuple[Dict[str, Any], str | None]:
    try:
        body = event.get("body") or "{}"
        if isinstance(body, str):
            return json.loads(body or "{}"), None
        if isinstance(body, bytes):
            return json.loads(body.decode("utf-8")), None
        return body, None
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive only
        return {}, f"Invalid JSON: {exc}"


def _response(status_code: int, payload: Dict[str, Any], cors_origin: str | None = None) -> Dict[str, Any]:
    origin = cors_origin or "*"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def _initialize_stripe(optional: bool = True) -> bool:
    secret = get_stripe_secret(optional=True)
    if not secret:
        return False
    stripe.api_key = secret
    return True


ALLOWED_FIELDS = {"displayName", "dashboardSettings", "phone", "shippingAddress"}


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """Update profile in DynamoDB. Requires authenticated authorizer and UUID userId.

    If `syncToStripe: true` is present in the body, will create/update a Stripe Customer
    and store `stripeCustomerId` on the profile.
    """

    method = (event.get("httpMethod") or "POST").upper()
    cors_origin = resolve_origin(event)
    if method == "OPTIONS":
        return _response(200, {"ok": True}, cors_origin=cors_origin)

    body, error = _parse_body(event)
    if error:
        return _response(400, {"error": error}, cors_origin=cors_origin)

    user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId")
    if not user_id:
        return _response(401, {"error": "Unauthorized"}, cors_origin=cors_origin)

    # Require UUID identity
    try:
        uuid_obj = uuid.UUID(str(user_id))
    except Exception:
        return _response(400, {"error": "Invalid userId format; expected UUID"}, cors_origin=cors_origin)

    user_pk = f"USER#{str(uuid_obj)}"
    table = get_commerce_table()

    # Ensure profile exists (signup flow should create it)
    try:
        existing = table.get_item(Key={"PK": user_pk, "SK": "PROFILE"}).get("Item")
    except Exception as exc:  # pragma: no cover - runtime/permissions
        return _response(500, {"error": f"Failed to read profile: {exc}"}, cors_origin=cors_origin)

    if not existing:
        return _response(404, {"error": "Profile not found"}, cors_origin=cors_origin)

    # Collect updates limited to allowed fields
    updates: Dict[str, Any] = {}
    for key, val in (body or {}).items():
        if key in ALLOWED_FIELDS:
            updates[key] = val

    if not updates and not body.get("syncToStripe"):
        return _response(400, {"error": "No updatable fields provided"}, cors_origin=cors_origin)

    # Handle Stripe sync if requested
    sync_to_stripe = bool(body.get("syncToStripe"))
    stripe_id = existing.get("stripeCustomerId")
    if sync_to_stripe:
        if not _initialize_stripe():
            return _response(500, {"error": "Stripe secret not configured"}, cors_origin=cors_origin)

        # Build stripe payload from allowed fields and existing email
        stripe_payload: Dict[str, Any] = {}
        if updates.get("displayName"):
            stripe_payload["name"] = updates["displayName"]
        # Use existing email (email is read-only in profile)
        if existing.get("email"):
            stripe_payload["email"] = existing.get("email")

        # Map shippingAddress if provided
        shipping = updates.get("shippingAddress")
        if isinstance(shipping, dict):
            # Stripe expects 'address' and 'shipping' structured data
            address = {
                "line1": shipping.get("line1"),
                "line2": shipping.get("line2"),
                "city": shipping.get("city"),
                "state": shipping.get("state"),
                "postal_code": shipping.get("postalCode"),
                "country": shipping.get("country"),
            }
            # Remove None entries
            address = {k: v for k, v in address.items() if v is not None}
            if address:
                stripe_payload["address"] = address
                stripe_payload["shipping"] = {"address": address, "name": updates.get("displayName") or existing.get("displayName")}

        try:
            if stripe_id:
                stripe.Customer.modify(stripe_id, **stripe_payload)
            else:
                created = stripe.Customer.create(**stripe_payload)
                stripe_id = created.get("id")
                # persist stripeCustomerId along with updates below
                updates["stripeCustomerId"] = stripe_id
        except Exception as exc:  # pragma: no cover - network/stripe errors
            return _response(502, {"error": f"Stripe error: {exc}"}, cors_origin=cors_origin)

    # Always set updatedAt
    updates["updatedAt"] = now_utc_iso()

    # Build DynamoDB UpdateExpression
    expr_parts = []
    expr_values: Dict[str, Any] = {}
    for k, v in updates.items():
        placeholder = f":{k}"
        expr_parts.append(f"{k} = {placeholder}")
        expr_values[placeholder] = v

    update_expr = "SET " + ", ".join(expr_parts)

    try:
        resp = table.update_item(
            Key={"PK": user_pk, "SK": "PROFILE"},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
    except Exception as exc:  # pragma: no cover - runtime/permissions
        return _response(500, {"error": f"Failed to update profile: {exc}"}, cors_origin=cors_origin)

    new_item = resp.get("Attributes") or {}
    new_item.pop("PK", None)
    new_item.pop("SK", None)

    return _response(200, {"profile": new_item}, cors_origin=cors_origin)
