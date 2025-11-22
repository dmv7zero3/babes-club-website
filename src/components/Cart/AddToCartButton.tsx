import React from "react";
import { useCart } from "@/lib/context/CartContext";
import type { UICartItem } from "@/lib/types/cart";

type Props = {
  item: UICartItem;
  className?: string;
  children?: React.ReactNode;
};

const AddToCartButton: React.FC<Props> = ({ item, className, children }) => {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      className={
        className ??
        "inline-flex items-center justify-center rounded-lg bg-babe-pink text-white px-5 py-3 font-semibold tracking-wide shadow-md hover:bg-babe-pink-600 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 transition"
      }
      onClick={() => addItem(item)}
    >
      {children ?? "Add to Cart"}
    </button>
  );
};

export default AddToCartButton;
