# Deploying a Static Website to AWS S3 with CloudFront

This guide shows how to create an S3 bucket for static website hosting, configure CORS, set up a bucket policy for CloudFront.

## ⚠️ Important: Replace All Placeholders

Before running commands, replace these placeholders with your actual values:
- `<your-bucket-name>` - Your unique S3 bucket name
- `<your-region>` - AWS region (e.g., us-east-1)
- `<your-oac-id>` - Origin Access Control ID from Step 9
- `<cloudfront-distribution-arn>` - Your CloudFront distribution ARN
- `<your-distribution-id>` - CloudFront distribution ID
- `<your-response-headers-policy-id>` - Response headers policy ID (create in CloudFront console or use managed policies)

---

## 1. Create the S3 Bucket

> **Note:** S3 bucket names must be globally unique across all AWS accounts, contain only lowercase letters, numbers, and hyphens, be 3-63 characters long, and cannot start/end with hyphens or contain periods for SSL compatibility.

```sh
# For us-east-1:
aws s3api create-bucket --bucket <your-bucket-name> --region us-east-1

# For other regions:
aws s3api create-bucket --bucket <your-bucket-name> --region <your-region> \
  --create-bucket-configuration LocationConstraint=<your-region>
```

---

## 2. Enable Static Website Hosting

```sh
aws s3api put-bucket-website --bucket <your-bucket-name> --website-configuration '{
  "IndexDocument": {"Suffix": "index.html"}
}'
```

---

## 3. Set CORS Configuration

```sh
aws s3api put-bucket-cors --bucket <your-bucket-name> --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedOrigins": [
        "https://d2oj202orlmxbf.cloudfront.net",
        "http://localhost:3001",
        "*"
      ],
      "MaxAgeSeconds": 3000
    }
  ]
}'
```

---

## 4. Set Public Access Block (Do this BEFORE setting bucket policy)

```sh
aws s3api put-public-access-block --bucket <your-bucket-name> \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false
```

---

## 5. Set Bucket Policy for CloudFront Access

Replace `<cloudfront-distribution-arn>` with your CloudFront distribution ARN (you'll get this after creating the distribution).

```sh
aws s3api put-bucket-policy --bucket <your-bucket-name> --policy '{
  "Version": "2008-10-17",
  "Id": "PolicyForCloudFrontPrivateContent",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {"Service": "cloudfront.amazonaws.com"},
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<your-bucket-name>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "<cloudfront-distribution-arn>"
        }
      }
    }
  ]
}'
```

---

## 6. Set Bucket ACL (Default: Owner Full Control)

```sh
aws s3api put-bucket-acl --bucket <your-bucket-name> --acl private
```

---

## 7. Upload Your Website Files with Cache Headers

```sh
# HTML files - no cache
aws s3 sync ./public s3://<your-bucket-name>/ \
  --exclude "*" --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate"

# Static assets - long cache
aws s3 sync ./public s3://<your-bucket-name>/ \
  --exclude "*.html" \
  --cache-control "max-age=31536000"
```

---

## 8. Invalidate CloudFront Cache (After Deployment)

```sh
aws cloudfront create-invalidation --distribution-id <your-distribution-id> --paths "/*"
```

---

## 9. Create Origin Access Control (OAC) for CloudFront

Before creating the CloudFront distribution, create an OAC:

```sh
aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "<your-bucket-name>-OAC",
    "Description": "OAC for <your-bucket-name>",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }'
```

Save the returned OAC ID for use in the CloudFront distribution configuration.

---

## 10. Create a CloudFront Distribution (with Behaviors)

> **SPA Routing Note:** For single-page applications, you have two origin options:
> - **S3 REST endpoint** (e.g., `bucket-name.s3.us-east-1.amazonaws.com`) - Use with CloudFront error page handling (recommended)
> - **S3 Website endpoint** (e.g., `bucket-name.s3-website-us-east-1.amazonaws.com`) - Use if you want S3 to handle routing/errors
> 
> Most SPAs work best with the REST endpoint + CloudFront's CustomErrorResponses for cleaner URLs.

You can create a CloudFront distribution using the AWS CLI and a JSON config file. Below is a sample `cloudfront-config.json` template that includes SPA error handling:

### Sample cloudfront-config.json

```json
{
  "CallerReference": "<unique-string>",
  "Comment": "Static website distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-<your-bucket-name>",
        "DomainName": "<your-bucket-name>.s3.us-east-1.amazonaws.com",
        "OriginAccessControlId": "<your-oac-id>",
        "OriginPath": "",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-<your-bucket-name>",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
    "Compress": true,
    "SmoothStreaming": false,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "TrustedKeyGroups": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CacheBehaviors": {
    "Quantity": 9,
    "Items": [
      {
        "PathPattern": "/js/*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/styles/*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/fonts/*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/js/*.map",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/videos/*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-video-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": false,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/images/*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/favicon*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/apple-touch*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      },
      {
        "PathPattern": "/site.webma*",
        "TargetOriginId": "S3-<your-bucket-name>",
        "ViewerProtocolPolicy": "redirect-to-https",
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "ResponseHeadersPolicyId": "<your-pwa-response-headers-policy-id>",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
        },
        "Compress": true,
        "SmoothStreaming": false,
        "TrustedSigners": {
          "Enabled": false,
          "Quantity": 0
        },
        "TrustedKeyGroups": {
          "Enabled": false,
          "Quantity": 0
        }
      }
    ]
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponseCode": 200,
        "ResponsePagePath": "/index.html",
        "ErrorCachingMinTTL": 0
      },
      {
        "ErrorCode": 404,
        "ResponseCode": 200,
        "ResponsePagePath": "/index.html",
        "ErrorCachingMinTTL": 0
      }
    ]
  },
  "ViewerCertificate": { 
    "CloudFrontDefaultCertificate": true 
  }
}
```

Replace placeholders with your actual values. You can get policy IDs from the AWS Console or CLI. Add `Aliases` and a custom `ViewerCertificate` if you use a custom domain.

### Create the Distribution

```sh
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

---

## Common Response Headers Policy IDs (AWS Managed)

- **Managed-CachingOptimized**: `658327ea-f89d-4fab-a63d-7e88639e58f6`
- **Managed-CachingDisabled**: `4135ea2d-6df8-44a3-9df3-4b5a84be39ad`
- **Managed-CORS-and-SecurityHeadersPolicy**: `e61eb60c-9c35-4d20-a928-2b84e02af89c`
- **Managed-CORS-with-preflight**: `5cc3b908-e619-4b99-88e5-2cf7f45965bd`

---

## Notes

- The above settings are optimized for static React/Webpack applications with SPA routing support.
- Ensure all placeholders are replaced with your actual AWS resource values.
- The order of operations matters - particularly setting public access block before bucket policy.
- For production deployments, consider setting up custom domains with Route 53 and ACM certificates.
- For more details, see the [AWS S3 Static Website Hosting Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html).