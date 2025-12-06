# Dashboard Get Profile Lambda - Review Summary

## Review Date: 2025-11-26

## Overall Assessment: ✅ Good - Minor Improvements

The original code is well-written and handles the security-critical task of filtering password fields correctly. Only minor improvements are recommended.

---

## What's Good ✅

| Area                    | Assessment                                             |
| ----------------------- | ------------------------------------------------------ |
| **Password filtering**  | Correctly removes `passwordHash`, `passwordSalt`, etc. |
| **Authorization check** | Validates userId from authorizer context               |
| **Error handling**      | Returns appropriate status codes (401, 404, 500)       |
| **CORS handling**       | Uses `resolve_origin()` from shared layer              |
| **Consistent reads**    | Uses `ConsistentRead=True` for profile fetch           |
| **Logging**             | Has logging for key operations                         |

---

## Issues Fixed

### 1. **Import Inside Function Body** (Minor)

```python
# Before:
def lambda_handler(event, _context):
    import logging
    logger = logging.getLogger(__name__)

# After:
import logging
logger = logging.getLogger(__name__)
# ... at module level
```

**Why:** Imports inside functions run on every invocation, adding latency.

---

### 2. **f-strings in Logger** (Minor)

```python
# Before:
logger.info(f"Fetching profile for user: {user_id}")

# After:
logger.info("Fetching profile for user: %s", user_id)
```

**Why:** Lazy formatting with `%s` avoids string interpolation if log level is disabled.

---

### 3. **Missing Decimal Handling** (Medium)

```python
# Before:
"body": json.dumps(payload)

# After:
def _json_serializer(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)

"body": json.dumps(payload, default=_json_serializer)
```

**Why:** DynamoDB returns numbers as `Decimal`. Without a serializer, `json.dumps()` raises `TypeError` for fields like `hashIterations` or any numeric profile data.

---

### 4. **No HTTP Method Validation** (Low)

```python
# Before:
# Allows POST, PUT, DELETE, etc. to reach the handler

# After:
if method != "GET":
    return _error_response("Method not allowed", 405, cors_origin)
```

**Why:** Explicit method validation is a best practice.

---

### 5. **Hardcoded Sensitive Fields** (Improved)

```python
# Before:
item.pop("PK", None)
item.pop("SK", None)
item.pop("passwordHash", None)
# ... individual pop() calls

# After:
SENSITIVE_FIELDS: Set[str] = {
    "PK", "SK",
    "passwordHash", "passwordSalt", "hashAlgorithm", "hashIterations",
    "expiresAt",
}

def _sanitize_profile(item: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in item.items() if k not in SENSITIVE_FIELDS}
```

**Why:** Centralized set is easier to maintain and audit.

---

### 6. **Flexible User ID Extraction** (Compatibility)

```python
# Before:
user_id = (event.get("requestContext") or {}).get("authorizer", {}).get("userId")

# After:
def _get_user_id(event: Dict[str, Any]) -> Optional[str]:
    user_id = (
        authorizer.get("userId") or
        authorizer.get("user_id") or
        authorizer.get("sub") or              # Cognito
        (authorizer.get("claims") or {}).get("sub")
    )
```

**Why:** Different authorizers use different field names.

---

## Test File Improvements

The original test file was minimal:

```python
# Original - no DynamoDB mocking
def test_lambda_handler_unauthorized():
    event = {"httpMethod": "GET", "requestContext": {"authorizer": {}}}
    result = lambda_handler(event, None)
    assert result["statusCode"] == 401
```

The improved test file includes:

- **DynamoDB mocking** with `unittest.mock`
- **Sensitive field filtering tests**
- **Decimal serialization tests**
- **404 and 500 error case tests**
- **CORS handling tests**
- **Method validation tests**

---

## Files

| File                                                                                                                             | Description              |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| [dashboard-get-profile-lambda-function.py](computer:///mnt/user-data/outputs/dashboard-get-profile-lambda-function.py)           | Reviewed Lambda          |
| [dashboard-get-profile-test-lambda-function.py](computer:///mnt/user-data/outputs/dashboard-get-profile-test-lambda-function.py) | Comprehensive test suite |

---

## README Assessment

The README is accurate. One small update:

```markdown
## Next steps

1. ~~Wire the JWT authorizer~~ ✅ Done
2. ~~Replace placeholder with real DynamoDB lookups~~ ✅ Done
3. Add structured logging + metrics per the dashboard backend plan.
```

The README still says "placeholder" but the code is now fully implemented.

---

## Security Checklist ✅

| Check                                | Status                          |
| ------------------------------------ | ------------------------------- |
| Password hash filtered               | ✅                              |
| Password salt filtered               | ✅                              |
| Hash algorithm filtered              | ✅                              |
| Hash iterations filtered             | ✅                              |
| DynamoDB keys (PK/SK) filtered       | ✅                              |
| Only authenticated users can access  | ✅                              |
| Users can only see their own profile | ✅ (authorizer provides userId) |

---

## Testing

```bash
# Run tests
cd AWS_Lambda_Functions/babes-website-dashboard-get-profile
pytest test_lambda_function.py -v

# Expected output:
# test_lambda_function.py::TestOptionsRequest::test_returns_200_with_ok PASSED
# test_lambda_function.py::TestUnauthorized::test_missing_authorizer_returns_401 PASSED
# test_lambda_function.py::TestGetProfile::test_filters_sensitive_fields PASSED
# ... etc
```
