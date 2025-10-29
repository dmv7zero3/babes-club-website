# Cart & Checkout API Contracts

> Draft TypeScript definitions shared between the web client and Lambda handlers. Copy these into a future `@/types/api` module once the API is live.

```ts
export type MoneyCents = number;

export type CartItemPayload = {
  collectionId: string;
  variantId: string;
  qty: number;
};

export type CartQuoteRequest = {
  items: CartItemPayload[];
};

export type CartQuoteLineItem = CartItemPayload & {
  unitPriceCents: MoneyCents;
  subtotalCents: MoneyCents;
  name: string;
  imageUrl?: string | null;
  collectionTitle?: string | null;
};

export type BundleApplied = {
  tierMinQty: number;
  bundleCount: number;
  tierTotalPriceCents: MoneyCents;
};

export type CollectionDiscountSummary = {
  collectionId: string;
  appliedBundles: BundleApplied[];
  discountCents: MoneyCents;
};

export type BundleOpportunity = {
  collectionId: string;
  title: string;
  quantity: number;
  discountCents: MoneyCents;
  appliedBundles: BundleApplied[];
  nextTier?: {
    minQty: number;
    missingQty: number;
    totalPriceCents: MoneyCents;
    note?: string;
    potentialSavingsCents: MoneyCents;
  };
};

export type CartQuoteResponse = {
  items: CartQuoteLineItem[];
  quote: {
    currency: string;
    lineItems: Array<{
      item: CartItemPayload;
      unitPriceCents: MoneyCents;
      subtotalCents: MoneyCents;
    }>;
    preDiscountTotalCents: MoneyCents;
    discounts: CollectionDiscountSummary[];
    grandTotalCents: MoneyCents;
  };
  opportunities: BundleOpportunity[];
  totalDiscountCents: MoneyCents;
  quoteSignature: string;
};

export type CheckoutSessionRequest = {
  items: CartItemPayload[];
  quoteSignature: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSessionResponse = {
  checkoutUrl: string;
  sessionId: string;
  quoteSignature: string;
};

export type CheckoutStatusResponse = {
  sessionId: string;
  status: "open" | "complete" | "expired" | "canceled";
  customerEmail?: string | null;
  amountSubtotalCents: MoneyCents;
  amountTotalCents: MoneyCents;
  paymentIntentId?: string | null;
  metadata?: Record<string, string>;
};
```

**Notes**

- `quoteSignature` is an HMAC of the normalized cart and pricing totals; the backend rejects tampered payloads before creating Stripe sessions.
- Future auth-enabled flows can extend `CartQuoteRequest` with `customerId` or session metadata without breaking existing clients.
- Keep `MoneyCents` as `number` (integer) to avoid floating point loss across network boundaries.
