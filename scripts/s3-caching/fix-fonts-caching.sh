#!/bin/bash

# Fix font files caching
set -e

BUCKET="nash-and-smashed-website"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing font files...${NC}"

aws s3 cp s3://$BUCKET/fonts/ s3://$BUCKET/fonts/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --quiet

echo -e "${GREEN}✓ Font files updated${NC}"