# S3 & CloudFront Integration Check

This guide provides AWS CLI commands to verify that your S3 bucket and CloudFront distribution are working together for your static website.

---

## 1. Check S3 Bucket Public Access

```sh
aws s3api get-bucket-policy-status --bucket moon-lounge-webapp
```

Your S3 bucket policy status should shows "IsPublic": false, which means the bucket is not publicly accessible.

This is normal and recommended when using S3 with CloudFront and an Origin Access Identity (OAI) or Origin Access Control (OAC). CloudFront will still be able to access your files if it is configured with the correct permissions, even if the bucket is not public.

---

## 2. List S3 Bucket Contents

```sh
aws s3 ls s3://moon-lounge-webapp/
```

---

## 3. Get S3 Bucket Website Configuration (if using S3 website hosting)

```sh
aws s3api get-bucket-website --bucket moon-lounge-webapp
```

**Expected output:**

You should see something like:

```json
{
  "IndexDocument": {
    "Suffix": "index.html"
  }
}
```

This means S3 will serve `index.html` for directory requests (e.g., `/menu/` → `menu/index.html`).

If you see an error or missing configuration, your bucket is not set up for static website hosting.

---

## 4. Check CloudFront Distribution Status

```sh
aws cloudfront get-distribution --id E1M8KKNV7T5UPX
```

---

## 5. Get CloudFront Distribution Domain Name

```sh
aws cloudfront get-distribution --id E1M8KKNV7T5UPX --query 'Distribution.DomainName' --output text
```

---

## 6. Test File Delivery via CloudFront

Replace `<domain>` with the output from the previous command. For example, to test `index.html`:

```sh
curl -I https://<domain>/index.html
```

You should see `HTTP/1.1 200 OK` and `Via: CloudFront` headers.

---

## 7. Check S3 Bucket Permissions & Policy

### View S3 Bucket Policy

```sh
aws s3api get-bucket-policy --bucket moon-lounge-webapp --query 'Policy' --output text | jq .
```

### List S3 Bucket ACL (Access Control List)

```sh
aws s3api get-bucket-acl --bucket moon-lounge-webapp
```

### List S3 Object ACL (for a specific file, e.g. index.html)

```sh
aws s3api get-object-acl --bucket moon-lounge-webapp --key index.html
```

---

## 8. Test File Delivery Directly from S3 (if public)

```sh
curl -I https://moon-lounge-webapp.s3.amazonaws.com/index.html
```

---

## 8. (Optional) Invalidate CloudFront Cache

If you update files and want to force CloudFront to fetch the latest from S3:

```sh
aws cloudfront create-invalidation --distribution-id E1M8KKNV7T5UPX --paths '/*'
```

---

## 9. Check CloudFront Cache Behavior (Optional)

```sh
aws cloudfront get-distribution --id E1M8KKNV7T5UPX --query 'Distribution.DistributionConfig.CacheBehaviors.Items'
```

---

**Tip:**

- If you see files in S3 but not via CloudFront, check bucket policy, CloudFront origin settings, and cache invalidation.
- If you get 403/AccessDenied, check S3 bucket policy and CloudFront OAI/permissions.
