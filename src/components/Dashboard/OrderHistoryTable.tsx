import { useMemo } from "react";
import { useDashboardData } from "./DashboardDataProvider";
import type { DashboardOrder, DashboardOrderItem } from "@/lib/types/dashboard";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/common/Pagination";
import { announce } from "@/utils/accessibility";

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

  // Pagination integration
  const pagination = usePagination<DashboardOrder>(orders, {
    totalItems: orders.length,
    itemsPerPage: 10,
    initialPage: 1,
    siblingCount: 1,
  });

  const handlePageChange = (page: number) => {
    pagination.goToPage(page);
    announce(`Navigated to page ${page} of ${pagination.totalPages}`, "polite");
    document.getElementById("order-history-table")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
        No orders yet. Encourage your members to explore the shop!
      </div>
    );
  }

  const pageData: DashboardOrder[] = pagination.pageData as DashboardOrder[];
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-6 py-3">
        <p className="text-sm text-neutral-600">
          Showing {pagination.startIndex + 1} to {pagination.endIndex} of{" "}
          {orders.length} orders
        </p>
      </div>
      <div id="order-history-table" className="overflow-x-auto">
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
            {pageData.map((order: DashboardOrder) => {
              const isActive = order.orderId === activeOrderId;
              return (
                <tr
                  key={order.orderId}
                  className={isActive ? "bg-neutral-50" : "hover:bg-neutral-50"}
                >
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOrderId(order.orderId);
                        onSelectOrder?.(order.orderId);
                        announce(
                          `Viewing order ${order.orderNumber}`,
                          "polite"
                        );
                      }}
                      className="text-left text-sm font-medium text-black hover:underline focus:outline-none focus:ring-2 focus:ring-cotton-candy focus:ring-offset-2 rounded"
                    >
                      {order.orderNumber}
                    </button>
                    <p className="text-xs text-neutral-500">{order.orderId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700"
                      role="status"
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-900">
                    {formatCurrency(order.amount, order.currency.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-neutral-500">
                    {order.items.length > 0 ? (
                      <span>
                        {order.items
                          .map((item: DashboardOrderItem) => item.name)
                          .join(", ")}
                      </span>
                    ) : (
                      <span className="text-neutral-400">No items</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        pageNumbers={pagination.pageNumbers}
        onPageChange={handlePageChange}
        onPreviousPage={() => {
          pagination.previousPage();
          announce(`Moved to page ${pagination.currentPage - 1}`, "polite");
        }}
        onNextPage={() => {
          pagination.nextPage();
          announce(`Moved to page ${pagination.currentPage + 1}`, "polite");
        }}
        onFirstPage={() => {
          pagination.goToFirstPage();
          announce("Moved to first page", "polite");
        }}
        onLastPage={() => {
          pagination.goToLastPage();
          announce(
            `Moved to last page, page ${pagination.totalPages}`,
            "polite"
          );
        }}
        hasNextPage={pagination.hasNextPage}
        hasPreviousPage={pagination.hasPreviousPage}
        ariaLabel="Order history pagination"
      />
    </div>
  );
};

export default OrderHistoryTable;
