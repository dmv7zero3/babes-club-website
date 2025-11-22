import type { CheckoutPayload } from "@/lib/api/cartPayload";
import type {
  CartQuoteResponse,
  CheckoutSessionResponse,
} from "@/lib/api/cart";

const STORAGE_KEY = "checkout:last-session";

export type CheckoutSnapshot = {
  payload: CheckoutPayload;
  quote: CartQuoteResponse;
  session: CheckoutSessionResponse;
  storedAt: string;
};

export function stashCheckoutSnapshot(snapshot: CheckoutSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Unable to persist checkout snapshot", error);
  }
}

export function readCheckoutSnapshot(): CheckoutSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutSnapshot;
  } catch (error) {
    console.warn("Failed to parse checkout snapshot", error);
    return null;
  }
}

export function clearCheckoutSnapshot() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
