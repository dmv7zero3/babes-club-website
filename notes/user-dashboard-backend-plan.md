# User Dashboard Backend Plan

## Goals

- Allow authenticated Babes Club members to view and update their profile information.
- Surface order history sourced from Stripe (charges/payment intents linked to the customer record).
- Provide a unified API that powers the React dashboard via API Gateway and Lambda (Python 3.12).

## High-Level Architecture

- **Client**: React dashboard calls REST endpoints with authenticated requests (Cognito JWT or existing auth token).
- **API Gateway**: Routes requests to Lambda functions; handles auth via custom Lambda authorizer or Cognito authorizer.
- **Lambda Functions (Python 3.12)**: Stateless handlers orchestrating data access, validation, and integration logic.
- **DynamoDB Tables**:
  - `UserProfiles`: primary store for profile data and dashboard preferences.
  - `OrderSnapshots`: cached Stripe order summaries for fast reads.
- **Stripe API**: Queried for incremental order updates; sync via scheduled Lambda/Webhook ingestion.
- **EventBridge / SQS (optional)**: Buffer webhook events or schedule batch sync jobs.

## Data Model Draft

### DynamoDB: `UserProfiles`

- **Partition key**: `userId` (UUID / auth subject)
- **Attributes**: `email`, `displayName`, `shippingAddress`, `preferredWallet`, `avatarUrl`, `dashboardSettings`, `updatedAt`, `stripeCustomerId`.
- **Indexes**: GSI on `stripeCustomerId` for reverse lookup.

### DynamoDB: `OrderSnapshots`

- **Partition key**: `userId`
- **Sort key**: `orderId`
- **Attributes**: `orderNumber`, `stripePaymentIntentId`, `status`, `amount`, `currency`, `items`, `createdAt`, `updatedAt`.
- **TTL**: optional for stale data; rely on periodic refresh.

## API Surface (Draft)

### Profile Management

- `GET /dashboard/profile`
  - Returns merged profile data from `UserProfiles`.
- `PUT /dashboard/profile`
  - Validates and updates profile attributes in DynamoDB.
  - Emits audit log event (CloudWatch/EventBridge).

### Order History

- `GET /dashboard/orders`
  - Supports pagination, sort by `createdAt`.
  - Reads from `OrderSnapshots`; triggers background refresh if data older than threshold.
- `GET /dashboard/orders/{orderId}`
  - Returns detailed order record; fetches live from Stripe if snapshot missing.

### Admin / Sync Utilities (later phase)

- `POST /internal/sync/stripe` (protected) — manually trigger Stripe sync for a user.

## Lambda Function Breakdown

1. **`get_profile`**: fetch profile and compute derived fields (e.g., total orders count from `OrderSnapshots`).
2. **`update_profile`**: validate payload, persist to `UserProfiles`.
3. **`list_orders`**: read paginated orders, schedule async refresh via EventBridge if stale.
4. **`get_order_detail`**: fetch single order; fall back to Stripe API if not found or outdated.
5. **`stripe_webhook_handler`**: ingest Stripe events (payment_intent.succeeded, charge.updated) to update `OrderSnapshots`.
6. **`stripe_order_sync`** (scheduled): daily job to reconcile orders, fill gaps.
7. **`auth_authorizer`** (if using Lambda authorizer): verify JWT/session, map to `userId`.

## External Integrations

- **Stripe**:
  - Use Stripe SDK for Python 3.12.
  - Store `stripeCustomerId` in `UserProfiles`.
  - Webhook endpoint deployed via API Gateway → Lambda; verify signature using Stripe secret.
  - Scheduled sync ensures resilience against missed webhooks.

## Security & Compliance

- Authenticate via JWT.
- Authorize actions using `userId` from token; disallow cross-user access.
- Encrypt rest data (DynamoDB default) and use KMS where needed.
- Secrets stored in Secrets Manager; environment variables fetched at cold start.
- Audit logs to CloudWatch (profile updates, sync anomalies).
- Input validation with Pydantic or custom validators.

## Operational Considerations

- **Infrastructure as Code**: Prefer AWS SAM or CDK (Python) to define API Gateway, Lambdas, DynamoDB tables, and IAM.
- **CI/CD**: Extend existing pipeline to deploy backend stack.
- **Monitoring**: CloudWatch metrics + alarms for Lambda errors, throttles, DynamoDB consumption.
- **Tracing**: Enable X-Ray for observability.
- **Caching Strategy**: Use DynamoDB TTL and periodic sync to keep cached data fresh without high latency.
- **Rate Limits**: Handle Stripe API limits with exponential backoff; same for NFT marketplace.

## Development Phases

1. **Planning & Schema Finalization**
   - Confirm user auth flow and `userId` source.
   - Finalize DynamoDB schema (attributes, indexes).
2. **Infrastructure Setup**
   - Define SAM/CDK stack, deploy base tables and API skeleton.
3. **Profile Endpoints**
   - Implement `get_profile` and `update_profile`; integrate auth.
4. **Order Sync Pipeline**
   - Build Stripe webhook + snapshot write; implement order list/detail endpoints.
5. **Admin Tools & Monitoring**
   - Add manual sync triggers, metrics, dashboards.
6. **QA & Load Test**
   - Run integration tests, test sync failure scenarios.
7. **Docs & Hand-off**
   - Document API contracts, IAM roles, deployment steps.

## Open Questions

- What authentication system is currently in place (Cognito, custom)?
- Desired data freshness windows for orders?
- Should order data include line-item fulfillment details (e.g., shipping status)?
