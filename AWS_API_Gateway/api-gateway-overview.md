# Babes Club API Gateway Overview

## API Gateway Structure

- **API Name:** The Babes Club
- **API ID:** a2fps4r1la
- **Stage:** PROD
- **Custom Domain:** api.thebabesclub.com
- **Main Endpoints:**
  - `/cart/quote` (POST, OPTIONS)
  - `/dashboard/update-profile` (POST, OPTIONS)
  - `/auth/login`, `/auth/signup`, etc.

## Authentication & Authorization

- **Authorization Type:**
  - Most endpoints use a CUSTOM Lambda authorizer.
  - The authorizer validates tokens or custom headers (e.g., `X-Api-Gateway-Key` for cart quote).
- **Lambda Authorizer:**
  - Receives the token/header from the request.
  - Validates against SSM Parameter Store or other logic.
  - Returns IAM policy to allow/deny request.
- **Frontend:**
  - Must send a valid `Authorization` header (JWT or session token) for protected endpoints.
  - For `/cart/quote`, CloudFront injects `X-Api-Gateway-Key`.

## CORS

- All endpoints must return CORS headers:
  - `Access-Control-Allow-Origin: *` (or production domains)
  - `Access-Control-Allow-Headers: Content-Type,Authorization`
  - `Access-Control-Allow-Methods: POST,OPTIONS`
- OPTIONS method is configured as MOCK with CORS headers.
- POST method must return CORS headers in all Lambda responses.

## API Gateway Integration

- **Integration Type:** AWS_PROXY (Lambda Proxy Integration)
- **Lambda Functions:**
  - `/cart/quote` → `babes-website-cart-quote`
  - `/dashboard/update-profile` → `babes-website-dashboard-update-profile`
  - etc.
- **Resource Policy:**
  - Restricts direct access to API Gateway except via CloudFront (for `/cart/quote`).

## Deployment & Security

- ACM certificate for custom domain.
- Route 53 alias for domain.
- CloudFront forwards requests to API Gateway, injects custom header for `/cart/quote`.
- Lambda authorizer blocks direct access without secret header.
- Environment variables set for CORS, secrets, etc.
- CloudWatch alarms for errors and 4XX/5XX responses.

## Example Request Flow

1. **Frontend** sends POST to `https://thebabesclub.com/dashboard/update-profile`.
2. **CloudFront** routes to API Gateway custom domain.
3. **API Gateway** triggers Lambda authorizer, validates token.
4. **Lambda** executes, returns response with CORS headers.
5. **Frontend** receives response.

## References

- See `cart-quote-api-guide.md` for detailed cart quote setup.
- See `structure.md` for resource/method mapping.
- See `notes.md` for troubleshooting and operational notes.
