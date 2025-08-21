#!/bin/bash

# Nash & Smashed - Complete S3 Caching Fix
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUCKET="nash-and-smashed-website"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Nash & Smashed - Complete S3 Caching Fix${NC}"
echo -e "${BLUE}========================================${NC}"

# Run all caching fixes
echo -e "${YELLOW}🚀 Running all caching fixes...${NC}"

"$SCRIPT_DIR/fix-js-caching.sh"
"$SCRIPT_DIR/fix-css-caching.sh"
"$SCRIPT_DIR/fix-fonts-caching.sh"
"$SCRIPT_DIR/fix-images-caching.sh"
"$SCRIPT_DIR/fix-html-caching.sh"

echo -e "${GREEN}🎉 All cache headers applied successfully!${NC}"
echo -e "${YELLOW}Run verification: ./verify-caching.sh${NC}"
echo -e "${YELLOW}Run invalidation: ../cloudfront/invalidate-distribution.sh${NC}"