# Debugging API Gateway 403 Forbidden on Profile Update

## Context

- API Gateway endpoint: `/dashboard/update-profile` (Resource ID: ps54hw)
- API Gateway ARN: `arn:aws:execute-api:us-east-1:752567131183:a2fps4r1la/*/POST/dashboard/update-profile`
- Error: `User is not authorized to access this resource because no identity-based policy allows the execute-api:Invoke action`
- Lambda authorizer is used for authentication (JWT-based)
- First profile update works, subsequent updates return 403 Forbidden
- Lambda logs show only successful requests; failed requests do not reach Lambda

## Prompt for LLM Research & Debugging

---

We are experiencing repeated 403 Forbidden errors when updating user profiles via our AWS API Gateway and Lambda stack. The first update works, but subsequent updates fail with a 403. The Lambda authorizer logs indicate the JWT is invalid or expired for failing requests. The frontend sends the correct JWT and headers, but receives a 403 from API Gateway. No explicit deny statements exist in the Lambda execution role or API Gateway resource policy.

**Please research and debug the following:**

1. What are the most common causes of 403 Forbidden errors in API Gateway with Lambda authorizers?
2. How does JWT expiry, authorizer caching, and frontend token refresh logic affect repeated requests?
3. What steps should we take to:
   - Decode and inspect JWTs from failing requests
   - Check and configure authorizer cache TTL
   - Ensure frontend always sends a fresh, valid token
   - Update API Gateway method and integration response mappings for CORS and authorization
   - Enable and interpret API Gateway and Lambda logs for debugging
4. What AWS CLI or Console steps are needed to update authorizer, resource policy, and redeploy API Gateway?
5. What best practices should we follow to avoid this issue in production?

**References:**

- API Gateway Lambda Authorizer Docs
- JWT Debugging
- CloudWatch Logging for API Gateway

---

Please provide a step-by-step troubleshooting and remediation guide, including CLI commands and configuration examples, to resolve this issue and prevent it in the future.
