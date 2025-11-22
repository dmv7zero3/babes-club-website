# babes-website-dashboard-get-profile

Lightweight Lambda placeholder for the authenticated dashboard profile "GET" endpoint. This function will eventually read the consolidated DynamoDB table (`babesclub-commerce`) and return the member profile, Stripe customer linkage, and dashboard preferences referenced in `notes/UserDashboardBackendPlan.md`.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Event source**: API Gateway REST path `/dashboard/profile` (GET) protected by the Babes Club JWT authorizer.
- **Response**: `200` with the member profile payload. The placeholder currently returns a mock payload until the data layer is attached.

## Environment variables

| Name                | Required | Purpose                                                 |
| ------------------- | -------- | ------------------------------------------------------- |
| `COMMERCE_TABLE`    | ✅       | DynamoDB table holding user profile records.            |
| `CORS_ALLOW_ORIGIN` | ➕       | Optional comma-delimited list of origins for responses. |

## Next steps

1. Wire the JWT authorizer (see `babes-website-auth-authorizer`).
2. Replace the placeholder body with real DynamoDB lookups and validation.
3. Add structured logging + metrics per the dashboard backend plan.
