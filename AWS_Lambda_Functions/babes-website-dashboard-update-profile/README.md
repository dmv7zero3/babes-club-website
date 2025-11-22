# babes-website-dashboard-update-profile

Placeholder Lambda for handling authenticated profile updates from the React dashboard. It will validate incoming fields, persist changes to the consolidated DynamoDB table, and emit audit logs.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: API Gateway REST path `/dashboard/profile` (PUT) with JWT authorizer attached.
- **Request body**: Partial profile payload (name, email, shipping, wallet, avatar, etc.).
- **Response**: Updated profile document.

## Environment variables

| Name                | Required | Purpose                                                  |
| ------------------- | -------- | -------------------------------------------------------- |
| `COMMERCE_TABLE`    | ✅       | Table storing profile records.                           |
| `AUDIT_LOG_STREAM`  | ➕       | Optional log destination identifier for profile changes. |
| `CORS_ALLOW_ORIGIN` | ➕       | Optional CORS header list.                               |

## TODO

1. Add payload validation + field allowlist.
2. Connect to DynamoDB single-table schema (`PK=USER#<id>`, `SK=PROFILE`).
3. Emit structured metrics/logs for observability.
