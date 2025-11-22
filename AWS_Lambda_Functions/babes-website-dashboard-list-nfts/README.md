# babes-website-dashboard-list-nfts

Placeholder Lambda that will surface a member's NFT holdings on the dashboard. Final implementation will read from the shared DynamoDB table where NFT ownership snapshots live under `PK=USER#<id>` and `SK=NFT#<collection>#<tokenId>`.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: API Gateway path `/dashboard/nfts` (GET) requiring JWT auth.
- **Response**: Array of NFT metadata objects with `tokenId`, `collectionId`, imagery, and `lastSyncedAt`.

## Environment variables

| Name                | Required | Purpose                                   |
| ------------------- | -------- | ----------------------------------------- |
| `COMMERCE_TABLE`    | ✅       | DynamoDB table storing NFT snapshots.     |
| `NFT_STALE_SECONDS` | ➕       | Optional freshness window before re-sync. |

## TODO

1. Add DynamoDB query + optional refresh trigger.
2. Surface pagination if holdings exceed the base page size.
3. Include caching headers or ETags if needed by the frontend.
