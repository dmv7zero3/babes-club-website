export const CART_CHECKOUT_EVENT = "cart:checkout" as const;
export const CART_RESUME_CHECKOUT_EVENT = "cart:resume-checkout" as const;

export function emitCartCheckoutEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_CHECKOUT_EVENT));
}

export function emitCartResumeCheckoutEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_RESUME_CHECKOUT_EVENT));
}
