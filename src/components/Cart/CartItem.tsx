import React, { useMemo } from "react";
import { useCart } from "@/lib/context/CartContext";
import type { UICartItem } from "@/lib/types/cart";
import { formatMoney, getUnitPriceCents } from "@/lib/pricing";

type Props = { item: UICartItem };

const CartItemRow: React.FC<Props> = ({ item }) => {
  const { updateQty, removeItem } = useCart();
  const unitPrice = useMemo(() => {
    if (typeof item.unitPriceCents === "number") return item.unitPriceCents;
    try {
      return getUnitPriceCents(item.variantId);
    } catch {
      return undefined;
    }
  }, [item.unitPriceCents, item.variantId]);
  const lineTotal = unitPrice ? unitPrice * item.qty : undefined;
  const categoryLabel = useMemo(() => {
    switch (item.collectionId) {
      case "necklaces":
        return "Necklace";
      case "earrings":
        return "Earrings";
      default:
        return item.collectionId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }, [item.collectionId]);
  const showColor =
    item.color &&
    item.color.trim().toLowerCase() !== item.name.trim().toLowerCase();
  const metaParts = [categoryLabel, ...(showColor ? [item.color!] : [])];
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-200">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="object-cover rounded-md w-14 h-14 ring-1 ring-slate-200"
        />
      )}
      <div className="flex-1">
        <div className="font-medium text-slate-900">{item.name}</div>
        {metaParts.length > 0 && (
          <div className="text-sm text-slate-500">{metaParts.join(" · ")}</div>
        )}
        {unitPrice && (
          <div className="mt-1 text-xs text-slate-500">
            {formatMoney(unitPrice)} each
            {lineTotal && lineTotal !== unitPrice
              ? ` · ${formatMoney(lineTotal)} total`
              : ""}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 border rounded-md border-slate-300 text-slate-700 hover:bg-slate-100"
          onClick={() => updateQty(item.variantId, item.qty - 1)}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="w-8 text-center text-slate-900">{item.qty}</span>
        <button
          className="px-2 py-1 border rounded-md border-slate-300 text-slate-700 hover:bg-slate-100"
          onClick={() => updateQty(item.variantId, item.qty + 1)}
          aria-label="Increase quantity"
        >
          +
        </button>
        <button
          className="ml-2 text-slate-500 hover:text-babe-pink-600"
          onClick={() => removeItem(item.variantId)}
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItemRow;
