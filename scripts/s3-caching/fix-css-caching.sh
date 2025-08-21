#!/bin/bash

# Fix CSS files caching
set -e

BUCKET="nash-and-smashed-website"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing CSS files...${NC}"

aws s3 cp s3://$BUCKET/styles/ s3://$BUCKET/styles/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "text/css" \
  --quiet

echo -e "${GREEN}✓ CSS files updated${NC}"