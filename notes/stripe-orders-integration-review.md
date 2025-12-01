# Stripe Orders Integration Review Report

## The Babes Club E-commerce Website

**Date:** November 26, 2025  
**Prepared for:** Development Team Handoff  
**Status:** Ready for Implementation

---

## Executive Summary

This report analyzes the Stripe Orders integration across the React SPA frontend, AWS Lambda backend, API Gateway, and DynamoDB infrastructure for The Babes Club e-commerce website.

**Key Finding:** The integration is **production-ready for checkout flows** but **partially implemented for order history/dashboard features**.

| Category                      | Status                                           |
| ----------------------------- | ------------------------------------------------ |
| Checkout Flow (Cart → Stripe) | ✅ Production-ready with real Stripe API         |
| Catalog Sync                  | ✅ 18 products synced to Stripe                  |
| Webhook Handling              | ✅ Signature verification implemented            |
| Order History Display         | ⚠️ Placeholder - needs Stripe sync               |
| Dashboard APIs                | ⚠️ Mock data - needs DynamoDB/Stripe integration |
| Environment Configuration     | ✅ Well-documented with SSM support              |
| Security                      | ✅ Rate limiting, HMAC, JWT auth in place        |

---

## 1. Files and Modules Related to Stripe Orders

### 1.1 Backend (AWS Lambda Functions)

| Function                  | Path                                                                            | Purpose                                                |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `cart-quote`              | `AWS_Lambda_Functions/babes-website-cart-quote/`                                | Normalizes cart items, writes signed quote to DynamoDB |
| `checkout-create-session` | `AWS_Lambda_Functions/babes-website-checkout-create-session/lambda_function.py` | Creates Stripe Checkout sessions with real API calls   |
| `stripe-webhook`          | `AWS_Lambda_Functions/babes-website-stripe-webhook/`                            | Handles Stripe webhook events, updates session records |
| `dashboard-get-profile`   | `AWS_Lambda_Functions/babes-website-dashboard-get-profile/`                     | Returns user profile (placeholder returning mock data) |
| `dashboard-list-orders`   | `AWS_Lambda_Functions/babes-website-dashboard-list-orders/`                     | Lists user orders (placeholder)                        |
| `dashboard-get-order`     | `AWS_Lambda_Functions/babes-website-dashboard-get-order/`                       | Gets single order detail (placeholder)                 |

### 1.2 Shared Commerce Layer

| File                                                         | Purpose                                                    |
| ------------------------------------------------------------ | ---------------------------------------------------------- |
| `shared_layers/commerce/python/shared_commerce/env.py`       | Retrieves Stripe secrets from environment                  |
| `shared_layers/commerce/python/shared_commerce/constants.py` | Defines `STRIPE_SECRET_ENV`, `STRIPE_SECRET_PARAMETER_ENV` |

### 1.3 Frontend (React)

| File                                                 | Purpose                                                          |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `src/lib/api/cart.ts`                                | API client for `createCartQuote()` and `createCheckoutSession()` |
| `src/lib/api/cartPayload.ts`                         | Checkout payload builders                                        |
| `src/lib/api/checkoutStorage.ts`                     | Session storage for checkout snapshots                           |
| `src/components/Cart/CartDrawer.tsx`                 | Cart UI with checkout flow                                       |
| `src/pages/Checkout/Success/index.tsx`               | Post-checkout success page                                       |
| `src/pages/Checkout/Cancel/index.tsx`                | Checkout cancellation handling                                   |
| `src/components/Dashboard/OrderHistoryTable.tsx`     | Order history display                                            |
| `src/components/Dashboard/DashboardDataProvider.tsx` | Dashboard data context                                           |
| `src/lib/dashboard/api.ts`                           | Dashboard API client                                             |

### 1.4 Stripe Catalog Importer

| File                                            | Purpose                                             |
| ----------------------------------------------- | --------------------------------------------------- |
| `scripts/Stripe/import-catalog.ts`              | Syncs catalog from `JewleryProducts.json` to Stripe |
| `scripts/Stripe/stripe-id-map.json`             | Maps SKUs to Stripe product/price IDs               |
| `scripts/Stripe/provision_stripe_parameters.py` | Provisions Stripe keys to AWS SSM                   |

---

## 2. Real vs Mock Data Analysis

### 2.1 ✅ REAL STRIPE API CALLS (Production-Ready)

#### Checkout Session Creation

**File:** `checkout-create-session/lambda_function.py`

```python
checkout_session = stripe.checkout.Session.create(
    idempotency_key=idem_key,
    **session_args
)
```

This uses the **live Stripe SDK** with proper idempotency keys.

#### Catalog Import

**File:** `import-catalog.ts`

```typescript
const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});
// ... calls stripe.products.create(), stripe.prices.create()
```

Uses **real Stripe API** with the production secret key.

#### Evidence of Live Integration

- Response files show real Stripe session IDs: `cs_test_a1fJTwAiEgELLmhliZHqkghLu5B1NqM4l7eQHLRXhoTIw1qt6N0NL9kgQ1`
- Checkout URLs point to real Stripe: `https://checkout.stripe.com/c/pay/cs_test_...`
- Product IDs in `stripe-id-map.json` are real Stripe IDs: `prod_TBMJ4DtUWw1BtC`

### 2.2 ⚠️ MOCK/PLACEHOLDER DATA AREAS

#### Dashboard Profile Lambda

**File:** `dashboard-get-profile/README.md`

> "The placeholder currently returns a mock payload until the data layer is attached."

#### Dashboard Orders Lambda

**File:** `dashboard-get-order/README.md`

> "Placeholder Lambda to fetch a single order summary..."
> "TODO: Query the single-table layout... On cache miss, invoke Stripe API"

#### Dashboard List Orders Lambda

Not yet connected to Stripe API for fetching order history.

#### Frontend Fallback Values

**File:** `src/lib/dashboard/api.ts`

```typescript
const normalizeProfile = (
  profile?: Partial<DashboardProfile>
): DashboardProfile => {
  return {
    userId: profile?.userId ?? "anonymous",
    displayName: profile?.displayName ?? "Babes Club Member",
    email: profile?.email ?? "member@example.com",
    // ... fallbacks for defensive coding
  };
};
```

---

## 3. Stripe Catalog and Product Data Validation

### 3.1 Live Stripe Catalog

The `stripe-id-map.json` confirms **18 real products/prices** synchronized to Stripe:

```json
{
  "N-RED": {
    "productId": "prod_TBMJ4DtUWw1BtC",
    "priceId": "price_1SEzbLE2izAILc8xFMdUwAlm",
    "amount": 3000,
    "currency": "USD"
  },
  "N-ORG": {
    "productId": "prod_TBMKqHCMbxilxG",
    "priceId": "price_1SEzbME2izAILc8x7C8jHaXG",
    "amount": 3000,
    "currency": "USD"
  },
  "E-MAG-SIL": {
    "productId": "prod_TBMKMbQBlO2Ah8",
    "priceId": "price_1SEzbYE2izAILc8xUyTnvIcd",
    "amount": 2500,
    "currency": "USD"
  }
  // ... 15 more products
}
```

### 3.2 Source of Truth

| Source                                  | Purpose                                      |
| --------------------------------------- | -------------------------------------------- |
| `src/businessInfo/JewleryProducts.json` | Catalog JSON with pricing, variants, bundles |
| `scripts/Stripe/import-catalog.ts`      | Sync script to Stripe                        |
| `scripts/Stripe/stripe-id-map.json`     | Generated mapping of SKU → Stripe IDs        |

### 3.3 Checkout Flow Uses Real Prices

From `checkout-create-session/lambda_function.py`, line items reference actual Stripe price IDs stored in quote records from the catalog sync.

---

## 4. Environment Variables and Secrets Configuration

### 4.1 Required Environment Variables

| Variable                                                     | Lambda                                  | Purpose                            | Status        |
| ------------------------------------------------------------ | --------------------------------------- | ---------------------------------- | ------------- |
| `STRIPE_SECRET` or `STRIPE_SECRET_PARAMETER`                 | checkout-create-session, stripe-webhook | API authentication                 | ✅ Documented |
| `STRIPE_WEBHOOK_SECRET` or `STRIPE_WEBHOOK_SECRET_PARAMETER` | stripe-webhook                          | Webhook signature verification     | ✅ Documented |
| `COMMERCE_TABLE`                                             | All handlers                            | DynamoDB table name                | ✅ Documented |
| `CORS_ALLOW_ORIGIN`                                          | All handlers                            | CORS configuration                 | ✅ Documented |
| `CHECKOUT_SUCCESS_URL`                                       | checkout-create-session                 | Post-payment redirect              | ✅ Documented |
| `CHECKOUT_CANCEL_URL`                                        | checkout-create-session                 | Cancellation redirect              | ✅ Documented |
| `JWT_SECRET`                                                 | auth, profile lambdas                   | Token signing                      | ✅ Documented |
| `QUOTE_TTL_MINUTES`                                          | cart-quote                              | Quote expiration (default: 15)     | ✅ Optional   |
| `SESSION_TTL_MINUTES`                                        | checkout-create-session                 | Session expiration (default: 1440) | ✅ Optional   |

### 4.2 SSM Parameter Support

The `env.py` module supports both direct environment variables and AWS SSM SecureString parameters:

```python
def get_stripe_secret(optional: bool = False) -> Optional[str]:
    return _get_secret(STRIPE_SECRET_ENV, STRIPE_SECRET_PARAMETER_ENV, optional)
```

### 4.3 Provisioning Script

**File:** `scripts/Stripe/provision_stripe_parameters.py`

```bash
python scripts/Stripe/provision_stripe_parameters.py \
  --secret-name /babesclub/stripe/secret \
  --publishable-name /babesclub/stripe/publishable \
  --region us-east-1
```

---

## 5. Areas Where Mock Data Remains

| Area                                 | Current State                       | Action Required                                         |
| ------------------------------------ | ----------------------------------- | ------------------------------------------------------- |
| **Dashboard Profile Lambda**         | Returns placeholder mock payload    | Connect to DynamoDB `UserProfiles` table                |
| **Dashboard List Orders Lambda**     | Placeholder                         | Implement Stripe API integration for order history      |
| **Dashboard Get Order Lambda**       | Placeholder                         | Query `OrderSnapshots` table, fallback to Stripe API    |
| **Order Sync Pipeline**              | Not implemented                     | Build `stripe_order_sync` scheduled Lambda              |
| **Stripe Webhook → Order Snapshots** | Not implemented                     | Update `OrderSnapshots` on `checkout.session.completed` |
| **Frontend Fallback Values**         | Normalizes missing data to defaults | Keep as defensive fallbacks (appropriate)               |

---

## 6. Steps to Replace Mock Data with Live Stripe Integration

### Phase 1: Order Ingestion (Critical Path)

#### Step 1: Update `stripe-webhook` Lambda

On `checkout.session.completed`, create `OrderSnapshots` record in DynamoDB:

```python
def handle_checkout_completed(session: dict, table) -> None:
    """Process completed checkout session and create order snapshot."""

    customer_email = session.get("customer_details", {}).get("email")
    user_id = session.get("metadata", {}).get("userId") or customer_email
    session_id = session.get("id")
    payment_intent = session.get("payment_intent")

    # Retrieve line items from Stripe
    line_items = stripe.checkout.Session.list_line_items(session_id, limit=100)

    order_item = {
        "PK": f"USER#{user_id}",
        "SK": f"ORDER#{int(time.time())}#{session_id}",
        "orderId": session_id,
        "orderNumber": f"BC-{session_id[-8:].upper()}",
        "status": "completed",
        "amount": session.get("amount_total", 0),
        "currency": session.get("currency", "usd"),
        "stripePaymentIntentId": payment_intent,
        "stripeSessionId": session_id,
        "customerEmail": customer_email,
        "items": [
            {
                "name": item.get("description"),
                "quantity": item.get("quantity"),
                "unitPrice": item.get("price", {}).get("unit_amount", 0),
                "sku": item.get("price", {}).get("product", {}).get("metadata", {}).get("sku"),
            }
            for item in line_items.get("data", [])
        ],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    table.put_item(Item=order_item)
```

#### Step 2: Create Stripe Customer Linkage

In `checkout-create-session`, before creating session:

```python
# Check if user already has a Stripe customer ID
user_profile = table.get_item(Key={"PK": f"USER#{user_id}", "SK": "PROFILE"})

if not user_profile.get("Item", {}).get("stripeCustomerId"):
    customer = stripe.Customer.create(
        email=customer_email,
        metadata={"userId": user_id}
    )
    # Update UserProfiles with stripeCustomerId
    table.update_item(
        Key={"PK": f"USER#{user_id}", "SK": "PROFILE"},
        UpdateExpression="SET stripeCustomerId = :cid, updatedAt = :now",
        ExpressionAttributeValues={
            ":cid": customer.id,
            ":now": datetime.now(timezone.utc).isoformat()
        }
    )
```

### Phase 2: Order Retrieval APIs

#### Step 3: Implement `list_orders` Lambda

```python
def lambda_handler(event, context):
    user_id = event["requestContext"]["authorizer"]["userId"]

    # Query parameters
    limit = int(event.get("queryStringParameters", {}).get("limit", 20))
    cursor = event.get("queryStringParameters", {}).get("cursor")

    query_params = {
        "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ORDER#"),
        "ScanIndexForward": False,  # Newest first
        "Limit": limit
    }

    if cursor:
        query_params["ExclusiveStartKey"] = json.loads(base64.b64decode(cursor))

    response = table.query(**query_params)

    orders = [normalize_order(item) for item in response.get("Items", [])]

    next_cursor = None
    if response.get("LastEvaluatedKey"):
        next_cursor = base64.b64encode(json.dumps(response["LastEvaluatedKey"]).encode()).decode()

    return {
        "statusCode": 200,
        "body": json.dumps({
            "orders": orders,
            "nextCursor": next_cursor
        })
    }
```

#### Step 4: Implement `get_order_detail` Lambda with Stripe Fallback

```python
def lambda_handler(event, context):
    user_id = event["requestContext"]["authorizer"]["userId"]
    order_id = event["pathParameters"]["orderId"]

    # Try DynamoDB first
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with(f"ORDER#"),
        FilterExpression=Attr("orderId").eq(order_id)
    )

    if response.get("Items"):
        return {"statusCode": 200, "body": json.dumps({"order": response["Items"][0]})}

    # Fallback to Stripe API
    try:
        session = stripe.checkout.Session.retrieve(
            order_id,
            expand=["line_items", "customer"]
        )

        # Cache to DynamoDB for future requests
        order_item = build_order_from_stripe_session(session, user_id)
        table.put_item(Item=order_item)

        return {"statusCode": 200, "body": json.dumps({"order": order_item})}
    except stripe.error.InvalidRequestError:
        return {"statusCode": 404, "body": json.dumps({"error": "Order not found"})}
```

### Phase 3: Scheduled Sync

#### Step 5: Create `stripe_order_sync` Lambda

Triggered by CloudWatch Events (nightly):

```python
def lambda_handler(event, context):
    """Reconcile Stripe checkout sessions with DynamoDB OrderSnapshots."""

    # Get last sync timestamp from DynamoDB or default to 24 hours ago
    sync_state = table.get_item(Key={"PK": "SYSTEM", "SK": "STRIPE_SYNC"})
    last_sync = sync_state.get("Item", {}).get("lastSyncAt", int(time.time()) - 86400)

    # List completed checkout sessions since last sync
    sessions = stripe.checkout.Session.list(
        created={"gte": last_sync},
        status="complete",
        limit=100,
        expand=["data.line_items"]
    )

    synced_count = 0
    for session in sessions.auto_paging_iter():
        user_id = session.metadata.get("userId") or session.customer_details.email

        # Check if order already exists
        existing = table.query(
            KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("ORDER#"),
            FilterExpression=Attr("stripeSessionId").eq(session.id),
            Limit=1
        )

        if not existing.get("Items"):
            order_item = build_order_from_stripe_session(session, user_id)
            table.put_item(Item=order_item)
            synced_count += 1

    # Update sync state
    table.put_item(Item={
        "PK": "SYSTEM",
        "SK": "STRIPE_SYNC",
        "lastSyncAt": int(time.time()),
        "lastSyncCount": synced_count
    })

    return {"synced": synced_count}
```

---

## 7. Recommendations for Robustness, Error Handling, and Security

### 7.1 Error Handling Improvements

| Area                    | Recommendation                                                | Priority |
| ----------------------- | ------------------------------------------------------------- | -------- |
| **Stripe API Failures** | Add exponential backoff with jitter for retries               | High     |
| **Webhook Processing**  | Implement dead-letter queue for failed events                 | High     |
| **Quote Expiration**    | Add `QUOTE_TTL_MINUTES` validation with graceful regeneration | Medium   |
| **Session Recovery**    | Persist pre-checkout cart to DynamoDB for recovery            | Medium   |
| **Network Timeouts**    | Set explicit timeout on Stripe API calls (10s recommended)    | Medium   |

### 7.2 Security Enhancements

| Area                  | Current State      | Recommendation                                                  |
| --------------------- | ------------------ | --------------------------------------------------------------- |
| **Webhook Signature** | ✅ Implemented     | Ensure `STRIPE_WEBHOOK_TOLERANCE` is configured (default: 300s) |
| **Quote Tampering**   | ✅ HMAC signatures | Document secret rotation policy                                 |
| **Cross-User Access** | Partial            | Add `userId` check in ALL dashboard endpoints                   |
| **Rate Limiting**     | ✅ DynamoDB-based  | Add CloudWatch alarms for threshold breaches                    |
| **Input Validation**  | Partial            | Add Pydantic or JSON Schema validation to all Lambdas           |

### 7.3 Operational Improvements

| Area            | Recommendation                                           | Priority |
| --------------- | -------------------------------------------------------- | -------- |
| **Monitoring**  | Add CloudWatch alarms for Stripe API errors (4XX/5XX)    | High     |
| **Logging**     | Ensure structured JSON logging for all Stripe operations | High     |
| **Idempotency** | ✅ Checkout sessions covered; extend to order sync       | Medium   |
| **PITR**        | Enable DynamoDB Point-in-Time Recovery before production | High     |
| **Tracing**     | Enable X-Ray for end-to-end request tracing              | Medium   |
| **Alerting**    | Configure SNS/PagerDuty for webhook failures             | High     |

### 7.4 Code Quality

```python
# Recommended: Add structured logging
import logging
import json

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def log_stripe_operation(operation: str, session_id: str, status: str, **kwargs):
    logger.info(json.dumps({
        "event": "stripe_operation",
        "operation": operation,
        "session_id": session_id,
        "status": status,
        **kwargs
    }))
```

---

## 8. DynamoDB Schema Reference

### 8.1 Single-Table Design: `babesclub-commerce`

| Entity           | PK                    | SK                            | Attributes                                                 |
| ---------------- | --------------------- | ----------------------------- | ---------------------------------------------------------- |
| User Profile     | `USER#{userId}`       | `PROFILE`                     | displayName, email, stripeCustomerId, shippingAddress, ... |
| Order            | `USER#{userId}`       | `ORDER#{timestamp}#{orderId}` | orderNumber, status, amount, currency, items[], ...        |
| Quote Cache      | `QUOTE#{signature}`   | `CACHE`                       | items, pricingSummary, expiresAt                           |
| Checkout Session | `QUOTE#{signature}`   | `SESSION#{sessionId}`         | stripeSessionId, status, checkoutUrl                       |
| Session Pointer  | `SESSION#{sessionId}` | `METADATA`                    | quoteSignature, stripeSessionId                            |
| Rate Limit       | `RATE#{ip}`           | `WINDOW#{windowId}`           | count, expiresAt                                           |
| Sync State       | `SYSTEM`              | `STRIPE_SYNC`                 | lastSyncAt, lastSyncCount                                  |

### 8.2 GSI: `stripeCustomerId-index`

For reverse lookup of users by Stripe customer ID:

- Partition Key: `stripeCustomerId`
- Sort Key: `PK`

---

## 9. API Gateway Routes

| Method | Path                          | Lambda                   | Auth             |
| ------ | ----------------------------- | ------------------------ | ---------------- |
| POST   | `/cart/quote`                 | cart-quote               | None             |
| POST   | `/checkout/create-session`    | checkout-create-session  | None             |
| POST   | `/stripe/webhook`             | stripe-webhook           | Stripe Signature |
| GET    | `/dashboard/profile`          | dashboard-get-profile    | JWT              |
| PUT    | `/dashboard/profile`          | dashboard-update-profile | JWT              |
| GET    | `/dashboard/orders`           | dashboard-list-orders    | JWT              |
| GET    | `/dashboard/orders/{orderId}` | dashboard-get-order      | JWT              |
| GET    | `/dashboard/nfts`             | dashboard-list-nfts      | JWT              |

---

## 10. Open Questions

| Question                                      | Impact                                 | Owner   |
| --------------------------------------------- | -------------------------------------- | ------- |
| Is automatic tax enabled in Stripe?           | Affects checkout session configuration | Backend |
| Are shipping rates configured in Stripe?      | May need `shipping_address_collection` | Backend |
| What webhook events are currently subscribed? | Need `checkout.session.completed`      | DevOps  |
| Test mode vs Live mode credentials ready?     | Production deployment                  | DevOps  |
| NFT marketplace API contract available?       | Dashboard NFT feature                  | Product |
| Desired data freshness window for orders?     | Sync frequency                         | Product |

---

## 11. Implementation Checklist

### Pre-Launch (Must Have)

- [ ] Update `stripe-webhook` Lambda to create `OrderSnapshots` on checkout completion
- [ ] Implement `list_orders` Lambda with DynamoDB query
- [ ] Implement `get_order_detail` Lambda with Stripe fallback
- [ ] Connect `dashboard-get-profile` to real DynamoDB data
- [ ] Enable DynamoDB Point-in-Time Recovery
- [ ] Verify Stripe webhook subscription includes `checkout.session.completed`
- [ ] Add CloudWatch alarms for Lambda errors and Stripe API failures
- [ ] Test end-to-end checkout → order display flow

### Post-Launch (Should Have)

- [ ] Create `stripe_order_sync` scheduled Lambda for reconciliation
- [ ] Implement Stripe Customer creation and linkage
- [ ] Add dead-letter queue for failed webhook events

### Future Enhancements (Nice to Have)

- [ ] Implement NFT ownership sync
- [ ] Add order status webhooks (refunds, disputes)
- [ ] Build admin sync trigger endpoints
- [ ] Add email notifications via SES/Postmark

---

## 12. Contact & Handoff

This report is ready for handoff to another developer or LLM for implementation. All context required to proceed is contained within this document.

**Key Files to Start With:**

1. `AWS_Lambda_Functions/babes-website-stripe-webhook/` - Add order snapshot creation
2. `AWS_Lambda_Functions/babes-website-dashboard-list-orders/` - Implement DynamoDB query
3. `notes/backend/cart-checkout-plan.md` - Full backend architecture context

**Testing Checklist:**

1. Create test checkout session with test card `4242 4242 4242 4242`
2. Verify webhook fires and order appears in DynamoDB
3. Confirm dashboard displays order from API
4. Test order detail page with Stripe fallback

---

_Report generated: November 26, 2025_
