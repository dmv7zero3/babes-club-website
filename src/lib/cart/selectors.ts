import type { CartState } from "@/lib/types/cart";

export const selectItems = (s: CartState) => s.items;
export const selectTotalItems = (s: CartState) => s.totalItems;
export const selectItemByVariant = (variantId: string) => (s: CartState) =>
  s.items.find((i) => i.variantId === variantId);
