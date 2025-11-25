# Stripe EventBridge Integration: To-Do Checklist

Use this checklist to ensure your Babes Club AWS environment has an active, working Stripe connection via EventBridge.

---

## Stripe EventBridge Connection To-Do List

1. **Stripe Dashboard Setup**
   - [ ] Log in to Stripe Dashboard.
   - [ ] Go to Developers → Event Destinations.
   - [ ] Add a new Event Destination for Amazon EventBridge.
   - [ ] Enter your AWS Account ID and select the correct region (e.g., us-east-1).
   - [ ] Select all required event types (e.g., checkout.session.completed, customer.subscription.\*).
   - [ ] Save and activate the destination.

2. **AWS EventBridge Setup**
   - [ ] In AWS Console, go to EventBridge → Partner event sources.
   - [ ] Accept the Stripe partner event source.
   - [ ] Confirm a new event bus is created (e.g., aws.partner/stripe.com/<account-id>/<destination-id>).

3. **EventBridge Rule Configuration**
   - [ ] Create EventBridge rules to match Stripe event types (by detail.type).
   - [ ] Set Lambda function(s) as the target for these rules.
   - [ ] Test rule pattern with sample events.

4. **Lambda Event Processor**
   - [ ] Deploy Lambda function(s) to process Stripe events from EventBridge.
   - [ ] Ensure Lambda parses event["detail"] for Stripe payload.
   - [ ] Implement idempotency using DynamoDB (attribute_not_exists(event_id)).
   - [ ] Add business logic for key event types (e.g., checkout.session.completed, customer.subscription.deleted).
   - [ ] Log event IDs and types for observability.

5. **Testing & Validation**
   - [ ] Trigger test events from Stripe to EventBridge.
   - [ ] Confirm events appear in CloudWatch logs for Lambda.
   - [ ] Verify DynamoDB table updates for processed events.
   - [ ] Confirm business logic executes as expected.

6. **Monitoring & Maintenance**
   - [ ] Set up CloudWatch alarms for Lambda errors or failures.
   - [ ] Monitor event bus for delivery failures or throttling.
   - [ ] Periodically review processed events and logs.

---

Update this checklist as you add new event types, Lambdas, or business logic.
