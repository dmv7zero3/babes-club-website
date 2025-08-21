#!/bin/bash

# Nash & Smashed S3 Caching Fix Script
# This script applies proper cache headers to all file types in your S3 bucket

set -e  # Exit on any error

# Configuration
BUCKET="nash-and-smashed-website"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Nash & Smashed S3 Caching Fix Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Bucket: ${BUCKET}"
echo ""

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not installed${NC}"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ AWS CLI is configured${NC}"
}

# Function to fix JavaScript files
fix_javascript_files() {
    echo -e "${YELLOW}🔧 Fixing JavaScript files (.js)...${NC}"
    
    aws s3 cp s3://$BUCKET/js/ s3://$BUCKET/js/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "application/javascript" \
        --exclude "*.map" \
        --exclude "*.LICENSE.txt" \
        --quiet
    
    echo -e "${GREEN}✓ JavaScript files updated${NC}"
    
    echo -e "${YELLOW}🔧 Fixing JavaScript source maps (.js.map)...${NC}"
    
    aws s3 cp s3://$BUCKET/js/ s3://$BUCKET/js/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "application/json" \
        --include "*.map" \
        --quiet
    
    echo -e "${GREEN}✓ JavaScript source maps updated${NC}"
    
    echo -e "${YELLOW}🔧 Fixing JavaScript license files (.LICENSE.txt)...${NC}"
    
    aws s3 cp s3://$BUCKET/js/ s3://$BUCKET/js/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "text/plain" \
        --include "*.LICENSE.txt" \
        --quiet
    
    echo -e "${GREEN}✓ JavaScript license files updated${NC}"
}

# Function to fix CSS files
fix_css_files() {
    echo -e "${YELLOW}🔧 Fixing CSS files...${NC}"
    
    aws s3 cp s3://$BUCKET/styles/ s3://$BUCKET/styles/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000, immutable" \
        --content-type "text/css" \
        --quiet
    
    echo -e "${GREEN}✓ CSS files updated${NC}"
}

# Function to fix font files
fix_font_files() {
    echo -e "${YELLOW}🔧 Fixing font files...${NC}"
    
    aws s3 cp s3://$BUCKET/fonts/ s3://$BUCKET/fonts/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000, immutable" \
        --quiet
    
    echo -e "${GREEN}✓ Font files updated${NC}"
}

# Function to fix image files
fix_image_files() {
    echo -e "${YELLOW}🔧 Fixing image files...${NC}"
    
    aws s3 cp s3://$BUCKET/images/ s3://$BUCKET/images/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000, immutable" \
        --quiet
    
    echo -e "${GREEN}✓ Image files updated${NC}"
}

# Function to fix HTML files
fix_html_files() {
    echo -e "${YELLOW}🔧 Fixing HTML files...${NC}"
    
    aws s3 cp s3://$BUCKET/ s3://$BUCKET/ \
        --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=300, must-revalidate" \
        --content-type "text/html" \
        --include "*.html" \
        --quiet
    
    echo -e "${GREEN}✓ HTML files updated${NC}"
}

# Main execution
main() {
    check_aws_cli
    
    echo ""
    echo -e "${YELLOW}🚀 Starting cache header fixes...${NC}"
    echo ""
    
    fix_javascript_files
    fix_css_files
    fix_font_files
    fix_image_files
    fix_html_files
    
    echo ""
    echo -e "${GREEN}🎉 Cache headers applied successfully!${NC}"
    echo -e "${BLUE}You can now manually verify and invalidate CloudFront as needed.${NC}"
}

# Run the script
main "$@"