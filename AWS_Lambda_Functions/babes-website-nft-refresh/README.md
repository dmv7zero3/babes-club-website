# babes-website-nft-refresh

Scheduled Lambda to refresh NFT ownership snapshots for all active members. Complements the manual `/internal/sync/nfts` endpoint and ensures dashboard data stays current even if marketplace webhooks are delayed.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: EventBridge schedule (e.g., hourly) or ad-hoc trigger.
- **Behavior**: Iterate recently active wallets, call the NFT API, write deltas to DynamoDB, and emit metrics.

## Environment variables

| Name                    | Required | Purpose                                      |
| ----------------------- | -------- | -------------------------------------------- |
| `COMMERCE_TABLE`        | ✅       | NFT snapshot store.                          |
| `NFT_API_BASE_URL`      | ✅       | Marketplace API endpoint.                    |
| `NFT_API_KEY_PARAMETER` | ✅       | Parameter Store entry for credentials.       |
| `BATCH_SIZE`            | ➕       | Number of wallets to refresh per invocation. |

## TODO

1. Implement wallet batching + cursor storage.
2. Add retry/backoff when marketplace API throttles requests.
3. Ship structured logs/metrics for monitoring freshness.
