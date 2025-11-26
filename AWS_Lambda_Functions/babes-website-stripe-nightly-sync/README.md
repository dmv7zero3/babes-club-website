# babes-website-stripe-nightly-sync

Scheduled Lambda that reconciles Stripe checkout sessions with DynamoDB order snapshots. Acts as a safety net to catch any orders missed by the webhook handler.

## Purpose

Webhooks can fail due to:

- Lambda timeouts or cold starts
- DynamoDB throttling
- Network issues
- Deployments during event delivery
- Bugs in webhook handler

This sync job runs nightly to ensure all completed Stripe checkouts have corresponding order snapshots in DynamoDB.

## Handler Contract

- **Runtime**: Python 3.12
- **Entry point**: `lambda_function.lambda_handler`
- **Memory**: 256 MB recommended
- **Timeout**: 5 minutes (300 seconds)
- **Trigger**: CloudWatch Events (EventBridge) schedule

## Schedule Configuration

Recommended schedule: **2:00 AM UTC daily**

```bash
# Create EventBridge rule
aws events put-rule \
  --name babes-stripe-nightly-sync \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED \
  --description "Nightly Stripe order reconciliation" \
  --region us-east-1

# Add Lambda target
aws events put-targets \
  --rule babes-stripe-nightly-sync \
  --targets '[{
    "Id": "1",
    "Arn": "arn:aws:lambda:us-east-1:ACCOUNT_ID:function:babes-website-stripe-nightly-sync"
  }]' \
  --region us-east-1

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name babes-website-stripe-nightly-sync \
  --statement-id eventbridge-nightly-sync \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:ACCOUNT_ID:rule/babes-stripe-nightly-sync \
  --region us-east-1
```

## Environment Variables

| Name                      | Required | Default | Description                          |
| ------------------------- | -------- | ------- | ------------------------------------ |
| `COMMERCE_TABLE`          | ✅       | -       | DynamoDB table name                  |
| `STRIPE_SECRET`           | ✅\*     | -       | Stripe API secret key (direct value) |
| `STRIPE_SECRET_PARAMETER` | ✅\*     | -       | SSM parameter name for Stripe secret |
| `SYNC_LOOKBACK_HOURS`     | ➖       | 25      | Hours to look back for sessions      |
| `SYNC_MAX_SESSIONS`       | ➖       | 500     | Maximum sessions to process per run  |
| `SYNC_DRY_RUN`            | ➖       | false   | If true, don't write to DynamoDB     |
| `ORDER_TTL_DAYS`          | ➖       | 0       | Days until orders expire (0 = never) |

\*Either `STRIPE_SECRET` or `STRIPE_SECRET_PARAMETER` must be set.

## Event Payload (Optional)

When invoking manually, you can override configuration:

```json
{
  "lookbackHours": 48,
  "maxSessions": 100,
  "dryRun": true
}
```

## Response Format

```json
{
  "statusCode": 200,
  "body": {
    "status": "success",
    "trigger": "scheduled",
    "syncStartedAt": "2024-11-27T02:00:00Z",
    "syncCompletedAt": "2024-11-27T02:01:23Z",
    "lookbackHours": 25,
    "lookbackWindow": {
      "from": "2024-11-26T01:00:00Z",
      "to": "2024-11-27T02:00:00Z"
    },
    "processed": 42,
    "created": 3,
    "skipped": 38,
    "errors": 1,
    "createdOrders": ["BC-ABC12345", "BC-DEF67890", "BC-GHI11111"],
    "dryRun": false
  }
}
```

## DynamoDB Records

### Order Snapshot (created)

```json
{
  "PK": "USER#user_12345",
  "SK": "ORDER#1732669200#cs_test_abc123",
  "orderId": "cs_test_abc123",
  "orderNumber": "BC-ABC12345",
  "status": "completed",
  "source": "nightly_sync",
  "syncedAt": "2024-11-27T02:00:00Z"
}
```

The `source: "nightly_sync"` field distinguishes orders created by this sync from those created by the webhook handler (`source` would be absent or `"webhook"`).

### Sync State (updated after each run)

```json
{
  "PK": "SYSTEM",
  "SK": "STRIPE_ORDER_SYNC",
  "lastSyncStartedAt": "2024-11-27T02:00:00Z",
  "lastSyncCompletedAt": "2024-11-27T02:01:23Z",
  "lastSyncProcessed": 42,
  "lastSyncCreated": 3,
  "lastSyncSkipped": 38,
  "lastSyncErrors": 1,
  "lastLookbackStart": 1732582800,
  "lastLookbackEnd": 1732669200
}
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. Get configuration (env vars + event overrides)                  │
├─────────────────────────────────────────────────────────────────────┤
│  2. Query Stripe API for completed sessions in lookback window      │
│     stripe.checkout.Session.list(created={gte: since_ts})           │
├─────────────────────────────────────────────────────────────────────┤
│  3. For each session:                                               │
│     a. Extract userId from metadata (or fallback to email)          │
│     b. Check if ORDER# record exists in DynamoDB                    │
│     c. If missing → fetch line items → create order snapshot        │
│     d. If exists → skip (already synced)                            │
├─────────────────────────────────────────────────────────────────────┤
│  4. Update SYSTEM#STRIPE_ORDER_SYNC state record                    │
├─────────────────────────────────────────────────────────────────────┤
│  5. Return summary with counts and created order numbers            │
└─────────────────────────────────────────────────────────────────────┘
```

## Testing

### Dry Run (Preview Mode)

```bash
# Via environment variable
aws lambda update-function-configuration \
  --function-name babes-website-stripe-nightly-sync \
  --environment "Variables={SYNC_DRY_RUN=true,...}" \
  --region us-east-1

# Via event payload
aws lambda invoke \
  --function-name babes-website-stripe-nightly-sync \
  --payload '{"dryRun": true, "lookbackHours": 48}' \
  --cli-binary-format raw-in-base64-out \
  output.json \
  --region us-east-1

cat output.json
```

### Manual Sync (Extended Lookback)

```bash
aws lambda invoke \
  --function-name babes-website-stripe-nightly-sync \
  --payload '{"lookbackHours": 168}' \
  --cli-binary-format raw-in-base64-out \
  output.json \
  --region us-east-1
```

### Verify Results

```bash
# Check sync state
aws dynamodb get-item \
  --table-name babesclub-commerce \
  --key '{"PK": {"S": "SYSTEM"}, "SK": {"S": "STRIPE_ORDER_SYNC"}}' \
  --region us-east-1

# Query recent orders created by sync
aws dynamodb scan \
  --table-name babesclub-commerce \
  --filter-expression "source = :src" \
  --expression-attribute-values '{":src": {"S": "nightly_sync"}}' \
  --region us-east-1
```

## Monitoring

### CloudWatch Alarms

```bash
# Alarm on sync errors
aws cloudwatch put-metric-alarm \
  --alarm-name stripe-sync-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --dimensions Name=FunctionName,Value=babes-website-stripe-nightly-sync \
  --statistic Sum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:alerts \
  --region us-east-1
```

### Log Insights Queries

```sql
-- Sync summary
fields @timestamp, @message
| filter @message like /Sync completed/
| sort @timestamp desc
| limit 10

-- Orders created by sync
fields @timestamp, @message
| filter @message like /Created order snapshot.*via sync/
| sort @timestamp desc
| limit 50

-- Errors
fields @timestamp, @message
| filter @logStream like /stripe-nightly-sync/
| filter @message like /ERROR|error|Error/
| sort @timestamp desc
| limit 20
```

## Deployment

```bash
cd AWS_Lambda_Functions/babes-website-stripe-nightly-sync

# Package
zip -r function.zip lambda_function.py

# Deploy
aws lambda update-function-code \
  --function-name babes-website-stripe-nightly-sync \
  --zip-file fileb://function.zip \
  --region us-east-1

# Configure environment
aws lambda update-function-configuration \
  --function-name babes-website-stripe-nightly-sync \
  --timeout 300 \
  --memory-size 256 \
  --environment "Variables={
    COMMERCE_TABLE=babesclub-commerce,
    STRIPE_SECRET_PARAMETER=/babesclub/stripe/secret,
    SYNC_LOOKBACK_HOURS=25,
    SYNC_MAX_SESSIONS=500
  }" \
  --region us-east-1
```

## Troubleshooting

| Issue              | Cause                       | Solution                                       |
| ------------------ | --------------------------- | ---------------------------------------------- |
| No orders created  | All orders already exist    | Check webhook is working; this is expected     |
| High error count   | Stripe API rate limit       | Reduce `SYNC_MAX_SESSIONS` or increase timeout |
| Missing line items | Session too old (>24h)      | Line items expire; use shorter lookback        |
| Duplicate orders   | Race condition with webhook | Check `_order_exists_for_session` logic        |
| Timeout            | Too many sessions           | Reduce lookback or max sessions                |

## IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query"],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/babesclub-commerce",
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/babesclub-commerce/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter"],
      "Resource": "arn:aws:ssm:us-east-1:ACCOUNT:parameter/babesclub/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:ACCOUNT:*"
    }
  ]
}
```
