// src/components/Dashboard/OrderHistory.tsx
// Order history component with proper empty state handling
//
// NOTE: This is an ALTERNATIVE component to OrderHistoryTable.
// OrderHistoryTable uses useDashboardData() from DashboardDataProvider.
// This component uses the standalone useOrders hook.

import React from "react";
import { useOrders, Order } from "../../hooks/useOrders";

// Currency formatter - defined locally to avoid external dependency
const formatCurrency = (amountCents: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(amountCents / 100);

// Loading skeleton
const OrderSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="p-4 mb-4 bg-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="w-24 h-4 bg-gray-300 rounded" />
        <div className="w-16 h-4 bg-gray-300 rounded" />
      </div>
      <div className="w-32 h-3 mb-2 bg-gray-300 rounded" />
      <div className="w-20 h-3 bg-gray-300 rounded" />
    </div>
    <div className="p-4 mb-4 bg-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="w-24 h-4 bg-gray-300 rounded" />
        <div className="w-16 h-4 bg-gray-300 rounded" />
      </div>
      <div className="w-32 h-3 mb-2 bg-gray-300 rounded" />
      <div className="w-20 h-3 bg-gray-300 rounded" />
    </div>
  </div>
);

// Empty state component
interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <div className="px-4 py-12 text-center">
    {/* Shopping bag icon */}
    <svg
      className="w-16 h-16 mx-auto mb-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
    <h3 className="mb-2 text-lg font-medium text-gray-900">No orders yet</h3>
    <p className="max-w-sm mx-auto mb-6 text-gray-500">
      {message ||
        "Your order history will appear here after your first purchase."}
    </p>
    <a
      href="/shop"
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
    >
      Start Shopping
    </a>
  </div>
);

// Error state component
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="px-4 py-12 text-center">
    <svg
      className="w-16 h-16 mx-auto mb-4 text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <h3 className="mb-2 text-lg font-medium text-gray-900">
      Unable to load orders
    </h3>
    <p className="mb-6 text-gray-500">{error.message}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
    >
      Try Again
    </button>
  </div>
);

// Status badge component
const StatusBadge: React.FC<{ status: Order["status"] }> = ({ status }) => {
  const styles: Record<Order["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
    refunded: "bg-blue-100 text-blue-800",
  };

  const labels: Record<Order["status"], string> = {
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

// Order card component
interface OrderCardProps {
  order: Order;
  onClick?: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className="p-4 transition-colors bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-pink-300"
      onClick={() => onClick?.(order.orderId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(order.orderId)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-medium text-gray-900">{order.orderNumber}</span>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-sm text-gray-500">{formattedDate}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-2 text-sm text-gray-600">
        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">
          {formatCurrency(order.amount, order.currency || "USD")}
        </span>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
};

// Main OrderHistory component
export interface OrderHistoryProps {
  onOrderClick?: (orderId: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ onOrderClick }) => {
  const {
    orders,
    loading,
    error,
    hasOrders,
    hasMore,
    message,
    loadMore,
    refresh,
  } = useOrders();

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Order History
        </h2>
        <OrderSkeleton />
      </div>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Order History
        </h2>
        <ErrorState error={error} onRetry={refresh} />
      </div>
    );
  }

  // Empty state
  if (!hasOrders) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Order History
        </h2>
        <EmptyState message={message || undefined} />
      </div>
    );
  }

  // Orders list
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
        <button
          onClick={refresh}
          className="text-sm text-pink-600 hover:text-pink-700"
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-3">
        {orders.map((order: Order) => (
          <OrderCard key={order.orderId} order={order} onClick={onOrderClick} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
