#!/bin/bash

# Verify S3 caching headers
BUCKET="nash-and-smashed-website"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Nash & Smashed - Cache Verification${NC}"
echo -e "${BLUE}========================================${NC}"

# Check JavaScript
echo -e "${YELLOW}Checking JavaScript files...${NC}"
JS_FILE=$(aws s3api list-objects-v2 --bucket $BUCKET --prefix "js/" --max-items 1 | jq -r '.Contents[0].Key // empty')
if [ ! -z "$JS_FILE" ]; then
    JS_CACHE=$(aws s3api head-object --bucket $BUCKET --key "$JS_FILE" | jq -r '.CacheControl')
    echo "File: $JS_FILE"
    echo "Cache: $JS_CACHE"
    if [[ "$JS_CACHE" == *"max-age=31536000"* ]]; then
        echo -e "${GREEN}✓ JavaScript: Correct (1 year)${NC}"
    else
        echo -e "${RED}✗ JavaScript: Incorrect${NC}"
    fi
fi

# Check CSS
echo -e "\n${YELLOW}Checking CSS files...${NC}"
CSS_FILE=$(aws s3api list-objects-v2 --bucket $BUCKET --prefix "styles/" --max-items 1 | jq -r '.Contents[0].Key // empty')
if [ ! -z "$CSS_FILE" ]; then
    CSS_CACHE=$(aws s3api head-object --bucket $BUCKET --key "$CSS_FILE" | jq -r '.CacheControl')
    echo "File: $CSS_FILE"
    echo "Cache: $CSS_CACHE"
    if [[ "$CSS_CACHE" == *"max-age=31536000"* ]]; then
        echo -e "${GREEN}✓ CSS: Correct (1 year)${NC}"
    else
        echo -e "${RED}✗ CSS: Incorrect${NC}"
    fi
fi

# Check HTML
echo -e "\n${YELLOW}Checking HTML files...${NC}"
HTML_CACHE=$(aws s3api head-object --bucket $BUCKET --key "index.html" | jq -r '.CacheControl')
echo "File: index.html"
echo "Cache: $HTML_CACHE"
if [[ "$HTML_CACHE" == *"max-age=300"* ]]; then
    echo -e "${GREEN}✓ HTML: Correct (5 minutes)${NC}"
else
    echo -e "${RED}✗ HTML: Incorrect${NC}"
fi

# Check fonts
echo -e "\n${YELLOW}Checking font files...${NC}"
FONT_FILE=$(aws s3api list-objects-v2 --bucket $BUCKET --prefix "fonts/" --max-items 1 | jq -r '.Contents[0].Key // empty')
if [ ! -z "$FONT_FILE" ]; then
    FONT_CACHE=$(aws s3api head-object --bucket $BUCKET --key "$FONT_FILE" | jq -r '.CacheControl')
    echo "File: $FONT_FILE"
    echo "Cache: $FONT_CACHE"
    if [[ "$FONT_CACHE" == *"max-age=31536000"* ]]; then
        echo -e "${GREEN}✓ Fonts: Correct (1 year)${NC}"
    else
        echo -e "${RED}✗ Fonts: Incorrect${NC}"
    fi
fi