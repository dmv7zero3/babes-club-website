import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "./DashboardDataProvider";
import type { DashboardOrderItem } from "@/lib/types/dashboard";

const formatCurrency = (amountCents: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amountCents / 100);

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

interface OrderDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailDrawer = ({ isOpen, onClose }: OrderDetailDrawerProps) => {
  const { activeOrder } = useDashboardData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const portalTarget = useMemo(
    () => (typeof window !== "undefined" ? document.body : null),
    []
  );

  if (!isOpen || !mounted || !portalTarget) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl md:rounded-l-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Order Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>
        {!activeOrder ? (
          <p className="mt-6 text-sm text-neutral-500">
            Select an order from the table to see its details.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="space-y-1">
              <h3 className="text-sm font-medium text-neutral-700">
                {activeOrder.orderNumber}
              </h3>
              <p className="text-xs text-neutral-500">{activeOrder.orderId}</p>
              <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
                {activeOrder.status}
              </span>
            </section>

            <section className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Placed</span>
                <span>{formatDateTime(activeOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(
                    activeOrder.amount,
                    activeOrder.currency.toUpperCase()
                  )}
                </span>
              </div>
              {activeOrder.stripePaymentIntentId ? (
                <div className="flex justify-between">
                  <span>Payment Intent</span>
                  <span className="font-mono text-xs text-neutral-500">
                    {activeOrder.stripePaymentIntentId}
                  </span>
                </div>
              ) : null}
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                Items
              </h4>
              <ul className="mt-3 space-y-2 text-sm">
                {activeOrder.items.map((item: DashboardOrderItem) => (
                  <li
                    key={`${activeOrder.orderId}-${item.sku}`}
                    className="flex items-start justify-between rounded-lg border border-neutral-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {item.name}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Qty {item.quantity} · {item.sku}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(
                        item.unitPrice * item.quantity,
                        activeOrder.currency.toUpperCase()
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Close order details"
        onClick={onClose}
        className="flex-1"
      />
    </div>,
    portalTarget
  );
};

export default OrderDetailDrawer;
