# JWT Refresh Flow & Integration

## Backend

- **Login/Signup Lambdas** now issue both `accessToken` (short TTL, e.g. 1 hour) and `refreshToken` (long TTL, e.g. 30 days).
- **Refresh Lambda** (`/auth/refresh`) accepts a `refresh_token` in the request body and issues a new `accessToken` if valid.
- **Authorizer Cache**: API Gateway authorizer TTL is set to `0` (`authorizerResultTtlInSeconds: 0`) for immediate recognition of new tokens.

## Frontend

- **Session Storage**: Both tokens are stored in session/local storage after login/signup.
- **Reactive Refresh**: On any 401/403 response, the frontend automatically calls `/auth/refresh` with the stored refresh token. If successful, it updates the session and retries the original request. If refresh fails, the user is logged out.
- **No manual refresh needed**: Users stay logged in as long as their refresh token is valid.

## Testing

- Log in and confirm both tokens are present in storage.
- Wait for access token to expire, then trigger a protected API call. The frontend should refresh the token and keep the user logged in.
- If both tokens are expired/invalid, the user is logged out.

## Example Session Object

```json
{
  "token": "<accessToken>",
  "refreshToken": "<refreshToken>",
  "expiresAt": 1700000000,
  "user": {
    "userId": "...",
    "email": "...",
    "displayName": "..."
  },
  "storedAt": 1700000000
}
```

## API Endpoints

- `POST /auth/login` → returns `accessToken`, `refreshToken`, `user`
- `POST /auth/signup` → returns `accessToken`, `refreshToken`, `user`
- `POST /auth/refresh` → accepts `{ refresh_token }`, returns new `accessToken`, `user`

## Authorizer

- Lambda authorizer (`babes-website-auth-authorizer`) validates JWTs for all protected endpoints.
- API Gateway authorizer cache TTL is set to `0` for immediate effect of new tokens.

# /auth/refresh Lambda Function

This Lambda function powers the `/auth/refresh` API Gateway endpoint. It handles JWT refresh logic for the Babes Club website.

## Usage

- **Endpoint:** `POST /auth/refresh`
- **Request Body:**
  ```json
  {
    "refresh_token": "<your_refresh_token>"
  }
  ```
- **Response:**
  - `200 OK` with new `access_token` and user info
  - `400` for missing/invalid request
  - `401` for invalid refresh token
  - `500` for server errors

## Implementation

- Uses shared commerce layer utilities for environment, JWT validation, and token issuance.
- Validates the provided refresh token and issues a new access token if valid.

## Environment

- Requires the shared Lambda layer: `arn:aws:lambda:us-east-1:752567131183:layer:babesclub-shared-commerce:6`

## Example Request

```bash
curl -X POST https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/auth/refresh \
	-H "Content-Type: application/json" \
	-d '{"refresh_token": "<your_refresh_token>"}'
```
