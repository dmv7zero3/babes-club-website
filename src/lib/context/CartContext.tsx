import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  cartReducer,
  loadCart,
  saveCart,
  type CartAction,
} from "@/lib/cart/cart.store";
import {
  CartActionType,
  type CartState,
  type UICartItem,
} from "@/lib/types/cart";

export type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: UICartItem) => void;
  removeItem: (variantId: string) => void;
  updateQty: (variantId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, undefined as any, loadCart);

  useEffect(() => {
    saveCart(state);
  }, [state]);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      dispatch,
      addItem: (item) => dispatch({ type: CartActionType.ADD, item }),
      removeItem: (variantId) =>
        dispatch({ type: CartActionType.REMOVE, variantId }),
      updateQty: (variantId, qty) =>
        dispatch({ type: CartActionType.UPDATE_QTY, variantId, qty }),
      clear: () => dispatch({ type: CartActionType.CLEAR }),
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
