# babes-website-internal-sync-stripe

Admin-only Lambda that will force-refresh Stripe order data for a member. It is called from the `/internal/sync/stripe` API route or a CLI tool when customer support needs immediate data consistency.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: API Gateway POST protected by an internal token/usage plan.
- **Request body**: `{ "userId": "...", "stripeCustomerId": "...", "since": "optional timestamp" }`.
- **Response**: Summary of refreshed orders or queued sync jobs.

## Environment variables

| Name                      | Required | Purpose                                               |
| ------------------------- | -------- | ----------------------------------------------------- |
| `COMMERCE_TABLE`          | ✅       | Destination for order snapshots.                      |
| `STRIPE_SECRET_PARAMETER` | ✅       | Parameter Store name for Stripe secret.               |
| `INTERNAL_TOKEN`          | ➕       | Optional shared secret to validate incoming requests. |

## TODO

1. Implement authentication/authorization guard.
2. Pull incremental orders from Stripe, write snapshots, and return a summary.
3. Emit structured logs for auditing support operations.
