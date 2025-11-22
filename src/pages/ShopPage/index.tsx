import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import BannerHero from "@/components/Hero/BannerHero";
import ProductCard from "@/components/Product/ProductCard";
import catalog from "@/businessInfo/JewleryProducts.json" assert { type: "json" };

const Section: React.FC<{
  title: string;
  note?: string;
  children: React.ReactNode;
}> = ({ title, note, children }) => (
  <section className="w-11/12 max-w-6xl py-8 mx-auto">
    <div className="mb-6 text-center md:text-left">
      <h2 className="text-2xl md:text-3xl font-heading text-babe-pink-700 drop-shadow-sm">
        {title}
      </h2>
      {note ? (
        <p className="mt-2 text-sm text-slate-500 md:text-base">{note}</p>
      ) : null}
    </div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  </section>
);

const quickLinks = [
  {
    href: "/products/earrings",
    label: "Shop Earrings",
    description: "Mix and match any 5 earrings for $100.",
  },
  {
    href: "/products/necklaces",
    label: "Shop Necklaces",
    description: "Layer custom chains and charms your way.",
  },
  {
    href: "/contact",
    label: "Request a custom order",
    description: "Send a note for wholesale, events, or bespoke pieces.",
  },
];

const ShopPage: React.FC = () => {
  const collections = catalog.collections;
  const canonical =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/shop`
      : "/shop";

  return (
    <main className="bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <Helmet>
        <title>Shop | The Babes Club</title>
        <meta
          name="description"
          content="Explore The Babes Club mix-and-match jewelry collection. Shop earrings, necklaces, and custom bundles designed for bold, everyday shine."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shop | The Babes Club" />
        <meta
          property="og:description"
          content="Handcrafted earrings and necklaces with bundle pricing, designed in Washington, DC."
        />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <BannerHero
        imageSrc="/images/banner/holly-chronic-5.jpg"
        title="Shop The Babes Club"
        alt="Model showcasing layered Babes Club jewelry"
        overlayOpacity={50}
        className="lg:min-h-[44svh]"
        titleClassName="tracking-tight"
      />

      <section className="w-11/12 max-w-4xl py-12 mx-auto space-y-5 text-center">
        <p className="text-lg text-slate-600">
          Build a jewelry wardrobe that matches your mood. Every piece is
          designed in the DMV and made to stack, so bundle discounts
          automatically unlock in your cart.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex flex-col gap-1 p-5 text-left transition border shadow-lg group rounded-2xl border-babe-pink/20 bg-white/70 shadow-babe-pink/10 hover:-translate-y-1 hover:border-babe-pink/40 hover:shadow-babe-pink/25"
            >
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-babe-pink-600">
                {link.label}
              </span>
              <span className="text-sm leading-relaxed text-slate-600">
                {link.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {collections.map((collection: any) => {
        const rawDefaultOptions = collection.options?.reduce(
          (acc: Record<string, string>, opt: any) => {
            if (opt.type === "select" && opt.default) {
              acc[opt.id] = opt.default;
            }
            return acc;
          },
          {}
        );
        const defaultOptions =
          rawDefaultOptions && Object.keys(rawDefaultOptions).length > 0
            ? rawDefaultOptions
            : undefined;

        const note = collection.tieredPricing?.[0]?.note;

        return (
          <Section key={collection.id} title={collection.title} note={note}>
            {collection.variants.map((variant: any) => (
              <ProductCard
                key={variant.id}
                collectionId={collection.id}
                variant={variant}
                defaultOptions={defaultOptions}
              />
            ))}
          </Section>
        );
      })}

      <section className="w-11/12 max-w-5xl py-16 mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-heading text-babe-pink-700">
          Need a custom stack?
        </h2>
        <p className="mt-4 text-slate-600 md:text-lg">
          Let us curate a quote for weddings, corporate gifting, or your next
          Babes Club pop-up. Share your vibe and we’ll handle the sparkle.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center px-8 py-3 mt-6 text-base font-semibold text-white transition rounded-full shadow-lg bg-babe-pink hover:bg-babe-pink-600"
        >
          Start a custom order
        </Link>
      </section>
    </main>
  );
};

export default ShopPage;
