# Nash & Smashed AWS Security Implementation Plan
## Building on Existing Lambda Security with Defense-in-Depth

---

## 🎯 **Current Security Status**
✅ **Lambda Functions:** Enterprise-level security implemented
- Rate limiting (5/hour, 10/day per IP)
- Input sanitization & spam detection
- Honeypot protection
- Enhanced validation
- Comprehensive logging

## 🛡️ **Next Layer: Infrastructure Security**

---

## 📋 **Priority 1: Immediate Implementation (Free/Low Cost)**

### **🪣 S3 Bucket Hardening** 
**Impact: 🔥🔥🔥 | Cost: FREE**

#### **Actions to Take Today:**

1. **Block All Public Access:**
   ```bash
   # AWS CLI commands:
   aws s3api put-public-access-block \
     --bucket nash-and-smashed-website \
     --public-access-block-configuration \
     BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
   ```

2. **Enable Default Encryption:**
   ```json
   {
     "Rules": [{
       "ApplyServerSideEncryptionByDefault": {
         "SSEAlgorithm": "AES256"
       }
     }]
   }
   ```

3. **Enforce HTTPS Only Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Deny",
       "Principal": "*",
       "Action": "s3:*",
       "Resource": [
         "arn:aws:s3:::nash-and-smashed-website/*",
         "arn:aws:s3:::nash-and-smashed-website"
       ],
       "Condition": {
         "Bool": {"aws:SecureTransport": "false"}
       }
     }]
   }
   ```

4. **Enable Versioning:**
   ```bash
   aws s3api put-bucket-versioning \
     --bucket nash-and-smashed-website \
     --versioning-configuration Status=Enabled
   ```

### **🌐 CloudFront Security Upgrade**
**Impact: 🔥🔥🔥 | Cost: FREE**

#### **Actions to Take Today:**

1. **Upgrade to Origin Access Control (OAC):**
   - Replace deprecated OAI with new OAC
   - Update S3 bucket policy to only allow OAC access

2. **Add Security Headers Policy:**
   ```json
   {
     "Name": "NashSecurityHeaders",
     "SecurityHeadersConfig": {
       "StrictTransportSecurity": {
         "AccessControlMaxAgeSec": 31536000,
         "IncludeSubdomains": true
       },
       "ContentTypeOptions": {"Override": true},
       "FrameOptions": {"FrameOption": "DENY", "Override": true},
       "ReferrerPolicy": {"ReferrerPolicy": "strict-origin-when-cross-origin", "Override": true},
       "ContentSecurityPolicy": {
         "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:",
         "Override": true
       }
     }
   }
   ```

3. **Restrict HTTP Methods:**
   - Only allow GET, HEAD, OPTIONS for website content
   - Block PUT, DELETE, POST to static assets

### **🔐 API Gateway Hardening**
**Impact: 🔥🔥 | Cost: FREE**

#### **Actions to Take Today:**

1. **Add Throttling (Additional Layer):**
   ```json
   {
     "BurstLimit": 20,
     "RateLimit": 10
   }
   ```

2. **Strict CORS Configuration:**
   ```json
   {
     "AllowedOrigins": ["https://nashandsmashed.com", "https://www.nashandsmashed.com"],
     "AllowedMethods": ["POST", "OPTIONS"],
     "AllowedHeaders": ["Content-Type", "X-Amz-Date", "Authorization"],
     "MaxAge": 86400
   }
   ```

3. **Request Validation Schemas:**
   ```json
   {
     "FranchiseFormSchema": {
       "type": "object",
       "required": ["firstName", "lastName", "email", "phone"],
       "properties": {
         "firstName": {"type": "string", "maxLength": 100},
         "lastName": {"type": "string", "maxLength": 100},
         "email": {"type": "string", "format": "email"},
         "phone": {"type": "string", "pattern": "^[0-9\\-\\(\\)\\+\\s]{10,15}$"}
       }
     }
   }
   ```

---

## 📋 **Priority 2: High Impact Implementation (Low Cost)**

### **🛡️ AWS WAF for CloudFront**
**Impact: 🔥🔥🔥 | Cost: ~$5-15/month**

#### **Managed Rule Groups to Enable:**
```json
{
  "ManagedRuleGroups": [
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": {"None": {}}
    },
    {
      "Name": "AWSManagedRulesKnownBadInputsRuleSet", 
      "Priority": 2,
      "OverrideAction": {"None": {}}
    },
    {
      "Name": "AWSManagedRulesBotControlRuleSet",
      "Priority": 3,
      "OverrideAction": {"None": {}}
    }
  ]
}
```

#### **Custom Rules for Nash & Smashed:**
```json
{
  "CustomRules": [
    {
      "Name": "BlockSuspiciousCountries",
      "Priority": 10,
      "Statement": {
        "GeoMatchStatement": {
          "CountryCodes": ["CN", "RU", "KP"]
        }
      },
      "Action": {"Block": {}}
    },
    {
      "Name": "RateLimitPerIP",
      "Priority": 20,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 100,
          "AggregateKeyType": "IP"
        }
      },
      "Action": {"Block": {}}
    }
  ]
}
```

### **📊 CloudWatch Enhanced Monitoring**
**Impact: 🔥🔥 | Cost: ~$5-10/month**

#### **Critical Alarms to Set Up:**
```json
{
  "Alarms": [
    {
      "Name": "HighLambdaErrors",
      "MetricName": "Errors",
      "Threshold": 5,
      "Period": 300,
      "ComparisonOperator": "GreaterThanThreshold"
    },
    {
      "Name": "UnauthorizedAPIGatewayCalls", 
      "MetricName": "4XXError",
      "Threshold": 10,
      "Period": 300
    },
    {
      "Name": "WAFBlockedRequests",
      "MetricName": "BlockedRequests",
      "Threshold": 50,
      "Period": 300
    }
  ]
}
```

### **🔍 CloudTrail Data Events**
**Impact: 🔥🔥 | Cost: ~$5-10/month**

#### **Enable for Critical Resources:**
```json
{
  "DataEvents": [
    {
      "ResourceType": "AWS::S3::Object",
      "ResourceARNs": ["arn:aws:s3:::nash-and-smashed-website/*"],
      "IncludeManagementEvents": true,
      "ReadWriteType": "All"
    },
    {
      "ResourceType": "AWS::Lambda::Function", 
      "ResourceARNs": ["arn:aws:lambda:*:*:function:nashsmash-*"],
      "IncludeManagementEvents": true
    }
  ]
}
```

---

## 📋 **Priority 3: Advanced Security (Medium Cost)**

### **🔍 AWS GuardDuty**
**Impact: 🔥🔥 | Cost: ~$20-40/month**

- **30-day free trial** - start here
- Automatically detects threats across your AWS account
- Monitors for compromised instances, cryptocurrency mining, data exfiltration

### **⚙️ AWS Config**
**Impact: 🔥🔥 | Cost: ~$10-25/month**

#### **Essential Config Rules:**
```json
{
  "ConfigRules": [
    "s3-bucket-public-read-prohibited",
    "s3-bucket-public-write-prohibited", 
    "s3-bucket-ssl-requests-only",
    "cloudfront-origin-access-identity-enabled",
    "lambda-concurrency-check",
    "api-gw-execution-logging-enabled"
  ]
}
```

### **🌐 Route 53 DNSSEC**
**Impact: 🔥 | Cost: FREE**

- Enable DNSSEC for your domain
- Protects against DNS hijacking and cache poisoning

---

## 📋 **Implementation Roadmap**

### **Week 1: Free Security Hardening**
- [ ] ✅ S3 bucket public access block
- [ ] ✅ S3 encryption and HTTPS enforcement
- [ ] ✅ CloudFront OAC upgrade
- [ ] ✅ CloudFront security headers
- [ ] ✅ API Gateway CORS tightening
- [ ] ✅ Basic CloudWatch alarms

### **Week 2: WAF Implementation**
- [ ] ✅ AWS WAF setup on CloudFront
- [ ] ✅ Enable managed rule groups
- [ ] ✅ Configure custom geo-blocking rules
- [ ] ✅ Set up WAF monitoring and alerts

### **Week 3: Enhanced Monitoring**
- [ ] ✅ CloudTrail data events for S3/Lambda
- [ ] ✅ Advanced CloudWatch metric filters
- [ ] ✅ SNS alert topics for security events
- [ ] ✅ GuardDuty 30-day trial

### **Week 4: Advanced Configuration**
- [ ] ✅ AWS Config rule deployment
- [ ] ✅ Route 53 DNSSEC enablement
- [ ] ✅ Security Hub integration
- [ ] ✅ Incident response automation

---

## 🎯 **Expected Security Posture After Implementation**

### **Current State:**
- ✅ **Application Layer:** Enterprise-level Lambda security
- ❌ **Infrastructure Layer:** Basic AWS defaults

### **Future State:**
- ✅ **Application Layer:** Enterprise-level Lambda security
- ✅ **Infrastructure Layer:** Defense-in-depth AWS security
- ✅ **Monitoring Layer:** Comprehensive threat detection
- ✅ **Response Layer:** Automated incident handling

---

## 💰 **Monthly Cost Breakdown**

| Security Layer | Monthly Cost | Impact |
|---------------|-------------|---------|
| **Priority 1 (Free)** | $0 | 🔥🔥🔥 |
| **AWS WAF** | $5-15 | 🔥🔥🔥 |
| **CloudWatch Enhanced** | $5-10 | 🔥🔥 |
| **CloudTrail Data Events** | $5-10 | 🔥🔥 |
| **GuardDuty** | $20-40 | 🔥🔥 |
| **AWS Config** | $10-25 | 🔥🔥 |
| **Total Security Investment** | **$45-100/month** | **🔥🔥🔥** |

---

## 🔄 **Integration with Existing Lambda Security**

Your existing Lambda security becomes the **final layer** in a comprehensive defense strategy:

```
Internet Traffic
    ↓
1. Route 53 (DNSSEC) → DNS protection
    ↓  
2. CloudFront + WAF → DDoS, geo-blocking, bot protection
    ↓
3. API Gateway → Throttling, CORS, request validation
    ↓
4. Lambda Functions → Rate limiting, spam detection, input sanitization
    ↓
5. DynamoDB/S3 → Encrypted storage with access controls
```

---

## 🚀 **Quick Start Commands**

### **S3 Security (Run Today):**
```bash
# Block public access
aws s3api put-public-access-block --bucket YOUR_BUCKET --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable versioning
aws s3api put-bucket-versioning --bucket YOUR_BUCKET --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption --bucket YOUR_BUCKET --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### **CloudWatch Alarms (Run Today):**
```bash
# High Lambda errors alarm
aws cloudwatch put-metric-alarm --alarm-name "Nash-HighLambdaErrors" --alarm-description "Lambda function errors" --metric-name Errors --namespace AWS/Lambda --statistic Sum --period 300 --threshold 5 --comparison-operator GreaterThanThreshold
```

---

## ✅ **Success Metrics**

After implementation, you'll have:
- **99.9% uptime** through redundancy and DDoS protection
- **Zero successful bot attacks** through WAF + Lambda security
- **Real-time threat detection** through GuardDuty
- **Automated compliance** through Config rules
- **Complete audit trail** through CloudTrail
- **<1 second response times** maintained through optimized security

---

*This plan transforms your Nash & Smashed website from having great application security to having enterprise-grade infrastructure security across all AWS layers, while maintaining cost-effectiveness for a growing franchise business.*