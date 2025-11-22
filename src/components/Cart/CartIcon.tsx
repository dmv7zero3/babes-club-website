import React from "react";
import { useCart } from "@/lib/context/CartContext";
import { ShoppingCart } from "lucide-react";

const CartIcon: React.FC<{ onClick?: () => void; className?: string }> = ({
  onClick,
  className,
}) => {
  const {
    state: { totalItems },
  } = useCart();
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        className ??
        "group relative inline-flex items-center justify-center text-white hover:text-cotton-candy-100 transition"
      }
      aria-label="Cart"
    >
      <ShoppingCart
        size={24}
        aria-hidden="true"
        className="text-white transition-colors group-hover:text-cotton-candy-100"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.45))" }}
      />
      {totalItems > 0 && (
        <span className="absolute inline-flex items-center justify-center w-5 h-5 text-xs text-white rounded-full -top-1 -right-1 bg-babe-pink ring-2 ring-white drop-shadow">
          {totalItems}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
