# Email Update Fix - Deployment Guide

## 🎯 What This Fix Does

1. **Properly deletes old EMAIL# lookup records** when email changes
2. **Issues new JWT tokens** with updated email after email change
3. **Returns tokens to frontend** so session can be updated atomically
4. **Adds detailed logging** for each transaction operation

---

## 📁 Files Included

| File | Purpose |
|------|---------|
| `lambda_function.py` | Fixed Lambda with proper email deletion + token issuance |
| `cleanup_orphaned_emails.py` | One-time script to clean up existing orphaned records |
| `frontend_integration_guide.ts` | Code examples for frontend session handling |

---

## 🚀 Deployment Steps

### Step 1: Clean Up Orphaned Records (One-Time)

Before deploying the fix, clean up existing orphaned EMAIL# records:

```bash
# First, do a dry run to see what will be deleted
python cleanup_orphaned_emails.py --dry-run

# If the output looks correct, execute the cleanup
python cleanup_orphaned_emails.py --execute
```

**Expected output:**
```
📧 Scanning for EMAIL# lookup records...
   Found 2 EMAIL# records

🔍 DRY RUN - Found 1 orphaned EMAIL# records:

  1. EMAIL#webdev@marketbrewer.com
     User ID: 510c747cacb54bcea7127d3fd7e40e30
     Reason: Email mismatch: lookup=webdev@marketbrewer.com, user's current email=newemail@example.com
     ⏸️  Would delete (dry run)
```

### Step 2: Deploy the Lambda

```bash
# Navigate to the Lambda directory
cd AWS_Lambda_Functions/babes-website-dashboard-update-profile

# Backup the current version
cp lambda_function.py lambda_function.py.backup

# Replace with the fixed version
cp /path/to/new/lambda_function.py .

# Create deployment package
zip -r function.zip lambda_function.py

# Deploy to AWS
aws lambda update-function-code \
  --function-name babes-website-dashboard-update-profile \
  --zip-file fileb://function.zip \
  --region us-east-1

# Wait for deployment to complete
aws lambda wait function-updated \
  --function-name babes-website-dashboard-update-profile \
  --region us-east-1

echo "✅ Lambda deployed successfully"
```

### Step 3: Verify Environment Variables

Ensure these environment variables are set in the Lambda:

```bash
aws lambda get-function-configuration \
  --function-name babes-website-dashboard-update-profile \
  --region us-east-1 \
  --query 'Environment.Variables' \
  --output table
```

Required variables:
- `COMMERCE_TABLE` - DynamoDB table name
- `CORS_ALLOW_ORIGIN` - Allowed CORS origins
- `JWT_SECRET` - JWT signing secret (for new token issuance)
- `REFRESH_SECRET` - Refresh token secret (for new token issuance)

If `JWT_SECRET` or `REFRESH_SECRET` are missing, add them:

```bash
aws lambda update-function-configuration \
  --function-name babes-website-dashboard-update-profile \
  --environment "Variables={COMMERCE_TABLE=babesclub-commerce,CORS_ALLOW_ORIGIN=http://localhost:3001,JWT_SECRET=your-secret,REFRESH_SECRET=your-refresh-secret}" \
  --region us-east-1
```

### Step 4: Update Frontend

Apply the changes from `frontend_integration_guide.ts` to your React app:

1. **Update `session.ts`** - Add the `updateSessionTokens` helper function
2. **Update your API client** - Handle the new response format with tokens
3. **Update `AuthContext.tsx`** - Update local state when email changes

### Step 5: Test the Fix

#### Test 1: Email Change Flow
```bash
# Monitor Lambda logs
aws logs tail /aws/lambda/babes-website-dashboard-update-profile --follow
```

Then in the frontend:
1. Log in with a user
2. Go to profile settings
3. Change the email to a new value
4. Submit the form

**Expected logs:**
```
[INFO] Email change request: 'newemail@example.com' (current: 'oldemail@example.com')
[INFO] Checking if email newemail@example.com is available
[INFO] Email newemail@example.com is available
[INFO] Email will change from 'oldemail@example.com' to 'newemail@example.com'
[INFO] === EMAIL CHANGE TRANSACTION ===
[INFO] Old email: oldemail@example.com
[INFO] New email: newemail@example.com
[INFO] Added PUT transaction for EMAIL#newemail@example.com
[INFO] Added DELETE transaction for EMAIL#oldemail@example.com
[INFO] === EXECUTING TRANSACTION ===
[INFO] Transaction has 3 items:
[INFO]   Item 1: Update
[INFO]   Item 2: Put
[INFO]   Item 3: Delete
[INFO] Executing transact_write_items with 3 formatted items
[INFO] Transaction completed successfully
[INFO] Email changed - issuing new tokens
[INFO] Issued new tokens for user xxx with email newemail@example.com
[INFO] New tokens issued successfully
```

#### Test 2: Verify Database State
```bash
# Check that only the new email lookup exists
aws dynamodb get-item \
  --table-name babesclub-commerce \
  --key '{"PK": {"S": "EMAIL#newemail@example.com"}, "SK": {"S": "LOOKUP"}}' \
  --region us-east-1

# Verify old email lookup is GONE
aws dynamodb get-item \
  --table-name babesclub-commerce \
  --key '{"PK": {"S": "EMAIL#oldemail@example.com"}, "SK": {"S": "LOOKUP"}}' \
  --region us-east-1
# Should return empty {}
```

#### Test 3: Frontend Session
After email change:
1. Open browser DevTools → Application → Session Storage
2. Check the session object has new tokens with the new email
3. Verify you can still make authenticated requests

---

## 🔍 Troubleshooting

### Issue: "Email already in use" (409)

**Cause:** Orphaned EMAIL# record exists

**Fix:** Run the cleanup script:
```bash
python cleanup_orphaned_emails.py --execute
```

### Issue: Token issuance fails after email change

**Cause:** Missing `JWT_SECRET` or `REFRESH_SECRET` environment variables

**Fix:** Add the environment variables to the Lambda (see Step 3)

### Issue: Frontend doesn't update session

**Cause:** Frontend not handling `emailChanged` response

**Fix:** Implement the `updateSessionTokens` function from the integration guide

### Issue: Transaction fails with "ConditionalCheckFailed"

**Cause:** Race condition - someone else took the email between check and transaction

**Fix:** This is handled gracefully - user sees "Email already in use" error

---

## 📋 Response Format Reference

### Normal Profile Update (no email change)
```json
{
  "profile": {
    "userId": "xxx",
    "email": "user@example.com",
    "displayName": "User Name",
    "updatedAt": "2025-11-26T..."
  }
}
```

### Email Change Response
```json
{
  "profile": {
    "userId": "xxx",
    "email": "newemail@example.com",
    "displayName": "User Name",
    "emailChangedAt": "2025-11-26T...",
    "updatedAt": "2025-11-26T..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresAt": 1764174774,
  "emailChanged": true
}
```

### Email Change with Token Error
```json
{
  "profile": { ... },
  "emailChanged": true,
  "tokenError": "Profile updated but failed to issue new tokens. Please log out and log back in."
}
```

---

## ✅ Verification Checklist

- [ ] Cleanup script run successfully
- [ ] Lambda deployed
- [ ] Environment variables set (including JWT_SECRET, REFRESH_SECRET)
- [ ] Frontend updated with new response handling
- [ ] Email change tested end-to-end
- [ ] Old EMAIL# record deleted after change
- [ ] New tokens received in frontend
- [ ] Session updated with new email
- [ ] Can still make authenticated requests after email change
