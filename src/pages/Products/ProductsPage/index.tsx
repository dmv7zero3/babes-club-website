import React from "react";
import catalog from "@/businessInfo/JewleryProducts.json" assert { type: "json" };
import ProductCard from "@/components/Product/ProductCard";

// VariantCard removed in favor of shared ProductCard

const Section: React.FC<{
  title: string;
  note?: string;
  children: React.ReactNode;
}> = ({ title, note, children }) => (
  <section className="container">
    <div className="mb-4">
      <h2 className="text-2xl header--pink font-heading">{title}</h2>
      {note && <p className="mt-1 text-sm opacity-80">{note}</p>}
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  </section>
);

const ProductsPage: React.FC = () => {
  const collections = catalog.collections;

  return (
    <div className="py-8">
      <div className="container text-white">
        <h1 className="mb-2 text-3xl md:text-4xl font-heading header--pink">
          Shop The Babes Club
        </h1>
        <p className="mb-6 text-sm opacity-80">
          Mix & match bundles apply per category and are automatically
          calculated in your cart.
        </p>
      </div>

      {collections.map((c) => {
        // Prepare default options (e.g., Necklace chain default)
        const defaultOptions: Record<string, string> | undefined =
          c.options?.reduce(
            (acc: any, opt: any) => {
              if (opt.type === "select" && opt.default)
                acc[opt.id] = opt.default;
              return acc;
            },
            {} as Record<string, string>
          );

        const note = c.tieredPricing?.[0]?.note;

        return (
          <Section key={c.id} title={c.title} note={note}>
            {c.variants.map((v: any) => (
              <ProductCard
                key={v.id}
                collectionId={c.id}
                variant={v}
                defaultOptions={defaultOptions}
              />
            ))}
          </Section>
        );
      })}
    </div>
  );
};

export default ProductsPage;
