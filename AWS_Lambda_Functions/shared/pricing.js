import { getCatalog } from "./catalog.js";

const catalog = getCatalog();

const collectionsById = new Map(
  catalog.collections.map((collection) => [collection.id, collection])
);

const variantsById = new Map(
  catalog.collections.flatMap((collection) =>
    collection.variants.map((variant) => [
      variant.id,
      {
        ...variant,
        __collectionId: collection.id,
        __basePriceCents: collection.basePriceCents,
      },
    ])
  )
);

export function getUnitPriceCents(variantId) {
  const variant = variantsById.get(variantId);
  if (!variant) throw new Error(`Unknown variantId: ${variantId}`);
  return typeof variant.priceOverrideCents === "number"
    ? variant.priceOverrideCents
    : variant.__basePriceCents;
}

export function priceCart(items) {
  const lineItems = items.map((item) => {
    const unit = getUnitPriceCents(item.variantId);
    return {
      item,
      unitPriceCents: unit,
      subtotalCents: unit * item.qty,
    };
  });

  const preDiscountTotalCents = lineItems.reduce(
    (sum, line) => sum + line.subtotalCents,
    0
  );

  const qtyByCollection = new Map();
  for (const line of lineItems) {
    const variant = variantsById.get(line.item.variantId);
    if (!variant) continue;
    const key = variant.__collectionId;
    const current = qtyByCollection.get(key) || {
      qty: 0,
      regularSumCents: 0,
      variants: [],
    };
    current.qty += line.item.qty;
    current.regularSumCents += line.subtotalCents;
    current.variants.push({
      ...line.item,
      unitPriceCents: line.unitPriceCents,
    });
    qtyByCollection.set(key, current);
  }

  const discounts = [];

  for (const [collectionId, aggregate] of qtyByCollection) {
    const collection = collectionsById.get(collectionId);
    if (!collection) continue;

    const tiers = [...(collection.tieredPricing || [])].sort(
      (a, b) => b.minQty - a.minQty
    );
    if (tiers.length === 0 || aggregate.qty === 0) continue;

    let remaining = aggregate.qty;
    let discountedTotalForBundles = 0;
    const appliedBundles = [];

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

    const averageRegularPrice = aggregate.regularSumCents / aggregate.qty;
    const regularPortionCents = Math.round(averageRegularPrice * remaining);

    const scenarioPriceCents = discountedTotalForBundles + regularPortionCents;
    const discountCents = Math.max(
      0,
      aggregate.regularSumCents - scenarioPriceCents
    );

    if (discountCents > 0) {
      discounts.push({
        collectionId,
        appliedBundles,
        discountCents,
      });
    }
  }

  const totalDiscountCents = discounts.reduce(
    (sum, discount) => sum + discount.discountCents,
    0
  );
  const grandTotalCents = preDiscountTotalCents - totalDiscountCents;

  return {
    currency: catalog.currency,
    lineItems,
    preDiscountTotalCents,
    discounts,
    grandTotalCents,
  };
}

function describeNextTier(collection, tiers, quantity) {
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

export function analyzeCartPricing(items) {
  const quote = priceCart(items);

  const byCollection = new Map();

  for (const item of items) {
    const collection = catalog.collections.find(
      (candidate) => candidate.id === item.collectionId
    );
    if (!collection) continue;
    const entry = byCollection.get(collection.id) || {
      collection,
      quantity: 0,
    };
    entry.quantity += item.qty;
    byCollection.set(collection.id, entry);
  }

  const discountMap = new Map(
    quote.discounts.map((discount) => [discount.collectionId, discount])
  );

  const opportunities = [];

  for (const [collectionId, { collection, quantity }] of byCollection) {
    const tiers = [...(collection.tieredPricing || [])].sort(
      (a, b) => a.minQty - b.minQty
    );
    const discount = discountMap.get(collectionId);

    opportunities.push({
      collectionId,
      title: collection.title,
      quantity,
      discountCents: discount?.discountCents || 0,
      appliedBundles: discount?.appliedBundles || [],
      nextTier: describeNextTier(collection, tiers, quantity),
    });
  }

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

export function getVariantDisplayData(variantId) {
  const variant = variantsById.get(variantId);
  if (!variant) throw new Error(`Unknown variantId: ${variantId}`);
  const collection = collectionsById.get(variant.__collectionId);
  return {
    variant,
    collection,
  };
}
