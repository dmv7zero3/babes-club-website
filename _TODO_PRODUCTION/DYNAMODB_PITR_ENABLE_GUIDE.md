# DynamoDB Point-in-Time Recovery (PITR) - Production Enablement Guide

## Overview

Point-in-Time Recovery (PITR) provides continuous backups for DynamoDB tables, allowing you to restore to any second within the last 35 days. This is a critical feature for production environments to protect against accidental deletes, corruption, or other data loss events.

## Current State

- PITR is currently **disabled** for both `babesclub-commerce` and `babesclub-auth-rate-limits` tables.
- Deletion protection is **enabled** for both tables.

## When to Enable PITR

- Before launching to production or handling real customer data.
- When regulatory, compliance, or business continuity requirements mandate data recoverability.
- Prior to major schema migrations or bulk data operations.

## How to Enable PITR

Run the following AWS CLI commands:

```sh
aws dynamodb update-continuous-backups \
  --table-name babesclub-commerce \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1

aws dynamodb update-continuous-backups \
  --table-name babesclub-auth-rate-limits \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

## Verification

To verify PITR is enabled:

```sh
aws dynamodb describe-continuous-backups --table-name babesclub-commerce --region us-east-1
aws dynamodb describe-continuous-backups --table-name babesclub-auth-rate-limits --region us-east-1
```

Look for:

- `ContinuousBackupsStatus: ENABLED`
- `PointInTimeRecoveryStatus: ENABLED`

## Rollback/Disable PITR

If you need to disable PITR:

```sh
aws dynamodb update-continuous-backups \
  --table-name babesclub-commerce \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=false \
  --region us-east-1

aws dynamodb update-continuous-backups \
  --table-name babesclub-auth-rate-limits \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=false \
  --region us-east-1
```

## Best Practices

- Always enable PITR before production launch.
- Document PITR status and recovery procedures in your ops runbook.
- Test table restore in a non-production environment to validate recovery.
- Monitor AWS billing for PITR-related costs (typically low for most workloads).

## References

- [AWS DynamoDB PITR Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/PointInTimeRecovery.html)
- [babesclub-commerce Table Schema](../AWS_Lambda_Functions/babes-website-stripe-webhook/README.md)

---

**For questions or changes, contact the backend operations team.**
