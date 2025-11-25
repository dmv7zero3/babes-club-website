#!/bin/bash

# Babes Club JWT Migration Script - Environment Variable Version
# No SSM Parameter Store - Uses Lambda environment variables

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="us-east-1"
TABLE_NAME="babesclub-commerce"

echo "======================================"
echo "Babes Club JWT Migration (Env Vars)"
echo "======================================"
echo ""

# Step 1: Generate Secrets
echo -e "${BLUE}Step 1: Generate JWT Secrets${NC}"
echo "================================"

JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)

echo -e "${GREEN}✓${NC} Generated JWT secret (64 chars)"
echo -e "${GREEN}✓${NC} Generated refresh secret (64 chars)"

# Save secrets to file (for your records)
cat > jwt-secrets.txt << EOF
# Babes Club JWT Secrets - Generated $(date)
# KEEP THIS FILE SECURE!
JWT_SECRET=${JWT_SECRET}
REFRESH_SECRET=${REFRESH_SECRET}
EOF

echo -e "${GREEN}✓${NC} Saved to jwt-secrets.txt (KEEP SECURE!)"
echo ""

# Step 2: Update Lambda Environment Variables
echo -e "${BLUE}Step 2: Update Lambda Environment Variables${NC}"
echo "==========================================="

LAMBDAS=(
    "babes-website-auth-login"
    "babes-website-auth-signup"
    "babes-website-auth-authorizer"
    "babes-website-auth-refresh"  # Will be created
)

echo "Will add these environment variables to Lambda functions:"
echo "  JWT_SECRET=<generated>"
echo "  REFRESH_SECRET=<generated>"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Update each Lambda
for LAMBDA in "${LAMBDAS[@]}"; do
    echo -n "Updating $LAMBDA... "
    
    # Check if Lambda exists
    if ! aws lambda get-function --function-name $LAMBDA --region $REGION > /dev/null 2>&1; then
        echo -e "${YELLOW}SKIP${NC} (doesn't exist yet)"
        continue
    fi
    
    # Get existing environment variables
    EXISTING_VARS=$(aws lambda get-function-configuration \
        --function-name $LAMBDA \
        --region $REGION \
        --query 'Environment.Variables' \
        --output json 2>/dev/null || echo '{}')
    
    # Merge with new JWT variables
    UPDATED_VARS=$(echo $EXISTING_VARS | jq \
        --arg jwt "$JWT_SECRET" \
        --arg refresh "$REFRESH_SECRET" \
        '. + {JWT_SECRET: $jwt, REFRESH_SECRET: $refresh}')
    
    # Update Lambda configuration
    aws lambda update-function-configuration \
        --function-name $LAMBDA \
        --environment "Variables=$UPDATED_VARS" \
        --region $REGION \
        --no-cli-pager > /dev/null 2>&1
    
    echo -e "${GREEN}✓${NC}"
done

echo ""

# Step 3: Create JWT Layer
echo -e "${BLUE}Step 3: Create JWT Utility Layer${NC}"
echo "=================================="

mkdir -p jwt-layer/python/shared_commerce
cp jwt_utils.py jwt-layer/python/shared_commerce/

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

echo -e "${GREEN}✓${NC} Created layer: $LAYER_ARN"

# Clean up
rm -rf jwt-layer jwt-layer.zip

# Step 4: Update Lambda Functions to Use Layer
echo ""
echo -e "${BLUE}Step 4: Add JWT Layer to Functions${NC}"
echo "===================================="

for LAMBDA in "${LAMBDAS[@]}"; do
    if aws lambda get-function --function-name $LAMBDA --region $REGION > /dev/null 2>&1; then
        echo -n "Adding layer to $LAMBDA... "
        
        # Get existing layers
        EXISTING_LAYERS=$(aws lambda get-function-configuration \
            --function-name $LAMBDA \
            --region $REGION \
            --query 'Layers[*].Arn' \
            --output json 2>/dev/null || echo '[]')
        
        # Add new layer
        UPDATED_LAYERS=$(echo $EXISTING_LAYERS | jq --arg layer "$LAYER_ARN" '. + [$layer] | unique')
        
        aws lambda update-function-configuration \
            --function-name $LAMBDA \
            --layers $(echo $UPDATED_LAYERS | jq -r '.[]' | tr '\n' ' ') \
            --region $REGION \
            --no-cli-pager > /dev/null 2>&1
        
        echo -e "${GREEN}✓${NC}"
    fi
done

echo ""

# Step 5: Testing Instructions
echo -e "${BLUE}Step 5: Testing JWT Authentication${NC}"
echo "===================================="

echo "Test the JWT implementation:"
echo ""
echo "1. Deploy updated Lambda code with JWT support"
echo "2. Test login endpoint:"
echo ""
echo "   curl -X POST https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"test@example.com\", \"password\": \"TestPass123!\"}'"
echo ""
echo "3. Use the returned accessToken to test protected endpoints:"
echo ""
echo "   curl -X GET https://a2fps4r1la.execute-api.us-east-1.amazonaws.com/PROD/dashboard/profile \\"
echo "     -H 'Authorization: Bearer <accessToken>'"
echo ""

echo -e "${GREEN}✅ JWT Infrastructure Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Keep jwt-secrets.txt file secure!${NC}"
echo -e "${YELLOW}Next: Deploy updated Lambda function code${NC}"
