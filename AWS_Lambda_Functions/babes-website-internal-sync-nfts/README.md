# babes-website-internal-sync-nfts

Admin/scheduled Lambda for forcing an NFT ownership refresh. It will call the marketplace API, reconcile holdings, and write snapshots to DynamoDB so the dashboard stays current.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event sources**:
  - API Gateway POST `/internal/sync/nfts` (manual refresh)
  - CloudWatch Events / EventBridge (scheduled refresh)
- **Request payload**: `userId` or `wallet` plus optional `collectionId` filter.

## Environment variables

| Name                    | Required | Purpose                                      |
| ----------------------- | -------- | -------------------------------------------- |
| `COMMERCE_TABLE`        | ✅       | NFT snapshot store.                          |
| `NFT_API_BASE_URL`      | ➕       | Marketplace API base URL.                    |
| `NFT_API_KEY_PARAMETER` | ➕       | Parameter Store secret for marketplace auth. |

## TODO

1. Wire marketplace API client + retry logic.
2. Implement dedupe semantics before writing to DynamoDB.
3. Surface sync summary in the response for support tooling.
