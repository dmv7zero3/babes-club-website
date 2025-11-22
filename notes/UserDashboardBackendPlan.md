# User Dashboard Backend Plan

## Goals

- Allow authenticated Babes Club members to view and update their profile information.
- Surface order history sourced from Stripe (charges/payment intents linked to the customer record).
- Display NFT ownership sourced from the Babes Club NFT marketplace.
- Provide a unified API that powers the React dashboard via API Gateway and Lambda (Python 3.12).

## High-Level Architecture

- **Client**: React dashboard calls REST endpoints with authenticated requests (custom JWT issued by the Babes Club identity service).
- **API Gateway**: Routes requests to Lambda functions; uses a lightweight Lambda authorizer that validates Babes Club JWTs with a shared signing secret provided via encrypted environment variables at deploy time.
- **Lambda Functions (Python 3.12)**: Stateless handlers that keep business logic small and focused.
- **DynamoDB Tables**:
  - `UserProfiles`: primary store for profile data and dashboard preferences.
  - `OrderSnapshots`: cached Stripe order summaries for fast reads.
  - `NFTOwnership`: indexed NFT holdings per wallet or user.
- **Stripe API**: Queried for incremental order updates; webhook ingestion keeps DynamoDB in sync, with a nightly reconciliation job for safety.
- **NFT Marketplace API**: Queried to confirm NFT holdings; simple polling job updates DynamoDB if webhooks are unavailable.
- **Secrets & Config**: Signing keys, Stripe secret, and NFT API credentials injected as encrypted Lambda environment variables during deployment and rotated manually when required.

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

### DynamoDB: `NFTOwnership`

- **Partition key**: `userId`
- **Sort key**: `tokenId`
- **Attributes**: `collectionId`, `tokenName`, `thumbnailUrl`, `lastSyncedAt`, `metadata`.
- **Indexes**: maybe GSI on `collectionId` for admin insights.

## API Endpoints

| Method | Path                          | Description                                             | Auth           | Notes                                                                                                                                              |
| ------ | ----------------------------- | ------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/dashboard/profile`          | Fetch the signed-in member's profile.                   | Required       | Returns `userId`, `displayName`, `email`, `shippingAddress`, `preferredWallet`, `avatarUrl`, `stripeCustomerId`, `dashboardSettings`, `updatedAt`. |
| PUT    | `/dashboard/profile`          | Update profile fields.                                  | Required       | Accepts partial payload; validates input and writes to `UserProfiles`. Responds with updated record.                                               |
| GET    | `/dashboard/orders`           | List recent orders with pagination (`limit`, `cursor`). | Required       | Reads from `OrderSnapshots`. Response includes `orders`, `nextCursor`. If cache older than 12h, invokes async refresh Lambda after responding.     |
| GET    | `/dashboard/orders/{orderId}` | Retrieve a single order summary.                        | Required       | Returns cached order; if missing or stale fetches fresh data from Stripe before responding.                                                        |
| GET    | `/dashboard/nfts`             | Fetch NFT holdings tied to the member.                  | Required       | Returns array of `{tokenId, collectionId, tokenName, thumbnailUrl, metadata, lastSyncedAt}` from `NFTOwnership`.                                   |
| POST   | `/internal/sync/stripe`       | Force-refresh Stripe data for a user.                   | Internal token | Accepts `stripeCustomerId` and optional `since`. Uses for admin tooling.                                                                           |
| POST   | `/internal/sync/nfts`         | Force-refresh NFT ownership for a user.                 | Internal token | Accepts `userId` or `wallet`. Only exposed behind internal auth.                                                                                   |

## Lambda Function Breakdown

1. **`auth_authorizer`**: Validate Babes Club JWT using signing key from encrypted environment variable, attach `userId` to request context.
2. **`get_profile`**: Read `UserProfiles` by `userId`, merge default settings, return payload.
3. **`update_profile`**: Validate allowed fields, update DynamoDB, bump `updatedAt`, and log audit event to CloudWatch.
4. **`list_orders`**: Query `OrderSnapshots` by `userId` with pagination. If `lastSyncedAt` older than 12h, enqueue refresh message.
5. **`get_order_detail`**: Fetch specific order; call Stripe on cache miss and write back result.
6. **`list_nfts`**: Query `NFTOwnership`; when data is older than target freshness window, call NFT marketplace and update table.
7. **`stripe_webhook_handler`**: Process Stripe events, update `OrderSnapshots`, mark `lastSyncedAt`.
8. **`stripe_order_sync`** (nightly CloudWatch event): Reconcile Stripe history to fill gaps.
9. **`nft_sync`** (scheduled or webhook): Update NFT holdings when marketplace events arrive or from periodic poll.

## External Integrations

- **Stripe**:
  - Use Stripe SDK for Python 3.12.
  - Store `stripeCustomerId` in `UserProfiles`.
  - Webhook endpoint deployed via API Gateway → Lambda; verify signature using Stripe secret.
  - Scheduled sync ensures resilience against missed webhooks.

- **NFT Marketplace**:
  - Identify API contract (REST/GraphQL). Prefer webhooks for real-time updates.
  - Store API credentials alongside other environment secrets; encrypt locally and bake into Lambda environment variables.
  - Rate-limit remote calls; use caching.

## Security & Compliance

- Authenticate via Babes Club JWTs signed by the existing identity service.
- Authorize actions using `userId` from token; disallow cross-user access.
- Encrypt rest data (DynamoDB default) and use KMS where needed.
- Secrets distributed via deployment pipeline as encrypted Lambda environment variables (rotate by redeploying with new values).
- Audit logs to CloudWatch (profile updates, sync anomalies).
- Input validation with Pydantic or small custom validators (avoid heavy dependencies).

## Operational Considerations

- **Infrastructure as Code**: Python to define API Gateway, Lambdas, DynamoDB tables, and IAM.
- **CI/CD**: Extend existing pipeline to deploy backend stack.
- **Monitoring**: CloudWatch metrics + alarms for Lambda errors, throttles, DynamoDB consumption.
- **Caching Strategy**: Use DynamoDB TTL only where necessary; prefer `lastSyncedAt` timestamps and simple freshness checks to avoid extra writes.
- **Rate Limits**: Handle Stripe API limits with exponential backoff; same for NFT marketplace.

## React Dashboard Components

1. [x] `DashboardRouteGuard`: ensures authentication (valid JWT) before rendering the dashboard stack.
2. [x] `DashboardDataProvider`: React context that wires API client calls, caching, and loading states for child components.
3. [x] `DashboardLayout`: shared layout with navigation, header, and slots for profile/orders/NFT views.
4. [x] `ProfileOverviewCard`: displays member info pulled from `/dashboard/profile`.
5. [x] `ProfileEditForm`: handles editing/saving profile fields with optimistic UI and validation.
6. [x] `OrderHistoryTable`: paginated table showing orders from `/dashboard/orders` with cursor controls.
7. [x] `OrderDetailDrawer`: slide-over or modal that surfaces `/dashboard/orders/{orderId}` details.
8. [x] `NFTHoldingsGrid`: gallery of NFTs sourced from `/dashboard/nfts`, supports refresh indicator.
9. [x] `DashboardErrorBoundary`: catches failures from API calls and shows fallback UI/retry.

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
5. **NFT Sync Pipeline**
   - Implement NFT ingestion + list endpoint.
6. **Admin Tools & Monitoring**
   - Add manual sync triggers, metrics, dashboards.
7. **QA & Load Test**
   - Run integration tests, test sync failure scenarios.
8. **Docs & Hand-off**
   - Document API contracts, IAM roles, deployment steps.

## Implementation Checklist

1. Capture Babes Club JWT signing secret and Stripe/NFT credentials, encrypt, and wire into deploy pipeline for Lambda env vars.
2. Draft DynamoDB table definitions (`UserProfiles`, `OrderSnapshots`, `NFTOwnership`) with throughput settings and required GSIs.
3. Bootstrap IaC project (SAM or CDK) that provisions API Gateway routes, core Lambdas, and DynamoDB tables.
4. Build `auth_authorizer` Lambda and integrate it with API Gateway routes; verify JWT validation locally.
5. Implement `get_profile` and `update_profile` Lambdas with validation and DynamoDB access layer; add unit tests.
6. Implement order-related Lambdas (`list_orders`, `get_order_detail`, webhook handler, nightly sync) and connect to Stripe API.
7. Implement NFT-related Lambdas (`list_nfts`, `nft_sync`) and connect to marketplace API/polling job.
8. Set up CloudWatch metrics, structured logging, and alarms for each Lambda; ensure audit events capture profile updates.
9. Expose internal sync endpoints with hardened auth (shared internal token) and document usage.
10. Build React dashboard components listed above, wiring them to the API via context hooks and adding optimistic refresh behavior.

## Open Questions

- What authentication system is currently in place (details about the custom JWT issuer and signing keys)?
- Do we have access to an NFT marketplace webhook, or will polling be required?
- Desired data freshness windows for orders and NFTs?
- Should order data include line-item fulfillment details (e.g., shipping status)?
