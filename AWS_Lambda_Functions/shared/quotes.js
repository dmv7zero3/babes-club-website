import crypto from "node:crypto";
import { analyzeCartPricing } from "./pricing.js";

const DEFAULT_QUOTE_TTL_SECONDS = 600; // 10 minutes

export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      collectionId: item.collectionId,
      variantId: item.variantId,
      qty: Number(item.qty) || 0,
    }))
    .filter((item) => item.variantId && item.collectionId && item.qty > 0)
    .sort((a, b) => {
      if (a.collectionId === b.collectionId) {
        return a.variantId.localeCompare(b.variantId);
      }
      return a.collectionId.localeCompare(b.collectionId);
    });
}

export function computeQuote(items) {
  const normalizedItems = normalizeItems(items);
  if (normalizedItems.length === 0) {
    return {
      analysis: {
        quote: {
          currency: "usd",
          lineItems: [],
          preDiscountTotalCents: 0,
          discounts: [],
          grandTotalCents: 0,
        },
        opportunities: [],
        totalDiscountCents: 0,
      },
      normalizedItems,
    };
  }

  const analysis = analyzeCartPricing(normalizedItems);
  return {
    analysis,
    normalizedItems,
  };
}

export function getQuoteVersion() {
  return process.env.QUOTE_PAYLOAD_VERSION || "1";
}

export function getQuoteTtlSeconds() {
  const configured = Number(process.env.QUOTE_TTL_SECONDS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_QUOTE_TTL_SECONDS;
  }
  return configured;
}

export function buildQuoteMetadata({
  issuedAt = Date.now(),
  version = getQuoteVersion(),
  ttlSeconds = getQuoteTtlSeconds(),
} = {}) {
  const expiresAt = issuedAt + ttlSeconds * 1000;
  return {
    version,
    issuedAt,
    expiresAt,
    ttlSeconds,
  };
}

export function canonicalizeQuotePayload(items, totals, metadata) {
  return JSON.stringify({
    version: metadata.version,
    issuedAt: metadata.issuedAt,
    expiresAt: metadata.expiresAt,
    ttlSeconds: metadata.ttlSeconds,
    items,
    totals: {
      preDiscountTotalCents: totals.preDiscountTotalCents,
      grandTotalCents: totals.grandTotalCents,
      totalDiscountCents: totals.totalDiscountCents,
      discounts: totals.discounts.map((discount) => ({
        collectionId: discount.collectionId,
        discountCents: discount.discountCents,
      })),
    },
  });
}

function getQuoteSecret() {
  const secret = process.env.QUOTE_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "QUOTE_SIGNING_SECRET is not set. Add it to the Lambda environment."
    );
  }
  return secret;
}

function createSignature(items, analysis, metadata) {
  const payload = canonicalizeQuotePayload(
    items,
    {
      preDiscountTotalCents: analysis.quote.preDiscountTotalCents,
      grandTotalCents: analysis.quote.grandTotalCents,
      totalDiscountCents: analysis.totalDiscountCents,
      discounts: analysis.quote.discounts,
    },
    metadata
  );
  const signature = crypto
    .createHmac("sha256", getQuoteSecret())
    .update(payload)
    .digest("hex");
  return { signature, payload };
}

export function signQuote(items, analysis, options = {}) {
  const metadata = buildQuoteMetadata(options);
  const result = createSignature(items, analysis, metadata);
  return {
    ...result,
    metadata,
  };
}

export function verifyQuoteSignature(items, analysis, signature, metadata) {
  if (!signature || !metadata) return false;
  if (!isQuoteMetadataValid(metadata)) return false;
  const { signature: expected } = createSignature(items, analysis, metadata);
  if (signature.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export function isQuoteExpired(metadata, now = Date.now()) {
  if (!isQuoteMetadataValid(metadata)) return true;
  return now > metadata.expiresAt;
}

export function isQuoteMetadataValid(metadata) {
  if (!metadata) return false;
  const requiredKeys = ["version", "issuedAt", "expiresAt", "ttlSeconds"];
  for (const key of requiredKeys) {
    if (metadata[key] === undefined || metadata[key] === null) {
      return false;
    }
  }
  if (typeof metadata.version !== "string") return false;
  if (!Number.isFinite(Number(metadata.issuedAt))) return false;
  if (!Number.isFinite(Number(metadata.expiresAt))) return false;
  if (!Number.isFinite(Number(metadata.ttlSeconds))) return false;
  if (metadata.expiresAt <= metadata.issuedAt) return false;
  return true;
}
