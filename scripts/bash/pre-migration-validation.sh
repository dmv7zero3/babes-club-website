#!/bin/bash

# Babes Club JWT Migration - Pre-Migration Validation Script
# Run this BEFORE starting the migration to ensure everything is ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "JWT Migration Pre-Flight Check"
echo "======================================"
echo ""

# Configuration
REGION="us-east-1"
TABLE_NAME="babesclub-commerce"
API_ID="a2fps4r1la"
STAGE="PROD"

# Check AWS CLI is configured
echo "1. Checking AWS CLI configuration..."
if aws sts get-caller-identity --region $REGION > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} AWS CLI configured"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "   Account: $ACCOUNT_ID"
else
    echo -e "${RED}✗${NC} AWS CLI not configured properly"
    exit 1
fi

echo ""
echo "2. Checking DynamoDB table..."
if aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} DynamoDB table '$TABLE_NAME' exists"
    
    # Count current sessions
    SESSION_COUNT=$(aws dynamodb scan \
        --table-name $TABLE_NAME \
        --filter-expression "begins_with(PK, :pk)" \
        --expression-attribute-values '{":pk":{"S":"SESSION#"}}' \
        --select COUNT \
        --region $REGION \
        --query Count \
        --output text 2>/dev/null || echo "0")
    
    echo -e "${YELLOW}!${NC} Current active sessions in DynamoDB: $SESSION_COUNT"
    
    if [ "$SESSION_COUNT" -gt "0" ]; then
        echo -e "${YELLOW}  Note:${NC} These sessions will become invalid after migration"
    fi
else
    echo -e "${RED}✗${NC} DynamoDB table '$TABLE_NAME' not found"
    exit 1
fi

echo ""
echo "3. Checking Lambda functions..."
LAMBDAS=(
    "babes-website-auth-login"
    "babes-website-auth-signup"
    "babes-website-auth-authorizer"
    "babes-website-dashboard-get-profile"
    "babes-website-dashboard-update-profile"
    "babes-website-dashboard-revoke-session"
)

LAMBDA_COUNT=0
for LAMBDA in "${LAMBDAS[@]}"; do
    if aws lambda get-function --function-name $LAMBDA --region $REGION > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Lambda function: $LAMBDA"
        LAMBDA_COUNT=$((LAMBDA_COUNT + 1))
    else
        echo -e "${YELLOW}⚠${NC} Lambda function not found: $LAMBDA"
    fi
done

echo "   Found $LAMBDA_COUNT of ${#LAMBDAS[@]} expected Lambda functions"

echo ""
echo "4. Checking API Gateway..."
if aws apigateway get-rest-api --rest-api-id $API_ID --region $REGION > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API Gateway found (ID: $API_ID)"
    
    # Check for authorizers
    AUTHORIZER_COUNT=$(aws apigateway get-authorizers \
        --rest-api-id $API_ID \
        --region $REGION \
        --query 'length(items)' \
        --output text 2>/dev/null || echo "0")
    
    echo "   Current authorizers: $AUTHORIZER_COUNT"
else
    echo -e "${RED}✗${NC} API Gateway not found (ID: $API_ID)"
    exit 1
fi

echo ""
echo "5. Checking SSM Parameters (for secrets)..."
# Check if JWT secrets already exist (they shouldn't before migration)
if aws ssm get-parameter --name "/babesclub/auth/jwt-secret" --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} JWT secret already exists in SSM"
    echo "   This might indicate a partial migration attempt"
else
    echo -e "${GREEN}✓${NC} JWT secret not found (expected before migration)"
fi

if aws ssm get-parameter --name "/babesclub/auth/refresh-secret" --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Refresh secret already exists in SSM"
else
    echo -e "${GREEN}✓${NC} Refresh secret not found (expected before migration)"
fi

echo ""
echo "6. Creating backup recommendations..."
echo -e "${YELLOW}IMPORTANT:${NC} Before proceeding with migration, please:"
echo ""
echo "   1. BACKUP Lambda function code:"
for LAMBDA in "${LAMBDAS[@]}"; do
    echo "      aws lambda get-function --function-name $LAMBDA --query 'Code.Location' --output text"
done
echo ""
echo "   2. BACKUP DynamoDB data:"
echo "      aws dynamodb create-backup --table-name $TABLE_NAME --backup-name babes-club-pre-jwt-migration-\$(date +%Y%m%d)"
echo ""
echo "   3. Note current Lambda environment variables:"
echo "      aws lambda get-function-configuration --function-name babes-website-auth-login --query 'Environment.Variables'"
echo ""

echo "======================================"
echo "Migration Readiness Summary"
echo "======================================"
echo ""

# Determine if ready to proceed
READY=true

if [ "$LAMBDA_COUNT" -lt "${#LAMBDAS[@]}" ]; then
    echo -e "${YELLOW}⚠${NC} Some Lambda functions are missing"
    READY=false
fi

if [ "$SESSION_COUNT" -gt "100" ]; then
    echo -e "${YELLOW}⚠${NC} High number of active sessions ($SESSION_COUNT)"
    echo "   Consider notifying users about the migration"
    READY=false
fi

if [ "$READY" = true ]; then
    echo -e "${GREEN}✅ System appears ready for JWT migration${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run the backup commands above"
    echo "2. Review the migration plan"
    echo "3. Execute Phase 1: Infrastructure Setup"
else
    echo -e "${YELLOW}⚠ Please address the issues above before proceeding${NC}"
fi

echo ""
echo "======================================"
echo "Optional: Dry-run JWT Secret Creation"
echo "======================================"
echo ""
echo "To test SSM parameter creation (without actually creating them):"
echo ""
echo "# Generate test secrets"
echo "JWT_SECRET=\$(openssl rand -hex 32)"
echo "echo \"Test JWT Secret: \$JWT_SECRET\""
echo ""
echo "# Verify IAM permissions for SSM"
echo "aws ssm put-parameter --name \"/babesclub/auth/test-param\" --value \"test\" --type String --region $REGION"
echo "aws ssm delete-parameter --name \"/babesclub/auth/test-param\" --region $REGION"
echo ""
