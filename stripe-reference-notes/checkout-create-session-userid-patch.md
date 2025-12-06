# Checkout Create Session - userId Metadata Patch

This document describes the changes needed to the `checkout-create-session` Lambda
to include `userId` in the Stripe session metadata, enabling order snapshot creation
in the webhook handler.

## Overview

The webhook handler needs a `userId` to create order snapshots with the correct
DynamoDB partition key (`USER#{userId}`). This patch ensures that:

1. Frontend can pass `userId` in the checkout request payload
2. The Lambda includes `userId` in Stripe session metadata
3. Webhook can extract `userId` from metadata to create order snapshots

## Changes Required

### 1. Update Metadata Sanitization (around line 200-210)

Find the existing metadata handling code:

```python
metadata = _sanitize_metadata(payload.get("metadata"))
metadata.setdefault("quoteSignature", quote_signature)
metadata.setdefault("normalizedHash", normalized_hash)
```

Replace with:

```python
metadata = _sanitize_metadata(payload.get("metadata"))
metadata.setdefault("quoteSignature", quote_signature)
metadata.setdefault("normalizedHash", normalized_hash)

# Include userId for order snapshot creation in webhook
user_id = payload.get("userId") or payload.get("user_id")
if isinstance(user_id, str) and user_id.strip():
    metadata["userId"] = user_id.strip()
elif customer_email:
    # Fallback: use customer email as userId for guest checkout
    metadata["userId"] = customer_email
```

### 2. Update API Contract Documentation

Add `userId` to the accepted payload fields in the Lambda's README or API docs:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Optional | User identifier for order history. Falls back to customerEmail if not provided. |

## Frontend Integration

Update the checkout request in `src/lib/api/cart.ts` to include `userId` when available:

```typescript
export async function createCheckoutSession(
  payload: CheckoutPayload,
  options?: { signal?: AbortSignal; userId?: string }
): Promise<CheckoutSessionResponse> {
  const requestBody: CheckoutSessionRequest = {
    quoteSignature: payload.quoteSignature,
    successUrl: `${window.location.origin}/checkout/success`,
    cancelUrl: `${window.location.origin}/checkout/cancel`,
    customerEmail: payload.customerEmail,
    // Include userId if available (from auth context)
    ...(options?.userId && { userId: options.userId }),
  };
  
  // ... rest of the function
}
```

## For Authenticated Users

When a user is logged in, retrieve their `userId` from the auth context and pass it
to the checkout session creation:

```typescript
// In CartDrawer.tsx or checkout component
const { user } = useAuth();

const handleCheckout = async () => {
  const session = await createCheckoutSession(checkoutPayload, {
    userId: user?.userId,
  });
  // redirect to Stripe
};
```

## For Guest Checkout

For guest checkout without authentication:
- The `userId` will be `undefined`
- The Lambda will fall back to using `customerEmail` as the identifier
- Orders will be stored under `USER#{email}` in DynamoDB
- Users can later claim these orders by verifying their email

## Testing

1. Create a checkout session with `userId` in the payload
2. Complete the checkout in Stripe test mode
3. Verify the webhook receives the `userId` in metadata
4. Confirm order snapshot is created with correct `PK: USER#{userId}`

## Full Patch Diff

```diff
--- a/AWS_Lambda_Functions/babes-website-checkout-create-session/lambda_function.py
+++ b/AWS_Lambda_Functions/babes-website-checkout-create-session/lambda_function.py
@@ -200,6 +200,14 @@ def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
     metadata = _sanitize_metadata(payload.get("metadata"))
     metadata.setdefault("quoteSignature", quote_signature)
     metadata.setdefault("normalizedHash", normalized_hash)
+
+    # Include userId for order snapshot creation in webhook
+    user_id = payload.get("userId") or payload.get("user_id")
+    if isinstance(user_id, str) and user_id.strip():
+        metadata["userId"] = user_id.strip()
+    elif customer_email:
+        # Fallback: use customer email as userId for guest checkout
+        metadata["userId"] = customer_email
 
     session_args: Dict[str, Any] = {
         "mode": mode,
```

## Security Considerations

1. **User ID Validation**: The userId should be validated against the authenticated
   user's session if authentication is required for checkout.
   
2. **Email Fallback**: Using email as userId for guest checkout means:
   - Orders are grouped by email address
   - No authentication is required to place orders
   - Email verification could be used later to claim order history

3. **Metadata Limits**: Stripe metadata values are limited to 500 characters.
   User IDs should be kept short (UUIDs are 36 chars, emails typically < 100 chars).
