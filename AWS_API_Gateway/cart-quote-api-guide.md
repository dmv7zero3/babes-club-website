# Cart Quote API Gateway Deployment Guide

## Why this API Gateway exists

The `/cart/quote` REST API is dedicated to the `babes-website-cart-quote` Lambda function. The gateway provides an HTTPS surface for the cart quote handler, while the Lambda stores quotes in DynamoDB and signs the payload using secrets from AWS Systems Manager Parameter Store. Because the API and the function are tightly coupled, we can harden the edge, document the deployment path, and keep the integration simple.

## Detailed setup

### 1. Prepare the DNS entry in Route 53

- Decide on the public hostname that will front the API, for example `api.thebabesclub.com` within the hosted zone `thebabesclub.com`.
- Confirm that an ACM certificate in **us-east-1** (the API Gateway region) covers that name (wildcard `*.thebabesclub.com` or the exact host). Request or import one if needed.
- Create (or reserve) an A-record alias in the `thebabesclub.com` hosted zone. Leave the alias target empty until the custom domain is created in API Gateway.

### 2. Bind the API Gateway to the custom domain

- In the API Gateway console (REST API), create a **Custom domain name** matching `api.thebabesclub.com` and attach the ACM certificate from the previous step.
- Add a base-path mapping that routes the empty path (`/`) or `/cart` as desired to the `PROD` stage of the REST API with ID `a2fps4r1la`.
- After creation, copy the “API Gateway domain name” (looks like `d-xyz123.execute-api.us-east-1.amazonaws.com`). Point the Route 53 alias created earlier to this target.

### 3. Update CloudFront to call the API securely

CloudFront becomes the single public entry point for both the marketing site and the cart quote API. The goal is to route `/cart/quote` requests to the API Gateway custom domain, while forwarding only the headers, body, and query data the Lambda actually needs. This keeps payloads intact for POST requests and lets us inject a shared-secret header that downstream policies can validate.

#### Useful AWS references

- Custom headers on origin requests let you tag traffic with a value like `X-Api-Gateway-Key` so that API Gateway or Lambda can confirm the request originated from your distribution.<sup>[AWS Docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/add-origin-custom-headers.html)</sup>
- Origin request policies dictate which viewer headers, cookies, query strings, and bodies CloudFront forwards to the origin.<sup>[AWS Docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-origin-requests.html)</sup>
- Managed policies such as `AllViewer` exist, but for this API we prefer a custom policy that whitelists only `Content-Type` (the Lambda still sees the injected secret because it is added as a CloudFront custom header, not via the viewer request path).<sup>[AWS Docs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-request-create-origin-request-policy.html)</sup>

#### Implementation walkthrough (replace placeholders before running)

1. **Add the API origin and custom header**

   ```bash
   aws cloudfront get-distribution-config \
   	 --id YOUR_DISTRIBUTION_ID > dist-config.json
   ```

   Edit `dist-config.json` to append an origin similar to:

   ```json
   {
     "Id": "APIGatewayCartQuote",
     "DomainName": "api.thebabesclub.com",
     "CustomOriginConfig": {
       "HTTPPort": 80,
       "HTTPSPort": 443,
       "OriginProtocolPolicy": "HTTPS_ONLY",
       "OriginSslProtocols": {
         "Items": ["TLSv1.2"],
         "Quantity": 1
       }
     },
     "CustomHeaders": {
       "Quantity": 1,
       "Items": [
         {
           "HeaderName": "X-Api-Gateway-Key",
           "HeaderValue": "REPLACE_ME_WITH_RANDOM_SECRET"
         }
       ]
     }
   }
   ```

   Update the distribution:

   ```bash
   aws cloudfront update-distribution \
   	 --id YOUR_DISTRIBUTION_ID \
   	 --if-match ETAG_FROM_GET_CALL \
   	 --distribution-config file://dist-config.json
   ```

2. **Create a tailored origin request policy**

   ```bash
   aws cloudfront create-origin-request-policy \
   --origin-request-policy-config '{
     "Name": "CartQuoteOriginRequestPolicyV2",
     "Comment": "Forward Content-Type for cart quote API",
     "HeadersConfig": {
       "HeaderBehavior": "whitelist",
       "Headers": {
         "Quantity": 1,
         "Items": ["Content-Type"]
       }
     },
     "CookiesConfig": {"CookieBehavior": "none"},
     "QueryStringsConfig": {"QueryStringBehavior": "none"}
   }'
   ```

   CloudFront rejects configurations that both forward a header from the viewer **and** inject the same header via `CustomHeaders`. Keeping the whitelist to just `Content-Type` avoids the conflict while still delivering POST payloads correctly. Capture the returned `OriginRequestPolicy.Id` (currently `0e599d8e-9f2a-48b6-ba34-0abded3d8cc8`) for the next step.

3. **Route `/cart/quote*` to the new origin**
   - Fetch the distribution config again, add (or update) a behaviour with `PathPattern` `cart/quote*`, `TargetOriginId` `APIGatewayCartQuote`, `ViewerProtocolPolicy` `HTTPS_ONLY`, and TTLs set to `0` to disable caching.

- Reference the origin request policy ID from the previous step (`0e599d8e-9f2a-48b6-ba34-0abded3d8cc8`) and either use the managed `Managed-CachingDisabled` cache policy (`413fdba3-...`) or another policy that keeps responses uncached.
- Save and re-run `aws cloudfront update-distribution ...` with the new config and ETag.

4. **Deploy and verify**
   - Wait for the CloudFront status to return to `Deployed` (usually within 15 minutes).
   - Invoke the site endpoint, e.g. `curl -X POST https://thebabesclub.com/cart/quote ...`, and confirm the Lambda sees the forwarded body and the injected `X-Api-Gateway-Key` header.
   - Latest validation (2025-10-06):
     ```bash
     curl -X POST https://www.thebabesclub.com/cart/quote \
       -H 'Content-Type: application/json' \
       -d '{"items":[{"sku":"ABC123","quantity":1,"price":10.0}],"subtotal":10.0,"currency":"CAD"}'
     ```
     Returned `HTTP/2 200` with a `quoteSignature` payload and `x-cache: Miss from cloudfront`.
   - Once validated, add the same header check inside your API resource policy or Lambda authoriser so that direct hits to `api.thebabesclub.com` without the secret are rejected.

### 4. Restrict direct internet access to the API

Use a lightweight Lambda authorizer so that only requests carrying the CloudFront-injected `X-Api-Gateway-Key` secret succeed. No AWS WAF is required.

1. **Store the shared secret in SSM Parameter Store**

   ```bash
   aws ssm put-parameter \
     --name "/commerce/cart-quote/api-gateway-key" \
     --type SecureString \
     --value "5e8642003c0f3d77994218a6f1ded42c" \
     --overwrite
   ```

2. **Package and deploy the authorizer Lambda**

   ```bash
   (cd AWS_Lambda_Functions/cart-quote-authorizer && zip -r ../../dist/cart-quote-authorizer.zip .)

   aws lambda create-function \
     --function-name babes-cart-quote-authorizer \
     --runtime python3.12 \
     --role arn:aws:iam::752567131183:role/babes-cart-quote-authorizer \
     --handler app.lambda_handler \
     --zip-file fileb://dist/cart-quote-authorizer.zip \
     --environment "Variables={API_KEY_PARAMETER=/commerce/cart-quote/api-gateway-key}"
   ```

   > Existing deployments can swap in `update-function-code` / `update-function-configuration` if the function already exists. The IAM role needs `ssm:GetParameter` for the parameter name above.

3. **Create (or update) the API Gateway authorizer**

   ```bash
   aws apigateway create-authorizer \
     --rest-api-id a2fps4r1la \
     --name CartQuoteHeaderAuthorizer \
     --type REQUEST \
     --authorizer-uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:752567131183:function:babes-cart-quote-authorizer/invocations" \
     --identity-source "method.request.header.X-Api-Gateway-Key"
   ```

   Reuse `update-authorizer` if the authorizer already exists. Grant API Gateway permission to call the Lambda:

   ```bash
   aws lambda add-permission \
     --function-name babes-cart-quote-authorizer \
     --statement-id apigateway-invoke \
     --action lambda:InvokeFunction \
     --principal apigateway.amazonaws.com \
     --source-arn "arn:aws:execute-api:us-east-1:752567131183:a2fps4r1la/*/POST/cart/quote"
   ```

4. **Attach the authorizer to the `/cart/quote` method**

   ```bash
   aws apigateway get-resources --rest-api-id a2fps4r1la --query "items[?path=='/cart/quote'].id" --output text

   aws apigateway update-method \
     --rest-api-id a2fps4r1la \
     --resource-id RESOURCE_ID_CART_QUOTE \
     --http-method POST \
     --patch-operations '[{"op":"replace","path":"/authorizationType","value":"CUSTOM"},{"op":"replace","path":"/authorizerId","value":"AUTHORIZER_ID"}]'
   ```

   Substitute `AUTHORIZER_ID` with the value returned by the authorizer creation command, and reuse the resource ID for the OPTIONS method if it should also require the header. Redeploy the `PROD` stage afterwards:

   ```bash
   aws apigateway create-deployment --rest-api-id a2fps4r1la --stage-name prod
   ```

With the authorizer in place, direct calls to `https://api.thebabesclub.com/cart/quote` without the secret header now return `401 Unauthorized`, while CloudFront traffic succeeds.

### 5. Align CORS and environment variables

- Set the `CORS_ALLOW_ORIGIN` (or `QUOTE_API_ALLOW_ORIGIN`) environment value for the Lambda to the exact production origins. Example command:

  ```bash
  aws lambda update-function-configuration \
    --function-name babes-cart-quote \
    --environment "Variables={CORS_ALLOW_ORIGIN=https://thebabesclub.com,https://www.thebabesclub.com,QUOTE_SIGNATURE_SECRET_PARAMETER=/commerce/cart-quote/signing-secret}"
  ```

  Update other variables in the same call to keep them in sync (Lambda overwrites the entire environment object).

- Run a fresh deployment so the Lambda picks up the logging and configuration changes:

  ```bash
  (cd AWS_Lambda_Functions/babes-website-cart-quote && zip -r ../../dist/babes-website-cart-quote.zip .)

  aws lambda update-function-code \
    --function-name babes-cart-quote \
    --zip-file fileb://dist/babes-website-cart-quote.zip
  ```

- The handler now logs only redacted metadata at DEBUG level (`cart-quote event (redacted)`), eliminating the temporary full-event logging.

### 6. Remove temporary logging

- Once validation is finished, delete or downgrade the temporary `logger.info("cart-quote event: ...")` call in `lambda_function.py` to avoid storing request bodies in CloudWatch.

### 7. Document and automate deploy commands

- Copy the helper env template and populate production values:

  ```bash
  cp config/deploy.cart-quote.env.example config/deploy.cart-quote.env
  # Edit the file with SNS topic ARN, optional EXTRA_LAYER_ARNS, etc.
  ```

- Use the deployment helper to publish the shared layer, refresh the Lambda, redeploy API Gateway, ensure alarms, and run smoke tests:

  ```bash
  scripts/cart-quote/deploy.sh full
  ```

  The script supports granular commands (`layer`, `function`, `layers-only`, `api`, `alarms`, `smoke`) if you need to run individual stages. See `scripts/cart-quote/README.md` for details.

### 8. Monitor the integration

- Create CloudWatch alarms on the Lambda’s `Errors` metric and on the API Gateway `4XXError`/`5XXError` metrics for the `PROD` stage. The deploy script can do this automatically:

  ```bash
  ALARM_TOPIC_ARN=arn:aws:sns:us-east-1:752567131183:alerts \
  scripts/cart-quote/deploy.sh alarms
  ```

  Thresholds: `Errors > 0` (single 5-minute period), `5XXError > 5`, `4XXError > 50`. All alarms treat missing data as not breaching and can optionally publish to the SNS topic supplied via `ALARM_TOPIC_ARN`.

- Enable execution logging at the API Gateway stage if not already on, but keep sampling minimal once stable to avoid excess noise.

## Quick checklist

- [x] ACM certificate for `api.thebabesclub.com` (arn:aws:acm:us-east-1:752567131183:certificate/976fe391-8da6-4884-9afd-3d1cf4329b80) issued and attached to the API Gateway custom domain.
- [x] Route 53 alias for `api.thebabesclub.com` pointing to `d-f08fcecmfg.execute-api.us-east-1.amazonaws.com` (hosted zone `Z1UJRXOUMOOFQ8`).
- [x] API Gateway custom domain + base-path mapping wired to REST API `a2fps4r1la` (stage `PROD`).
- [x] CloudFront origin/behaviour updated to forward `/cart/quote` to the API with required headers (`cart/quote*` → `api.thebabesclub.com-origin`, cache policy `4135ea2d-6df8-44a3-9df3-4b5a84be39ad`, origin request policy `0e599d8e-9f2a-48b6-ba34-0abded3d8cc8`).
- [x] Resource policy or authorizer in place to block direct public access (Lambda authorizer `babes-cart-quote-authorizer` validates `X-Api-Gateway-Key` against SSM `/commerce/cart-quote/api-gateway-key`).
- [x] Lambda CORS origin restricted to production domains, temporary logging removed, latest package deployed (env `CORS_ALLOW_ORIGIN` set to prod origins, sanitized logging deployed with `dist/babes-website-cart-quote.zip`).
- [x] Deployment commands scripted/documented and CloudWatch alarms configured (see `scripts/cart-quote/deploy.sh` and `scripts/cart-quote/README.md`; alarms managed via `scripts/cart-quote/deploy.sh alarms`).
