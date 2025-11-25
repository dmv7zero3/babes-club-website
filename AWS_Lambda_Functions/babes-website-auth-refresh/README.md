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
