// src/hooks/useOrders.ts
// Hook for fetching user orders from the dashboard API

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api/apiClient';
import { readStoredSession } from '@/lib/auth/session';

// Types
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnailUrl?: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  amount: number;
  amountSubtotal?: number;
  currency: string;
  createdAt: string;
  completedAt?: string;
  itemCount: number;
  items: OrderItem[];
  customerEmail?: string;
  shippingAddress?: ShippingAddress;
}

export interface OrdersResponse {
  orders: Order[];
  nextCursor: string | null;
  hasOrders: boolean;
  message?: string;
}

export interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  hasOrders: boolean;
  hasMore: boolean;
  message: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useOrders = (initialLimit = 20): UseOrdersResult => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasOrders, setHasOrders] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchOrders = useCallback(async (cursor?: string, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const session = readStoredSession();
      if (!session?.token) {
        throw new Error('Not authenticated');
      }

      const params: Record<string, string> = {
        limit: String(initialLimit),
      };
      
      if (cursor) {
        params.cursor = cursor;
      }

      const response = await apiClient.get<OrdersResponse>('/dashboard/orders', params, {
        headers: { Authorization: `Bearer ${session.token}` }
      });

      const data = response.data;
      
      if (append) {
        setOrders(prev => [...prev, ...(data.orders || [])]);
      } else {
        setOrders(data.orders || []);
      }
      
      setHasOrders(data.hasOrders);
      setNextCursor(data.nextCursor);
      setMessage(data.message || null);
      setError(null);

    } catch (err: any) {
      console.error('[useOrders] Error fetching orders:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        // Session expired - the apiClient interceptor should handle refresh
        // If we still get 401, the refresh failed
        setError(new Error('Session expired. Please log in again.'));
      } else if (err.code === 'ERR_NETWORK') {
        // Network error - might be CORS or connectivity
        setError(new Error('Network error. Please check your connection.'));
      } else {
        setError(err instanceof Error ? err : new Error('Failed to load orders'));
      }
      
      // Don't clear existing orders on error when loading more
      if (!append) {
        setOrders([]);
        setHasOrders(false);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [initialLimit]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    await fetchOrders(nextCursor, true);
  }, [nextCursor, isLoadingMore, fetchOrders]);

  const refresh = useCallback(async () => {
    setNextCursor(null);
    await fetchOrders();
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading: loading || isLoadingMore,
    error,
    hasOrders,
    hasMore: !!nextCursor,
    message,
    loadMore,
    refresh,
  };
};

export default useOrders;
