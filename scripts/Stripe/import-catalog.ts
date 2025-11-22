import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Stripe from "stripe";

const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_PRIVATE_KEY;

if (!secretKey) {
  console.error(
    "Missing STRIPE_PRIVATE_KEY in environment. Populate your .env before running the import script."
  );
  process.exit(1);
}

if (!publishableKey) {
  console.warn(
    "Warning: STRIPE_PUBLISHABLE_KEY is unset. The catalog import only needs the private key, but keeping both configured ensures client + server parity."
  );
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});

const args = new Set(process.argv.slice(2));
const flag = (name: string) => args.has(name);
const flagValue = (name: string): string | undefined => {
  const prefix = `${name}=`;
  const found = [...args].find((token) => token.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
};

const dryRun = flag("--dry-run") || process.env.DRY_RUN === "1";
const rotatePrices = flag("--rotate-price");
const collectionFilter = flagValue("--collections")
  ?.split(",")
  .map((v) => v.trim());

const jsonPath =
  flagValue("--json") ??
  process.env.JEWELRY_PRODUCTS_PATH ??
  path.resolve(process.cwd(), "src/businessInfo/JewleryProducts.json");

const outputPath =
  flagValue("--out") ??
  path.resolve(process.cwd(), "scripts/Stripe/stripe-id-map.json");

const ensureDirs = (file: string) => {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

type Variant = {
  id: string;
  sku: string;
  name: string;
  color?: string;
  imageUrl?: string | null;
  priceOverrideCents?: number;
  group?: string;
  notes?: string;
  active?: boolean;
};

type Collection = {
  id: string;
  title: string;
  slug: string;
  basePriceCents: number;
  taxCode?: string;
  tieredPricing?: Array<{
    minQty: number;
    totalPriceCents: number;
    mixAndMatch?: boolean;
    note?: string;
  }>;
  variants: Variant[];
};

type Catalog = {
  currency: string;
  collections: Collection[];
};

const readCatalog = (file: string): Catalog => {
  if (!fs.existsSync(file)) {
    console.error(`Catalog JSON not found at ${file}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(file, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.collections || !Array.isArray(parsed.collections)) {
      throw new Error("Catalog missing collections array");
    }
    return parsed as Catalog;
  } catch (err) {
    console.error(`Failed to parse catalog JSON: ${(err as Error).message}`);
    process.exit(1);
  }
};

const normalizeSku = (sku: string) => sku.trim();

const lookupKeyFor = (
  collectionId: string,
  variantId: string,
  currency: string
) => `babesclub:${collectionId}:${variantId}:${currency.toLowerCase()}`;

const safeEquals = (a?: string | null, b?: string | null) =>
  (a ?? "") === (b ?? "");

async function findExistingProductBySku(sku: string) {
  try {
    const res = await stripe.products.search({
      query: `metadata['sku']:'${sku.replace(/'/g, "\\'")}'`,
      limit: 1,
    });
    if (res.data.length > 0) return res.data[0];
  } catch (searchError) {
    // Product search not enabled or other error; fallback to list.
    let startingAfter: string | undefined;
    do {
      const page = await stripe.products.list({
        limit: 100,
        starting_after: startingAfter,
      });
      const match = page.data.find(
        (product: Stripe.Product) =>
          normalizeSku(product.metadata?.sku ?? "") === sku
      );
      if (match) return match;
      startingAfter = page.has_more
        ? page.data[page.data.length - 1]?.id
        : undefined;
    } while (startingAfter);
  }
  return null;
}

function buildProductPayload(variant: Variant, collection: Collection) {
  const active = variant.active !== false;
  const metadata: Record<string, string> = {
    sku: variant.sku,
    collection: collection.id,
    variant_id: variant.id,
  };
  if (variant.group) metadata.group = variant.group;
  if (variant.color) metadata.color = variant.color;
  if (variant.imageUrl) metadata.image_url = variant.imageUrl;
  if (collection.taxCode) metadata.catalog_tax_code = collection.taxCode;

  return {
    name: `${variant.name}${collection.id === "earrings" ? " Earrings" : collection.id === "necklaces" ? " Necklace" : ""}`,
    active,
    description: `${collection.title} — ${variant.name}`,
    shippable: true,
    metadata,
    images: variant.imageUrl ? [variant.imageUrl] : undefined,
  } satisfies Stripe.ProductCreateParams;
}

function diffProduct(
  existing: Stripe.Product,
  desired: ReturnType<typeof buildProductPayload>
) {
  const updates: Stripe.ProductUpdateParams = {};
  if ((existing.active ?? true) !== desired.active) {
    updates.active = desired.active;
  }
  if (!safeEquals(existing.description, desired.description)) {
    updates.description = desired.description;
  }
  if (desired.images) {
    const current = existing.images ?? [];
    if (
      desired.images.length !== current.length ||
      desired.images.some((url: string, idx: number) => url !== current[idx])
    ) {
      updates.images = desired.images;
    }
  }
  const mergedMetadata = {
    ...(existing.metadata || {}),
    ...desired.metadata,
  };
  const metadataChanged = Object.keys(desired.metadata).some(
    (key) => !safeEquals(existing.metadata?.[key], desired.metadata[key])
  );
  if (metadataChanged) {
    updates.metadata = mergedMetadata;
  }
  return updates;
}

async function ensureProduct(variant: Variant, collection: Collection) {
  const payload = buildProductPayload(variant, collection);
  const existing = await findExistingProductBySku(payload.metadata.sku);
  if (existing) {
    const updates = diffProduct(existing, payload);
    if (Object.keys(updates).length === 0) {
      if (dryRun) {
        console.log(`[DRY] keep product ${existing.id} (${variant.sku})`);
      }
      return existing;
    }
    if (dryRun) {
      console.log(
        `[DRY] update product ${existing.id} (${variant.sku})`,
        updates
      );
      return existing;
    }
    const updated = await stripe.products.update(existing.id, updates);
    return updated;
  }

  if (dryRun) {
    console.log(`[DRY] create product ${variant.sku}`);
    return {
      id: `prod_dry_${variant.sku}`,
      metadata: payload.metadata,
    } as Stripe.Product;
  }
  return await stripe.products.create(payload);
}

async function findExistingPrice(lookupKey: string) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  return res.data[0] ?? null;
}

async function ensurePrice(
  productId: string,
  cents: number,
  currency: string,
  lookupKey: string
) {
  const existing = await findExistingPrice(lookupKey);
  if (existing) {
    if (existing.unit_amount !== cents) {
      const message = `Price mismatch for ${lookupKey}: existing=${existing.unit_amount} new=${cents}`;
      if (rotatePrices) {
        if (dryRun) {
          console.log(`[DRY] rotate price for ${lookupKey} to ${cents}`);
          return existing;
        }
        const newPrice = await stripe.prices.create({
          product: productId,
          currency: currency.toLowerCase(),
          unit_amount: cents,
          nickname: existing.nickname ?? "Base",
        });
        console.warn(
          `${message}. Created new price ${newPrice.id}; consider deactivating the old one manually.`
        );
        return newPrice;
      }
      console.warn(`${message}. Reuse existing price ${existing.id}.`);
    }
    return existing;
  }

  if (dryRun) {
    console.log(`[DRY] create price ${lookupKey} ${currency} ${cents}`);
    return { id: `price_dry_${lookupKey}` } as Stripe.Price;
  }

  return await stripe.prices.create({
    product: productId,
    currency: currency.toLowerCase(),
    unit_amount: cents,
    lookup_key: lookupKey,
    nickname: "Base",
  });
}

async function main() {
  const catalog = readCatalog(jsonPath);
  const filteredCollections = collectionFilter
    ? catalog.collections.filter((collection) =>
        collectionFilter.includes(collection.id)
      )
    : catalog.collections;

  if (filteredCollections.length === 0) {
    console.error("No collections selected for import.");
    process.exit(1);
  }

  const summary: Record<
    string,
    {
      productId: string;
      priceId: string;
      amount: number;
      currency: string;
    }
  > = {};

  for (const collection of filteredCollections) {
    for (const variant of collection.variants) {
      const sku = normalizeSku(variant.sku);
      if (!sku) {
        console.warn(`Skipping variant ${variant.id} with empty SKU.`);
        continue;
      }
      if (variant.active === false) {
        console.log(`Skipping inactive variant ${sku}.`);
        continue;
      }
      const amount = Number.isFinite(variant.priceOverrideCents)
        ? (variant.priceOverrideCents as number)
        : collection.basePriceCents;
      if (!Number.isFinite(amount) || amount <= 0) {
        console.warn(`Skipping ${sku}: invalid price ${amount}.`);
        continue;
      }

      const product = await ensureProduct(variant, collection);
      const lookupKey = lookupKeyFor(
        collection.id,
        variant.id,
        catalog.currency
      );
      const price = await ensurePrice(
        product.id,
        amount,
        catalog.currency,
        lookupKey
      );

      summary[sku] = {
        productId: product.id,
        priceId: price.id,
        amount,
        currency: catalog.currency,
      };
      console.log(
        `${sku} → ${product.id} | ${price.id} | ${amount} ${catalog.currency}`
      );
    }
  }

  if (dryRun) {
    console.log("\n[DRY] Skipping write of stripe-id-map.json");
    return;
  }

  ensureDirs(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ID map → ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
