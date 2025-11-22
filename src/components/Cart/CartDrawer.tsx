import React from "react";
import { useCart } from "@/lib/context/CartContext";
import CartItemRow from "./CartItem";
import { formatMoney } from "@/lib/pricing";
import {
  buildCheckoutPayload,
  stashCheckoutPayload,
  popCheckoutPayload,
  type CheckoutPayload,
} from "@/lib/api/cartPayload";
import { analyzeCartPricing } from "@/lib/cart/bundleInsights";
import {
  createCartQuote,
  createCheckoutSession,
  CommerceApiError,
} from "@/lib/api/cart";
import { stashCheckoutSnapshot } from "@/lib/api/checkoutStorage";
import {
  CART_CHECKOUT_EVENT,
  CART_RESUME_CHECKOUT_EVENT,
} from "@/lib/cart/drawerEvents";

type Props = { open: boolean; onClose: () => void };

type DrawerStep = "cart" | "checkout";

const CartDrawer: React.FC<Props> = ({ open, onClose }) => {
  const { state } = useCart();
  const [step, setStep] = React.useState<DrawerStep>("cart");
  const [checkoutPayload, setCheckoutPayload] =
    React.useState<CheckoutPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const resetCheckoutState = React.useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsSubmitting(false);
    setStatusMessage(null);
    setErrorMessage(null);
  }, []);

  const openCheckoutStep = React.useCallback(
    (payload?: CheckoutPayload | null) => {
      const effectivePayload = payload ?? buildCheckoutPayload(state);
      if (!effectivePayload || effectivePayload.items.length === 0) {
        setCheckoutPayload(null);
        return;
      }

      stashCheckoutPayload(effectivePayload);
      setCheckoutPayload(effectivePayload);
      setStep("checkout");
      setStatusMessage(null);
      setErrorMessage(null);
    },
    [state]
  );

  React.useEffect(() => {
    function handleCartCheckout() {
      openCheckoutStep();
    }

    function handleResumeCheckout() {
      const payload = popCheckoutPayload();
      if (payload) {
        openCheckoutStep(payload);
      }
    }

    window.addEventListener(CART_CHECKOUT_EVENT, handleCartCheckout);
    window.addEventListener(CART_RESUME_CHECKOUT_EVENT, handleResumeCheckout);

    return () => {
      window.removeEventListener(CART_CHECKOUT_EVENT, handleCartCheckout);
      window.removeEventListener(
        CART_RESUME_CHECKOUT_EVENT,
        handleResumeCheckout
      );
    };
  }, [openCheckoutStep]);

  React.useEffect(() => {
    if (open) {
      return;
    }

    setStep("cart");
    resetCheckoutState();
    setCheckoutPayload(null);
  }, [open, resetCheckoutState]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const pricingInput = state.items.map((it) => ({
    collectionId: it.collectionId,
    variantId: it.variantId,
    qty: it.qty,
  }));
  const analysis = analyzeCartPricing(pricingInput);
  const { quote, opportunities, totalDiscountCents } = analysis;
  const activeDiscounts = opportunities.filter((o) => o.discountCents > 0);
  const nextTierHints = opportunities
    .filter((o) => o.nextTier && o.nextTier.missingQty > 0)
    .sort(
      (a, b) => (a.nextTier!.missingQty ?? 0) - (b.nextTier!.missingQty ?? 0)
    );

  const checkoutTotalItems = React.useMemo(
    () => checkoutPayload?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0,
    [checkoutPayload]
  );

  const checkoutDiscountCents = React.useMemo(
    () =>
      checkoutPayload?.totals.discounts.reduce(
        (sum, discount) => sum + discount.discountCents,
        0
      ) ?? 0,
    [checkoutPayload]
  );

  const handleSecureCheckout = React.useCallback(async () => {
    if (!checkoutPayload || isSubmitting) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage("Calculating bundle savings…");

    try {
      const quote = await createCartQuote(checkoutPayload, {
        signal: controller.signal,
      });
      setStatusMessage("Preparing secure checkout…");

      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const successUrl = origin
        ? `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
        : undefined;
      const cancelUrl = origin ? `${origin}/checkout/cancel` : undefined;

      const session = await createCheckoutSession(
        {
          quoteSignature: quote.quoteSignature,
          successUrl,
          cancelUrl,
          metadata: {
            cartItemsCount: String(checkoutTotalItems),
            cartSubtotalCents: String(
              checkoutPayload.totals.preDiscountTotalCents
            ),
            cartGrandTotalCents: String(checkoutPayload.totals.grandTotalCents),
            normalizedHash: quote.normalizedHash,
          },
        },
        { signal: controller.signal }
      );

      stashCheckoutSnapshot({
        payload: checkoutPayload,
        quote,
        session,
        storedAt: new Date().toISOString(),
      });

      setStatusMessage("Redirecting to Stripe…");

      if (typeof window !== "undefined") {
        window.location.href = session.checkoutUrl;
        return;
      }
    } catch (error) {
      if ((error as Error)?.name === "AbortError") {
        return;
      }

      console.error("Checkout failed", error);
      if (error instanceof CommerceApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "We couldn't start your secure checkout just now. Please try again."
        );
      }
      setStatusMessage(null);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  }, [checkoutPayload, checkoutTotalItems, isSubmitting]);

  const handleProceedToCheckout = React.useCallback(() => {
    if (state.items.length === 0) {
      return;
    }

    resetCheckoutState();
    openCheckoutStep();
  }, [openCheckoutStep, resetCheckoutState, state.items.length]);

  const handleBackToCart = React.useCallback(() => {
    resetCheckoutState();
    setStep("cart");
  }, [resetCheckoutState]);

  return (
    <div
      className={`fixed inset-0 z-[1000] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 z-[999] bg-babe-pink/25 backdrop-blur-sm saturate-150 transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => {
          onClose();
          resetCheckoutState();
          setStep("cart");
        }}
      />
      <aside
        className={`absolute right-0 top-0 z-[1000] h-full w-full max-w-md p-5 transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"} bg-white/95 backdrop-blur-xl border-l border-babe-pink/20 shadow-[0_0_60px_rgba(254,59,161,0.35)] text-slate-900`}
      >
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-xl font-semibold">
                {step === "cart" ? "Your Cart" : "Secure Checkout"}
              </h2>
              <p className="text-xs text-slate-500">
                {step === "cart"
                  ? "Review your selections and bundle savings."
                  : "We’ll redirect you to Stripe to finish payment."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {step === "checkout" && (
                <button
                  type="button"
                  className="px-3 py-1 text-xs font-medium transition border rounded-full border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  onClick={handleBackToCart}
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  resetCheckoutState();
                  setStep("cart");
                }}
                aria-label="Close"
                className="text-2xl leading-none transition text-slate-600 hover:text-slate-900"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 pr-1 overflow-y-auto">
            {step === "cart" ? (
              state.items.length === 0 ? (
                <div className="opacity-70">Your cart is empty.</div>
              ) : (
                state.items.map((it) => (
                  <CartItemRow key={it.variantId} item={it} />
                ))
              )
            ) : !checkoutPayload ? (
              <div className="px-3 py-3 text-sm border rounded-lg border-rose-200/70 bg-rose-50 text-rose-700">
                We couldn’t restore your checkout details. Add items to your
                cart and try again.
              </div>
            ) : (
              <div className="pb-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Items
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {checkoutPayload.items.map((item) => (
                      <li
                        key={`${item.variantId}-${item.qty}`}
                        className="flex items-center justify-between px-3 py-2 border rounded-lg shadow-sm border-white/40 bg-white/60"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.name ?? item.variantId}
                          </p>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                            Qty {item.qty} · {item.collectionId}
                          </p>
                        </div>
                        <span className="font-semibold">
                          {formatMoney((item.unitPriceCents ?? 0) * item.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 space-y-2 text-sm border rounded-lg shadow-sm border-slate-200 bg-white/70">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>
                      {formatMoney(
                        checkoutPayload.totals.preDiscountTotalCents
                      )}
                    </span>
                  </div>
                  {checkoutPayload.totals.discounts.map((discount) => (
                    <div
                      key={discount.collectionId}
                      className="flex justify-between text-emerald-600"
                    >
                      <span>{discount.collectionId} savings</span>
                      <span>-{formatMoney(discount.discountCents)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-semibold text-slate-900">
                    <span>Grand Total</span>
                    <span>
                      {formatMoney(checkoutPayload.totals.grandTotalCents)}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3 text-xs border rounded-lg shadow-sm border-emerald-200/70 bg-emerald-50 text-emerald-800">
                  {checkoutDiscountCents > 0 ? (
                    <p>
                      We’ll automatically apply{" "}
                      {formatMoney(checkoutDiscountCents)} in bundle savings
                      during payment with a one-time Stripe coupon.
                    </p>
                  ) : (
                    <p>
                      Mix and match pieces from the same collection to unlock
                      bundle savings automatically at checkout.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 space-y-3 text-sm border-t border-slate-200">
            {step === "cart" ? (
              <>
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal</span>
                  <span>{formatMoney(quote.preDiscountTotalCents)}</span>
                </div>
                {activeDiscounts.map((disc) => (
                  <div
                    key={disc.collectionId}
                    className="flex items-start justify-between text-emerald-600"
                  >
                    <span className="pr-2">
                      Bundle savings · {disc.title}
                      {disc.appliedBundles
                        .map(
                          (b) =>
                            ` • ${b.tierMinQty} for ${formatMoney(
                              b.tierTotalPriceCents
                            )} x${b.bundleCount}`
                        )
                        .join("") || ""}
                    </span>
                    <span>-{formatMoney(disc.discountCents)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(quote.grandTotalCents)}</span>
                </div>
                <div className="px-3 py-2 text-xs border rounded-lg shadow-sm border-emerald-200/70 bg-emerald-50 text-emerald-800">
                  {totalDiscountCents > 0 ? (
                    <p>
                      We’ll automatically apply{" "}
                      {formatMoney(totalDiscountCents)} in bundle savings at
                      payment using a one-time Stripe coupon.
                    </p>
                  ) : nextTierHints.length > 0 ? (
                    <>
                      <p className="font-medium text-emerald-900">
                        Almost there!
                      </p>
                      {nextTierHints.slice(0, 1).map((hint) => (
                        <p key={hint.collectionId}>
                          Add {hint.nextTier!.missingQty} more from the{" "}
                          {hint.title} collection to unlock{" "}
                          {hint.nextTier!.minQty} for{" "}
                          {formatMoney(hint.nextTier!.totalPriceCents)} (save up
                          to {formatMoney(hint.nextTier!.potentialSavingsCents)}
                          ).
                        </p>
                      ))}
                    </>
                  ) : (
                    <p>
                      Mix and match pieces from the same collection to unlock
                      bundle savings automatically at checkout.
                    </p>
                  )}
                </div>
                {nextTierHints.length > 1 && (
                  <div className="space-y-1 text-xs text-slate-500">
                    {nextTierHints.slice(1).map((hint) => (
                      <p key={hint.collectionId}>
                        {hint.nextTier!.missingQty} more from {hint.title} →{" "}
                        {hint.nextTier!.minQty} for{" "}
                        {formatMoney(hint.nextTier!.totalPriceCents)}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Taxes and shipping (if any) are calculated in Stripe Checkout.
                </p>
                <button
                  type="button"
                  className="block w-full py-3 font-semibold text-center text-white transition rounded-lg shadow-md bg-babe-pink hover:bg-babe-pink-600 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handleProceedToCheckout}
                  disabled={state.items.length === 0}
                >
                  Continue to checkout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="block w-full py-3 font-semibold text-center text-white transition rounded-lg shadow-md bg-babe-pink hover:bg-babe-pink-600 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || !checkoutPayload}
                  onClick={handleSecureCheckout}
                >
                  {isSubmitting ? "Redirecting to Stripe…" : "Secure checkout"}
                </button>
                <p className="text-xs text-slate-500">
                  We’ll send you to Stripe Checkout to finish payment and apply
                  your bundle savings automatically.
                </p>
                {statusMessage && (
                  <p className="text-xs text-emerald-600" aria-live="polite">
                    {statusMessage}
                  </p>
                )}
                {errorMessage && (
                  <p className="text-xs text-rose-600" aria-live="assertive">
                    {errorMessage}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
