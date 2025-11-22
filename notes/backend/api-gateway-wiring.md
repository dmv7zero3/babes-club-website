# API Gateway Wiring Cheat Sheet

Once the Lambda bundles are uploaded (`cart-quote`, `checkout-create-session`), wire them into REST API `a2fps4r1la` like so.

> Replace `${ACCOUNT_ID}` with your AWS account number and `${REGION}` with the deployment region (currently `us-east-1`).

## 1. Create `/cart` and `/checkout` resources

```bash
aws apigateway create-resource \
  --rest-api-id a2fps4r1la \
  --parent-id veuq5gli98 \
  --path-part cart \
  --region us-east-1

aws apigateway create-resource \
  --rest-api-id a2fps4r1la \
  --parent-id veuq5gli98 \
  --path-part checkout \
  --region us-east-1
```

Note the resulting resource IDs (referred to as `cartResourceId` and `checkoutResourceId` below).

## 2. Attach `/cart/quote` (POST)

```bash
# create /quote under /cart
aws apigateway create-resource \
  --rest-api-id a2fps4r1la \
  --parent-id ${cartResourceId} \
  --path-part quote \
  --region us-east-1

# enable POST
aws apigateway put-method \
  --rest-api-id a2fps4r1la \
  --resource-id ${cartQuoteResourceId} \
  --http-method POST \
  --authorization-type NONE \
  --region us-east-1

# proxy integration to Lambda
aws apigateway put-integration \
  --rest-api-id a2fps4r1la \
  --resource-id ${cartQuoteResourceId} \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:${ACCOUNT_ID}:function:cart-quote/invocations"

# allow API Gateway to invoke Lambda
aws lambda add-permission \
  --function-name cart-quote \
  --statement-id cart-quote-apigateway \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:${ACCOUNT_ID}:a2fps4r1la/*/POST/cart/quote"
```

Repeat with an `OPTIONS` method using `MOCK` integration for CORS, or rely on the Lambda response headers (recommended: add an `OPTIONS` MOCK returning 200).

## 3. Attach `/checkout/create-session` (POST)

```bash
aws apigateway create-resource \
  --rest-api-id a2fps4r1la \
  --parent-id ${checkoutResourceId} \
  --path-part create-session \
  --region us-east-1

aws apigateway put-method \
  --rest-api-id a2fps4r1la \
  --resource-id ${checkoutCreateResourceId} \
  --http-method POST \
  --authorization-type NONE \
  --region us-east-1

aws apigateway put-integration \
  --rest-api-id a2fps4r1la \
  --resource-id ${checkoutCreateResourceId} \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:${ACCOUNT_ID}:function:checkout-create-session/invocations"

aws lambda add-permission \
  --function-name checkout-create-session \
  --statement-id checkout-create-session-apigateway \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:${ACCOUNT_ID}:a2fps4r1la/*/POST/checkout/create-session"
```

## 4. Redeploy `PROD`

```bash
aws apigateway create-deployment \
  --rest-api-id a2fps4r1la \
  --stage-name PROD \
  --description "Wire cart + checkout endpoints"
```

## 5. Smoke test

```bash
curl --request POST \
  https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/cart/quote \
  --header 'Content-Type: application/json' \
  --data '{"items":[{"collectionId":"necklaces","variantId":"necklace-bright-red","qty":1}]}'
```

Expect HTTP 200 with `quoteSignature`, then POST to `/checkout/create-session` with the same `items` plus the returned signature and redirect URLs.
