# Cart & Checkout API Implementation Plan

_Last updated: 2025-10-05_

## Objectives

- Stand up AWS Lambda handlers that deliver secure cart pricing, Stripe Checkout session creation, and Stripe webhook processing with all safeguards from the existing security checklists.
- Ensure cart quotes remain tamper-proof, cacheable, and versioned so desktop and mobile flows share the same price data.
- Provide a minimal but production-ready guest checkout path: quote → checkout session → Stripe email confirmation, while logging order notifications for manual fulfillment.
- Document infrastructure tasks (API Gateway wiring, throttles, WAF hooks, logging) so operations can deploy consistently.

## Scope for Initial Iteration

1. **Lambda: `cart-quote`**
   - Validate request payload (structure, honeypot/base fields) and normalize items.
   - Enforce IP+signature-based throttling using DynamoDB (reuse rate-limiter module).
   - Run pricing analysis via shared catalog/pricing utilities; include applied bundles + next-tier hints.
   - Produce a short-lived cache entry keyed by normalized items (for reuse and coupon deduping).
   - Return HMAC-signed `quoteSignature` embedding timestamp/version; log structured metrics to CloudWatch.

2. **Lambda: `checkout-create-session`**
   - Recompute and verify quote signature; reject stale or tampered payloads.
   - Reuse cached quote if available; otherwise recompute and refresh signature.
   - Create or reuse a one-time coupon (idempotency key: `coupon-{quoteSignature}`) with graceful fallback to no-discount session if Stripe rejects coupon creation.
   - Create Stripe Checkout Session (`idempotencyKey = checkout-{quoteSignature}`) with metadata, configured redirect URLs, and optional customer email.
   - Emit order notification log (future hook for SES/Postmark).
   - Respond with `{ checkoutUrl, sessionId, quoteSignature }` plus expanded diagnostics in logs only.

3. **Lambda: `stripe-webhook` (new)**
   - Verify signatures with `STRIPE_WEBHOOK_SECRET` and guard by `STRIPE_WEBHOOK_TOLERANCE`.
   - Handle `checkout.session.completed` (fulfillment + coupon cleanup) and `checkout.session.expired` (coupon release).
   - Record idempotent fulfillment markers (DynamoDB or parameter store) keyed by session ID.
   - Log any failures loudly; respond within 10 seconds.

## Infrastructure Tasks

- Extend API Gateway (`a2fps4r1la`) with:
  - `/cart/quote` (POST/OPTIONS) → Lambda proxy integration
  - `/checkout/create-session` (POST/OPTIONS)
  - `/stripe/webhook` (POST) with Lambda proxy
- Apply throttling: `RateLimit=10 req/sec`, `BurstLimit=20` at method or usage plan level.
- Tighten CORS to `https://thebabesclub.com` and `https://www.thebabesclub.com`; all other origins denied.
- Ensure CloudWatch execution logs enabled, and add metric alarms per security plan (Lambda Errors, 4XX spikes, WAF blocks).
- Coordinate with AWS WAF/CloudFront roadmap for upstream filtering once APIs stabilize.

## Security Alignment Checklist

- ✅ Reference: `notes/aws_lambda_security_checklist.md` for rate limiting, spam detection, logging, honeypot checks.
- ✅ Reference: `notes/aws_security_implementation_plan.md` for infrastructure hardening, throttles, staged rollouts, and CloudWatch/WAF guidance.
- ✅ Reference: `notes/aws-forms-template-system.md` for packaging scripts, API Gateway setup patterns, and DynamoDB table conventions.

## Outstanding Questions (Stripe-specific)

1. **Coupon Lifecycle**
   - Should per-quote coupons be deleted after a successful checkout, or retained for customer support lookups?
   - Are promotion codes required for the frontend (convert coupon → promo code), or is an automatic discount acceptable?

2. **Existing Stripe Catalog Usage**
   - The catalog import created 18 products/prices earlier; do we rely solely on those Stripe Price IDs, or should the checkout flow always send on-the-fly `price_data` with metadata?
   - Are there catalog items (e.g., bundles, shipping) that must be included separately in the session line items?

3. **Stripe Account Configuration**
   - Which publishable/secret keys should these Lambdas load before deployment?
   - Are taxes, shipping, or automatic tax settings enabled in Stripe? If so, how should the Lambda specify them?
   - Is manual fulfillment expected (email + dashboard), or do we need to trigger downstream systems via metadata/webhooks?

4. **Webhook Destination & Alerting**
   - Which Stripe events should we subscribe to beyond `checkout.session.completed` and `checkout.session.expired` (e.g., `coupon.deleted`, `payment_intent.payment_failed`)?
   - Where should webhook failure alerts go (PagerDuty, email, Slack)?

5. **Customer Email Flow**
   - Should we collect customer email on the frontend prior to checkout (pre-fill), or rely on Stripe’s native collection?
   - Do we plan to send a custom confirmation email in addition to Stripe’s receipt? If yes, what provider should we integrate (SES/Postmark)?

6. **Quote Cache & Expiry**
   - Acceptable TTL for cached quotes? (Proposed: 10 minutes)
   - How do we handle quotes created on mobile and completed later on desktop—should signatures expire gracefully or force regen?

## Next Steps

- Await answers to the Stripe questions above to finalize the coupon/session implementation details.
- Once confirmed, begin coding the Lambda handlers and DynamoDB support modules with the security controls already itemized.
- After implementation, follow `notes/backend/api-gateway-wiring.md` to publish and test endpoints, then schedule WAF/monitoring upgrades per the security implementation plan.

## DynamoDB Single-Table PK/SK Layout (Cost-Optimized)

To minimize operational cost and stay within the free tier, consolidate commerce data into a single table (suggested name: `babesclub-commerce`) that relies solely on a `PK`/`SK` key pair plus targeted TTL settings. Each item uses a type-prefixed identifier so all access patterns resolve with key-only queries—no GSIs required.

| Use case                            | `PK` value                  | `SK` value                                  | Notes                                                                                                                                       |
| ----------------------------------- | --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Cart quote cache (latest + history) | `CART#<normalizedHash>`     | `QUOTE#<timestamp>`                         | Query with `ScanIndexForward=false` to grab the newest quote; store pricing snapshot, signature, metadata, and `expiresAt` (10–15 min TTL). |
| Quote lookup by signature           | `QUOTE#<quoteSignature>`    | `CART#<normalizedHash>`                     | Lightweight pointer item (≤1 KB) for direct `GetItem` validation; optionally include created timestamp for staleness checks.                |
| Checkout session history            | `QUOTE#<quoteSignature>`    | `SESSION#<stripeSessionId>`                 | Records coupon usage, status, timestamps; supports multiple sessions per quote. TTL of 30–60 days depending on audit needs.                 |
| Reverse session lookup (webhook)    | `SESSION#<stripeSessionId>` | `METADATA`                                  | Pointer item storing quote signature + status so Stripe webhooks can resolve context with one `GetItem`.                                    |
| Coupon ownership (optional)         | `COUPON#<couponId>`         | `SESSION#<stripeSessionId>`                 | Track which session currently holds a generated coupon; delete on completion/expiry.                                                        |
| Stripe event idempotency            | `EVENT#<stripeEventId>`     | `METADATA`                                  | Persist processed events/status for 60–90 days; store payload digest for replay diagnostics.                                                |
| Rate limiting window                | `LIMIT#<scope>#<ipAddress>` | `WINDOW#<yyyyMMddHH>` / `WINDOW#<yyyyMMdd>` | Replaces a dedicated rate-limit table; includes counters and `expiresAt` (hour/day boundaries) so stale windows auto-expire.                |

### Implementation guidelines

- **Environment variables:** Expose a single `COMMERCE_TABLE` name to Lambdas; helper modules implement `save_quote`, `fetch_quote_by_signature`, `record_session`, `check_rate_limit`, etc., all backed by the shared table.
- **TTL discipline:** Only quote cache, rate-limit windows, and webhook events carry `expiresAt` to keep storage near-zero while preserving permanent records (completed sessions, audit trails) as needed.
- **Pointer item size:** Keep pointer entities minimal (quote/signature references, webhook metadata) to avoid duplicate storage costs; centralize the full payload in the primary cart/session items.
- **Migrations:** Existing dedicated tables can be retired once code shifts to the consolidated layout; use a one-off script/Lambda to copy any data you want to retain.

This structure keeps every access path (`GetItem` or single `Query`) fast while eliminating GSI fees and extra tables, making the deployment effectively free until request volume grows.
