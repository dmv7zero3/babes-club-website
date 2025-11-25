# Debugging API Gateway 403 Errors on Profile Update

This guide documents the steps to debug and resolve repeated 403 Forbidden errors when updating the user profile via the Babes Club API Gateway and Lambda stack.

---

## 1. Problem Summary

- First profile update works (Lambda logs: 200 OK).
- Subsequent updates from the frontend return 403 Forbidden.
- Lambda logs show only the successful invocation; failed requests do not reach Lambda.
- Frontend sends correct JWT and headers, but receives 403 from API Gateway.

---

## 7. Latest Findings (Nov 24, 2025)

- CloudWatch logs from the Lambda authorizer show: `JWT not valid or expired` for failing requests.
- The authorizer is rejecting the JWT and returning a deny policy, causing API Gateway to respond with 403 Forbidden.
- The Lambda execution role and API Gateway resource policy do **not** contain explicit deny statements.
- The root cause is the JWT being invalid or expired at the time of the request.

---

## 8. Next Steps (Action Items)

### Immediate Troubleshooting Checklist

**[ ] 1. Verify Integration Response Mapping**

- Run the AWS CLI command to update integration response for POST `/dashboard/update-profile`:
  ```sh
  aws apigateway update-integration-response --rest-api-id a2fps4r1la --resource-id ps54hw --http-method POST --status-code 200 --patch-operations '[{"op":"add","path":"/responseParameters/method.response.header.Access-Control-Allow-Origin","value":"'\'*'\'"},{"op":"add","path":"/responseParameters/method.response.header.Access-Control-Allow-Headers","value":"'\'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\'"},{"op":"add","path":"/responseParameters/method.response.header.Access-Control-Allow-Methods","value":"'\'POST,OPTIONS'\'"}]' --region us-east-1
  ```
- Confirm no errors and that mapping expressions are accepted.

**[ ] 2. Redeploy API Gateway**

- Run:
  ```sh
  aws apigateway create-deployment --rest-api-id a2fps4r1la --stage-name PROD --region us-east-1
  ```
- Confirm deployment completes successfully.

**[ ] 3. Test with cURL and Frontend**

- Use cURL to send a POST request with a valid JWT:
  ```sh
  curl -X POST https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/update-profile \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{"displayName": "Test", "email": "test@example.com"}'
  ```
- Inspect response headers for CORS and status code.
- Retest the frontend profile update flow and check for CORS errors or 403 responses.

**[ ] 4. Decode and Inspect JWT**

- Use [jwt.io](https://jwt.io/) or a local script to decode the JWT from a failing request.
- Check the `exp` claim and confirm it is in the future (not expired).
- Confirm the claims (userId, email, etc.) are correct.

**[ ] 5. Frontend Token Handling**

- Ensure the frontend is not using a stale or expired token after the first request.
- If the user logs in again, the token should be refreshed and used for all requests.

**[ ] 6. Authorizer Logic**

- Review the Lambda authorizer code to confirm it only denies when the JWT is truly invalid or expired.
- Add logging to capture why a token is rejected (e.g., expired, bad signature, missing claims).

**[ ] 7. Enable API Gateway Logs**

- Turn on detailed CloudWatch logging for API Gateway if not already enabled.
- Check logs for rejected requests and authorizer errors.

**[ ] 8. Document Findings**

- Update this file with results from each step above, including CLI output, decoded JWTs, and log findings.

---

## 9. Summary

- The 403 error is caused by the Lambda authorizer rejecting an invalid or expired JWT.
- Fixing frontend token refresh logic and confirming authorizer validation should resolve the issue.

Update this file as you complete each action item and retest the flow.

---

## 2. Likely Causes

- **JWT Expiry or Invalidity:** The JWT may be expired or malformed.
- **Authorizer Caching Issues:** API Gateway custom authorizer may cache results, causing stale or mismatched context.
- **Frontend Token Handling:** The frontend may be sending an old or invalid JWT after the first request.
- **API Gateway Configuration:** CORS, authorizer, or method settings may block requests before Lambda invocation.

---

## 3. Debugging Steps

### A. Decode and Inspect JWT

- Extract the JWT from the failing request.
- Decode the JWT (use [jwt.io](https://jwt.io/) or `jwt.decode()` in Python).
- Check the `exp` (expiry) and `userId` claims.
- Confirm the token is valid and not expired.

### B. Check API Gateway Authorizer Settings

- In AWS Console or CLI, inspect the authorizer for `/dashboard/update-profile`.
- Verify cache TTL (set to 0 for debugging).
- Ensure context mapping is correct.
- Confirm the authorizer is set to CUSTOM and points to the correct Lambda.

### C. Review Frontend Token Usage

- Ensure the frontend updates the JWT after login/signup.
- Confirm the token used in the request matches the current authenticated user.
- Add debug logging to print the JWT before each request.

### D. Enable API Gateway Logs

- Turn on detailed CloudWatch logging for API Gateway.
- Check logs for rejected requests and authorizer errors.

### E. Test with cURL

- Use cURL to send repeated profile update requests with the same JWT.
- Compare results to frontend behavior.

---

## 4. Remediation Steps

- If JWT is expired, refresh or re-authenticate in the frontend.
- If authorizer cache is causing issues, set cache TTL to 0 and retest.
- If frontend is sending stale tokens, fix token refresh logic.
- If API Gateway config is incorrect, update method/authorizer settings.

---

## 5. Next Actions

1. Decode the JWT from a failing request and check expiry.
2. Inspect API Gateway authorizer cache settings.
3. Add debug logging to frontend to print JWT before each request.
4. Enable API Gateway logs and review for errors.
5. Test repeated updates with cURL using the same JWT.
6. Document findings and update this file with results.

---

## 6. References

- [API Gateway Lambda Authorizer Docs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [JWT Debugging](https://jwt.io/)
- [CloudWatch Logging for API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-logging.html)

---

---

## 10. AWS Best-Practice & Troubleshooting Summary

### API Gateway CORS Configuration (REST APIs with Lambda Proxy & Custom Authorizers)

- Always define an explicit OPTIONS method for every route, returning CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`).
- For Lambda proxy integration, ensure your Lambda returns a `statusCode`, a JSON string `body`, and a `headers` object with CORS headers.
- In API Gateway, declare method response headers and map them in integration responses. Use static values wrapped in single quotes.
- Set OPTIONS method `authorizationType` to NONE so pre-flight requests are unauthenticated.

### Custom Authorizer & JWT Handling

- Authorizer is not invoked for OPTIONS (pre-flight), but is for all other methods.
- Set `authorizerResultTtlInSeconds` to a low value for debugging, and flush cache after permission changes.
- Log all JWT validation failures in the authorizer and return clear error context.
- Decode JWTs from failing requests and check `exp`, `aud`, and `iss` claims.
- Ensure frontend always uses a fresh, valid token after login/signup.

### API Gateway Deployment & Logging

- After any config change, always redeploy the API and verify the correct stage is live.
- Use CloudWatch execution logs to trace 403 errors and header mapping issues.

### SPA Deployment (React + S3/CloudFront)

- Use CloudFront with OAC/OAI for S3 bucket security.
- Configure error responses to serve `index.html` for unknown routes.
- Set aggressive cache headers for static assets, and `must-revalidate` for `index.html`.

### Stripe Integration

- Store Stripe secrets in AWS Secrets Manager.
- Use SQS for webhook decoupling and idempotency checks in DynamoDB.
- Cache Stripe API results to reduce latency and cost.

### TLS & Security

- Consider enabling STRICT endpoint access mode and hardened TLS policies for API Gateway.
- Enforce HTTPS everywhere and set security headers via CloudFront or Lambda@Edge.

### Common Pitfalls & Solutions

- For CORS errors: Check OPTIONS method, header spelling, and mapping.
- For 403 errors: Check authorizer logic, JWT validity, resource policies, and deployment status.
- For header mapping: Ensure method response headers are declared and mapped in integration response.

---

Refer to this summary for ongoing troubleshooting and architecture improvements.
