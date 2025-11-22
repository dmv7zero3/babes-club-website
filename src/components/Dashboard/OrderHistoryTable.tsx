import { Fragment, useMemo } from "react";
import { useDashboardData } from "./DashboardDataProvider";

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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

interface OrderHistoryTableProps {
  onSelectOrder?: (orderId: string) => void;
}

const OrderHistoryTable = ({ onSelectOrder }: OrderHistoryTableProps = {}) => {
  const { orders, activeOrderId, setActiveOrderId } = useDashboardData();

  const groupedOrders = useMemo(() => {
    return orders.reduce<Record<string, typeof orders>>((acc, order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 7);
      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(order);
      return acc;
    }, {});
  }, [orders]);

  const monthKeys = useMemo(
    () =>
      Object.keys(groupedOrders)
        .sort((a, b) => (a < b ? 1 : -1))
        .map((key) => {
          const [year, month] = key.split("-");
          const label = new Date(
            Number(year),
            Number(month) - 1
          ).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          });

          return {
            key,
            label,
          };
        }),
    [groupedOrders]
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        No orders yet. Encourage your members to explore the shop!
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="px-6 py-3">Order</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Total</th>
            <th className="px-6 py-3">Created</th>
            <th className="px-6 py-3">Items</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700">
          {monthKeys.map(({ key, label }) => (
            <Fragment key={key}>
              <tr className="bg-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <td className="px-6 py-2" colSpan={5}>
                  {label}
                </td>
              </tr>
              {groupedOrders[key]?.map((order) => {
                const isActive = order.orderId === activeOrderId;

                return (
                  <tr
                    key={order.orderId}
                    className={
                      isActive ? "bg-neutral-50" : "hover:bg-neutral-50"
                    }
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveOrderId(order.orderId);
                          onSelectOrder?.(order.orderId);
                        }}
                        className="text-left text-sm font-medium text-black"
                      >
                        {order.orderNumber}
                      </button>
                      <p className="text-xs text-neutral-500">
                        {order.orderId}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {formatCurrency(
                        order.amount,
                        order.currency.toUpperCase()
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {order.items.map((item) => item.name).join(", ")}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderHistoryTable;
