import {
  CartActionType,
  type CartState,
  type UICartItem,
} from "@/lib/types/cart";

export const STORAGE_KEY = "cart:v1";

export type CartAction =
  | { type: CartActionType.ADD; item: UICartItem }
  | { type: CartActionType.REMOVE; variantId: string }
  | { type: CartActionType.UPDATE_QTY; variantId: string; qty: number }
  | { type: CartActionType.CLEAR };

export function calcTotalItems(items: UICartItem[]) {
  return items.reduce((s, i) => s + i.qty, 0);
}

export function loadCart(): CartState {
  try {
    if (typeof window === "undefined") return { items: [], totalItems: 0 };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], totalItems: 0 };
    const parsed = JSON.parse(raw) as Partial<CartState>;
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return { items, totalItems: calcTotalItems(items) };
  } catch {
    return { items: [], totalItems: 0 };
  }
}

export function saveCart(state: CartState) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items: state.items, totalItems: state.totalItems })
    );
  } catch {}
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case CartActionType.ADD: {
      const existing = state.items.find(
        (i) => i.variantId === action.item.variantId
      );
      const items = existing
        ? state.items.map((i) =>
            i.variantId === action.item.variantId
              ? { ...i, qty: i.qty + action.item.qty }
              : i
          )
        : [...state.items, action.item];
      return { items, totalItems: calcTotalItems(items) };
    }
    case CartActionType.REMOVE: {
      const items = state.items.filter((i) => i.variantId !== action.variantId);
      return { items, totalItems: calcTotalItems(items) };
    }
    case CartActionType.UPDATE_QTY: {
      const items = state.items
        .map((i) =>
          i.variantId === action.variantId ? { ...i, qty: action.qty } : i
        )
        .filter((i) => i.qty > 0);
      return { items, totalItems: calcTotalItems(items) };
    }
    case CartActionType.CLEAR:
      return { items: [], totalItems: 0 };
    default:
      return state;
  }
}
