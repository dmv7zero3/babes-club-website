#!/bin/bash

# Babes Club - Apply JWT Secrets to Lambda Functions
# Uses the provided JWT secrets as environment variables

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-1"

# Your JWT Secrets
JWT_SECRET="2770b964fd6791ab807ca09ee0c369385cbf0340aa9370d67b36e69b31d3e642"
REFRESH_SECRET="fe1e94964c52c794e60794c42e34471275bbedb73334ab989216ab3c8941c81c"

echo "======================================"
echo "Applying JWT Secrets to Lambda Functions"
echo "======================================"
echo ""

# Lambda functions to update
LAMBDAS=(
    "babes-website-auth-login"
    "babes-website-auth-signup"
    "babes-website-auth-authorizer"
    "babes-website-dashboard-get-profile"
    "babes-website-dashboard-update-profile"
    "babes-website-dashboard-revoke-session"
)

echo "Will add these environment variables:"
echo "  JWT_SECRET=****${JWT_SECRET: -8}"
echo "  REFRESH_SECRET=****${REFRESH_SECRET: -8}"
echo ""

read -p "Apply secrets to Lambda functions? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Counter for successful updates
SUCCESS_COUNT=0
TOTAL=${#LAMBDAS[@]}

echo ""
echo "Updating Lambda functions..."
echo "=============================="

for LAMBDA in "${LAMBDAS[@]}"; do
    echo -n "[$((SUCCESS_COUNT + 1))/$TOTAL] Updating $LAMBDA... "
    
    # Check if Lambda exists
    if ! aws lambda get-function --function-name $LAMBDA --region $REGION > /dev/null 2>&1; then
        echo -e "${YELLOW}SKIP${NC} (function not found)"
        continue
    fi
    
    # Get existing environment variables
    EXISTING_VARS=$(aws lambda get-function-configuration \
        --function-name $LAMBDA \
        --region $REGION \
        --query 'Environment.Variables' \
        --output json 2>/dev/null || echo '{}')
    
    # If no existing environment, create empty object
    if [ "$EXISTING_VARS" == "null" ] || [ -z "$EXISTING_VARS" ]; then
        EXISTING_VARS="{}"
    fi
    
    # Merge with JWT secrets
    UPDATED_VARS=$(echo "$EXISTING_VARS" | jq \
        --arg jwt "$JWT_SECRET" \
        --arg refresh "$REFRESH_SECRET" \
        '. + {JWT_SECRET: $jwt, REFRESH_SECRET: $refresh}')

    # Convert JSON to comma-separated key=value pairs for AWS CLI
    ENV_STRING=$(echo "$UPDATED_VARS" | jq -r 'to_entries|map("\(.key)=\(.value)")|join(",")')

    # Update Lambda configuration
    if aws lambda update-function-configuration \
        --function-name $LAMBDA \
        --environment "Variables={$ENV_STRING}" \
        --region $REGION \
        --no-cli-pager > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}✗${NC} (update failed)"
    fi
done

echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo -e "${GREEN}✓${NC} Successfully updated: $SUCCESS_COUNT/$TOTAL functions"

# Create JWT layer
echo ""
echo -e "${BLUE}Creating JWT Utility Layer${NC}"
echo "======================================"

if [ -f "scripts/bash/jwt_utils.py" ]; then
    mkdir -p jwt-layer/python/shared_commerce
    cp scripts/bash/jwt_utils.py jwt-layer/python/shared_commerce/

    cd jwt-layer
    zip -r ../jwt-layer.zip . -q
    cd ..

    LAYER_ARN=$(aws lambda publish-layer-version \
        --layer-name babes-commerce-jwt \
        --description "JWT utilities for Babes Club" \
        --zip-file fileb://jwt-layer.zip \
        --compatible-runtimes python3.12 \
        --region $REGION \
        --query 'LayerVersionArn' \
        --output text)

    echo -e "${GREEN}✓${NC} Created layer: babes-commerce-jwt"
    echo "   ARN: $LAYER_ARN"

    # Clean up
    rm -rf jwt-layer jwt-layer.zip

    # Add layer to functions
    echo ""
    echo "Adding layer to Lambda functions..."
    for LAMBDA in "${LAMBDAS[@]}"; do
        if aws lambda get-function --function-name $LAMBDA --region $REGION > /dev/null 2>&1; then
            echo -n "  $LAMBDA... "

            # Get existing layers
            EXISTING_LAYERS=$(aws lambda get-function-configuration \
                --function-name $LAMBDA \
                --region $REGION \
                --query 'Layers[*].Arn' \
                --output json 2>/dev/null || echo '[]')

            # If null, make it empty array
            if [ "$EXISTING_LAYERS" == "null" ]; then
                EXISTING_LAYERS="[]"
            fi

            # Add new layer (avoiding duplicates)
            UPDATED_LAYERS=$(echo "$EXISTING_LAYERS" | jq --arg layer "$LAYER_ARN" \
                'if (. | map(. == $layer) | any) then . else . + [$layer] end')

            # Convert array to space-separated string
            LAYER_STRING=$(echo "$UPDATED_LAYERS" | jq -r '.[]' | tr '\n' ' ')

            if [ -z "$LAYER_STRING" ]; then
                LAYER_STRING="$LAYER_ARN"
            fi

            if aws lambda update-function-configuration \
                --function-name $LAMBDA \
                --layers $LAYER_STRING \
                --region $REGION \
                --no-cli-pager > /dev/null 2>&1; then
                echo -e "${GREEN}✓${NC}"
            else
                echo -e "${YELLOW}⚠${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} scripts/bash/jwt_utils.py not found"
    echo "   Download it from the migration plan output"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ JWT Infrastructure Complete!${NC}"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Update Lambda function code to use JWT (see migration plan)"
echo "2. Test authentication flow:"
echo "   - Login endpoint should return accessToken"
echo "   - Protected endpoints should accept Bearer token"
echo "3. Deploy frontend changes"
echo "4. Clean up old sessions from DynamoDB"
echo ""
echo -e "${YELLOW}Important:${NC} Keep these secrets secure!"
echo "JWT_SECRET and REFRESH_SECRET are now set as environment variables"
