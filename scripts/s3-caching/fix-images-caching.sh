#!/bin/bash

# Fix image files caching
set -e

BUCKET="nash-and-smashed-website"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing image files...${NC}"

aws s3 cp s3://$BUCKET/images/ s3://$BUCKET/images/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --quiet

echo -e "${GREEN}✓ Image files updated${NC}"