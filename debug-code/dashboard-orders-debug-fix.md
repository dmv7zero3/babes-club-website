# Dashboard Orders Integration - Debug & Fix Guide

## Problem Summary

Based on the CloudWatch logs and frontend console errors, there are **three distinct issues**:

1. **CORS Error on `/auth/profile`** - Preflight request blocked
2. **401 Unauthorized on `/dashboard/orders`** - No userId in authorizer context
3. **Empty orders for new users** - Users without Stripe ID need graceful handling

---

## Issue 1: CORS Error on `/auth/profile`

### Symptoms
```
Access to XMLHttpRequest at 'https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/auth/profile' 
from origin 'http://localhost:3001' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Cause
The API Gateway Gateway Responses (for UNAUTHORIZED, ACCESS_DENIED) are not returning CORS headers on preflight failures.

### Fix

Run this script to fix the Gateway Responses:

```bash
#!/bin/bash
API_ID="a2fps4r1la"
REGION="us-east-1"
STAGE="PROD"

# Fix UNAUTHORIZED Gateway Response
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type UNAUTHORIZED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

# Fix ACCESS_DENIED Gateway Response
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type ACCESS_DENIED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

# Fix DEFAULT_4XX Gateway Response
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type DEFAULT_4XX \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

# Deploy changes
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "Fix CORS headers on Gateway Responses" \
    --region $REGION

echo "✅ Gateway Responses fixed and deployed!"
```

---

## Issue 2: 401 Unauthorized - No userId in Authorizer Context

### Symptoms
```
[WARNING] Unauthorized request: no userId in authorizer context
```

### Root Cause
The Lambda authorizer is either:
1. Not receiving a valid token
2. Returning a CORS error response instead of an IAM policy
3. Not setting `userId` in the context

### Debug Steps

**Step 1: Check Authorizer Logs**
```bash
aws logs tail /aws/lambda/babes-website-auth-authorizer --follow --since 5m
```

Look for:
- `JWT payload: ...` - Shows decoded claims
- `JWT exp: ...` - Shows expiry
- `Authorizer returning Allow for userId: ...` - Successful validation
- Any error messages

**Step 2: Check if Token is Being Sent**
In browser DevTools > Network > click on the failed `/dashboard/orders` request:
- Check Request Headers for `Authorization: Bearer <token>`
- If missing, the frontend isn't sending the token

**Step 3: Verify Token is Valid**
Decode the JWT at https://jwt.io and check:
- Is `exp` (expiry) in the future?
- Does it have `userId` claim?

### Fix: Update Auth Authorizer to Return Proper IAM Policy

The current authorizer might be returning a CORS error response instead of raising an exception or returning a Deny policy. Here's the corrected pattern:

```python
# In babes-website-auth-authorizer/lambda_function.py

def lambda_handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    """
    Lambda authorizer - must return IAM policy, NOT HTTP response.
    
    For TOKEN authorizer:
    - Return Allow policy with context for valid tokens
    - Raise Exception("Unauthorized") for invalid tokens (API Gateway returns 401)
    """
    LOGGER.info("Authorizer invoked: methodArn=%s", event.get("methodArn"))
    
    token = _extract_token(event)
    
    if not token:
        LOGGER.warning("No authorization token provided")
        # Raise exception - API Gateway will return 401 with Gateway Response CORS headers
        raise Exception("Unauthorized")
    
    try:
        payload = verify_jwt(token)
        LOGGER.info("JWT payload: %s", json.dumps(payload))
    except Exception as exc:
        LOGGER.error("JWT verification error: %s", exc)
        raise Exception("Unauthorized")
    
    if not payload:
        LOGGER.warning("JWT not valid or expired")
        raise Exception("Unauthorized")
    
    user_id = payload.get("userId")
    if not user_id:
        LOGGER.warning("JWT missing userId claim")
        raise Exception("Unauthorized")
    
    context = {
        "userId": str(user_id),
        "role": str(payload.get("role", "customer")),
        "email": str(payload.get("email", "")),
        "displayName": str(payload.get("displayName", ""))
    }
    
    LOGGER.info("Authorizer returning Allow for userId: %s", user_id)
    return _generate_policy(
        principal_id=user_id,
        effect="Allow",
        method_arn=event["methodArn"],
        context=context
    )
```

**Important**: The authorizer should NEVER return an HTTP response with statusCode. It must return an IAM policy document or raise an exception.

---

## Issue 3: Handling Users Without Orders

### Current Behavior
The `dashboard-list-orders` Lambda correctly returns an empty list when no orders exist:
```json
{
    "orders": [],
    "nextCursor": null
}
```

### Recommended Frontend Handling

In your OrderHistoryTable component or hook:

```typescript
// src/hooks/useOrders.ts
const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const session = readStoredSession();
        if (!session?.token) {
          throw new Error('Not authenticated');
        }

        const response = await apiClient.get('/dashboard/orders', {
          headers: { Authorization: `Bearer ${session.token}` }
        });

        // Empty orders is a valid state
        setOrders(response.data.orders || []);
        setError(null);
      } catch (err) {
        // Don't treat empty orders as an error
        if (err.response?.status === 401) {
          // Token expired, trigger refresh
          setError(new Error('Session expired'));
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, loading, error, hasOrders: orders.length > 0 };
};
```

```tsx
// In your component
const { orders, loading, error, hasOrders } = useOrders();

if (loading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;

if (!hasOrders) {
  return (
    <EmptyState
      icon={<ShoppingBag />}
      title="No orders yet"
      description="Your order history will appear here after your first purchase."
      action={<Button href="/shop">Start Shopping</Button>}
    />
  );
}

return <OrderTable orders={orders} />;
```

---

## Complete Debugging Checklist

### Backend Checks

- [ ] **Gateway Responses have CORS headers**
  ```bash
  aws apigateway get-gateway-responses --rest-api-id a2fps4r1la --region us-east-1 | jq '.items[] | {responseType, responseParameters}'
  ```

- [ ] **Authorizer returns IAM policy (not HTTP response)**
  - Check CloudWatch logs for `babes-website-auth-authorizer`
  - Look for "Authorizer returning Allow for userId: ..."

- [ ] **Dashboard Lambda receives userId**
  - Check CloudWatch logs for `babes-website-dashboard-list-orders`
  - Look for "Listed orders: userId=..."

- [ ] **API Gateway deployment is current**
  ```bash
  aws apigateway get-stage --rest-api-id a2fps4r1la --stage-name PROD --region us-east-1 | jq '.deploymentId'
  ```

### Frontend Checks

- [ ] **Token is stored in session**
  ```javascript
  // In browser console
  localStorage.getItem('babes_session');
  ```

- [ ] **Token is sent with request**
  - DevTools > Network > Request Headers > Authorization

- [ ] **Token is not expired**
  - Decode at jwt.io, check `exp` claim

- [ ] **CORS preflight succeeds**
  - Look for OPTIONS request before the actual GET
  - Should return 200 with CORS headers

---

## Quick Fix Script

Run this complete fix script:

```bash
#!/bin/bash
set -e

API_ID="a2fps4r1la"
REGION="us-east-1"
STAGE="PROD"

echo "🔧 Fixing Gateway Responses..."

for RESPONSE_TYPE in UNAUTHORIZED ACCESS_DENIED DEFAULT_4XX DEFAULT_5XX; do
    echo "  - Fixing $RESPONSE_TYPE..."
    aws apigateway put-gateway-response \
        --rest-api-id $API_ID \
        --response-type $RESPONSE_TYPE \
        --response-parameters '{
            "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS'\''"
        }' \
        --region $REGION 2>/dev/null || echo "    (may already exist)"
done

echo ""
echo "🚀 Deploying API changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "Fix CORS on Gateway Responses" \
    --region $REGION \
    --query 'id' \
    --output text

echo ""
echo "✅ Done! Test with:"
echo "curl -X OPTIONS -H 'Origin: http://localhost:3001' \\"
echo "  'https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/orders' -i"
```

---

## Testing After Fixes

### Test 1: Gateway Response CORS
```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3001" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  -i "https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/orders"
```

Expected: 200 with `Access-Control-Allow-Origin: *`

### Test 2: Authenticated Request
```bash
TOKEN="<your-jwt-token>"
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: http://localhost:3001" \
  "https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/orders"
```

Expected: `{"orders": [], "nextCursor": null}` or list of orders

### Test 3: Frontend
1. Clear browser cache and local storage
2. Log in fresh
3. Navigate to dashboard/orders page
4. Check DevTools Network tab - should see successful GET to /dashboard/orders
