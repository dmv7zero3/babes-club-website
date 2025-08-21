# CloudFront Cache Configuration for Static Assets

This document explains how to configure AWS CloudFront cache behaviors to improve static asset caching and resolve Google PageSpeed Insights "Use efficient cache lifetimes" warnings.

## Problem Statement

Google PageSpeed Insights reported cache TTL issues for static assets:
- JavaScript files (`/js/*`): No cache TTL configured
- CSS files (`/styles/*`): No cache TTL configured  
- Font files (`/fonts/*`): No cache TTL configured
- **Total potential savings**: 792 KiB

## Solution Overview

Configure CloudFront cache behaviors for static asset paths using AWS Managed Cache Policies to enable efficient browser caching.

## Prerequisites

- AWS CLI installed and configured
- `jq` installed for JSON parsing
- Appropriate AWS permissions for CloudFront management
- CloudFront distribution already deployed

## Step-by-Step Implementation

### 1. Verify Current Configuration

```bash
# Check AWS CLI access
aws --version
aws sts get-caller-identity

# Get current distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Check existing cache behaviors (likely empty)
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID | jq '.DistributionConfig.CacheBehaviors'
```

### 2. Identify Current Cache Policy

```bash
# Get current cache policy details
CURRENT_POLICY_ID=$(aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID | jq -r '.DistributionConfig.DefaultCacheBehavior.CachePolicyId')

# Check policy details
aws cloudfront get-cache-policy --id $CURRENT_POLICY_ID | jq '.CachePolicy.CachePolicyConfig | {Name, DefaultTTL, MaxTTL, MinTTL}'
```

### 3. Create Updated Distribution Configuration

Create a file called `updated-distribution-config.json` with the following structure:

```json
{
  "CallerReference": "YOUR_CALLER_REFERENCE",
  "Aliases": {
    "Quantity": 2,
    "Items": ["www.yourdomain.com", "yourdomain.com"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "your-s3-bucket.s3.region.amazonaws.com",
        "DomainName": "your-s3-bucket.s3.region.amazonaws.com",
        "OriginPath": "",
        "CustomHeaders": {"Quantity": 0},
        "S3OriginConfig": {"OriginAccessIdentity": ""},
        "ConnectionAttempts": 3,
        "ConnectionTimeout": 10,
        "OriginShield": {"Enabled": false},
        "OriginAccessControlId": "YOUR_OAC_ID"
      }
    ]
  },
  "OriginGroups": {"Quantity": 0},
  "DefaultCacheBehavior": {
    "TargetOriginId": "your-s3-bucket.s3.region.amazonaws.com",
    "TrustedSigners": {"Enabled": false, "Quantity": 0},
    "TrustedKeyGroups": {"Enabled": false, "Quantity": 0},
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
      "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
    },
    "SmoothStreaming": false,
    "Compress": true,
    "LambdaFunctionAssociations": {"Quantity": 0},
    "FunctionAssociations": {
      "Quantity": 1,
      "Items": [
        {
          "FunctionARN": "arn:aws:cloudfront::ACCOUNT:function/your-function",
          "EventType": "viewer-request"
        }
      ]
    },
    "FieldLevelEncryptionId": "",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "GrpcConfig": {"Enabled": false}
  },
  "CacheBehaviors": {
    "Quantity": 3,
    "Items": [
      {
        "PathPattern": "/js/*",
        "TargetOriginId": "your-s3-bucket.s3.region.amazonaws.com",
        "TrustedSigners": {"Enabled": false, "Quantity": 0},
        "TrustedKeyGroups": {"Enabled": false, "Quantity": 0},
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["HEAD", "GET"],
          "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
      },
      {
        "PathPattern": "/styles/*",
        "TargetOriginId": "your-s3-bucket.s3.region.amazonaws.com",
        "TrustedSigners": {"Enabled": false, "Quantity": 0},
        "TrustedKeyGroups": {"Enabled": false, "Quantity": 0},
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["HEAD", "GET"],
          "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
      },
      {
        "PathPattern": "/fonts/*",
        "TargetOriginId": "your-s3-bucket.s3.region.amazonaws.com",
        "TrustedSigners": {"Enabled": false, "Quantity": 0},
        "TrustedKeyGroups": {"Enabled": false, "Quantity": 0},
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["HEAD", "GET"],
          "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {"Quantity": 0},
        "FunctionAssociations": {"Quantity": 0},
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
      }
    ]
  },
  "CustomErrorResponses": {"Quantity": 0},
  "Comment": "yourdomain.com",
  "Logging": {
    "Enabled": false,
    "IncludeCookies": false,
    "Bucket": "",
    "Prefix": ""
  },
  "PriceClass": "PriceClass_100",
  "Enabled": true,
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": false,
    "ACMCertificateArn": "arn:aws:acm:region:account:certificate/cert-id",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021",
    "Certificate": "arn:aws:acm:region:account:certificate/cert-id",
    "CertificateSource": "acm"
  },
  "Restrictions": {
    "GeoRestriction": {"RestrictionType": "none", "Quantity": 0}
  },
  "WebACLId": "",
  "HttpVersion": "http2",
  "IsIPV6Enabled": true,
  "ContinuousDeploymentPolicyId": "",
  "Staging": false
}
```

### 4. Apply the Configuration

```bash
# Get current ETag (required for update)
CURRENT_ETAG=$(aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID | jq -r '.ETag')

# Apply the update
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --distribution-config file://updated-distribution-config.json \
  --if-match $CURRENT_ETAG
```

### 5. Monitor Deployment

```bash
# Check deployment status (will show "InProgress" initially)
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID | jq '.Distribution.Status'

# Verify cache behaviors were added
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID | jq '.DistributionConfig.CacheBehaviors.Items[] | {PathPattern: .PathPattern, CachePolicyId: .CachePolicyId}'
```

## Cache Policy Details

The solution uses AWS Managed Cache Policy `658327ea-f89d-4fab-a63d-7e88639e58f6` ("Managed-CachingOptimized"):

- **Name**: Managed-CachingOptimized
- **DefaultTTL**: 86400 seconds (24 hours)
- **MaxTTL**: 31536000 seconds (1 year)
- **MinTTL**: 1 second
- **Compression**: Gzip and Brotli enabled
- **Query Strings**: Not forwarded
- **Headers**: None forwarded
- **Cookies**: None forwarded

## Expected Results

After deployment (5-15 minutes):

1. **Static assets will be cached for 24 hours by default**
2. **Browser cache headers will be set appropriately**
3. **Google PageSpeed Insights cache warnings will be resolved**
4. **Potential bandwidth savings of 792 KiB on repeat visits**

## Verification

### Test Cache Headers
```bash
# Test JavaScript file caching
curl -I https://yourdomain.com/js/main-[hash].js

# Test CSS file caching  
curl -I https://yourdomain.com/styles/main-[hash].css

# Test font file caching
curl -I https://yourdomain.com/fonts/[font-name].ttf
```

### Expected Response Headers
```
Cache-Control: max-age=86400
```

### Google PageSpeed Insights
Re-run the PageSpeed test to verify the "Use efficient cache lifetimes" warning is resolved.

## Troubleshooting

### Common Issues

1. **ETag Mismatch Error**: Get the current ETag before applying updates
2. **Path Pattern Issues**: Ensure your asset paths match the configured patterns
3. **Deployment Time**: Allow 5-15 minutes for changes to propagate

### Rollback Procedure

```bash
# Get current configuration
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID > backup-config.json

# Remove cache behaviors by setting Quantity to 0
# Edit the config file and reapply
```

## Architecture Considerations

- **Build Process**: Ensure your build process creates versioned/hashed filenames for cache busting
- **Asset Organization**: Organize assets in `/js/`, `/styles/`, and `/fonts/` directories
- **CDN Strategy**: Consider using longer cache times (1 year) with proper versioning

## Additional Optimizations

1. **Image Caching**: Add cache behavior for `/images/*` or `/assets/*`
2. **API Responses**: Configure appropriate caching for API endpoints
3. **HTML Caching**: Consider shorter cache times for HTML files (1 hour)

## References

- [AWS CloudFront Cache Behaviors](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesCacheBehavior)
- [AWS Managed Cache Policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html)
- [Google PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/)

---

**Implementation Date**: July 28, 2025  
**Distribution ID**: E1M9JT7AEV0YV1 (nash-and-smashed example)  
**Status**: Successfully deployed