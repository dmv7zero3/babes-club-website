/*
  Pricing utilities for computing line item totals and mix-and-match bundle discounts
  from src/businessInfo/JewleryProducts.json

  Notes for later / assumptions
  - Bundles are applied per collection (e.g., necklaces vs earrings), not across collections.
  - Mix-and-match is allowed within a collection; tiers are greedy (largest tier first).
  - Variant price overrides affect the regular price and the weighted average used for non-bundled leftovers.
  - Tiers are defined in cents and represent total price of the bundle set, not per-item price.
  - If multiple tiers exist, the algorithm chooses the cheapest combination by applying largest tiers first.

  TODO
  - If we introduce per-variant bundle eligibility, add a flag like `eligibleForBundles: boolean`.
  - If bundles should exclude overridden-price variants, filter those items when grouping.
  - Consider exposing a function to return a human-readable explanation for the cart UI.
*/

import catalog from "../businessInfo/JewleryProducts.json" assert { type: "json" };

export type MoneyCents = number; // integer cents

export type CartItem = {
  collectionId: string; // e.g., "necklaces"
  variantId: string; // e.g., "necklace-bright-red"
  qty: number;
};

export type LineBreakdown = {
  item: CartItem;
  unitPriceCents: MoneyCents;
  subtotalCents: MoneyCents;
};

export type CollectionDiscount = {
  collectionId: string;
  appliedBundles: Array<{
    tierMinQty: number;
    bundleCount: number; // how many times this tier applied
    tierTotalPriceCents: MoneyCents; // for each bundle
  }>;
  discountCents: MoneyCents;
};

export type PricingResult = {
  currency: string;
  lineItems: LineBreakdown[];
  preDiscountTotalCents: MoneyCents;
  discounts: CollectionDiscount[];
  grandTotalCents: MoneyCents;
};

// Helpers to access catalog data
const collectionsById = new Map(
  catalog.collections.map((c) => [c.id, c] as const)
);
const variantsById = new Map(
  catalog.collections.flatMap((c) =>
    c.variants.map(
      (v) =>
        [
          v.id,
          {
            ...v,
            __collectionId: c.id,
            __basePriceCents: c.basePriceCents,
          } as any,
        ] as const
    )
  )
);

export function getUnitPriceCents(variantId: string): MoneyCents {
  const v = variantsById.get(variantId) as any;
  if (!v) throw new Error(`Unknown variantId: ${variantId}`);
  return typeof v.priceOverrideCents === "number"
    ? v.priceOverrideCents
    : v.__basePriceCents;
}

export function priceCart(items: CartItem[]): PricingResult {
  // Normalize and compute line subtotals
  const lineItems: LineBreakdown[] = items.map((it) => {
    const unit = getUnitPriceCents(it.variantId);
    return { item: it, unitPriceCents: unit, subtotalCents: unit * it.qty };
  });

  const preDiscountTotalCents = lineItems.reduce(
    (s, l) => s + l.subtotalCents,
    0
  );

  // Group quantities by collection
  const qtyByCollection = new Map<
    string,
    { qty: number; regularSumCents: number }
  >();
  for (const l of lineItems) {
    const v = variantsById.get(l.item.variantId) as any;
    const key = v.__collectionId as string;
    const cur = qtyByCollection.get(key) || { qty: 0, regularSumCents: 0 };
    cur.qty += l.item.qty;
    cur.regularSumCents += l.subtotalCents;
    qtyByCollection.set(key, cur);
  }

  const discounts: CollectionDiscount[] = [];

  for (const [collectionId, agg] of qtyByCollection) {
    const collection = collectionsById.get(collectionId)!;
    const tiers = [...(collection.tieredPricing ?? [])].sort(
      (a, b) => b.minQty - a.minQty
    );
    if (tiers.length === 0 || agg.qty === 0) continue;

    let remaining = agg.qty;
    let discountedTotalForBundles = 0;
    const appliedBundles: CollectionDiscount["appliedBundles"] = [];

    // Greedy: apply largest tier first to maximize discount
    for (const tier of tiers) {
      if (remaining < tier.minQty) continue;
      const bundleCount = Math.floor(remaining / tier.minQty);
      if (bundleCount <= 0) continue;
      discountedTotalForBundles += bundleCount * tier.totalPriceCents;
      remaining -= bundleCount * tier.minQty;
      appliedBundles.push({
        tierMinQty: tier.minQty,
        bundleCount,
        tierTotalPriceCents: tier.totalPriceCents,
      });
    }

    // Remaining items not in a bundle are priced at regular base/override.
    // We approximate their total using a weighted average across all items in the collection.
    // This keeps the logic independent of how specific items are chosen for bundles.
    const averageRegularPrice = agg.regularSumCents / agg.qty; // in cents
    const regularPortionCents = Math.round(averageRegularPrice * remaining);

    const scenarioPriceCents = discountedTotalForBundles + regularPortionCents;
    const discountCents = Math.max(0, agg.regularSumCents - scenarioPriceCents);

    if (discountCents > 0) {
      discounts.push({ collectionId, appliedBundles, discountCents });
    }
  }

  const totalDiscountCents = discounts.reduce((s, d) => s + d.discountCents, 0);
  const grandTotalCents = preDiscountTotalCents - totalDiscountCents;

  return {
    currency: catalog.currency,
    lineItems,
    preDiscountTotalCents,
    discounts,
    grandTotalCents,
  };
}

// Utility display helpers
export const formatMoney = (cents: number, currency = catalog.currency) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    cents / 100
  );

// Tiny smoke test style function (can be removed later)
export function demo() {
  const sample: CartItem[] = [
    { collectionId: "necklaces", variantId: "necklace-bright-red", qty: 2 },
    { collectionId: "necklaces", variantId: "necklace-green", qty: 2 },
    { collectionId: "earrings", variantId: "earring-baby-blue", qty: 5 },
  ];
  return priceCart(sample);
}
