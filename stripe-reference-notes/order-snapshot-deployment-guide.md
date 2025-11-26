# Order Snapshot Feature - Deployment Guide

## Overview

This guide covers deploying the updated Stripe webhook Lambda that creates order snapshots in DynamoDB when a checkout is completed.

## Files Included

| File | Description |
|------|-------------|
| `stripe-webhook-lambda-function.py` | Updated webhook Lambda with order snapshot creation |
| `checkout-create-session-userid-patch.md` | Patch instructions for checkout Lambda to include userId |
| `test_order_snapshot.py` | Test script for validating order snapshot creation |

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Stripe         │      │  API Gateway    │      │  Lambda         │
│  Checkout       │─────▶│  /stripe/webhook│─────▶│  stripe-webhook │
│  (completed)    │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │   DynamoDB      │
                                                 │   babesclub-    │
                                                 │   commerce      │
                                                 │                 │
                                                 │  ┌───────────┐  │
                                                 │  │ EVENT#    │  │
                                                 │  │ SESSION#  │  │
                                                 │  │ ORDER#    │◀─── NEW!
                                                 │  └───────────┘  │
                                                 └─────────────────┘
```

## DynamoDB Schema - Order Snapshots

### Key Structure

| Field | Pattern | Example |
|-------|---------|---------|
| PK | `USER#{userId}` | `USER#user_12345` or `USER#guest@example.com` |
| SK | `ORDER#{timestamp}#{orderId}` | `ORDER#1732612800#cs_test_abc123` |

### Order Item Attributes

```json
{
  "PK": "USER#user_12345",
  "SK": "ORDER#1732612800#cs_test_abc123",
  "orderId": "cs_test_abc123",
  "orderNumber": "BC-ABC123",
  "userId": "user_12345",
  "status": "completed",
  "amount": 8500,
  "amountSubtotal": 8500,
  "currency": "usd",
  "items": [
    {
      "name": "Red Necklace",
      "quantity": 2,
      "unitPrice": 3000,
      "sku": "N-RED",
      "collectionId": "necklaces"
    }
  ],
  "itemCount": 2,
  "createdAt": "2024-11-26T12:00:00Z",
  "completedAt": "2024-11-26T12:00:00Z",
  "stripeSessionId": "cs_test_abc123",
  "stripePaymentIntentId": "pi_xyz789",
  "customerEmail": "customer@example.com",
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main St",
    "city": "Toronto",
    "state": "ON",
    "postalCode": "M5V 1A1",
    "country": "CA"
  }
}
```

## Deployment Steps

### Step 1: Update checkout-create-session Lambda

Apply the patch from `checkout-create-session-userid-patch.md`:

```python
# In the metadata handling section, add:
user_id = payload.get("userId") or payload.get("user_id")
if isinstance(user_id, str) and user_id.strip():
    metadata["userId"] = user_id.strip()
elif customer_email:
    metadata["userId"] = customer_email
```

Deploy:
```bash
cd AWS_Lambda_Functions/babes-website-checkout-create-session
zip -r function.zip .
aws lambda update-function-code \
  --function-name babes-website-checkout-create-session \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Step 2: Deploy Updated stripe-webhook Lambda

Replace the existing `lambda_function.py` with `stripe-webhook-lambda-function.py`:

```bash
cd AWS_Lambda_Functions/babes-website-stripe-webhook

# Backup existing
cp lambda_function.py lambda_function.py.bak

# Copy new version
cp /path/to/stripe-webhook-lambda-function.py lambda_function.py

# Package and deploy
zip -r function.zip .
aws lambda update-function-code \
  --function-name babes-website-stripe-webhook \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Step 3: Configure Environment Variables (Optional)

Add the new environment variable if you want order TTL:

```bash
aws lambda update-function-configuration \
  --function-name babes-website-stripe-webhook \
  --environment "Variables={
    COMMERCE_TABLE=babesclub-commerce,
    STRIPE_WEBHOOK_SECRET_PARAMETER=/babesclub/stripe/webhook-secret,
    ORDER_TTL_DAYS=0
  }" \
  --region us-east-1
```

**Note:** `ORDER_TTL_DAYS=0` means orders never expire (recommended for production).

### Step 4: Update Frontend (Optional but Recommended)

If using authenticated checkout, update the frontend to pass `userId`:

```typescript
// src/lib/api/cart.ts
export async function createCheckoutSession(
  payload: CheckoutPayload,
  options?: { signal?: AbortSignal; userId?: string }
): Promise<CheckoutSessionResponse> {
  const response = await api.post('/checkout/create-session', {
    quoteSignature: payload.quoteSignature,
    // ... other fields
    userId: options?.userId,  // Add this
  });
  return response.data;
}
```

### Step 5: Verify Stripe Webhook Configuration

Ensure your Stripe webhook is subscribed to these events:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Select your endpoint
3. Verify events are enabled

## Testing

### Local Test

```bash
cd /path/to/lambda
python test_order_snapshot.py
```

### Integration Test

1. Create a test checkout session:
```bash
curl -X POST https://api.thebabesclub.com/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "quoteSignature": "test-quote-123",
    "userId": "test-user-001"
  }'
```

2. Complete checkout in Stripe test mode using card `4242 4242 4242 4242`

3. Verify order in DynamoDB:
```bash
aws dynamodb query \
  --table-name babesclub-commerce \
  --key-condition-expression "PK = :pk AND begins_with(SK, :sk)" \
  --expression-attribute-values '{
    ":pk": {"S": "USER#test-user-001"},
    ":sk": {"S": "ORDER#"}
  }' \
  --region us-east-1
```

### Verify in CloudWatch Logs

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/babes-website-stripe-webhook \
  --filter-pattern "Order snapshot created" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region us-east-1
```

## Rollback

If issues occur, restore the original Lambda:

```bash
cd AWS_Lambda_Functions/babes-website-stripe-webhook
cp lambda_function.py.bak lambda_function.py
zip -r function.zip .
aws lambda update-function-code \
  --function-name babes-website-stripe-webhook \
  --zip-file fileb://function.zip \
  --region us-east-1
```

## Monitoring

### CloudWatch Alarms

Create alarms for:
- Lambda errors (5XX responses)
- Order creation failures (filter: "Failed to create order snapshot")
- High latency (> 5 seconds)

### Key Metrics to Watch

- `stripe-webhook` Lambda invocations
- `stripe-webhook` Lambda errors
- DynamoDB write capacity consumption
- Order snapshot creation rate

### Log Queries

```
# Count orders created per hour
fields @timestamp, @message
| filter @message like /Order snapshot created/
| stats count() by bin(1h)

# Find failed order creations
fields @timestamp, @message
| filter @message like /Failed to create order snapshot/
| sort @timestamp desc
| limit 50
```

## Troubleshooting

### Order Not Created

1. Check webhook received the event:
   - Look for "Processing checkout completion" in logs
   
2. Verify userId is in metadata:
   - Check Stripe Dashboard → Checkout Session → Metadata
   
3. Check for DynamoDB errors:
   - Look for "Failed to create order snapshot" in logs

### Missing Line Items

1. Verify Stripe API key has read access
2. Check for "Failed to fetch line items" in logs
3. Ensure line items haven't expired (24h window)

### Duplicate Orders

The handler is idempotent via EVENT# records. If duplicates occur:
1. Check if webhook is being delivered multiple times
2. Verify EVENT# idempotency check is working

## Next Steps

After deploying order snapshots:

1. **Implement dashboard-list-orders Lambda** to query orders by user
2. **Add order sync Lambda** for reconciliation
3. **Update frontend OrderHistoryTable** to fetch from API instead of mock data

## Support

For issues, check:
- CloudWatch Logs: `/aws/lambda/babes-website-stripe-webhook`
- DynamoDB table: `babesclub-commerce`
- Stripe Dashboard: Developers → Webhooks → Event deliveries
