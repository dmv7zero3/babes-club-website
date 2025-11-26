# Lambda Indentation Bug Fix & Deployment Guide

## 🐞 What Was Fixed

The critical bug was **incorrect indentation** that made all the update logic unreachable:

### Before (Broken)

```python
    except Exception as exc:
        logger.exception(f"Failed to read profile for {user_id}: {exc}")
        return _response(500, {"error": "Database error"}, cors_origin=cors_origin)

        # ❌ This code was INSIDE the except block (after return = unreachable!)
        updates: Dict[str, Any] = {}
        for key, val in (body or {}).items():
            ...
```

### After (Fixed)

```python
    except Exception as exc:
        logger.exception(f"Failed to read profile for {user_id}: {exc}")
        return _response(500, {"error": "Database error"}, cors_origin=cors_origin)

    # ✅ Now correctly OUTSIDE the except block
    updates: Dict[str, Any] = {}
    for key, val in (body or {}).items():
        ...
```

## 🚀 Deploy Commands

```bash
# 1. Navigate to the Lambda directory
cd AWS_Lambda_Functions/babes-website-dashboard-update-profile

# 2. Replace the file with the fixed version
# (copy the downloaded file here)

# 3. Create deployment package
zip -r function.zip lambda_function.py

# 4. Deploy to AWS
aws lambda update-function-code \
  --function-name babes-website-dashboard-update-profile \
  --zip-file fileb://function.zip \
  --region us-east-1

# 5. Wait for update to complete
aws lambda wait function-updated \
  --function-name babes-website-dashboard-update-profile \
  --region us-east-1

# 6. Monitor logs
aws logs tail /aws/lambda/babes-website-dashboard-update-profile --follow
```

## ✅ After Deploying

You should now see logs like:

```
[INFO] Found existing profile with keys: [...]
[INFO] Adding update for field: displayName
[INFO] Adding update for field: shippingAddress
[INFO] Update expression: SET displayName = :displayName, ...
[INFO] Executing transaction with 1 items
[INFO] Transaction completed successfully
[INFO] Successfully updated profile for user: ...
[INFO] Returning response: 200
```

---

**This markdown file documents the bug, the fix, and the deployment steps for future reference.**
