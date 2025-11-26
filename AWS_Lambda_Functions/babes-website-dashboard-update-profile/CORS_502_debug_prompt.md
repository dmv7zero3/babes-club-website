# AWS Lambda + API Gateway CORS/502 Debugging Prompt

## Problem Statement

I have an AWS Lambda function (Python 3.12) behind API Gateway, handling POST requests to `/dashboard/update-profile`. The Lambda logs show successful invocation, correct parsing, DynamoDB access, and no errors. However, my frontend receives CORS errors and/or a 502 Bad Gateway, and the browser console reports:

```
Access to XMLHttpRequest at 'https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/update-profile' from origin 'http://localhost:3001' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

The Lambda code always returns CORS headers via a `_response()` helper, and the API Gateway POST and OPTIONS methods are configured to allow CORS.

Here is a recent CloudWatch log excerpt for a POST request (no errors, normal flow):

```
[INFO] LAMBDA INVOCATION START
[INFO] HTTP Method: POST
[INFO] Path: /dashboard/update-profile
[INFO] Connected to table: babesclub-commerce
[INFO] Fetching profile for USER#510c747cacb54bcea7127d3fd7e40e30
[INFO] Found existing profile with keys: [...]
```

But the frontend still gets a CORS error or 502.

## Additional Context

- Lambda always returns CORS headers in all responses (success and error).
- API Gateway is set up with AWS_PROXY integration for POST, MOCK for OPTIONS.
- No errors in Lambda logs, but frontend gets CORS error or 502.
- The request includes a valid JWT and all required headers.

## Request

**What could cause this? What steps should I take to debug and fix it? Please provide a solution.**

---

_This markdown file is intended for use as a prompt for another LLM to diagnose and solve the issue._
