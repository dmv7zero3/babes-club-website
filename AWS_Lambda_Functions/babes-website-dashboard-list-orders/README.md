# babes-website-dashboard-list-orders

Placeholder Lambda for serving a member's recent orders to the React dashboard. The final version will query cached order snapshots keyed by `PK=USER#<id>` and `SK=ORDER#<timestamp>`.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: API Gateway REST path `/dashboard/orders` (GET) with JWT auth.
- **Query params**: `limit`, `cursor` for pagination.
- **Response**: `{ "orders": [...], "nextCursor": "..." }`.

## Environment variables

| Name              | Required | Purpose                                        |
| ----------------- | -------- | ---------------------------------------------- |
| `COMMERCE_TABLE`  | ✅       | Shared DynamoDB table housing order snapshots. |
| `ORDER_PAGE_SIZE` | ➕       | Default page size override.                    |

## TODO

1. Implement DynamoDB query with pagination tokens.
2. Trigger async refresh when cached data is older than target freshness.
3. Emit metrics (items returned, latency) for observability.
