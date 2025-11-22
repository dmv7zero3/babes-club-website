import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { formatMoney } from "@/lib/pricing";
import {
  readCheckoutSnapshot,
  clearCheckoutSnapshot,
  type CheckoutSnapshot,
} from "@/lib/api/checkoutStorage";
import { stashCheckoutPayload } from "@/lib/api/cartPayload";
import { useDrawerManager } from "@/lib/context/DrawerManagerContext";
import { emitCartResumeCheckoutEvent } from "@/lib/cart/drawerEvents";

const CheckoutCancelPage: React.FC = () => {
  const location = useLocation();
  const sessionIdParam = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("session_id");
  }, [location.search]);
  const navigate = useNavigate();
  const { open: openDrawer } = useDrawerManager();

  const [snapshot, setSnapshot] = React.useState<CheckoutSnapshot | null>(null);
  const [cartRestored, setCartRestored] = React.useState(false);

  React.useEffect(() => {
    const data = readCheckoutSnapshot();
    if (data) {
      setSnapshot(data);
      stashCheckoutPayload(data.payload);
      clearCheckoutSnapshot();
      setCartRestored(true);
    }
  }, []);

  const subtotal = snapshot?.payload.totals.preDiscountTotalCents ?? 0;
  const discountTotal =
    snapshot?.payload.totals.discounts.reduce(
      (sum, discount) => sum + discount.discountCents,
      0
    ) ?? 0;
  const grandTotal = snapshot?.payload.totals.grandTotalCents ?? 0;
  const currency = snapshot?.payload.currency ?? "USD";

  const readableSessionId = React.useMemo(() => {
    if (!snapshot) return sessionIdParam;
    return snapshot.session.stripeSessionId ?? snapshot.session.sessionId;
  }, [snapshot, sessionIdParam]);

  return (
    <div className="container py-12 text-white">
      <div className="max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-rose-200/80">
            Checkout paused
          </p>
          <h1 className="text-4xl font-heading header--pink">
            No worries — your cart is safe
          </h1>
          <p className="text-base text-white/80">
            You haven't been charged. When you're ready, hop back into secure
            checkout to finish your order or keep shopping the latest drops.
          </p>
        </header>

        {snapshot ? (
          <section className="space-y-6 rounded-2xl border border-rose-300/30 bg-rose-900/40 p-6 shadow-lg shadow-rose-900/20">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-rose-50">
                  Your saved selections
                </h2>
                <p className="text-sm text-rose-100/70">
                  Bundle savings will still apply when you restart checkout.
                </p>
              </div>
              {readableSessionId && (
                <p className="text-xs font-mono text-rose-100/60">
                  Last session · {readableSessionId}
                </p>
              )}
            </div>

            {cartRestored && (
              <div className="rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Your cart is reloaded with these items. Tap “Resume checkout”
                below when you're ready.
              </div>
            )}

            <div className="space-y-4">
              <ul className="space-y-2 text-sm">
                {snapshot.payload.items.map((item) => (
                  <li
                    key={`${item.variantId}-${item.qty}`}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {item.name ?? item.variantId}
                      </p>
                      <p className="text-xs uppercase tracking-widest text-white/60">
                        Qty {item.qty} · {item.collectionId}
                      </p>
                    </div>
                    <span className="font-semibold text-white">
                      {formatMoney(
                        (item.unitPriceCents ?? 0) * item.qty,
                        currency
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-200">
                  <span>Bundle savings</span>
                  <span>-{formatMoney(discountTotal, currency)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold text-base">
                  <span>Due at checkout</span>
                  <span>{formatMoney(grandTotal, currency)}</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-white/80">
            <p>
              We didn't find any recent checkout details to restore here. Head
              back to the cart to rebuild your order or reach out if you need a
              hand.
            </p>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              openDrawer("cart");
              emitCartResumeCheckoutEvent();
              navigate("/");
            }}
          >
            Resume checkout
          </button>
          <Link
            to="/shop"
            className="btn btn-secondary border border-white/40 bg-transparent text-white hover:bg-white/10"
          >
            Keep shopping
          </Link>
          <Link to="/" className="btn btn-ghost text-white/70 hover:text-white">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
