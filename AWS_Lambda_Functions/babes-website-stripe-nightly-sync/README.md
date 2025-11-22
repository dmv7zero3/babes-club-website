# babes-website-stripe-nightly-sync

Scheduled Lambda that will reconcile Stripe checkout sessions/payment intents nightly to keep DynamoDB order snapshots accurate. It complements the real-time webhook and manual sync endpoints.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: EventBridge schedule rule (e.g., every 6 hours).
- **Behavior**: Iterate recent Stripe activity, compare against DynamoDB, write any missing snapshots, and log summary metrics.

## Environment variables

| Name                      | Required | Purpose                                     |
| ------------------------- | -------- | ------------------------------------------- |
| `COMMERCE_TABLE`          | ✅       | Order snapshot table.                       |
| `STRIPE_SECRET_PARAMETER` | ✅       | Parameter Store name for Stripe secret key. |
| `SYNC_LOOKBACK_HOURS`     | ➕       | How far back to reconcile each run.         |

## TODO

1. Wire Stripe pagination + rate limiting.
2. Implement idempotent writes to DynamoDB.
3. Emit CloudWatch metrics for processed orders, failures, and latency.
