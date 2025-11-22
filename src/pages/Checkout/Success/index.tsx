import React from "react";
import { Link, useLocation } from "react-router-dom";

import { formatMoney } from "@/lib/pricing";
import {
  readCheckoutSnapshot,
  clearCheckoutSnapshot,
  type CheckoutSnapshot,
} from "@/lib/api/checkoutStorage";
import { EMAIL } from "@/businessInfo/business";

const CheckoutSuccessPage: React.FC = () => {
  const location = useLocation();
  const sessionIdParam = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("session_id");
  }, [location.search]);

  const [snapshot, setSnapshot] = React.useState<CheckoutSnapshot | null>(null);
  const [sessionIdMismatch, setSessionIdMismatch] = React.useState(false);
  const supportEmail = EMAIL;

  React.useEffect(() => {
    const data = readCheckoutSnapshot();
    if (data) {
      setSnapshot(data);
      clearCheckoutSnapshot();

      const expectedSessionId =
        data.session.stripeSessionId ?? data.session.sessionId;
      if (
        sessionIdParam &&
        expectedSessionId &&
        sessionIdParam !== expectedSessionId
      ) {
        setSessionIdMismatch(true);
      }
    }
  }, [sessionIdParam]);

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
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/70">
            Payment complete
          </p>
          <h1 className="text-4xl font-heading header--pink">
            Thank you for your order!
          </h1>
          <p className="text-base text-white/80">
            We emailed your receipt and order details. You can now close this
            page or keep exploring the latest drops below.
          </p>
        </header>

        {snapshot ? (
          <section className="space-y-6 rounded-2xl border border-emerald-300/30 bg-emerald-900/40 p-6 shadow-lg shadow-emerald-900/20">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-emerald-100">
                  Order summary
                </h2>
                <p className="text-sm text-emerald-200/80">
                  Checked out on{" "}
                  {new Date(snapshot.storedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {readableSessionId && (
                <p className="text-xs font-mono text-emerald-200/70">
                  Stripe session · {readableSessionId}
                </p>
              )}
            </div>

            {sessionIdMismatch && (
              <div className="rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                We found your purchase details, but the session id in this URL
                doesn't match the latest checkout attempt. If you completed the
                order elsewhere, double-check your confirmation email or reach
                out to support.
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
                  <span>Paid today</span>
                  <span>{formatMoney(grandTotal, currency)}</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-white/80">
            <p>
              We couldn't locate your order summary in this browser session.
              This usually happens if the success page was opened in a different
              device or after clearing cookies.
            </p>
            <p>
              If you just finished paying, your receipt and shipping details are
              already on the way. Need help? Email{" "}
              <a className="underline" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
              .
            </p>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Link to="/shop" className="btn btn-primary">
            Shop new arrivals
          </Link>
          <Link
            to="/"
            className="btn btn-secondary border border-white/40 bg-transparent text-white hover:bg-white/10"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
