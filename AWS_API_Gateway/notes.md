# API Gateway Notes

- See `api-gateway-overview.md` for a summary of endpoint structure and auth.
- If you encounter CORS or 403 errors, verify:
  - Lambda responses always include CORS headers for all status codes.
  - API Gateway method response and integration response mappings are set for CORS.
  - The frontend sends a valid Authorization header for protected endpoints.
  - The Lambda authorizer is correctly validating tokens or custom headers.
