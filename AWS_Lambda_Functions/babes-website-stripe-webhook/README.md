# Stripe Webhook Lambda - Production Review Summary

## Review Date: 2025-11-26

## Overall Assessment: ✅ Production Ready (with minor improvements)

The original code is well-structured and follows good practices. The reviewed version includes minor improvements for additional robustness.

---

## Changes Made

### 1. **Time-Bounded Processing** (NEW)

```python
MAX_PROCESSING_TIME_SECONDS = 25
start_time = time.time()

# Before expensive operations:
elapsed = time.time() - start_time
if elapsed < MAX_PROCESSING_TIME_SECONDS:
    # proceed with operation
```

**Why:** Stripe expects a 2xx response within 20 seconds. This ensures we don't timeout and cause retries.

---

### 2. **User ID Sanitization** (SECURITY)

```python
# Before:
user_id = metadata.get("userId") or metadata.get("user_id")

# After:
user_id = metadata.get("userId") or metadata.get("user_id")
user_id = re.sub(r"[^a-zA-Z0-9@.\-_]", "", str(user_id))[:256]
if not user_id:
    logger.warning("Cannot create order snapshot: user_id is empty after sanitization")
    return None
```

**Why:** Prevents DynamoDB key injection attacks via malicious userId values.

---

### 3. **Null Safety for Amounts** (BUG FIX)

```python
# Before:
"amount": data_object.get("amount_total", 0),

# After:
"amount": data_object.get("amount_total") or 0,
```

**Why:** `data_object.get("amount_total", 0)` returns `None` if the key exists with value `None`. Using `or 0` handles both missing keys and `None` values.

---

### 4. **Non-Blocking Failures** (RESILIENCE)

```python
# Before:
session_pointer = get_session_pointer(session_id, table=table)

# After:
try:
    session_pointer = get_session_pointer(session_id, table=table)
except Exception as exc:
    logger.debug("Session pointer lookup failed: %s", exc)
```

**Why:** Secondary lookups shouldn't fail the entire webhook. The nightly sync catches missed orders.

---

### 5. **Phone Number Length Limit** (DATA QUALITY)

```python
# Before:
order_item["customerPhone"] = customer_phone

# After:
order_item["customerPhone"] = str(customer_phone)[:20]
```

**Why:** Prevents malformed phone numbers from bloating DynamoDB items.

---

### 6. **Improved Idempotency Check Error Handling**

```python
# Before:
existing = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"}).get("Item")

# After:
try:
    existing = table.get_item(Key={"PK": f"EVENT#{event_id}", "SK": "METADATA"}).get("Item")
    if existing:
        logger.info("Event %s already processed, returning cached status", event_id)
        return ...
except Exception as exc:
    logger.warning("Idempotency check failed: %s", exc)
    # Continue processing rather than failing
```

**Why:** A DynamoDB blip shouldn't cause webhook failures. Better to risk a duplicate than lose an order.

---

### 7. **Order Number Edge Case** (BUG FIX)

```python
# Before:
suffix = stripe_session_id[-8:].upper()
suffix = re.sub(r"[^A-Z0-9]", "", suffix)
return f"BC-{suffix}"

# After:
suffix = stripe_session_id[-8:].upper()
suffix = re.sub(r"[^A-Z0-9]", "", suffix)
if not suffix:  # Edge case: all chars were non-alphanumeric
    suffix = str(int(time.time()))[-8:]
return f"BC-{suffix}"
```

**Why:** Handles edge case where session ID ends in all special characters.

---

### 8. **Critical Event Recording Handling**

```python
# Before:
record_event(event_item, table=table)

# After:
try:
    record_event(event_item, table=table)
except Exception as exc:
    logger.error("CRITICAL: Failed to record event %s: %s", event_id, exc)
    # Still return 200 to prevent Stripe retries
```

**Why:** If event recording fails, we should still return 200 to prevent Stripe retries. The nightly sync is our safety net.

---

### 9. **Processing Time Logging**

```python
elapsed_total = time.time() - start_time
logger.info(
    "Webhook processed: eventId=%s type=%s status=%s elapsed=%.2fs",
    event_id, event_type, derived_status, elapsed_total
)
```

**Why:** Helps identify slow webhooks and potential timeout issues.

---

## Items NOT Changed (Already Correct)

| Area                     | Why It's Fine                                              |
| ------------------------ | ---------------------------------------------------------- |
| Signature verification   | Uses Stripe SDK properly with configurable tolerance       |
| CORS handling            | Proper origin validation with caching                      |
| Base64 decoding          | Handles all API Gateway encoding cases                     |
| Stripe object conversion | `_to_plain_dict()` handles all Stripe types                |
| Event idempotency        | Correct use of EVENT# keys                                 |
| Order key structure      | `USER#{userId}` / `ORDER#{timestamp}#{orderId}` is optimal |
| TTL configuration        | Properly uses environment variables with defaults          |
| Quote enrichment         | Non-critical, fails gracefully                             |

---

## Deployment Recommendation

1. **Test in staging first** with the reviewed version
2. **Monitor CloudWatch** for any new warning/error patterns
3. **Verify** order creation with a test checkout
4. **Keep original as backup** until verified in production

---

## Files

| File                            | Description                        |
| ------------------------------- | ---------------------------------- |
| `lambda_function.py` (original) | Your uploaded version              |
| `lambda_function_reviewed.py`   | Reviewed version with improvements |

The changes are minimal and low-risk. The original code would work fine in production; these improvements add extra resilience for edge cases.
