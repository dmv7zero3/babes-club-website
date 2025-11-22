import React from "react";
import ProductImage from "@/components/Product/ProductImage";
import { getUnitPriceCents, formatMoney } from "@/lib/pricing";
import type { UICartItem } from "@/lib/types/cart";
import AddToCartButton from "@/components/Cart/AddToCartButton";
import catalog from "@/businessInfo/JewleryProducts.json" assert { type: "json" };

type VariantLike = {
  id: string;
  name: string;
  color?: string;
  imageUrl?: string | null;
};

type Props = {
  collectionId: string;
  variant: VariantLike;
  defaultOptions?: Record<string, string>;
  className?: string;
};

const ProductCard: React.FC<Props> = ({
  collectionId,
  variant,
  defaultOptions,
  className,
}) => {
  const unit = getUnitPriceCents(variant.id);
  const item: UICartItem = {
    collectionId,
    variantId: variant.id,
    name: variant.name,
    color: variant.color,
    qty: 1,
    options: defaultOptions,
    unitPriceCents: unit,
  };

  // Find a bundle tier for this variant's collection, if any
  const collection = catalog.collections.find((c) =>
    c.variants.some((v: any) => v.id === variant.id)
  );
  const tier = collection?.tieredPricing
    ?.slice()
    .sort((a: any, b: any) => a.minQty - b.minQty)[0];
  const approxPerUnit = tier
    ? Math.round(tier.totalPriceCents / tier.minQty)
    : null;

  const categoryLabel = React.useMemo(() => {
    switch (collectionId) {
      case "earrings":
        return "Earrings";
      case "necklaces":
        return "Necklaces";
      default: {
        if (collection?.title) return collection.title;
        return collectionId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  }, [collectionId, collection?.title]);

  const metaParts = React.useMemo(() => {
    const parts: string[] = categoryLabel ? [categoryLabel] : [];
    if (variant.color) {
      const normalizedColor = variant.color.trim();
      if (normalizedColor.length > 0) parts.push(normalizedColor);
    }
    return parts;
  }, [categoryLabel, variant.color]);

  return (
    <div
      className={
        className ??
        [
          "group flex flex-col gap-3 p-4 text-slate-800",
          // Brighter, colorful surface with soft depth
          "rounded-xl border border-babe-pink/20 bg-white/90",
          "shadow-lg shadow-pink-900/15",
          // Smooth hover lift (respect reduced motion via user's settings; Tailwind doesn't toggle automatically)
          "transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-pink-900/25",
        ].join(" ")
      }
    >
      <ProductImage
        name={variant.name}
        colorName={variant.color}
        imageUrl={variant.imageUrl ?? undefined}
        className="mb-2"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 pr-1">
          <div className="font-heading text-lg font-semibold text-babe-pink-800 tracking-wide">
            {variant.name}
          </div>
          {metaParts.length > 0 && (
            <div className="mt-1 text-xs uppercase tracking-[0.3em] text-babe-pink-500">
              {metaParts.join(" · ")}
            </div>
          )}
          {defaultOptions && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(defaultOptions).map(([k, v]) => (
                <span
                  key={k}
                  className="text-xs px-2 py-0.5 rounded-full bg-babe-pink-100 text-babe-pink-700"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
          {/* {variant.color && (
            <div className="text-sm opacity-80">{variant.color}</div>
          )} */}
        </div>
        <div className="flex flex-col items-end gap-1 whitespace-nowrap">
          <div className="rounded-md bg-babe-pink-100 px-2 py-1 text-sm font-semibold text-babe-pink-800 md:text-base">
            {formatMoney(unit)}
          </div>
          {approxPerUnit && tier?.minQty ? (
            <div className="text-[11px] text-babe-pink-500">
              ≈ {formatMoney(approxPerUnit)} ea at {tier.minQty}
            </div>
          ) : null}
        </div>
      </div>

      <div className="pt-1">
        <AddToCartButton
          item={item}
          className="w-full py-2 text-sm rounded-lg bg-babe-pink hover:bg-babe-pink-400 focus:ring-2 focus:ring-babe-pink/40 focus:outline-none transition-colors shadow-md"
        />
      </div>
    </div>
  );
};

export default ProductCard;
