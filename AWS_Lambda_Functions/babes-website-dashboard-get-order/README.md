# Babes Club Dashboard Get Order Lambda

## Overview

This Lambda function fetches a single order detail for the authenticated user. It first queries DynamoDB for an order snapshot (`PK=USER#<userId>`, `SK=ORDER#<timestamp>#<orderId>`). If not found, it falls back to the Stripe API, normalizes the result, caches it in DynamoDB, and returns the order data.

---

## Handler Contract

- **Runtime:** Python 3.12
- **Entry Point:** `lambda_function.lambda_handler`
- **Event Source:** API Gateway REST path `/dashboard/orders/{orderId}` (GET) with JWT auth
- **Path Params:**
  - `orderId`: Stripe Checkout Session ID
- **Response:**
  ```json
  {
  	"order": {
  		"orderId": "cs_test_...",
  		"orderNumber": "BC-ABCDEFGH",
  		"status": "completed",
  		"amount": 3000,
  		"currency": "usd",
  		"createdAt": "2025-11-26T21:28:24.990Z",
  		"itemCount": 2,
  		"items": [ ... ],
  		"customerEmail": "user@example.com"
  	}
  }
  ```

---

## Environment Variables

| Name             | Required | Purpose                                 |
| ---------------- | -------- | --------------------------------------- |
| `COMMERCE_TABLE` | ✅       | DynamoDB table storing order snapshots. |
| `STRIPE_SECRET`  | ✅       | Stripe API secret for fallback queries. |

---

## Implementation Details

- Queries DynamoDB for order snapshot using user context and orderId.
- If not found, retrieves order from Stripe API, normalizes, and caches result.
- Handles CORS and preflight requests.
- Returns 401 if user is not authenticated.
- Returns 400 if orderId is missing.
- Returns 404 if order is not found in both sources.
- Prevents cross-user access by requiring matching userId.

---

## Example Usage

**Request:**

```
GET /dashboard/orders/cs_test_12345678
Authorization: Bearer <JWT>
```

**Response:**

```
{
	"order": { ... }
}
```

---

## Future Enhancements

- Add more detailed error messages and logging.
- Support additional Stripe event types and metadata.
- Emit metrics for observability.

---

**For questions or issues, contact the backend development team.**
