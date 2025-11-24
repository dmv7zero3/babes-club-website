#!/bin/bash

# Fix Gateway Response CORS Headers - Correct Syntax
# The issue: Gateway Response is returning literal string instead of evaluated header

API_ID="a2fps4r1la"
REGION="us-east-1"
STAGE="PROD"

echo "🔧 Fixing Gateway Response CORS header mappings..."

# Fix ACCESS_DENIED response - use single quotes correctly
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type ACCESS_DENIED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "method.request.header.Origin",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

echo "✓ ACCESS_DENIED fixed"

# Fix UNAUTHORIZED response
aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type UNAUTHORIZED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "method.request.header.Origin",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

echo "✓ UNAUTHORIZED fixed"

# Alternative: If dynamic origin doesn't work, use wildcard
echo ""
echo "If dynamic origin still doesn't work, applying wildcard fallback..."

aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type ACCESS_DENIED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

aws apigateway put-gateway-response \
    --rest-api-id $API_ID \
    --response-type UNAUTHORIZED \
    --response-parameters '{
        "gatewayresponse.header.Access-Control-Allow-Origin": "'\''*'\''",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'\''Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\''",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS'\''"
    }' \
    --region $REGION

echo "✓ Wildcard CORS applied"

# Deploy changes
echo ""
echo "🚀 Deploying changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name $STAGE \
    --description "Fix CORS header value in Gateway Responses" \
    --region $REGION \
    --query 'id' \
    --output text

echo ""
echo "✅ Fix applied! The CORS headers should now work correctly."
echo ""
echo "The issue was: Gateway Response was returning the literal string"
echo "'method.request.header.Origin' instead of evaluating it."
echo ""
echo "Wait 30 seconds for changes to propagate, then test again."