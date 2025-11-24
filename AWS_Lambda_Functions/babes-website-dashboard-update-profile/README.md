# 🔧 Babes Club - Update Profile Lambda

## 📋 Overview

This Lambda handles authenticated profile updates from the React dashboard, with robust error handling, CORS support, and full debugging visibility.

## 🎯 What Was Fixed

**Critical Issues Resolved:**

- ✅ Module-level logger initialization (prevents silent crash)
- ✅ Comprehensive exception handling (all errors logged)
- ✅ CORS preflight (OPTIONS) handling (no more browser CORS errors)
- ✅ Extensive debugging logs (full visibility)
- ✅ Proper error responses (valid JSON, CORS headers)

## 🚀 Quick Deploy

1. **Replace Lambda Code**
   - Overwrite `AWS_Lambda_Functions/babes-website-dashboard-update-profile/lambda_function.py` with the fixed code.
2. **Deploy to AWS**
   ```bash
   cd AWS_Lambda_Functions/babes-website-dashboard-update-profile
   zip -r function.zip lambda_function.py
   aws lambda update-function-code \
     --function-name babes-website-dashboard-update-profile \
     --zip-file fileb://function.zip \
     --region us-east-1
   aws lambda wait function-updated \
     --function-name babes-website-dashboard-update-profile \
     --region us-east-1
   ```
3. **Test & Monitor**
   ```bash
   aws logs tail /aws/lambda/babes-website-dashboard-update-profile --follow
   ```

## 📝 Handler Contract

- **Runtime:** Python 3.12
- **Entry point:** `lambda_function.lambda_handler`
- **Event source:** API Gateway REST path `/dashboard/update-profile` (POST) with JWT authorizer attached
- **Request body:** Partial profile payload (name, email, shipping, wallet, avatar, etc.)
- **Response:** Updated profile document

## 🔑 Environment Variables

| Name                | Required | Purpose                                                                 |
| ------------------- | -------- | ----------------------------------------------------------------------- |
| `COMMERCE_TABLE`    | ✅       | Table storing profile records.                                          |
| `CORS_ALLOW_ORIGIN` | ✅       | CORS header list (e.g. `http://localhost:3001,https://yourdomain.com`). |
| `AUDIT_LOG_STREAM`  | ➕       | Optional log destination identifier for profile changes.                |

## 🛠️ Features

- Update allowed fields: `displayName`, `phone`, `shippingAddress`, `dashboardSettings`, `preferredWallet`
- Email change with 4-day rate limit and availability check
- Atomic DynamoDB transactions
- Sensitive field filtering
- OPTIONS preflight and CORS headers on all responses
- Full execution trace in CloudWatch logs

## 🧪 Testing Scenarios

1. **Basic Profile Update**
   ```json
   { "displayName": "John Doe", "phone": "+1234567890" }
   ```
2. **Shipping Address Update**
   ```json
   {
     "shippingAddress": {
       "line1": "123 Main St",
       "city": "New York",
       "state": "NY",
       "postalCode": "10001",
       "country": "US"
     }
   }
   ```
3. **Email Change (First Time)**
   ```json
   { "email": "newemail@example.com" }
   ```
4. **Email Change (Rate Limited)**
   (within 4 days of previous change)
   **Expected:** 429 Too Many Requests
5. **Email Already in Use**
   **Expected:** 409 Conflict
6. **No Fields to Update**
   `{}` → 400 Bad Request
7. **Invalid JSON**
   `{invalid json}` → 400 Bad Request
8. **Missing Authorization**
   (No token) → 401 Unauthorized

## 🆘 Troubleshooting

- **CORS errors?** Ensure API Gateway has OPTIONS method, deploy API, and set `CORS_ALLOW_ORIGIN`.
- **No logs?** Check IAM role for CloudWatch permissions, increase Lambda timeout.
- **Profile not found?** Verify user exists in DynamoDB and authorizer passes `userId`.

## ✅ Verification Checklist

- [ ] Lambda code deployed
- [ ] Environment variables set (`COMMERCE_TABLE`, `CORS_ALLOW_ORIGIN`)
- [ ] API Gateway has OPTIONS method
- [ ] Authorizer returns userId in context
- [ ] DynamoDB table accessible
- [ ] No CORS errors in browser console
- [ ] CloudWatch logs show "LAMBDA INVOCATION START"
- [ ] Profile updates successfully in DynamoDB
- [ ] UI updates with new profile data
- [ ] Error cases show meaningful messages

## 🔒 Required API Gateway & Auth Setup

- API Gateway POST and OPTIONS methods must be present for `/dashboard/update-profile`.
- Method response for POST must include:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Headers`
  - `Access-Control-Allow-Methods`
- Lambda must return these CORS headers for all responses (success and error).
- API Gateway must attach a CUSTOM authorizer that returns `userId` in the request context.
- Frontend must send a valid `Authorization` header (JWT/session token).
- DynamoDB table must be accessible and have correct schema for user profiles and email lookups.

## 📖 Documentation

- **lambda_function.py** – Main Lambda code
- **QUICK_START.md** – 3-step deploy guide
- **DEPLOYMENT_GUIDE.md** – Full deployment/testing instructions
- **FIX_SUMMARY.md** – Detailed explanation of all changes
- **test_lambda.py** – Local testing script

---

**Ready to deploy?** Start with **QUICK_START.md**!

**Need more details?** See **DEPLOYMENT_GUIDE.md**!

**Want to understand the changes?** Read **FIX_SUMMARY.md**!
