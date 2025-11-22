import type { CartState, UICartItem } from "@/lib/types/cart";
import { priceCart } from "@/lib/pricing";

export type CheckoutPayload = {
  currency: string;
  items: Array<{
    collectionId: string;
    variantId: string;
    qty: number;
    name?: string;
    unitPriceCents?: number;
    options?: Record<string, string>;
  }>;
  totals: {
    preDiscountTotalCents: number;
    discounts: Array<{
      collectionId: string;
      appliedBundles: Array<{
        tierMinQty: number;
        bundleCount: number;
        tierTotalPriceCents: number;
      }>;
      discountCents: number;
    }>;
    grandTotalCents: number;
  };
};

export function buildCheckoutPayload(state: CartState): CheckoutPayload {
  const items = state.items.map((i) => ({
    collectionId: i.collectionId,
    variantId: i.variantId,
    qty: i.qty,
    name: i.name,
    unitPriceCents: i.unitPriceCents,
    options: i.options,
  }));
  const quote = priceCart(
    items.map((i) => ({
      collectionId: i.collectionId,
      variantId: i.variantId,
      qty: i.qty,
    }))
  );
  return {
    currency: quote.currency,
    items,
    totals: {
      preDiscountTotalCents: quote.preDiscountTotalCents,
      discounts: quote.discounts.map((d) => ({
        collectionId: d.collectionId,
        appliedBundles: d.appliedBundles,
        discountCents: d.discountCents,
      })),
      grandTotalCents: quote.grandTotalCents,
    },
  };
}

export const CHECKOUT_STASH_KEY = "checkout:pending-payload";

export function stashCheckoutPayload(payload: CheckoutPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHECKOUT_STASH_KEY, JSON.stringify(payload));
}

export function popCheckoutPayload(): CheckoutPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CHECKOUT_STASH_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(CHECKOUT_STASH_KEY);
  try {
    return JSON.parse(raw) as CheckoutPayload;
  } catch {
    return null;
  }
}
