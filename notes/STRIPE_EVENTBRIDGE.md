# Stripe Integration with AWS EventBridge (Babes Club)

This guide documents the recommended approach for integrating Stripe with AWS EventBridge for the Babes Club web application. It includes the actual setup details for your current environment:

- React SPA (CloudFront/S3)
- API Gateway (REST, regional)
- AWS Lambda (Python 3.12)
- DynamoDB
- Stripe

---

## Current Setup Details (Test Mode)

- **Destination Name:** `stripe-eventbridge`
- **Partner Event Source Name & Event Bus:** `aws.partner/stripe.com/ed_test_61Tgbw4tAWzZeirTG16TVtIa1oSQktdZeofdAxL32Ni4`
- **Partner Event Source ARN:** `arn:aws:events:us-east-1::event-source/aws.partner/stripe.com/ed_test_61Tgbw4tAWzZeirTG16TVtIa1oSQktdZeofdAxL32Ni4`
- **AWS Account ID:** `752567131183`
- **Status:** Active
- **API Version:** 2022-08-01
- **Listening to:** 1 event (customize as needed)

## Why EventBridge?

- **No webhook endpoint required**: Stripe sends events directly to AWS EventBridge.
- **Resilient delivery**: Built-in retries, event filtering, and routing.
- **Simpler architecture**: No need for API Gateway or Lambda for receiving webhooks.
- **Easy integration**: Route events to Lambda, SQS, Step Functions, etc.

---

## Testing Stripe Event Destinations → EventBridge in Test Mode

### ✅ What the documentation says about testing Event Destinations → EventBridge

- Stripe’s “Send events to Amazon EventBridge” doc states: _“Use your live account or sandboxes to send events to Amazon EventBridge.”_ ([Stripe Docs][1])
- When creating the event destination via API, the returned object has a field `livemode` which is `false` if the object exists in test mode. ([Stripe Docs][2])
- You can view event deliveries via the **Event deliveries** tab in the Dashboard. Retries behaviour: “In the sandbox, Stripe retries three times over the course of a few hours.” ([Stripe Docs][3])
- The “Testing use cases” doc distinguishes between Test Mode vs Sandboxes, shows that test mode shares settings with live mode, and that Sandboxes offer better isolation. ([Stripe Docs][4])

### 🧪 Key limitations / differences in test mode for Event Destinations

- Retry behaviour is **much shorter** in test mode / sandbox for delivery of events: only three retries over a few hours rather than up to days. ([Stripe Docs][1])
- Some features (API v2 support, “thin events” format) are noted as “partial support” in test mode / sandboxes. ([Stripe Docs][4])
- Settings in test mode may _share_ state with live mode; Sandboxes offer better separation. ([Stripe Docs][4])
- Stripe CLI may **not support** certain operations (like `event_destinations` list/create) for EventBridge destinations in test mode (community commentary).
- Sometimes the “Event deliveries” tab may show _no deliveries_ even though events arrive in AWS — mis-configuration is typically the cause.

---

## How to test & verify EventBridge integration in your Babes Club setup

1. **Ensure event destination in Stripe (Test mode) is configured**
   - In Stripe Dashboard (**Test data** toggle ON) → Developers → Event Destinations → Create new destination. ([Stripe Docs][3])
   - Select your account, select events (e.g., `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`).
   - Choose **Amazon EventBridge** as destination type. Enter AWS Account ID (`752567131183`), AWS Region (`us-east-1`). Click Create. ([Stripe Docs][1])
   - Confirm returned object has `"livemode": false` (API).

2. **Associate the Partner Event Source in AWS**
   - AWS Console → EventBridge → Partner event sources → locate Stripe source → Accept/Associate with Event Bus (e.g., `stripe-events-bus`). ([Stripe Docs][1])
   - If not associated within 7 days, source may be auto-deleted and destination disabled.

3. **Create an EventBridge rule for verification**
   - On the event bus: create a rule with pattern:

     ```json
     {
       "source": ["aws.partner/stripe.com"],
       "detail.type": ["checkout.session.completed"]
     }
     ```

   - Target: CloudWatch Log Group or Lambda that logs the payload.
   - Use AWS “Sandbox” tester to verify event pattern matches a sample event. ([AWS Documentation][5])

4. **Trigger a test event in Stripe**
   - Create a Checkout Session via backend or Dashboard, complete it (use Stripe test card `4242 4242 4242 4242`).
   - Optionally: Use `stripe trigger checkout.session.completed` (CLI may not trigger EventDestinations in all cases).
   - Wait a few minutes.

5. **Verify Event arrival in AWS**
   - In CloudWatch Logs (or Lambda target) check for log entry corresponding to Stripe event. Should appear as EventBridge event:

     ```json
     {
       "version": "0",
       "id": "...",
       "detail-type": "...",
       "source": "aws.partner/stripe.com",
       "account": "752567131183",
       "time": "2025-11-24T...",
       "region": "us-east-1",
       "detail": {
         "type": "checkout.session.completed",
         "data": { "object": { … } }
       }
     }
     ```

   - If you see this, ingestion path is working.

6. **Check Stripe Dashboard “Event deliveries” tab**
   - Stripe Dashboard → Event Destinations → select destination → **Event deliveries** tab.
   - Should show `Delivered` or `Failed`. In test mode, may show fewer entries or lag; retries limited to ~3 in a few hours.

---

## Troubleshooting: “No event deliveries found” / no events showing in AWS

- **Events from setting**: Check “Your account” vs “Connected accounts”.
- **Partner event source association**: In AWS, verify status is `ACTIVE` and associated with event bus.
- **Region / Account ID mismatch**: Ensure AWS region and account ID match.
- **Rule pattern mismatch**: Verify rule’s event pattern matches actual event’s `detail.type`. Use AWS Sandbox tester.
- **Inspect CloudWatch Logs and EventBridge metrics**: View metrics “Invocations” or “FailedInvocations”.
- **Check Stripe dashboard for destination status**: If event source is disabled, recreate.
- **Test mode retry limitations**: Only 3 retries over a few hours; ensure target is healthy.
- **CLI limitations**: Some CLI triggers may not result in Event Destinations; validate via AWS side.
- **Check API version field**: Ensure downstream code expects same format (`snapshot` vs `thin`). ([Stripe Docs][6])

---

## Actionable recommendations for your Babes Club project

- In your repo (e.g., `docs/stripe_eventbridge_testing.md`), include the step-by-step above for team reference.
- For verification, initially point EventBridge rule to CloudWatch Logs before routing to Lambda.
- Use a “smoke test” Lambda to log incoming events for 24 hours to observe event volumes/types.
- Document mapping of “Event type” → “Business logic path” for verification.
- Consider Sandboxes for full isolation if needed (per Stripe docs).
- Add alerts/metrics: EventBridge `Invocations` vs `Errors`, CloudWatch Alarms for ingestion drops.
- When transitioning to live mode, repeat verification: create live mode destination, verify AWS ingestion, then switch business logic. Separate logs/alerts for production.
- Treat EventBridge events as **source of truth** for subscription/charge state; build downstream logic accordingly.

---

## Stripe → EventBridge Integration Pattern

### 1. Configure Stripe Event Destination

- In Stripe Dashboard, go to **Developers → Event Destinations**.
- Add a new destination for **Amazon EventBridge**.
- Enter your AWS Account ID and select the region (e.g., `us-east-1`).
- Select the event types you want to send (e.g., `checkout.session.completed`, `customer.subscription.*`).

**For this setup:**

- Destination Name: `stripe-eventbridge`
- AWS Account ID: `752567131183`
- Region: `us-east-1`

### 2. AWS EventBridge Setup

- Stripe will create a **partner event source** in your AWS account.
- In AWS Console, go to **EventBridge → Partner event sources** and accept the source.
- A new event bus will be created (e.g., `aws.partner/stripe.com/<account-id>/<destination-id>`).

**For this setup:**

- Partner event source name & event bus: `aws.partner/stripe.com/ed_test_61Tgbw4tAWzZeirTG16TVtIa1oSQktdZeofdAxL32Ni4`
- Partner event source ARN: `arn:aws:events:us-east-1::event-source/aws.partner/stripe.com/ed_test_61Tgbw4tAWzZeirTG16TVtIa1oSQktdZeofdAxL32Ni4`
- Status: Active

### 3. EventBridge Rule → Lambda

- Create an EventBridge rule to match Stripe events (e.g., by `detail.type`).
- Target your Lambda function for processing Stripe events.
- Example rule pattern:

```json
{
  "source": ["aws.partner/stripe.com"],
  "detail-type": ["checkout.session.completed"]
}
```

### 4. Lambda Event Processor (Python)

- Your Lambda receives the event payload directly from EventBridge.
- No need to verify Stripe signature (EventBridge guarantees authenticity).
- Process events and update DynamoDB as needed.

```python
# stripe_eventbridge_processor.py
import json
import boto3
from aws_lambda_powertools import Logger

logger = Logger()
dynamodb = boto3.resource("dynamodb")
events_table = dynamodb.Table("STRIPE_EVENTS_TABLE")

# EventBridge event structure
# event["detail"] contains the Stripe event payload

def handler(event, context):
    stripe_event = event["detail"]
    event_id = stripe_event["id"]
    event_type = stripe_event["type"]
    obj = stripe_event["data"]["object"]

    # Idempotency guard
    try:
        events_table.put_item(
            Item={"event_id": event_id, "processed_at": context.aws_request_id},
            ConditionExpression="attribute_not_exists(event_id)",
        )
    except Exception as e:
        logger.info(f"Event {event_id} already processed or error: {e}")
        return

    # Business logic
    if event_type == "checkout.session.completed":
        handle_checkout_completed(obj)
    elif event_type == "customer.subscription.deleted":
        handle_subscription_deleted(obj)
    # ...other event types...

    logger.info(f"Processed Stripe event {event_id} of type {event_type}")
```

## Key Points for Babes Club Setup

- **No need for webhook endpoint or signature verification.**
- **No need for Secrets Manager or custom IAM for Stripe keys** (EventBridge delivers events securely).
- **All event processing logic lives in Lambda functions triggered by EventBridge rules.**
- **Idempotency**: Use DynamoDB to ensure each event is processed only once.
- **Extendable**: Add more rules to route different event types to different Lambdas or SQS queues.

---

## Verification Steps

1. **Create EventBridge Rule:**
   - On event bus `aws.partner/stripe.com/ed_test_61Tgbw4tAWzZeirTG16TVtIa1oSQktdZeofdAxL32Ni4`, create a rule to match the Stripe event(s) you want (e.g., `checkout.session.completed`).
   - Set the rule’s target to CloudWatch Logs (for initial verification) or your Lambda/SQS.
2. **Trigger Test Event:**
   - In Stripe Dashboard (Test mode), create a Checkout Session or use:
     ```bash
     stripe trigger checkout.session.completed
     ```
3. **Check AWS CloudWatch Logs or Lambda:**
   - Confirm event arrival and payload.
4. **Troubleshooting:**
   - If no events arrive, check event bus, rule pattern, partner event source association, and AWS region/account.
   - Use CloudWatch logs as ground truth for event delivery.

---

## References

- [Stripe Event Destinations → EventBridge](https://docs.stripe.com/event-destinations/amazon-eventbridge)
- [AWS EventBridge Partner Sources](https://docs.aws.amazon.com/eventbridge/latest/userguide/eventbridge-partner-event-sources.html)
- [Serverless Land: Stripe to EventBridge Pattern](https://serverlessland.com/patterns/eventbridge-webhook-stripe)

[1]: https://docs.stripe.com/event-destinations/eventbridge?utm_source=chatgpt.com
[2]: https://docs.stripe.com/api/v2/core/event_destinations/enable?utm_source=chatgpt.com
[3]: https://docs.stripe.com/workbench/event-destinations?utm_source=chatgpt.com
[4]: https://docs.stripe.com/testing-use-cases?utm_source=chatgpt.com
[5]: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-pattern-sandbox.html?utm_source=chatgpt.com
[6]: https://docs.stripe.com/event-destinations?utm_source=chatgpt.com

---

## Change Log

- **2025-11-24:** Added actual destination, event bus, ARN, and verification steps for Babes Club test mode setup.
- **2025-11-24:** Added detailed summary, limitations, troubleshooting, and actionable recommendations for testing Stripe Event Destinations → EventBridge in test mode/sandbox.
