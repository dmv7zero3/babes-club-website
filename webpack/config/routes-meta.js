// webpack/config/routes-meta.js
// ==============================================================================
// Central route metadata & structured data (JSON-LD) definitions.
// All SEO logic is computed here - the HTML template just outputs values.
// ==============================================================================

import fs from "fs";
import path from "path";

// -----------------------------------------------------------------------------
// Load business data
// -----------------------------------------------------------------------------
const businessDataPath = path.resolve(
  process.cwd(),
  "src/businessInfo/business-data.json"
);
const business = JSON.parse(fs.readFileSync(businessDataPath, "utf-8"));

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const ORIGIN =
  process.env.SITE_ORIGIN ||
  business.contact.website ||
  "https://thebabesclub.com";

const DEFAULT_OG_IMAGE = `${ORIGIN}/images/og-image/og-image.png`;
const DEFAULT_OG_IMAGE_ALT = `Handcrafted jewelry by The Babes Club – women-owned Washington DC accessories brand`;
const DEFAULT_KEYWORDS =
  "The Babes Club,jewelry,handcrafted accessories,women owned,Washington DC,artisan jewelry,feminine empowerment,handmade,earrings,necklaces";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Build canonical URL for a route
 * @param {string} route - Route path (e.g., "/about")
 * @returns {string} Full canonical URL with trailing slash
 */
function buildCanonical(route) {
  return route === "/" ? `${ORIGIN}/` : `${ORIGIN}${route}/`;
}

/**
 * Build the full OG image URL
 * @param {string|undefined} ogImagePath - Relative path or full URL
 * @returns {string} Absolute URL to OG image
 */
function buildOgImageUrl(ogImagePath) {
  if (!ogImagePath) return DEFAULT_OG_IMAGE;
  if (ogImagePath.startsWith("http")) return ogImagePath;
  return `${ORIGIN}${ogImagePath.startsWith("/") ? "" : "/"}${ogImagePath}`;
}

/**
 * Build complete template parameters for HtmlWebpackPlugin
 * @param {string} route - Route path
 * @param {object} meta - Route metadata
 * @returns {object} Complete params object for template
 */
function buildParams(route, meta) {
  const canonical = buildCanonical(route);
  const ogImage = buildOgImageUrl(meta.ogImage);

  return {
    // Primary meta
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords || DEFAULT_KEYWORDS,
    canonical,

    // Open Graph / Twitter
    ogTitle: meta.ogTitle || meta.title,
    ogDescription: meta.ogDescription || meta.description,
    ogImage,
    ogImageAlt: meta.ogImageAlt || DEFAULT_OG_IMAGE_ALT,

    // JSON-LD (pre-stringified for template)
    jsonLd: meta.jsonLd ? JSON.stringify(meta.jsonLd) : null,
  };
}

// -----------------------------------------------------------------------------
// JSON-LD Entities
// -----------------------------------------------------------------------------

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
    business.social_media?.instagram_main,
    business.social_media?.instagram_shop,
    business.social_media?.website,
  ].filter(Boolean),
  contactPoint: {
    "@type": "ContactPoint",
    email: business.contact?.email,
    contactType: "customer service",
  },
};

const WEBSITE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${ORIGIN}/#website`,
  url: `${ORIGIN}/`,
  name: business.business_name,
  description: business.description,
  publisher: { "@id": `${ORIGIN}/#org` },
};

const ABOUT_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${ORIGIN}/about/#about-page`,
  url: `${ORIGIN}/about/`,
  name: `About ${business.business_name}`,
  description:
    "Meet the women-owned team crafting vibrant jewelry in Washington, DC, offering custom designs, bulk orders, and DMV pickup.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: `${ORIGIN}/about/`,
      },
    ],
  },
  isPartOf: { "@id": `${ORIGIN}/#website` },
};

const CONTACT_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${ORIGIN}/contact/#contact-page`,
  url: `${ORIGIN}/contact/`,
  name: `Contact ${business.business_name}`,
  description:
    "Reach out for custom jewelry, boutique partnerships, pop-ups, or DMV pickup coordination.",
  isPartOf: { "@id": `${ORIGIN}/#website` },
};

const SHOP_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${ORIGIN}/shop/#shop-page`,
  url: `${ORIGIN}/shop/`,
  name: `${business.business_name} Shop`,
  description:
    "Browse handcrafted earrings and necklaces with bundle pricing from The Babes Club.",
  isPartOf: { "@id": `${ORIGIN}/#website` },
};

const GALLERY_PAGE_ENTITY = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${ORIGIN}/gallery/#gallery-page`,
  url: `${ORIGIN}/gallery/`,
  name: `${business.business_name} Gallery`,
  description:
    "Editorial shoots, behind-the-scenes moments, and everyday stacks featuring The Babes Club jewelry.",
  isPartOf: { "@id": `${ORIGIN}/#website` },
};

// -----------------------------------------------------------------------------
// Route Definitions
// -----------------------------------------------------------------------------

const ROUTES = {
  "/": {
    title: `${business.business_name} | ${business.tagline || "Handcrafted Jewelry & Accessories"}`,
    description: business.description,
    ogImage: business.og_image,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY],
  },
  "/about": {
    title: `About | ${business.business_name}`,
    description:
      "Meet the women-owned team crafting vibrant jewelry in Washington, DC, offering custom designs, bulk orders, and DMV pickup.",
    ogImage: business.og_image,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, ABOUT_PAGE_ENTITY],
  },
  "/shop": {
    title: `Shop | ${business.business_name}`,
    description:
      "Browse handcrafted earrings and necklaces with bundle pricing from The Babes Club in Washington, DC.",
    ogImage: business.og_image,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, SHOP_PAGE_ENTITY],
  },
  "/contact": {
    title: `Contact | ${business.business_name}`,
    description:
      "Contact The Babes Club for custom jewelry, boutique partnerships, pop-ups, or DMV pickup coordination.",
    ogImage: business.og_image,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, CONTACT_PAGE_ENTITY],
  },
  "/gallery": {
    title: `Gallery | ${business.business_name}`,
    description:
      "A mosaic of editorial shoots, behind-the-scenes looks, and everyday stacks celebrating The Babes Club community.",
    ogImage: business.og_image,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY, GALLERY_PAGE_ENTITY],
  },
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

/**
 * Static route paths for HTML generation
 */
export const STATIC_ROUTE_PATHS = Object.keys(ROUTES);

/**
 * Get route metadata by path
 * @param {string} routePath
 * @returns {object|undefined}
 */
export function getRouteMetaByPath(routePath) {
  return ROUTES[routePath];
}

/**
 * Build the route meta list for HtmlWebpackPlugin
 * Used by webpack.prod.js to generate per-route HTML files
 * @returns {Array<{route: string, filename: string, params: object}>}
 */
export function buildRouteMetaList() {
  return STATIC_ROUTE_PATHS.map((route) => {
    const meta = ROUTES[route];
    return {
      route,
      filename: route === "/" ? "index.html" : `${route.slice(1)}/index.html`,
      params: buildParams(route, meta),
    };
  });
}

// Legacy export for backwards compatibility
export const ROUTE_META = Object.entries(ROUTES).map(([path, meta]) => ({
  path,
  ...meta,
}));

export default ROUTES;
