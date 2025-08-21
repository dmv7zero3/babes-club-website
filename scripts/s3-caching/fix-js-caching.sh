#!/bin/bash

# Fix JavaScript files caching
set -e

BUCKET="nash-and-smashed-website"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Fixing JavaScript files...${NC}"

# Main JS files
aws s3 cp s3://$BUCKET/js/ s3://$BUCKET/js/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "application/javascript" \
  --exclude "*.map" \
  --exclude "*.LICENSE.txt" \
  --quiet

# Source maps
aws s3 cp s3://$BUCKET/js/ s3://$BUCKET/js/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "application/json" \
  --include "*.map" \
  --quiet

# License files
aws s3 cp s3://$BUCKET/js/ s3://$BUCKET/js/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "text/plain" \
  --include "*.LICENSE.txt" \
  --quiet

echo -e "${GREEN}✓ JavaScript files updated${NC}"