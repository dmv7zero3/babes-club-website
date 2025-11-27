/**
 * Dashboard Data Provider for The Babes Club
 *
 * Provides profile, orders, and NFT data context for dashboard components.
 * Handles data fetching and profile updates.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type DashboardNftAsset,
  type DashboardOrder,
  type DashboardProfile,
} from "@/lib/types/dashboard";
import { updateDashboardProfile } from "@/lib/dashboard/api";
import { useDashboardAuth } from "./DashboardRouteGuard";
import { readStoredSession } from "@/lib/dashboard/session";

// ============================================================================
// Types
// ============================================================================

type DashboardDataStatus = "idle" | "loading" | "error";

interface DashboardSnapshot {
  profile: DashboardProfile;
  orders: DashboardOrder[];
  nfts: DashboardNftAsset[];
}

type UpdateableProfileFields = Partial<
  Omit<DashboardProfile, "userId" | "category" | "updatedAt">
> & {
  updatedAt?: string;
};

interface DashboardDataContextValue {
  status: DashboardDataStatus;
  profile?: DashboardProfile;
  orders: DashboardOrder[];
  nfts: DashboardNftAsset[];
  error?: Error;
  refresh: () => void;
  updateProfile: (fields: UpdateableProfileFields) => Promise<void>;
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  activeOrder?: DashboardOrder | null;
}

// ============================================================================
// Context
// ============================================================================

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null
);

export const useDashboardData = (): DashboardDataContextValue => {
  const context = useContext(DashboardDataContext);

  if (!context) {
    throw new Error(
      "useDashboardData must be used within a DashboardDataProvider."
    );
  }

  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

interface DashboardDataProviderProps {
  children: ReactNode;
}

const DashboardDataProvider = ({ children }: DashboardDataProviderProps) => {
  const {
    status: authStatus,
    user,
    error: authError,
    reload,
    token,
  } = useDashboardAuth();

  // Debug: Log initial auth context
  useEffect(() => {
    console.log("[DashboardDataProvider] Auth context changed", {
      authStatus,
      user,
      authError,
      hasToken: !!token,
      tokenPreview: token?.slice(0, 20) + "...",
    });
  }, [authStatus, user, authError, token]);

  // Initialize data from stored session or user snapshot
  const storedSession = readStoredSession();
  const [data, setData] = useState<DashboardSnapshot | undefined>(() => {
    if (user && "profile" in user && "orders" in user && "nfts" in user) {
      return user as DashboardSnapshot;
    }
    if (storedSession?.user) {
      return {
        profile: {
          userId: storedSession.user.userId ?? "anonymous",
          displayName:
            storedSession.user.displayName ??
            storedSession.user.email ??
            "Member",
          email: storedSession.user.email ?? "",
          shippingAddress: {
            line1: "",
            city: "",
            state: "",
            postalCode: "",
            country: "US",
          },
          preferredWallet: undefined,
          avatarUrl: undefined,
          stripeCustomerId: undefined,
          dashboardSettings: {},
          updatedAt: new Date().toISOString(),
          category: "Member",
        },
        orders: [],
        nfts: [],
      };
    }
    return undefined;
  });

  const [status, setStatus] = useState<DashboardDataStatus>(
    authStatus === "authenticated" ? "idle" : "loading"
  );
  const [error, setError] = useState<Error | undefined>(authError);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Sync data with auth state changes
  useEffect(() => {
    console.log(
      "[DashboardDataProvider] useEffect - authStatus changed:",
      authStatus
    );

    if (authStatus === "loading") {
      setStatus("loading");
      return;
    }

    if (authStatus === "unauthenticated") {
      setStatus("error");
      setError(authError ?? new Error("Dashboard user unauthenticated."));
      setData(undefined);
      setActiveOrderId(null);
      return;
    }

    if (authStatus === "authenticated" && user) {
      // If user is a full snapshot, set it directly
      if ("profile" in user && "orders" in user && "nfts" in user) {
        console.log("[DashboardDataProvider] Setting data from user snapshot");
        setData(user as DashboardSnapshot);
        setStatus("idle");
        setError(undefined);
        setActiveOrderId((current) => {
          if (
            current &&
            (user as DashboardSnapshot).orders.some(
              (order) => order.orderId === current
            )
          ) {
            return current;
          }
          return (user as DashboardSnapshot).orders[0]?.orderId ?? null;
        });
      } else {
        // Fallback: treat user as profile only
        console.log(
          "[DashboardDataProvider] Setting data from user (profile only)"
        );
        setData({ profile: user as DashboardProfile, orders: [], nfts: [] });
        setStatus("idle");
        setError(undefined);
        setActiveOrderId(null);
      }
    }
  }, [authStatus, authError, user]);

  // Refresh handler
  const refresh = useCallback(() => {
    console.log("[DashboardDataProvider] Refresh triggered");
    setStatus("loading");
    setError(undefined);
    reload();
  }, [reload]);

  // Update profile handler
  const updateProfile = useCallback(
    async (fields: UpdateableProfileFields) => {
      console.log("[DashboardDataProvider] updateProfile called", {
        hasToken: !!token,
        fields,
      });

      if (!token) {
        console.error(
          "[DashboardDataProvider] No token available for updateProfile"
        );
        throw new Error("Dashboard session is not available.");
      }

      try {
        console.log(
          "[DashboardDataProvider] Calling updateDashboardProfile API..."
        );
        const updatedProfile = await updateDashboardProfile(token, fields);

        console.log("[DashboardDataProvider] API response - updatedProfile:", {
          userId: updatedProfile.userId,
          displayName: updatedProfile.displayName,
          email: updatedProfile.email,
          shippingAddress: updatedProfile.shippingAddress,
          billingAddress: updatedProfile.billingAddress,
          updatedAt: updatedProfile.updatedAt,
        });

        // Update local state with new profile
        setData((previous) => {
          if (!previous) {
            console.warn("[DashboardDataProvider] No previous data to update");
            return previous;
          }

          const newData = {
            ...previous,
            profile: updatedProfile,
          };

          console.log(
            "[DashboardDataProvider] setData called with new profile:",
            {
              previousProfile: previous.profile?.updatedAt,
              newProfile: updatedProfile.updatedAt,
            }
          );

          return newData;
        });

        console.log("[DashboardDataProvider] Profile update complete");
      } catch (err) {
        // Enhanced error logging
        if (
          err &&
          typeof err === "object" &&
          "isAxiosError" in err &&
          (err as { isAxiosError: boolean }).isAxiosError === true
        ) {
          const axiosErr = err as import("axios").AxiosError;
          console.error("[DashboardDataProvider] updateProfile API error", {
            message: axiosErr.message,
            code: axiosErr.code,
            status: axiosErr.response?.status,
            data: axiosErr.response?.data,
          });
        } else {
          console.error("[DashboardDataProvider] updateProfile error", err);
        }
        throw err;
      }
    },
    [token]
  );

  // Computed values
  const orders = data?.orders ?? [];
  const nfts = data?.nfts ?? [];

  const activeOrder = useMemo(() => {
    if (!activeOrderId) {
      return null;
    }
    return orders.find((order) => order.orderId === activeOrderId) ?? null;
  }, [orders, activeOrderId]);

  // Context value
  const contextValue = useMemo<DashboardDataContextValue>(
    () => ({
      status,
      profile: data?.profile,
      orders,
      nfts,
      error,
      refresh,
      updateProfile,
      activeOrderId,
      setActiveOrderId,
      activeOrder,
    }),
    [
      status,
      data?.profile,
      orders,
      nfts,
      error,
      refresh,
      updateProfile,
      activeOrderId,
      activeOrder,
    ]
  );

  // Debug: Log context value changes
  useEffect(() => {
    console.log("[DashboardDataProvider] Context value updated", {
      status,
      hasProfile: !!data?.profile,
      profileUpdatedAt: data?.profile?.updatedAt,
      ordersCount: orders.length,
      nftsCount: nfts.length,
    });
  }, [status, data?.profile, orders.length, nfts.length]);

  return (
    <DashboardDataContext.Provider value={contextValue}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export default DashboardDataProvider;
