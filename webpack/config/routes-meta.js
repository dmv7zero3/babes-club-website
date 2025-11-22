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
const business = JSON.parse(fs.readFileSync(businessDataPath, "utf-8"));

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

const ABOUT_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${ORIGIN}/about/#about-page`,
  url: `${ORIGIN}/about/`,
  name: `${business.business_name} About`,
  description:
    business.description ||
    "Handcrafted accessories, custom jewelry, and women-owned business in Washington, DC.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${ORIGIN}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: `${ORIGIN}/about/`,
      },
    ],
  },
  isPartOf: {
    "@id": `${ORIGIN}/#website`,
  },
};

const CONTACT_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${ORIGIN}/contact/#contact-page`,
  url: `${ORIGIN}/contact/`,
  name: `${business.business_name} Contact`,
  description:
    "Reach out to plan custom jewelry, wholesale orders, or Babes Club events in the Washington, DC area.",
  isPartOf: {
    "@id": `${ORIGIN}/#website`,
  },
};

const SHOP_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${ORIGIN}/shop/#shop-page`,
  url: `${ORIGIN}/shop/`,
  name: `${business.business_name} Shop`,
  description:
    "Handcrafted jewelry bundles, earrings, and necklaces designed by The Babes Club.",
  isPartOf: {
    "@id": `${ORIGIN}/#website`,
  },
};

const GALLERY_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${ORIGIN}/gallery/#gallery-page`,
  url: `${ORIGIN}/gallery/`,
  name: `${business.business_name} Gallery`,
  description:
    "Explore editorial shoots, behind-the-scenes moments, and everyday stacks featuring The Babes Club jewelry.",
  isPartOf: {
    "@id": `${ORIGIN}/#website`,
  },
};

// Base meta registry
export const ROUTE_META = [
  {
    path: "/",
    title: `${business.business_name} | ${business.tagline}`,
    description: business.description,
    ogImage: business.og_image ? `${ORIGIN}${business.og_image}` : undefined,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY],
  },
  {
    path: "/about",
    title: `${business.business_name} | About`,
    description:
      "Meet the women-owned team crafting vibrant jewelry in Washington, DC, offering custom designs, bulk orders, and DMV pickup.",
    ogImage: business.og_image ? `${ORIGIN}${business.og_image}` : undefined,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, ABOUT_PAGE_ENTITY],
  },
  {
    path: "/contact",
    title: `${business.business_name} | Contact`,
    description:
      "Contact The Babes Club for custom jewelry, boutique partnerships, pop-ups, or DMV pickup coordination.",
    ogImage: business.og_image ? `${ORIGIN}${business.og_image}` : undefined,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, CONTACT_PAGE_ENTITY],
  },
  {
    path: "/shop",
    title: `${business.business_name} | Shop`,
    description:
      "Browse handcrafted earrings and necklaces with bundle pricing from The Babes Club in Washington, DC.",
    ogImage: business.og_image ? `${ORIGIN}${business.og_image}` : undefined,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, SHOP_PAGE_ENTITY],
  },
  {
    path: "/gallery",
    title: `${business.business_name} | Gallery`,
    description:
      "A mosaic of editorial shoots, behind-the-scenes looks, and everyday stacks celebrating The Babes Club community.",
    ogImage: business.og_image ? `${ORIGIN}${business.og_image}` : undefined,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, GALLERY_PAGE_ENTITY],
  },
];

export function getRouteMetaByPath(path) {
  return ROUTE_META.find((m) => m.path === path);
}

// Sourced from src/routes.tsx (excluding catch-all 404 route)
export const STATIC_ROUTE_PATHS = [
  "/",
  "/about",
  "/contact",
  "/shop",
  "/gallery",
];

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
