# babes-website-cart-quote Lambda

Rebuilt Babylon's "cart quote" Lambda using the shared commerce layer. This function validates a cart payload, writes quote records to DynamoDB, and returns a signed response that expires after a configured TTL.

## Handler contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Request**: `POST` events (API Gateway/Lambda URL) with JSON body:
  ```json
  {
    "items": [
      {
        "collectionId": "string",
        "variantId": "string",
        "qty": 1,
        "price": 123.45
      }
    ],
    "subtotal": 456.78,
    "currency": "CAD"
  }
  ```
- **Success response**: `200` with `quoteId`, `quoteSignature`, `quoteHash`, `expiresAt`, `lineItems`, and a `summary` block (item count, subtotal, currency).
- **Failure responses**:
  - `400` for malformed payloads
  - `405` for non-POST methods
  - `500` for unexpected errors (logged for CloudWatch)

## Environment variables

| Name                               | Required        | Notes                                                                                                                                   |
| ---------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `COMMERCE_TABLE`                   | ✅              | DynamoDB table holding quotes (`babesclub-commerce`).                                                                                   |
| `QUOTE_SIGNATURE_SECRET_PARAMETER` | ✅              | SecureString parameter name in AWS Systems Manager Parameter Store (Standard tier). The function loads and caches the value at runtime. |
| `QUOTE_SIGNATURE_SECRET`           | ➕              | Optional override used for local development or manual deployments. If set, it takes precedence over the Parameter Store value.         |
| `QUOTE_TTL_MINUTES`                | ⛔️ (default 5) | Override shared constant if business rules change.                                                                                      |
| `CORS_ALLOW_ORIGIN`                | ➕              | Optional; if present, added to the response headers.                                                                                    |

## Local development notes

The Lambda imports shared helpers from the deployed layer. For local executions, set `PYTHONPATH` to include `AWS_Lambda_Functions/shared_layers/commerce/python` before running the handler, e.g.:

```bash
PYTHONPATH="AWS_Lambda_Functions/shared_layers/commerce/python:$PYTHONPATH" \
  python AWS_Lambda_Functions/babes-website-cart-quote/lambda_function.py
```

## Secret management via SSM Parameter Store

1. Provision the parameters (one SecureString, one plain String) using the helper script:
   ```bash
   python scripts/Stripe/provision_stripe_parameters.py \
     --secret-value "REPLACE_WITH_STRIPE_SECRET" \
     --publishable-value "REPLACE_WITH_STRIPE_PUBLISHABLE"
   ```
   The script defaults to storing values at `/marketbrewer/babes-club/stripe/secret` (SecureString) and `/marketbrewer/babes-club/stripe/publishable` (String). Re-run with real production keys when ready.
2. Attach an IAM policy to the Lambda execution role allowing read access:
   ```json
   {
     "Effect": "Allow",
     "Action": "ssm:GetParameter",
     "Resource": [
       "arn:aws:ssm:us-east-1:${ACCOUNT_ID}:parameter/marketbrewer/babes-club/stripe/secret"
     ]
   }
   ```
   Include the publishable parameter ARN if you need to reference it server-side.
3. During deployment, set the Lambda environment variable `QUOTE_SIGNATURE_SECRET_PARAMETER` to that parameter name (e.g. `/marketbrewer/babes-club/stripe/secret`). CloudFormation example:
   ```yaml
   Environment:
     Variables:
       QUOTE_SIGNATURE_SECRET_PARAMETER: "/marketbrewer/babes-club/stripe/secret"
   ```
4. For local testing, either export `QUOTE_SIGNATURE_SECRET` directly or configure AWS credentials so the function can fetch from SSM.

## Local smoke test

1. Activate the Python venv for this repo: `source ../../shine-venv/bin/activate`.
2. From the repo root, run:
   ```bash
   python - <<'PY'
   import json, importlib.util, pathlib
   module_path = pathlib.Path('AWS_Lambda_Functions/babes-website-cart-quote/lambda_function.py')
   spec = importlib.util.spec_from_file_location('lambda_function', module_path)
   module = importlib.util.module_from_spec(spec)
   spec.loader.exec_module(module)
   event = {
       "httpMethod": "POST",
       "body": json.dumps({
           "items": [{"collectionId": "col1", "variantId": "var1", "qty": 2, "price": 19.99}],
           "subtotal": 39.98,
           "currency": "CAD"
       })
   }
   print(module.lambda_handler(event, None))
   PY
   ```
3. Expect `statusCode: 200` with a JSON body containing quote metadata and signature.

## Packaging

```bash
cd AWS_Lambda_Functions/babes-website-cart-quote
zip -r ../../dist/babes-website-cart-quote.zip .
```

Once the commerce layer is published:

1. Remove the `sys.path` manipulation in `lambda_function.py`.
2. Update the Lambda configuration to include the new layer ARN.
3. Rebuild the deployment ZIP to keep handlers lean.

## Next steps

- Publish `shared_layers/commerce` as `marketbrewer-commerce-core`.
- Update other babes-website Lambdas (checkout session, Stripe webhook) to depend on the layer.
- Document rollout steps in `config/deploy*.json` and client-specific instructions.
