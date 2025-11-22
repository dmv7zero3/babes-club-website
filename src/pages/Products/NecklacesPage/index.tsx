import React from "react";
import catalog from "@/businessInfo/JewleryProducts.json" assert { type: "json" };
import ProductCard from "@/components/Product/ProductCard";
import BannerHero from "@/components/Hero/BannerHero";
import ProductGrid from "@/components/Product/ProductGrid";
import TieredPricingNote from "@/components/Product/TieredPricingNote";

const NecklacesPage: React.FC = () => {
  const collection = catalog.collections.find((c) => c.id === "necklaces");
  if (!collection) return <div className="container">No necklaces found.</div>;

  const defaultOptions: Record<string, string> | undefined =
    collection.options?.reduce(
      (acc: any, opt: any) => {
        if (opt.type === "select" && opt.default) acc[opt.id] = opt.default;
        if (opt.type === "fixed" && opt.default) acc[opt.id] = opt.default;
        return acc;
      },
      {} as Record<string, string>
    );

  const tier = collection.tieredPricing?.[0];
  const heroSrc = "/images/banner/holly-chronic-2.jpg"; // Replace with a 2:1 banner when available

  return (
    <div className="pb-10 text-white">
      <BannerHero imageSrc={heroSrc} title="Necklaces" overlayOpacity={35} />
      <TieredPricingNote tier={tier} />
      <div className="mt-4">
        <ProductGrid ariaLabel="Necklaces">
          {collection.variants.map((v: any) => (
            <ProductCard
              key={v.id}
              collectionId={collection.id}
              variant={v}
              defaultOptions={defaultOptions}
            />
          ))}
        </ProductGrid>
      </div>
    </div>
  );
};

export default NecklacesPage;
