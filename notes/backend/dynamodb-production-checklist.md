# DynamoDB Production Checklist

Table: `babesclub-commerce` (single-table design with `PK`/`SK` keys and TTL attribute `expiresAt`). Use this list before promoting the table to a live ecommerce environment.

## 1. Table Configuration

- [ ] **Verify billing mode**: `PAY_PER_REQUEST` should remain enabled for spiky launch traffic; switch only if consistent throughput justifies provisioned capacity.
- [ ] **Confirm encryption**: Table must show `SSEType=KMS` (default AWS-managed key ok). If using a customer key, rotate and update IAM policies.
- [ ] **TTL status**: Keep `expiresAt` TTL enabled so quote caches, rate limits, and coupon holds auto-clean.
- [ ] **PITR decision**: Re-enable point-in-time recovery right before production cutover (`aws dynamodb update-continuous-backups ... PointInTimeRecoveryEnabled=true`). Document who is allowed to toggle it back off.

## 2. Environment & IAM

- [ ] **Environment variables**: Set `COMMERCE_TABLE=babesclub-commerce` in `README_ENV.md`, `.env`, and all Lambda configs.
- [ ] **IAM policies**: Lambda roles should have least-privilege `dynamodb:*` scoped to this table ARN plus CloudWatch logging. Update `config/iam` templates accordingly.
- [ ] **Audit logging**: Ensure Lambdas log all write failures (quotes, sessions, coupons) and emit structured metrics so CloudWatch alarms can trigger.

## 3. Data Seeding & Validation

- [ ] **CloudWatch alarms**: Create alarms for `ThrottledRequests`, `UserErrors`, and sudden `ConsumedRead/WriteCapacity` spikes. Tie alerts into the on-call channel.
- [ ] **DLQs / retry policy**: Attach dead-letter queues to cart/checkout Lambdas so failed DynamoDB writes are preserved for inspection.
- [ ] **Cost monitoring**: Tag the table (`Project=BabesClub`, `Env=prod`) and enable AWS Cost Explorer alerts for DynamoDB spend exceeding the target.
- [ ] **Backup cadence**: Decide if periodic on-demand snapshots are needed in addition to PITR; schedule them if compliance requires long-term retention.

## 5. Runbook & Testing

- [ ] **Failure drills**: Practice restoring a small item set from PITR (in a non-prod copy) so the team knows the workflow.
- [ ] **Load test**: Replay expected peak traffic against a staging table to confirm no hot partitions emerge; tune key prefixes if throttles appear.
- [ ] **Documentation**: Update `notes/backend/cart-checkout-plan.md` and team runbooks with any schema changes, new prefixes, or operational tweaks discovered during seeding/testing.

Mark this checklist complete only after every item is owned by an assignee and verified in the target AWS account.
