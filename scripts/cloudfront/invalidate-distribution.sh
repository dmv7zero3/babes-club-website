#!/bin/bash

# CloudFront Invalidation
set -e

DISTRIBUTION_ID="E1M9JT7AEV0YV1"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Creating CloudFront invalidation...${NC}"

RESULT=$(aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --output json)

INVALIDATION_ID=$(echo $RESULT | jq -r '.Invalidation.Id')

echo -e "${GREEN}✓ Invalidation created: $INVALIDATION_ID${NC}"
echo -e "${BLUE}Check status: aws cloudfront get-invalidation --distribution-id $DISTRIBUTION_ID --id $INVALIDATION_ID${NC}"