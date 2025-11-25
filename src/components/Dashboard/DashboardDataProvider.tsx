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
  type DashboardUserData,
} from "@/lib/types/dashboard";
import { updateDashboardProfile } from "@/lib/dashboard/api";
import { useDashboardAuth } from "./DashboardRouteGuard";
import { readStoredSession } from "@/lib/dashboard/session";

type DashboardDataStatus = "idle" | "loading" | "error";

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
    // eslint-disable-next-line no-console
    console.log("[DashboardDataProvider] Auth context", {
      authStatus,
      user,
      authError,
      token,
    });
  }, [authStatus, user, authError, token]);

  // Prefer a fully-loaded `user` snapshot, but fall back to any minimal
  // session info persisted in sessionStorage so the UI can show the
  // authenticated user's name/email immediately while the server snapshot
  // is fetched.
  const storedSession = readStoredSession();
  const [data, setData] = useState<DashboardUserData | undefined>(() => {
    if (user) return user;
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

    return user;
  });
  const [status, setStatus] = useState<DashboardDataStatus>(
    authStatus === "authenticated" ? "idle" : "loading"
  );
  const [error, setError] = useState<Error | undefined>(authError);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Debug: Log status changes
    console.log("[DashboardDataProvider] useEffect status", authStatus, user);
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
      setData(user);
      setStatus("idle");
      setError(undefined);
      setActiveOrderId((current) => {
        if (current && user.orders.some((order) => order.orderId === current)) {
          return current;
        }

        return user.orders[0]?.orderId ?? null;
      });
    }
  }, [authStatus, authError, user]);

  const refresh = useCallback(() => {
    setStatus("loading");
    setError(undefined);
    reload();
  }, [reload]);

  const updateProfile = useCallback(
    async (fields: UpdateableProfileFields) => {
      // Debug: Log updateProfile call and headers
      console.log("[DashboardDataProvider] updateProfile called", {
        token,
        fields,
      });
      console.log("[DashboardDataProvider] updateProfile headers", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });
      if (!token) {
        console.error(
          "[DashboardDataProvider] No token available for updateProfile"
        );
        throw new Error("Dashboard session is not available.");
      }

      try {
        const updatedProfile = await updateDashboardProfile(token, fields);
        console.log(
          "[DashboardDataProvider] updateDashboardProfile response",
          updatedProfile
        );
        setData((previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            profile: updatedProfile,
          };
        });
      } catch (err) {
        // Enhanced error logging with type guard for AxiosError
        if (
          err &&
          typeof err === "object" &&
          "isAxiosError" in err &&
          (err as any).isAxiosError === true
        ) {
          const axiosErr = err as import("axios").AxiosError;
          console.error("[DashboardDataProvider] updateProfile error", {
            message: axiosErr.message,
            code: axiosErr.code,
            response: axiosErr.response,
            config: axiosErr.config,
          });
          if (axiosErr.response) {
            console.error(
              "[DashboardDataProvider] API error response",
              axiosErr.response.data
            );
          }
        } else {
          console.error("[DashboardDataProvider] updateProfile error", err);
        }
        throw err;
      }
    },
    [token]
  );

  const orders = data?.orders ?? [];
  const nfts = data?.nfts ?? [];
  const activeOrder = useMemo(() => {
    if (!activeOrderId) {
      return null;
    }

    return orders.find((order) => order.orderId === activeOrderId) ?? null;
  }, [orders, activeOrderId]);

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

  return (
    <DashboardDataContext.Provider value={contextValue}>
      {children}
    </DashboardDataContext.Provider>
  );
};

export default DashboardDataProvider;
