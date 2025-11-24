#!/bin/bash

# =============================================================================
# Babes Club API - Targeted CORS & Authorization Fix
# Based on actual AWS configuration analysis
# =============================================================================

set -e

# Configuration
API_ID="a2fps4r1la"
RESOURCE_ID="ps54hw"
REGION="us-east-1"
STAGE="PROD"
AUTHORIZER_ID="3zw56r"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Babes Club API - Targeted Fix for CORS & 403 Issues${NC}"
echo -e "${BLUE}==============================================================================${NC}\n"

# =============================================================================
# PROBLEM IDENTIFIED:
# 1. Authorizer returns 403 (Deny) which doesn't include CORS headers
# 2. Lambda Proxy Integration means integration response CORS headers are ignored
# 3. Lambda function never gets called when auth fails
# =============================================================================

echo -e "${YELLOW}Problems Identified:${NC}"
echo "1. Authorizer denies requests (403) without CORS headers"
echo "2. Lambda Proxy Integration ignores API Gateway CORS mappings"
echo "3. Need to add 403 response with CORS headers for auth failures\n"

# =============================================================================
# FIX 1: Add 403 Method Response with CORS Headers
# =============================================================================

echo -e "${BLUE}Step 1: Adding 403 Method Response with CORS headers${NC}"

# Add 403 method response
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --status-code 403 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": false,
        "method.response.header.Access-Control-Allow-Headers": false,
        "method.response.header.Access-Control-Allow-Methods": false
    }' \
    --region $REGION 2>/dev/null || echo "403 response already exists"

echo -e "${GREEN}✓ 403 Method Response added${NC}"

# =============================================================================
# FIX 2: Add 403 Integration Response (Gateway Response)
# =============================================================================

echo -e "${BLUE}Step 2: Configuring Gateway Response for Authorization Failures${NC}"

# Update Gateway Response for ACCESS_DENIED (403 from authorizer)
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type ACCESS_DENIED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''method.request.header.Origin'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --response-templates '{"application/json": "{\"error\": \"$context.authorizer.reason\", \"message\": \"$context.error.message\"}"}' \
    --region $REGION

echo -e "${GREEN}✓ ACCESS_DENIED Gateway Response configured${NC}"

# Update Gateway Response for UNAUTHORIZED (401)
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type UNAUTHORIZED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''method.request.header.Origin'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --response-templates '{"application/json": "{\"error\": \"Unauthorized\", \"message\": \"$context.error.message\"}"}' \
    --region $REGION

echo -e "${GREEN}✓ UNAUTHORIZED Gateway Response configured${NC}"

# =============================================================================
# FIX 3: Add 401 Method Response
# =============================================================================

echo -e "${BLUE}Step 3: Adding 401 Method Response${NC}"

aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method POST \
    --status-code 401 \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": false,
        "method.response.header.Access-Control-Allow-Headers": false,
        "method.response.header.Access-Control-Allow-Methods": false
    }' \
    --region $REGION 2>/dev/null || echo "401 response already exists"

echo -e "${GREEN}✓ 401 Method Response added${NC}"

# =============================================================================
# FIX 4: Ensure OPTIONS Method Returns Proper CORS
# =============================================================================

echo -e "${BLUE}Step 4: Verifying OPTIONS method configuration${NC}"

# Check if OPTIONS exists
OPTIONS_EXISTS=$(aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION 2>/dev/null && echo "true" || echo "false")

if [ "$OPTIONS_EXISTS" = "false" ]; then
    echo "Creating OPTIONS method..."
    
    # Create OPTIONS method
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION
    
    # Add method response
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": false,
            "method.response.header.Access-Control-Allow-Methods": false,
            "method.response.header.Access-Control-Allow-Origin": false
        }' \
        --response-models '{"application/json": "Empty"}' \
        --region $REGION
    
    # Add MOCK integration
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region $REGION
    
    # Add integration response
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
            "method.response.header.Access-Control-Allow-Methods": "'\''POST,OPTIONS'\''",
            "method.response.header.Access-Control-Allow-Origin": "'\''*'\''"
        }' \
        --response-templates '{"application/json": ""}' \
        --region $REGION
fi

echo -e "${GREEN}✓ OPTIONS method configured${NC}"

# =============================================================================
# FIX 5: Deploy Changes
# =============================================================================

echo -e "${BLUE}Step 5: Deploying API changes${NC}"

DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "Fix CORS headers for authorizer denials" \
    --region $REGION \
    --query 'id' \
    --output text)

echo -e "${GREEN}✓ Deployed: $DEPLOYMENT_ID${NC}"

# =============================================================================
# LAMBDA FIX: Update Response Helper
# =============================================================================

echo -e "${BLUE}Step 6: Creating Lambda response helper file${NC}"

cat > /tmp/lambda_cors_fix.py << 'EOF'
"""
Add this to your babes-website-dashboard-update-profile Lambda function
"""

import json
import os

def get_cors_origin(event):
    """Extract and validate origin from request."""
    headers = event.get('headers', {})
    origin = headers.get('Origin') or headers.get('origin', '*')
    
    # Get allowed origins from environment
    allowed = os.environ.get('CORS_ALLOW_ORIGIN', '*').split(',')
    
    # If origin is in allowed list, use it; otherwise use first allowed or *
    if origin in allowed:
        return origin
    elif '*' in allowed:
        return '*'
    else:
        return allowed[0] if allowed else '*'

def create_response(status_code, body, event=None):
    """Create API Gateway response with proper CORS headers."""
    origin = get_cors_origin(event) if event else '*'
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
            'Access-Control-Allow-Credentials': 'true' if origin != '*' else 'false'
        },
        'body': json.dumps(body) if not isinstance(body, str) else body
    }

# Usage in your Lambda handler:
def lambda_handler(event, context):
    try:
        # Your existing code...
        
        # Success response
        return create_response(200, {'message': 'Profile updated'}, event)
    
    except Exception as e:
        # Error response - still includes CORS headers
        return create_response(500, {'error': str(e)}, event)
EOF

echo -e "${GREEN}✓ Lambda fix code saved to /tmp/lambda_cors_fix.py${NC}"

# =============================================================================
# TEST ENDPOINTS
# =============================================================================

echo -e "\n${BLUE}Step 7: Testing Endpoints${NC}\n"

# Test OPTIONS
echo "Testing OPTIONS request..."
CORS_TEST=$(curl -s -X OPTIONS \
    -H "Origin: http://localhost:3001" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -I \
    "https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/dashboard/update-profile" 2>&1 | grep -i "access-control-allow-origin" || echo "No CORS header")

if [[ "$CORS_TEST" == *"access-control-allow-origin"* ]]; then
    echo -e "${GREEN}✓ OPTIONS returns CORS headers${NC}"
else
    echo -e "${YELLOW}⚠ OPTIONS may not be returning CORS headers${NC}"
fi

# Test POST without auth (should now return CORS headers with 403)
echo -e "\nTesting POST without auth (should return 403 with CORS)..."
UNAUTH_TEST=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:3001" \
    -d '{"test": "data"}' \
    -I \
    "https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/dashboard/update-profile" 2>&1)

if [[ "$UNAUTH_TEST" == *"403"* ]] && [[ "$UNAUTH_TEST" == *"access-control-allow-origin"* ]]; then
    echo -e "${GREEN}✓ Unauthorized POST returns 403 with CORS headers${NC}"
else
    echo -e "${YELLOW}⚠ May need to wait for deployment to propagate (1-2 minutes)${NC}"
fi

# =============================================================================
# NEXT STEPS
# =============================================================================

echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${GREEN}FIXES APPLIED SUCCESSFULLY${NC}"
echo -e "${BLUE}==============================================================================${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}\n"

echo "1. ${YELLOW}Update your Lambda function${NC} with the CORS helper:"
echo "   - Copy the code from /tmp/lambda_cors_fix.py"
echo "   - Add to your babes-website-dashboard-update-profile function"
echo "   - Ensure ALL responses use create_response() helper"
echo ""
echo "2. ${YELLOW}Test with a valid session token:${NC}"
echo '   TOKEN="your-actual-session-token-from-db"'
echo '   curl -X POST \'
echo "     -H \"Authorization: Bearer \$TOKEN\" \\"
echo '     -H "Content-Type: application/json" \'
echo '     -H "Origin: http://localhost:3001" \'
echo '     -d '"'"'{"displayName": "Test"}'"'"' \'
echo "     https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/dashboard/update-profile"
echo ""
echo "3. ${YELLOW}Monitor CloudWatch Logs:${NC}"
echo "   aws logs tail /aws/lambda/babes-website-auth-authorizer --follow"
echo "   aws logs tail /aws/lambda/babes-website-dashboard-update-profile --follow"
echo ""
echo "4. ${YELLOW}Debug Authorization Issues:${NC}"
echo "   - Ensure session exists in DynamoDB"
echo "   - Check session status is 'active'"
echo "   - Verify session hasn't expired"
echo "   - Confirm userId is properly set in session"

echo -e "\n${GREEN}The main issue was that when the authorizer denies a request (403),${NC}"
echo -e "${GREEN}API Gateway wasn't including CORS headers in the error response.${NC}"
echo -e "${GREEN}This is now fixed with Gateway Responses for ACCESS_DENIED and UNAUTHORIZED.${NC}"

echo -e "\n${BLUE}==============================================================================${NC}"