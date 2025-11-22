# babes-website-dashboard-get-order

Placeholder Lambda to fetch a single order summary for the dashboard detail drawer.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: API Gateway REST path `/dashboard/orders/{orderId}` with JWT auth.
- **Path params**: `orderId` (from API Gateway mapping template).
- **Response**: Order payload containing items, totals, Stripe metadata.

## Environment variables

| Name             | Required | Purpose                                 |
| ---------------- | -------- | --------------------------------------- |
| `COMMERCE_TABLE` | ✅       | DynamoDB table storing order snapshots. |

## TODO

1. Query the single-table layout (`PK=USER#<id>`, `SK=ORDER#<timestamp>#<orderId>`).
2. On cache miss, invoke Stripe API, persist snapshot, and return data.
3. Implement authorization to prevent cross-user access.
