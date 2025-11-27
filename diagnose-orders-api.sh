#!/bin/bash
# diagnose-orders-api.sh
# Diagnose why /dashboard/orders is returning 401

set -e

API_ID="a2fps4r1la"
REGION="us-east-1"
STAGE="PROD"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================"
echo "Dashboard Orders API Diagnostic"
echo "========================================${NC}"
echo ""

# Step 1: Find the resource ID
echo -e "${YELLOW}Step 1: Finding /dashboard/orders resource...${NC}"
RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?path==`/dashboard/orders`].id' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$RESOURCE_ID" == "NOT_FOUND" ] || [ -z "$RESOURCE_ID" ]; then
    echo -e "${RED}✗ Resource /dashboard/orders not found!${NC}"
    echo "  Available resources:"
    aws apigateway get-resources --rest-api-id $API_ID --region $REGION --query 'items[*].path'
    exit 1
fi
echo -e "${GREEN}✓ Resource ID: $RESOURCE_ID${NC}"

# Step 2: Check GET method configuration
echo ""
echo -e "${YELLOW}Step 2: Checking GET method configuration...${NC}"
METHOD_CONFIG=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method GET \
    --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$METHOD_CONFIG" == "NOT_FOUND" ]; then
    echo -e "${RED}✗ GET method not configured!${NC}"
    exit 1
fi

AUTH_TYPE=$(echo "$METHOD_CONFIG" | jq -r '.authorizationType')
AUTHORIZER_ID=$(echo "$METHOD_CONFIG" | jq -r '.authorizerId // "none"')

echo "  Authorization Type: $AUTH_TYPE"
echo "  Authorizer ID: $AUTHORIZER_ID"

if [ "$AUTH_TYPE" != "CUSTOM" ]; then
    echo -e "${RED}✗ Authorization type should be CUSTOM, not $AUTH_TYPE${NC}"
    echo "  Fix: Attach a Lambda authorizer to this method"
else
    echo -e "${GREEN}✓ Using CUSTOM authorizer${NC}"
fi

# Step 3: Check authorizer details
echo ""
echo -e "${YELLOW}Step 3: Checking authorizer configuration...${NC}"
if [ "$AUTHORIZER_ID" != "none" ] && [ -n "$AUTHORIZER_ID" ]; then
    AUTHORIZER_DETAILS=$(aws apigateway get-authorizer \
        --rest-api-id $API_ID \
        --authorizer-id $AUTHORIZER_ID \
        --region $REGION 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$AUTHORIZER_DETAILS" != "NOT_FOUND" ]; then
        AUTH_NAME=$(echo "$AUTHORIZER_DETAILS" | jq -r '.name')
        AUTH_URI=$(echo "$AUTHORIZER_DETAILS" | jq -r '.authorizerUri')
        IDENTITY_SOURCE=$(echo "$AUTHORIZER_DETAILS" | jq -r '.identitySource')
        
        echo "  Authorizer Name: $AUTH_NAME"
        echo "  Identity Source: $IDENTITY_SOURCE"
        echo -e "${GREEN}✓ Authorizer configured${NC}"
        
        # Extract Lambda function name from URI
        LAMBDA_ARN=$(echo "$AUTH_URI" | grep -oP 'arn:aws:lambda:[^/]+')
        echo "  Lambda ARN: $LAMBDA_ARN"
    else
        echo -e "${RED}✗ Could not fetch authorizer details${NC}"
    fi
else
    echo -e "${RED}✗ No authorizer attached to this method!${NC}"
fi

# Step 4: Check integration type
echo ""
echo -e "${YELLOW}Step 4: Checking integration type...${NC}"
INTEGRATION=$(aws apigateway get-integration \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method GET \
    --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$INTEGRATION" != "NOT_FOUND" ]; then
    INT_TYPE=$(echo "$INTEGRATION" | jq -r '.type')
    INT_URI=$(echo "$INTEGRATION" | jq -r '.uri')
    
    echo "  Integration Type: $INT_TYPE"
    
    if [ "$INT_TYPE" == "AWS_PROXY" ]; then
        echo -e "${GREEN}✓ Using Lambda Proxy Integration (correct)${NC}"
        echo "  This means authorizer context is automatically passed"
    else
        echo -e "${YELLOW}⚠ Integration type is $INT_TYPE, not AWS_PROXY${NC}"
        echo "  For non-proxy integrations, you need to map context manually"
    fi
fi

# Step 5: Check OPTIONS method for CORS
echo ""
echo -e "${YELLOW}Step 5: Checking OPTIONS method (CORS)...${NC}"
OPTIONS_CONFIG=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$OPTIONS_CONFIG" == "NOT_FOUND" ]; then
    echo -e "${YELLOW}⚠ OPTIONS method not configured${NC}"
    echo "  This may cause CORS preflight issues"
else
    echo -e "${GREEN}✓ OPTIONS method exists${NC}"
fi

# Step 6: Check Gateway Responses
echo ""
echo -e "${YELLOW}Step 6: Checking Gateway Responses (CORS on errors)...${NC}"
UNAUTHORIZED_RESPONSE=$(aws apigateway get-gateway-response \
    --rest-api-id $API_ID \
    --response-type UNAUTHORIZED \
    --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$UNAUTHORIZED_RESPONSE" != "NOT_FOUND" ]; then
    CORS_HEADER=$(echo "$UNAUTHORIZED_RESPONSE" | jq -r '.responseParameters["gatewayresponse.header.Access-Control-Allow-Origin"] // "not set"')
    echo "  UNAUTHORIZED response CORS header: $CORS_HEADER"
    if [ "$CORS_HEADER" == "'*'" ] || [ "$CORS_HEADER" == "\"*\"" ]; then
        echo -e "${GREEN}✓ Gateway Response has CORS configured${NC}"
    else
        echo -e "${RED}✗ Gateway Response missing CORS header${NC}"
        echo "  Run fix-gateway-cors.sh to fix this"
    fi
else
    echo -e "${RED}✗ UNAUTHORIZED gateway response not configured${NC}"
fi

# Step 7: Recent Lambda logs
echo ""
echo -e "${YELLOW}Step 7: Recent authorizer logs...${NC}"
echo "  Fetching last 3 log entries..."
aws logs filter-log-events \
    --log-group-name /aws/lambda/babes-website-auth-authorizer \
    --start-time $(( $(date +%s) * 1000 - 300000 )) \
    --region $REGION \
    --limit 3 \
    --query 'events[*].message' \
    --output text 2>/dev/null | head -20 || echo "  No recent logs found"

echo ""
echo -e "${YELLOW}Step 8: Recent orders Lambda logs...${NC}"
echo "  Fetching last 3 log entries..."
aws logs filter-log-events \
    --log-group-name /aws/lambda/babes-website-dashboard-list-orders \
    --start-time $(( $(date +%s) * 1000 - 300000 )) \
    --region $REGION \
    --limit 3 \
    --query 'events[*].message' \
    --output text 2>/dev/null | head -20 || echo "  No recent logs found"

# Summary
echo ""
echo -e "${BLUE}========================================"
echo "Diagnosis Summary"
echo "========================================${NC}"
echo ""
echo "If you see 'Unauthorized request: no userId in authorizer context':"
echo "1. Check that the authorizer Lambda returns context with STRING values"
echo "2. Verify the authorizer is attached to GET /dashboard/orders"
echo "3. Ensure the integration type is AWS_PROXY"
echo ""
echo "To test manually:"
echo ""
echo "  TOKEN=\"your-jwt-token\""
echo "  curl -X GET \\"
echo "    -H \"Authorization: Bearer \$TOKEN\" \\"
echo "    -H \"Origin: http://localhost:3001\" \\"
echo "    \"https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/orders\""
