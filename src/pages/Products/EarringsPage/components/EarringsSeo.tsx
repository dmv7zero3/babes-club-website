import React from "react";
import { Helmet } from "react-helmet";

type Props = {
  title?: string;
  description?: string;
  ogImage?: string;
  path?: string; // "/products/earrings"
  heroImage?: { href: string; type?: string };
};

const SITE_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

const EarringsSeo: React.FC<Props> = ({
  title = "Earrings | The Babes Club",
  description = "Handcrafted earrings with silver pearl options. Mix & match any 5 earrings for $100.",
  ogImage = "/images/og-image/og-image.jpg",
  path = "/products/earrings",
  heroImage = {
    href: "/images/models/model-earrings-8.webp",
    type: "image/webp",
  },
}) => {
  const canonical = SITE_ORIGIN ? `${SITE_ORIGIN}${path}` : path;

  const productCollectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Earrings",
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      url: SITE_ORIGIN || undefined,
    },
  } as const;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Preload hero for better LCP */}
      {heroImage?.href && (
        <link
          rel="preload"
          as="image"
          href={heroImage.href}
          {...(heroImage.type ? { type: heroImage.type } : {})}
          fetchPriority="high"
        />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(productCollectionJsonLd)}
      </script>
    </Helmet>
  );
};

export default EarringsSeo;
