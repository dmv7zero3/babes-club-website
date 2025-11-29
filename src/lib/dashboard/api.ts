/**
 * Dashboard API Client for The Babes Club
 *
 * Functions for fetching dashboard data including profile, orders, and NFTs.
 */

import apiClient from "@/lib/api/apiClient";
import type {
  DashboardAddress,
  DashboardOrder,
  DashboardProfile,
  DashboardSnapshot,
} from "@/lib/types/dashboard";

// ============================================================================
// Types
// ============================================================================

export interface AuthLoginResponse {
  accessToken: string;
  expiresAt?: number;
  user?: {
    userId?: string;
    email?: string;
    displayName?: string;
    profile?: Partial<DashboardProfile>;
    lastLoginAt?: string;
  };
}

interface DashboardProfileResponse {
  profile?: Partial<DashboardProfile> & { userId?: string };
}

interface DashboardOrdersResponse {
  orders?: Array<Record<string, unknown>>;
}

// ✅ Export this type so DashboardRouteGuard can use it

// ============================================================================
// Helper Functions
// ============================================================================

const buildAuthHeaders = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const safeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value === null || value === undefined) return fallback;
  return fallback;
};

const isAddressObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const normalizeAddress = (address?: unknown): DashboardAddress => {
  if (!isAddressObject(address)) {
    return {
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      line2: "",
    };
  }
  return {
    line1: safeString(address.line1, ""),
    city: safeString(address.city, ""),
    state: safeString(address.state, ""),
    postalCode: safeString(address.postalCode, ""),
    country: safeString(address.country, ""),
    line2: safeString(address.line2, ""),
  };
};

const normalizeProfile = (
  profile?: Partial<DashboardProfile> | null
): DashboardProfile => {
  // Debug: Log incoming profile data
  console.log("[api.ts] normalizeProfile input:", {
    hasProfile: !!profile,
    hasShippingAddress: !!profile?.shippingAddress,
    hasBillingAddress: !!profile?.billingAddress,
    shippingAddress: profile?.shippingAddress,
    billingAddress: profile?.billingAddress,
  });

  const shippingAddress = normalizeAddress(profile?.shippingAddress);
  let billingAddress: DashboardAddress | undefined;
  if (
    profile?.billingAddress !== undefined &&
    profile?.billingAddress !== null
  ) {
    billingAddress = normalizeAddress(profile.billingAddress);
  }

  const normalized: DashboardProfile = {
    userId: profile?.userId ?? "anonymous",
    displayName: profile?.displayName ?? "Babes Club Member",
    email: profile?.email ?? "member@example.com",
    shippingAddress,
    billingAddress,
    preferredWallet: profile?.preferredWallet,
    avatarUrl: profile?.avatarUrl,
    stripeCustomerId: profile?.stripeCustomerId,
    dashboardSettings: profile?.dashboardSettings ?? {},
    updatedAt: profile?.updatedAt ?? new Date().toISOString(),
    category: profile?.category ?? "Member",
  };

  // Debug: Log normalized output
  console.log("[api.ts] normalizeProfile output:", {
    shippingAddress: normalized.shippingAddress,
    billingAddress: normalized.billingAddress,
  });

  return normalized;
};

const normalizeOrder = (
  order: Record<string, unknown> | undefined,
  index: number
): DashboardOrder => ({
  orderId: String(order?.orderId ?? order?.orderNumber ?? `order-${index}`),
  orderNumber: String(order?.orderNumber ?? order?.orderId ?? `BC-${index}`),
  status: String(order?.status ?? "processing"),
  amount:
    typeof order?.amount === "number"
      ? order.amount
      : Number(order?.amount ?? 0),
  currency: String(order?.currency ?? "usd").toLowerCase(),
  stripePaymentIntentId: order?.stripePaymentIntentId
    ? String(order.stripePaymentIntentId)
    : undefined,
  createdAt: String(order?.createdAt ?? new Date().toISOString()),
  items: Array.isArray(order?.items)
    ? order.items.map((item: Record<string, unknown>, itemIndex: number) => ({
        sku: String(item?.sku ?? `sku-${itemIndex}`),
        name: String(item?.name ?? "Item"),
        quantity:
          typeof item?.quantity === "number"
            ? item.quantity
            : Number(item?.quantity ?? 1),
        unitPrice:
          typeof item?.unitPrice === "number"
            ? item.unitPrice
            : Number(item?.unitPrice ?? 0),
      }))
    : [],
});

// ============================================================================
// Auth API Functions
// ============================================================================

export const login = async (
  email: string,
  password: string
): Promise<AuthLoginResponse> => {
  const { data } = await apiClient.post<AuthLoginResponse>("/auth/login", {
    email,
    password,
  });

  return data;
};

export const signup = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthLoginResponse> => {
  const { data } = await apiClient.post<AuthLoginResponse>("/auth/signup", {
    email,
    password,
    displayName,
  });

  return data;
};

// ============================================================================
// Dashboard API Functions
// ============================================================================

export const fetchDashboardSnapshot = async (
  token: string
): Promise<DashboardSnapshot> => {
  console.log("[api.ts] fetchDashboardSnapshot - fetching data...");

  const [profileResponse, ordersResponse] = await Promise.all([
    apiClient.get<DashboardProfileResponse>(
      "/dashboard/profile",
      buildAuthHeaders(token)
    ),
    apiClient.get<DashboardOrdersResponse>(
      "/dashboard/orders",
      buildAuthHeaders(token)
    ),
  ]);

  console.log("[api.ts] Raw profile response:", profileResponse.data);

  const profile = normalizeProfile(profileResponse.data.profile);
  const orders = (ordersResponse.data.orders ?? []).map(normalizeOrder);

  console.log("[api.ts] fetchDashboardSnapshot - snapshot created:", {
    profileUserId: profile.userId,
    hasShippingAddress: !!profile.shippingAddress?.line1,
    hasBillingAddress: !!profile.billingAddress?.line1,
    shippingLine1: profile.shippingAddress?.line1,
    billingLine1: profile.billingAddress?.line1,
    ordersCount: orders.length,
  });

  return {
    profile,
    orders,
  };
};

export const updateDashboardProfile = async (
  token: string,
  payload: Partial<DashboardProfile>
): Promise<DashboardProfile> => {
  console.log("[api.ts] updateDashboardProfile - payload:", payload);

  // Normalize payload before sending
  const normalizedPayload = {
    ...payload,
    shippingAddress: payload.shippingAddress
      ? normalizeAddress(payload.shippingAddress)
      : undefined,
    billingAddress: payload.billingAddress
      ? normalizeAddress(payload.billingAddress)
      : undefined,
  };

  console.log(
    "[api.ts] updateDashboardProfile - normalized payload:",
    normalizedPayload
  );

  const { data } = await apiClient.post<DashboardProfileResponse>(
    "/dashboard/update-profile",
    normalizedPayload,
    buildAuthHeaders(token)
  );

  console.log("[api.ts] updateDashboardProfile - response:", data);

  return normalizeProfile(data.profile);
};
