# AWS_Lambda_Functions Folder Overview

This folder contains all Python handler code and supporting modules for AWS Lambda functions powering the Babes Club backend APIs. Each subdirectory represents a distinct Lambda function or integration point, mapped to an API Gateway route or backend job. The folder structure and packaging conventions ensure that each Lambda is self-contained, easily deployable, and can be updated independently.

**How it works:**

- Each subfolder (e.g., `cart-quote/`, `checkout-create-session/`, `stripe-webhook/`) contains the code for a single Lambda function, including its main handler (usually `app.py` or `lambda_function.py`) and any required helper modules.
- Shared business logic (such as DynamoDB access, JWT utilities, CORS handling) is either copied into each handler directory or provided via a Lambda Layer for code reuse and consistency.
- When deploying, each handler directory is zipped and uploaded to AWS Lambda as the function code. The deployment process ensures only the necessary files are included, and dependencies are bundled if needed.
- After uploading new code, the corresponding API Gateway stage is redeployed to activate the latest Lambda integration for frontend and external clients.
- Environment variables and IAM permissions are managed per Lambda, allowing secure access to resources like DynamoDB, Stripe, and email providers.
- This folder is the canonical source for all backend logic exposed via the Babes Club API, including authentication, cart quoting, checkout, Stripe webhooks, and future integrations.

See below for specific handler descriptions, environment variable requirements, and deployment instructions.

# AWS Lambda Handlers

Python 3.12 Lambda handlers that back the cart quote, checkout session, and Stripe webhook APIs.

| Function                  | Path                              | Description                                                                                               |
| ------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `cart-quote`              | `/cart/quote` (POST)              | Normalizes cart items, writes a signed quote record to DynamoDB, and returns quote metadata.              |
| `checkout-create-session` | `/checkout/create-session` (POST) | Verifies a quote signature, creates a Stripe Checkout session, and persists the mapping in DynamoDB.      |
| `stripe-webhook`          | `/stripe/webhook` (POST)          | Verifies Stripe webhook signatures, updates session records, and records idempotency markers in DynamoDB. |

## Environment Variables

| Name                                                          | Required        | Purpose                                                                                   |
| ------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| `COMMERCE_TABLE`                                              | ✅              | DynamoDB table containing cart quotes, sessions, events, and rate-limit windows.          |
| `CORS_ALLOW_ORIGIN`                                           | ➖              | Overrides `Access-Control-Allow-Origin` response header (defaults to `*`).                |
| `QUOTE_SIGNATURE_SECRET` / `QUOTE_SIGNATURE_SECRET_PARAMETER` | ➖              | Secret used when signing cart quotes (direct value or SSM parameter).                     |
| `STRIPE_SECRET` / `STRIPE_SECRET_PARAMETER`                   | ✅ for checkout | Stripe API secret (direct value or SSM parameter) for creating checkout sessions.         |
| `STRIPE_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET_PARAMETER`   | ✅ for webhook  | Stripe webhook signing secret (direct value or SSM parameter) used to verify events.      |
| `QUOTE_TTL_MINUTES`                                           | ➖              | Minutes before cached quotes expire (default: 15).                                        |
| `SESSION_TTL_MINUTES`                                         | ➖              | Minutes before session records expire (default: 1440).                                    |
| `EVENT_TTL_DAYS`                                              | ➖              | Days before webhook event idempotency records expire (default: 90).                       |
| `CHECKOUT_SUCCESS_URL`                                        | ➖              | Default success redirect passed to Stripe (supports `{CHECKOUT_SESSION_ID}` placeholder). |
| `CHECKOUT_CANCEL_URL`                                         | ➖              | Default cancel redirect passed to Stripe when a session is abandoned.                     |
| `CHECKOUT_MODE`                                               | ➖              | Stripe Checkout mode (`payment`, `subscription`, or `setup`; default `payment`).          |
| `CHECKOUT_ALLOW_PROMOTION_CODES`                              | ➖              | Enables promotion codes by default when set truthy (`true`, `1`, etc.).                   |
| `CHECKOUT_AUTOMATIC_TAX`                                      | ➖              | Enables automatic tax calculation when set truthy.                                        |
| `STRIPE_WEBHOOK_TOLERANCE`                                    | ➖              | Seconds allowed for webhook signature tolerance (default: 300).                           |

## Packaging Notes

1. Ensure each handler directory (`cart-quote/`, `checkout-create-session/`, `stripe-webhook/`) contains its `app.py` file.
2. If you share helper modules, copy them into the handler directory before zipping (Lambda does not resolve shared paths automatically).
3. Bundle dependencies only if you add third-party libraries—`boto3` ships with the Lambda runtime.
4. Create the deployment zip:

```bash
(cd AWS_Lambda_Functions/cart-quote && zip -r ../../dist/cart-quote.zip .)
```

5. Upload or update the Lambda function code. Example:

```bash
aws lambda update-function-code \
  --function-name babes-cart-quote \
  --zip-file fileb://dist/cart-quote.zip
```

6. After deploying new code, redeploy the API Gateway stage so the latest integration is live:

```bash
aws apigateway create-deployment \
  --rest-api-id a2fps4r1la \
  --stage-name prod
```

## IAM permissions

Each Lambda needs permission to interact with the single DynamoDB table:

- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:Query`
- `dynamodb:BatchWriteItem`

Scope the resource ARN to the specific table (`arn:aws:dynamodb:<region>:<account-id>:table/babesclub-commerce`) for least privilege.

## Follow-ups

- Wire Stripe API calls into the checkout/session Lambda when ready (currently a stub response).
- Add `/checkout/status` handler to surface session progress to the frontend.
- Integrate SES/Postmark to emit order notifications after successful payment.
