# babes-website-auth-authorizer

Custom Lambda authorizer placeholder for validating Babes Club dashboard/internal API requests. The finished function will verify JWTs issued by the identity service and attach `userId`, roles, and other claims to the request context.

## Handler contract

**Runtime**: Python 3.12
**Entry point**: `lambda_function.lambda_handler`
**Type**: API Gateway TOKEN authorizer (REQUEST authorizer can be supported with header forwarding).
**Input**: `event['authorizationToken']` (for TOKEN authorizer). The token is expected in the format `Bearer <sessionId>` and is extracted/validated by the Lambda (the `Bearer` prefix is stripped automatically). If using REQUEST authorizer, the token may be forwarded in headers.
**Output**: IAM policy document containing `principalId`, `policyDocument`, and `context` map. The context always includes `userId` as a string, which is available to downstream Lambdas via `event['requestContext']['authorizer']['userId']`.

## Environment variables

| Name                        | Required | Purpose                                                     |
| --------------------------- | -------- | ----------------------------------------------------------- |
| `JWT_SIGNING_KEY_PARAMETER` | ✅       | Parameter Store name for the shared signing key/public key. |
| `ALLOWED_AUDIENCES`         | ➕       | Comma-delimited list of acceptable JWT `aud` claims.        |

## TODO

## Debugging & Logging

- The authorizer now includes detailed logging for:
  - JWT extraction and decoding
  - JWT payload, expiry (`exp`), and claims (`userId`, etc.)
  - Validation errors and reasons for Deny policies
  - Allow/Deny decisions with context

### Troubleshooting Steps

1. Check CloudWatch logs for `babes-website-auth-authorizer` for details on JWT validation failures.
2. Look for log entries:
   - `JWT payload: ...` (shows decoded claims)
   - `JWT exp: ...` (shows expiry)
   - `JWT verification error: ...` (shows validation errors)
   - `Authorizer returning Allow for userId: ...` (shows successful validation)
3. Use these logs to diagnose issues with token expiry, signature, or claim mismatches.

## TODO

1. Implement JWT verification (PyJWT or custom HMAC validation).
2. Populate context fields (userId, email, roles) for downstream Lambdas.
3. Add caching headers for API Gateway authorizer caching.
