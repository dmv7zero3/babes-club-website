export type UICartItem = {
  collectionId: string; // e.g., "necklaces"
  variantId: string; // e.g., "necklace-bright-red"
  name: string; // display name
  color?: string;
  imageUrl?: string;
  unitPriceCents?: number; // optional, UI display; server recomputes
  qty: number;
  options?: Record<string, string>; // e.g., { chain: "Gold" }
};

export type CartState = {
  items: UICartItem[];
  totalItems: number;
};

export enum CartActionType {
  ADD = "ADD",
  REMOVE = "REMOVE",
  UPDATE_QTY = "UPDATE_QTY",
  CLEAR = "CLEAR",
}
