#!/bin/bash

# Fix HTML files caching
set -e

BUCKET="nash-and-smashed-website"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing HTML files...${NC}"

aws s3 cp s3://$BUCKET/ s3://$BUCKET/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=300, must-revalidate" \
  --content-type "text/html" \
  --include "*.html" \
  --quiet

echo -e "${GREEN}✓ HTML files updated${NC}"