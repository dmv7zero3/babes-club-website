#!/bin/bash
# fix-gateway-cors.sh
# Fixes CORS headers on API Gateway Gateway Responses
# This ensures that even when the authorizer rejects a request,
# the CORS headers are returned so the browser can read the error

set -e

API_ID="a2fps4r1la"
REGION="us-east-1"
STAGE="PROD"

echo "========================================"
echo "Babes Club API Gateway CORS Fix"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Fixing Gateway Responses${NC}"
echo ""

# Response types that need CORS headers
RESPONSE_TYPES=(
    "UNAUTHORIZED"
    "ACCESS_DENIED"
    "DEFAULT_4XX"
    "DEFAULT_5XX"
    "EXPIRED_TOKEN"
    "INVALID_SIGNATURE"
    "MISSING_AUTHENTICATION_TOKEN"
)

for RESPONSE_TYPE in "${RESPONSE_TYPES[@]}"; do
    echo -n "  Fixing $RESPONSE_TYPE... "
    
    aws apigateway put-gateway-response \
        --rest-api-id "$API_ID" \
        --response-type "$RESPONSE_TYPE" \
        --response-parameters '{
            "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS'\''"
        }' \
        --region "$REGION" 2>/dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}(skipped)${NC}"
done

echo ""
echo -e "${YELLOW}Step 2: Deploying API changes${NC}"

DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE" \
    --description "Fix CORS headers on Gateway Responses - $(date +%Y-%m-%d_%H:%M:%S)" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo -e "  Deployment ID: ${GREEN}$DEPLOYMENT_ID${NC}"

echo ""
echo -e "${YELLOW}Step 3: Verifying Gateway Responses${NC}"

echo "  Checking UNAUTHORIZED response..."
CORS_HEADER=$(aws apigateway get-gateway-response \
    --rest-api-id "$API_ID" \
    --response-type UNAUTHORIZED \
    --region "$REGION" \
    --query 'responseParameters."gatewayresponse.header.Access-Control-Allow-Origin"' \
    --output text 2>/dev/null || echo "NOT_SET")

if [[ "$CORS_HEADER" == "'*'" ]]; then
    echo -e "  ${GREEN}✓ CORS header is set correctly${NC}"
else
    echo -e "  ${RED}✗ CORS header not set: $CORS_HEADER${NC}"
fi

echo ""
echo -e "${GREEN}========================================"
echo "Fix Complete!"
echo "========================================${NC}"
echo ""
echo "Test with:"
echo ""
echo "  # Test preflight request"
echo "  curl -X OPTIONS \\"
echo "    -H 'Origin: http://localhost:3001' \\"
echo "    -H 'Access-Control-Request-Method: GET' \\"
echo "    -H 'Access-Control-Request-Headers: Authorization,Content-Type' \\"
echo "    -i 'https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/orders'"
echo ""
echo "  # Test without token (should return 401 with CORS headers)"
echo "  curl -X GET \\"
echo "    -H 'Origin: http://localhost:3001' \\"
echo "    -i 'https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/orders'"
echo ""
