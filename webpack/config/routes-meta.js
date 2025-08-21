// webpack/config/routes-meta.js
// Central route metadata & structured data (JSON-LD) definitions.
// Blank ogImage means intentionally NO og:image tag.

import fs from "fs";
import path from "path";
import { DEFAULT_META } from "../../src/data/seo/defaultMeta.js";
// Load business info from src/businessInfo/business-data.json
const businessDataPath = path.resolve(
  process.cwd(),
  "src/businessInfo/business-data.json"
);
const businessData = JSON.parse(fs.readFileSync(businessDataPath, "utf-8"));
const business = businessData["sls-dc"];

const ORIGIN =
  process.env.SITE_ORIGIN || business.contact.website || "https://example.com";

// Shared JSON-LD entities (referenced via @id to avoid duplication)
const ORG_ENTITY = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${ORIGIN}/#org`,
  name: business.business_name,
  url: ORIGIN,
  logo: {
    "@type": "ImageObject",
    url: business.logo
      ? `${ORIGIN}${business.logo}`
      : `${ORIGIN}/images/logo.png`,
  },
  sameAs: [
    business.social_media.instagram,
    business.social_media.facebook,
    business.social_media.google_maps,
  ].filter(Boolean),
};

const WEBSITE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${ORIGIN}/#website`,
  url: ORIGIN + "/",
  name: business.business_name,
};

// Base meta registry
export const ROUTE_META = [
  {
    path: "/",
    title: `${business.business_name} | ${business.tagline}`,
    description: business.description,
    ogImage: `${ORIGIN}/images/og-image/sls-dc-og-image.jpg`,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY],
  },
  // Add more routes as needed for SLS DC
];

export function getRouteMetaByPath(path) {
  return ROUTE_META.find((m) => m.path === path);
}

// Sourced from src/routes.tsx (excluding catch-all 404 route)
export const STATIC_ROUTE_PATHS = ["/"];

export function buildRouteMetaList() {
  return STATIC_ROUTE_PATHS.map((p) => {
    const meta = getRouteMetaByPath(p) || {};
    return {
      route: p,
      filename: p === "/" ? "index.html" : p.slice(1) + "/index.html",
      params: {
        title: meta.title || DEFAULT_META.title,
        description: meta.description || DEFAULT_META.description,
        ogImage: meta.ogImage || DEFAULT_META.ogImage, // blank means intentional omission
        jsonLd: meta.jsonLd || DEFAULT_META.jsonLd,
        route: p,
      },
    };
  });
}

export default ROUTE_META;
