# Babes Club Dashboard List Orders Lambda

## Overview

This Lambda function returns a paginated list of recent orders for the authenticated user, querying DynamoDB for order snapshots (`PK=USER#<userId>`, `SK=ORDER#<timestamp>`). It supports pagination via `limit` and `cursor` query parameters and is designed for the React dashboard order history page.

---

## Handler Contract

- **Runtime:** Python 3.12
- **Entry Point:** `lambda_function.lambda_handler`
- **Event Source:** API Gateway REST path `/dashboard/orders` (GET) with JWT auth
- **Query Params:**
  - `limit` (optional): Number of orders to return (default: 20 or `ORDER_PAGE_SIZE` env)
  - `cursor` (optional): Pagination token for fetching next page
- **Response:**
  ```json
  {
  	"orders": [
  		{
  			"orderId": "cs_test_...",
  			"orderNumber": "BC-ABCDEFGH",
  			"status": "completed",
  			"amount": 3000,
  			"currency": "usd",
  			"createdAt": "2025-11-26T21:28:24.990Z",
  			"itemCount": 2,
  			"items": [ ... ]
  		}
  		// ... more orders
  	],
  	"nextCursor": "..." // Opaque string for pagination
  }
  ```

---

## Environment Variables

| Name              | Required | Purpose                                        |
| ----------------- | -------- | ---------------------------------------------- |
| `COMMERCE_TABLE`  | ✅       | Shared DynamoDB table housing order snapshots. |
| `ORDER_PAGE_SIZE` | ➕       | Default page size override.                    |

---

## Implementation Details

- Queries DynamoDB for orders using `PK=USER#<userId>` and `SK` prefix `ORDER#`, sorted by newest first.
- Supports pagination with `limit` and `cursor` (DynamoDB `ExclusiveStartKey` encoded as base64 JSON).
- Returns normalized order objects for frontend display.
- Handles CORS and preflight requests.
- Returns 401 if user is not authenticated.
- Returns 500 with error message if DynamoDB query fails.

---

## Example Usage

**Request:**

```
GET /dashboard/orders?limit=10&cursor=eyJQSyI6IlVTRVIjMTIzIiwgIlNLIjoiT1JERVIjMTIzIn0=
Authorization: Bearer <JWT>
```

**Response:**

```
{
	"orders": [ ... ],
	"nextCursor": "..."
}
```

---

## Future Enhancements

- Trigger async refresh if cached data is older than target freshness.
- Emit metrics (items returned, latency) for observability.
- Add filtering and sorting options.

---

**For questions or issues, contact the backend development team.**
