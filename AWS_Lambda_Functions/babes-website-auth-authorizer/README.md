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

1. Implement JWT verification (PyJWT or custom HMAC validation).
2. Populate context fields (userId, email, roles) for downstream Lambdas.
3. Add caching headers for API Gateway authorizer caching.
