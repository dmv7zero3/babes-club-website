# Dashboard Get Order Lambda - Review Summary

## Review Date: 2025-11-26

## Overall Assessment: 🔴 Critical Security Fix Required

The original code has a **critical security vulnerability** that allows users to view other users' orders.

---

## Critical Security Issue 🔴

### Cross-User Order Access

**Original Code (VULNERABLE):**

```python
# Stripe fallback - NO OWNERSHIP VALIDATION!
session = stripe.checkout.Session.retrieve(order_id, expand=["line_items", "customer"])
# Any user can view ANY order if they know/guess the session ID
return _response(200, {"order": order_item}, origin)
```

**Attack Scenario:**

1. User A places order → session ID `cs_test_abc123`
2. User B guesses or obtains session ID
3. User B requests `GET /dashboard/orders/cs_test_abc123`
4. User B sees User A's order details (email, address, items, payment info)

**Fixed Code:**

```python
def _fetch_order_from_stripe(order_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    session = stripe.checkout.Session.retrieve(order_id, ...)

    # SECURITY: Validate ownership
    order_user_id = metadata.get("userId")

    if order_user_id and order_user_id != user_id:
        logger.warning("Cross-user access attempt: authenticated=%s, order_owner=%s", user_id, order_user_id)
        return None  # Deny access

    # Also check email for guest checkout
    if not order_user_id and customer_email != user_id:
        return None  # Deny access
```

---

## All Issues Fixed

| #   | Issue                         | Severity    | Fix                                                   |
| --- | ----------------------------- | ----------- | ----------------------------------------------------- |
| 1   | **No cross-user validation**  | 🔴 Critical | Validate `userId` metadata matches authenticated user |
| 2   | Duplicate `import json`       | Minor       | Removed duplicate                                     |
| 3   | Import inside function        | Minor       | Moved to top                                          |
| 4   | Error details exposed         | Medium      | Generic error messages, log details                   |
| 5   | Missing Decimal handling      | Medium      | Added `_json_serializer()`                            |
| 6   | Silent exception swallowing   | Medium      | Added logging for all exceptions                      |
| 7   | No logging                    | Minor       | Added structured logging throughout                   |
| 8   | `createdAt` is Unix timestamp | Medium      | Convert to ISO format                                 |
| 9   | No Stripe key validation      | Medium      | Use `get_stripe_secret()` with validation             |

---

## Detailed Changes

### 1. Cross-User Validation (Critical Security Fix)

```python
# NEW: Validate order belongs to authenticated user
order_user_id = metadata.get("userId") or metadata.get("user_id")
customer_email = customer_details.get("email")

# If order has userId in metadata, it must match
if order_user_id and order_user_id != user_id:
    logger.warning("Cross-user access attempt: authenticated=%s, order_owner=%s", user_id, order_user_id)
    return None

# For guest checkout, check email matches
if not order_user_id and customer_email and customer_email != user_id:
    logger.warning("Cross-user access attempt (email mismatch)")
    return None

# If we can't verify ownership at all, deny access
if not order_user_id and not customer_email:
    logger.warning("Cannot verify order ownership")
    return None
```

### 2. Proper ISO Date Formatting

```python
# Before:
"createdAt": session.created  # Unix timestamp (1732654104)

# After:
created_timestamp = session_dict.get("created", int(time.time()))
"createdAt": datetime.fromtimestamp(created_timestamp, tz=timezone.utc).isoformat()
# "2025-11-26T21:28:24+00:00"
```

### 3. Decimal Serialization

```python
def _json_serializer(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(...)

"body": json.dumps(payload, default=_json_serializer)
```

### 4. Better Line Items Extraction

```python
# Before:
"items": [
    {
        "name": item.description,
        "sku": item.price.product.metadata.get("sku") if hasattr(...) else None,  # Fragile
    }
]

# After:
for item in line_items_data:
    price = _to_plain_dict(item.get("price"))
    product = _to_plain_dict(price.get("product"))
    product_metadata = _to_plain_dict(product.get("metadata"))

    normalized_item = {
        "name": item.get("description") or product.get("name", "Item"),
        "quantity": item.get("quantity", 1),
        "unitPrice": price.get("unit_amount", 0),
        # ... more fields with safe access
    }
```

### 5. Flexible User ID Extraction

```python
def _get_user_id(event: Dict[str, Any]) -> Optional[str]:
    user_id = (
        authorizer.get("userId") or
        authorizer.get("user_id") or
        authorizer.get("sub") or              # Cognito
        (authorizer.get("claims") or {}).get("sub")
    )
```

### 6. Order ID Validation

```python
# Basic sanity check to prevent abuse
if not isinstance(order_id, str) or len(order_id) > 100:
    return _error_response("Invalid orderId", 400, cors_origin)
```

### 7. Source Tracking

```python
# Orders fetched from Stripe have a source marker
order_item = {
    ...
    "source": "stripe_fallback",  # Distinguishes from webhook-created orders
}
```

---

## Files

| File                                                                                                               | Description                        |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| [dashboard-get-order-lambda-function.py](computer:///mnt/user-data/outputs/dashboard-get-order-lambda-function.py) | Reviewed version with security fix |

---

## Testing Checklist

```bash
# Test normal request (own order)
curl -H "Authorization: Bearer <token>" \
  "https://api.thebabesclub.com/dashboard/orders/cs_test_abc123"

# Test cross-user access (should return 404, not the order!)
# Authenticate as User B, request User A's order
curl -H "Authorization: Bearer <userB_token>" \
  "https://api.thebabesclub.com/dashboard/orders/cs_test_userA_order"
# Expected: {"error": "Order not found"}

# Test invalid orderId
curl -H "Authorization: Bearer <token>" \
  "https://api.thebabesclub.com/dashboard/orders/"
# Expected: {"error": "Missing orderId"}

# Test unauthorized
curl "https://api.thebabesclub.com/dashboard/orders/cs_test_abc123"
# Expected: {"error": "Unauthorized"}
```

---

## README Assessment

The README is accurate but should add a note about the security model:

```markdown
## Security

- Orders are only accessible by the authenticated user who placed them.
- Cross-user access is prevented by validating `userId` metadata against the authenticated user.
- For guest checkout orders, the customer email must match the authenticated user's ID.
```

---

## Deployment Priority: HIGH

This fix should be deployed **immediately** due to the critical security vulnerability. The cross-user access issue could expose customer PII (email, address, order contents).
