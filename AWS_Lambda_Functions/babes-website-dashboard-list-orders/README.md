# Dashboard List Orders Lambda - Review Summary

## Review Date: 2025-11-26

## Overall Assessment: ⚠️ Functional but needs improvements

The original code works but has security and reliability issues that should be fixed before production.

---

## Issues Fixed

### 1. **Imports Inside Function Body** (Code Quality)

```python
# Before (lines 52, 58):
if cursor:
    import base64, json as _json
    query_args["ExclusiveStartKey"] = _json.loads(base64.b64decode(cursor).decode())

# After:
import base64
import json
# ... at top of file, used in _decode_cursor()
```

**Why:** Imports inside functions are slow (checked every call) and violate Python conventions.

---

### 2. **No Input Validation on `limit`** (Security/Reliability)

```python
# Before:
limit = int(query_params.get("limit", os.environ.get("ORDER_PAGE_SIZE", 20)))

# After:
def _get_page_size(query_params: Dict[str, Any]) -> int:
    raw_limit = query_params.get("limit")
    try:
        limit = int(raw_limit)
        return min(max(limit, MIN_PAGE_SIZE), MAX_PAGE_SIZE)  # Clamp 1-100
    except (ValueError, TypeError):
        return default
```

**Why:**

- `int("abc")` raises ValueError → 500 error
- `int("-1")` or `int("999999")` could cause issues
- Now clamped to 1-100 range

---

### 3. **Exposes Internal Error Details** (Security)

```python
# Before:
return _json_response({"error": f"Failed to fetch orders: {exc}"}, status=500)

# After:
logger.exception("DynamoDB query failed for user %s: %s", user_id, exc)
return _error_response("Failed to retrieve orders", 500, cors_origin)
```

**Why:** Stack traces and exception details should go to logs, not API responses. Attackers can use error details.

---

### 4. **Missing Decimal Handling** (Bug)

```python
# Before:
"body": json.dumps(payload)

# After:
def _json_serializer(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError(...)

"body": json.dumps(payload, default=_json_serializer)
```

**Why:** DynamoDB returns numbers as `Decimal`. Without a custom serializer, `json.dumps()` raises `TypeError`.

---

### 5. **Cursor Tampering Vulnerability** (Security)

```python
# Before:
query_args["ExclusiveStartKey"] = json.loads(base64.b64decode(cursor).decode())

# After:
def _decode_cursor(cursor: str | None) -> Optional[Dict[str, Any]]:
    # Validate structure
    if "PK" not in start_key or "SK" not in start_key:
        return None
    # Validate PK format
    if not pk.startswith("USER#"):
        return None
    return start_key

# In handler:
if exclusive_start_key:
    cursor_user = exclusive_start_key.get("PK", "").replace("USER#", "")
    if cursor_user != user_id:
        exclusive_start_key = None  # Reject tampered cursor
```

**Why:** A user could craft a cursor with a different user's PK to enumerate other users' orders.

---

### 6. **Added Logging** (Observability)

```python
logger.info(
    "Listed orders: userId=%s count=%d hasMore=%s",
    user_id, len(orders), next_cursor is not None
)
```

**Why:** Essential for debugging and monitoring.

---

### 7. **Added More Order Fields** (Completeness)

```python
# Before:
orders.append({
    "orderId": item.get("orderId"),
    # ... 7 fields
})

# After:
def _normalize_order(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "orderId": item.get("orderId"),
        "amountSubtotal": item.get("amountSubtotal"),  # NEW
        "completedAt": item.get("completedAt"),        # NEW
        "customerEmail": item.get("customerEmail"),    # NEW
        "shippingAddress": item.get("shippingAddress"), # NEW
        # ... other fields
    }
```

**Why:** Frontend needs these fields for order details display.

---

### 8. **Flexible User ID Extraction** (Compatibility)

```python
# Before:
user_id = event.get("requestContext", {}).get("authorizer", {}).get("userId")

# After:
def _get_user_id(event: Dict[str, Any]) -> Optional[str]:
    user_id = (
        authorizer.get("userId") or
        authorizer.get("user_id") or
        authorizer.get("sub") or              # Cognito
        (authorizer.get("claims") or {}).get("sub")  # JWT claims
    )
```

**Why:** Different authorizers use different field names. This handles multiple formats.

---

### 9. **Uses boto3 Key Conditions** (Best Practice)

```python
# Before:
key_condition = "PK = :pk AND begins_with(SK, :sk_prefix)"
expression_values = {":pk": f"USER#{user_id}", ":sk_prefix": "ORDER#"}

# After:
from boto3.dynamodb.conditions import Key
query_args = {
    "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ORDER#"),
}
```

**Why:** Type-safe, less error-prone, recommended by AWS.

---

## README Assessment

The README is **accurate and complete**. No changes needed. It correctly documents:

- Handler contract
- Query parameters
- Response format
- Environment variables

---

## Files

| File                                                                                                                   | Description      |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| [dashboard-list-orders-lambda-function.py](computer:///mnt/user-data/outputs/dashboard-list-orders-lambda-function.py) | Reviewed version |

---

## Testing Checklist

```bash
# Test normal request
curl -H "Authorization: Bearer <token>" \
  "https://api.thebabesclub.com/dashboard/orders?limit=10"

# Test pagination
curl -H "Authorization: Bearer <token>" \
  "https://api.thebabesclub.com/dashboard/orders?cursor=<nextCursor>"

# Test invalid limit (should use default)
curl -H "Authorization: Bearer <token>" \
  "https://api.thebabesclub.com/dashboard/orders?limit=abc"

# Test limit clamping
curl -H "Authorization: Bearer <token>" \
  "https://api.thebabesclub.com/dashboard/orders?limit=9999"
# Should return max 100

# Test unauthorized
curl "https://api.thebabesclub.com/dashboard/orders"
# Should return 401
```
