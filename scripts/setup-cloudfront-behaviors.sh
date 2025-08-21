#!/bin/bash

# Fixed CloudFront Behaviors Setup Script for Moon Lounge
set -e

# Configuration
DISTRIBUTION_ID="E1M8KKNV7T5UPX"

echo "🚀 Setting up CloudFront behaviors for Moon Lounge..."
echo "Distribution ID: $DISTRIBUTION_ID"

# The policies were already created successfully, let's use them
STATIC_POLICY_ID="3e508d99-2c47-49ae-835c-9b890dd44da4"
VIDEO_POLICY_ID="1e4534ca-a864-4ca5-ae20-7201a7eccced"
PWA_POLICY_ID="45827936-64f4-4919-bfb4-e27c2b001f5c"

echo "📋 Using existing policy IDs:"
echo "Static Assets Policy ID: $STATIC_POLICY_ID"
echo "Video Assets Policy ID: $VIDEO_POLICY_ID"
echo "PWA Assets Policy ID: $PWA_POLICY_ID"

# Get current distribution configuration with proper JSON handling
echo "📥 Getting current distribution configuration..."

ETAG=$(aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --query 'ETag' --output text)
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --query 'DistributionConfig' > current-config.json

echo "Current ETag: $ETAG"

# Create properly formatted JSON configuration
echo "🔧 Creating new distribution configuration..."

# Extract values with proper quoting
CALLER_REFERENCE=$(jq -r '.CallerReference' current-config.json)
DEFAULT_ROOT_OBJECT=$(jq -r '.DefaultRootObject' current-config.json)
COMMENT=$(jq -r '.Comment' current-config.json)
ENABLED=$(jq '.Enabled' current-config.json)
PRICE_CLASS=$(jq -r '.PriceClass' current-config.json)
HTTP_VERSION=$(jq -r '.HttpVersion' current-config.json)
IPV6_ENABLED=$(jq '.IsIPV6Enabled' current-config.json)
STAGING=$(jq '.Staging' current-config.json)
WEB_ACL_ID=$(jq -r '.WebACLId // ""' current-config.json)

# Get the correct Origin ID from current config
ORIGIN_ID=$(jq -r '.Origins.Items[0].Id' current-config.json)

cat > updated-config.json << EOF
{
  "CallerReference": "$CALLER_REFERENCE",
  "Aliases": $(jq '.Aliases' current-config.json),
  "DefaultRootObject": "$DEFAULT_ROOT_OBJECT",
  "Comment": "$COMMENT",
  "Enabled": $ENABLED,
  "Origins": $(jq '.Origins' current-config.json),
  "PriceClass": "$PRICE_CLASS",
  "CacheBehaviors": {
    "Quantity": 9,
    "Items": [
      {
        "PathPattern": "/js/*",
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 3,
          "Items": ["GET", "HEAD", "OPTIONS"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": false,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$VIDEO_POLICY_ID",
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
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "PathPattern": "/apple-touch-icon*",
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "ResponseHeadersPolicyId": "$STATIC_POLICY_ID",
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
        "PathPattern": "/site.webmanifest",
        "TargetOriginId": "$ORIGIN_ID",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
          "Quantity": 0
        },
        "FunctionAssociations": {
          "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "CachePolicyId": "83da9c7e-98b4-4e11-a168-04f0df8e2c65",
        "ResponseHeadersPolicyId": "$PWA_POLICY_ID",
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
  "DefaultCacheBehavior": $(jq '.DefaultCacheBehavior' current-config.json),
  "CustomErrorResponses": $(jq '.CustomErrorResponses' current-config.json),
  "Logging": $(jq '.Logging' current-config.json),
  "WebACLId": "$WEB_ACL_ID",
  "ViewerCertificate": $(jq '.ViewerCertificate' current-config.json),
  "Restrictions": $(jq '.Restrictions' current-config.json),
  "HttpVersion": "$HTTP_VERSION",
  "IsIPV6Enabled": $IPV6_ENABLED,
  "Staging": $STAGING
}
EOF

# Validate JSON
echo "🔍 Validating JSON..."
jq . updated-config.json > /dev/null || {
  echo "❌ JSON validation failed"
  cat updated-config.json
  exit 1
}

# Update distribution
echo "🚀 Updating CloudFront distribution..."

aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://updated-config.json \
    --if-match "$ETAG" \
    --query 'Distribution.Status' \
    --output text

echo "✅ Distribution update initiated! Status should be 'InProgress'"

# Create invalidation for immediate testing
echo "🔄 Creating invalidation for immediate testing..."

aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/videos/*" "/images/*" "/favicon*" "/apple-touch-icon*" "/site.webmanifest" \
    --query 'Invalidation.Id' \
    --output text

# Cleanup
rm -f current-config.json updated-config.json

echo ""
echo "🎉 CloudFront behaviors setup complete!"
echo ""
echo "📋 Summary of changes:"
echo "  ✅ Used existing response headers policies"
echo "  ✅ Added behaviors for: /videos/*, /images/*, /favicon*, /apple-touch-icon*, /site.webmanifest"
echo "  ✅ Applied CORS headers to all static content"
echo "  ✅ Set proper caching policies"
echo "  ✅ Created invalidation for immediate testing"
echo ""
echo "⏱️  Distribution update typically takes 5-15 minutes to deploy globally"
echo ""
echo "🧪 Test videos after deployment:"
echo "curl -I 'https://d2oj202orlmxbf.cloudfront.net/videos/moon-lounge-hookah-cocktails-food-nightlife-sterling-va.mp4'"
echo ""
echo "📊 Monitor deployment status:"
echo "aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"