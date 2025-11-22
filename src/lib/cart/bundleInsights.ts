import catalog from "@/businessInfo/JewleryProducts.json" assert { type: "json" };
import { priceCart, type PricingResult } from "@/lib/pricing";

type PricingInput = {
  collectionId: string;
  variantId: string;
  qty: number;
};

type CatalogCollection = (typeof catalog.collections)[number];

type Tier = NonNullable<CatalogCollection["tieredPricing"]>[number];

export type BundleOpportunity = {
  collectionId: string;
  title: string;
  quantity: number;
  discountCents: number;
  appliedBundles: PricingResult["discounts"][number]["appliedBundles"];
  nextTier?: {
    minQty: number;
    missingQty: number;
    totalPriceCents: number;
    note?: string;
    potentialSavingsCents: number;
  };
};

export type CartPricingAnalysis = {
  quote: PricingResult;
  opportunities: BundleOpportunity[];
  totalDiscountCents: number;
};

function describeNextTier(
  collection: CatalogCollection,
  tiers: Tier[],
  quantity: number
): BundleOpportunity["nextTier"] {
  const nextTier = tiers.find((tier) => quantity < tier.minQty);
  if (!nextTier) return undefined;
  const missingQty = nextTier.minQty - quantity;
  const regularEstimate = nextTier.minQty * collection.basePriceCents;
  const potentialSavings = Math.max(
    0,
    regularEstimate - nextTier.totalPriceCents
  );
  return {
    minQty: nextTier.minQty,
    missingQty,
    totalPriceCents: nextTier.totalPriceCents,
    note: nextTier.note,
    potentialSavingsCents: potentialSavings,
  };
}

function computeOpportunities(
  items: PricingInput[],
  quote: PricingResult
): BundleOpportunity[] {
  const byCollection = new Map<
    string,
    { collection: CatalogCollection; quantity: number }
  >();

  for (const item of items) {
    const collection = catalog.collections.find(
      (c) => c.id === item.collectionId
    );
    if (!collection) continue;
    const entry = byCollection.get(collection.id) ?? {
      collection,
      quantity: 0,
    };
    entry.quantity += item.qty;
    byCollection.set(collection.id, entry);
  }

  const discountMap = new Map(
    quote.discounts.map((discount) => [discount.collectionId, discount])
  );

  const opportunities: BundleOpportunity[] = [];

  for (const [collectionId, { collection, quantity }] of byCollection) {
    const tiers = [...(collection.tieredPricing ?? [])].sort(
      (a, b) => a.minQty - b.minQty
    );
    const discount = discountMap.get(collectionId);

    opportunities.push({
      collectionId,
      title: collection.title,
      quantity,
      discountCents: discount?.discountCents ?? 0,
      appliedBundles: discount?.appliedBundles ?? [],
      nextTier: describeNextTier(collection, tiers, quantity),
    });
  }

  return opportunities;
}

export function analyzeCartPricing(items: PricingInput[]): CartPricingAnalysis {
  const quote = priceCart(items);
  const opportunities = computeOpportunities(items, quote);
  const totalDiscountCents = quote.discounts.reduce(
    (acc, discount) => acc + discount.discountCents,
    0
  );

  return {
    quote,
    opportunities,
    totalDiscountCents,
  };
}
