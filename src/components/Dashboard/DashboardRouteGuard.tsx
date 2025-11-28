/**
 * Dashboard Route Guard for The Babes Club
 *
 * Provides authentication context and loading states for dashboard pages.
 * Uses the branded ChronicLeafIcon loading component.
 *
 * FIXES in this version:
 * 1. Listens for SESSION_EVENTS.CLEARED to handle logout properly
 * 2. Clears both sessionStorage AND localStorage on logout
 * 3. Properly navigates to login after logout
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  readStoredSession,
  clearSession,
  SESSION_EVENTS,
  DASHBOARD_SESSION_STORAGE_KEY,
  type StoredDashboardSession,
} from "@/lib/dashboard/session";
import {
  fetchDashboardSnapshot,
  type DashboardSnapshot,
} from "@/lib/dashboard/api";
import { ChronicLeafIcon } from "@/components/LoadingIcon";
import DashboardErrorFallback from "./DashboardErrorFallback";

// ============================================================================
// Types
// ============================================================================

export type DashboardAuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated";

export interface DashboardUserData {
  userId: string;
  email: string;
  displayName: string;
  category?: string;
}

export interface DashboardAuthContextValue {
  status: DashboardAuthStatus;
  user?: DashboardSnapshot;
  error?: Error;
  reload: () => void;
  logout: () => void;
  token?: string;
}

type LoadingPhase = "session" | "profile" | "data" | null;

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const SESSION_CHECK_RETRIES = 3;
const SESSION_CHECK_DELAY_MS = 100;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Context
// ============================================================================

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(
  null
);

export const useDashboardAuth = (): DashboardAuthContextValue => {
  const ctx = useContext(DashboardAuthContext);
  if (!ctx) {
    throw new Error(
      "useDashboardAuth must be used within a DashboardRouteGuard"
    );
  }
  return ctx;
};

// ============================================================================
// Logger
// ============================================================================

const LOGGER = {
  info: (msg: string, data?: unknown) =>
    console.log(`[DashboardAuth] ${msg}`, data ?? ""),
  debug: (msg: string, data?: unknown) =>
    console.debug(`[DashboardAuth] ${msg}`, data ?? ""),
  error: (msg: string, data?: unknown) =>
    console.error(`[DashboardAuth] ${msg}`, data ?? ""),
};

// ============================================================================
// Loading Component
// ============================================================================

interface DashboardLoadingProps {
  phase?: LoadingPhase;
}

const DashboardLoading: React.FC<DashboardLoadingProps> = ({ phase }) => {
  const getMessage = () => {
    switch (phase) {
      case "session":
        return "Checking authentication...";
      case "profile":
        return "Loading your profile...";
      case "data":
        return "Fetching dashboard data...";
      default:
        return "Loading dashboard...";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
      <ChronicLeafIcon
        size={72}
        label={getMessage()}
        showLabel={true}
        enableRotation={true}
        enableGlow={true}
      />
    </div>
  );
};

// ============================================================================
// Route Guard Component
// ============================================================================

interface DashboardRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

const DashboardRouteGuard: React.FC<DashboardRouteGuardProps> = ({
  children,
  fallback,
  loading,
}) => {
  const [status, setStatus] = useState<DashboardAuthStatus>("loading");
  const [user, setUser] = useState<DashboardSnapshot | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [session, setSession] = useState<StoredDashboardSession | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("session");
  const [reloadFlag, setReloadFlag] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const reload = useCallback(() => {
    setReloadFlag((value) => value + 1);
  }, []);

  /**
   * Logout function - clears session and updates state
   * The clearSession function now dispatches SESSION_EVENTS.CLEARED
   */
  const logout = useCallback(() => {
    LOGGER.info("Logging out user");
    clearSession(); // This now clears BOTH sessionStorage AND localStorage
    setSession(null);
    setUser(undefined);
    setStatus("unauthenticated");
    // Navigate to login page
    navigate("/login", { replace: true });
  }, [navigate]);

  /**
   * Read session with retry logic
   */
  const readSessionWithRetry =
    useCallback(async (): Promise<StoredDashboardSession | null> => {
      for (let attempt = 1; attempt <= SESSION_CHECK_RETRIES; attempt++) {
        const storedSession = readStoredSession();

        if (storedSession && storedSession.token) {
          LOGGER.debug(`Session found on attempt ${attempt}`, {
            hasToken: !storedSession.token,
            expiresAt: storedSession.expiresAt,
          });
          return storedSession;
        }

        if (attempt < SESSION_CHECK_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, SESSION_CHECK_DELAY_MS)
          );
        }
      }

      LOGGER.debug("No session found after retries");
      return null;
    }, []);

  /**
   * FIX: Listen for session events (updated AND cleared)
   * This ensures the guard reacts to logout calls from anywhere in the app
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only react to our session key changes
      if (event.key === DASHBOARD_SESSION_STORAGE_KEY || event.key === null) {
        LOGGER.debug("Storage event detected, reloading session");
        reload();
      }
    };

    // Listen for session updated events (login, token refresh)
    const handleSessionUpdate = () => {
      LOGGER.debug("Session update event detected");
      reload();
    };

    // Listen for session cleared events (logout)
    const handleSessionCleared = () => {
      LOGGER.debug("Session cleared event detected - logging out");
      setSession(null);
      setUser(undefined);
      setStatus("unauthenticated");
    };

    // Legacy event name for backward compatibility
    const handleLegacySessionUpdate = () => {
      LOGGER.debug("Legacy session update event detected");
      reload();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(SESSION_EVENTS.UPDATED, handleSessionUpdate);
    window.addEventListener(SESSION_EVENTS.CLEARED, handleSessionCleared);
    window.addEventListener("session-updated", handleLegacySessionUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(SESSION_EVENTS.UPDATED, handleSessionUpdate);
      window.removeEventListener(SESSION_EVENTS.CLEARED, handleSessionCleared);
      window.removeEventListener("session-updated", handleLegacySessionUpdate);
    };
  }, [reload]);

  /**
   * Main authentication effect
   */
  useEffect(() => {
    let cancelled = false;

    const authenticate = async () => {
      try {
        setStatus("loading");
        setLoadingPhase("session");
        setError(undefined);

        // Step 1: Read session
        const storedSession = await readSessionWithRetry();

        if (cancelled) return;

        if (!storedSession || !storedSession.token) {
          LOGGER.info("No valid session found");
          setSession(null);
          setStatus("unauthenticated");
          return;
        }

        // Check token expiry
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (storedSession.expiresAt && storedSession.expiresAt <= nowSeconds) {
          LOGGER.info("Session expired");
          clearSession();
          setSession(null);
          setStatus("unauthenticated");
          return;
        }

        // Store the session in state so token is available in context
        setSession(storedSession);
        setLoadingPhase("profile");

        // Step 2: Fetch dashboard snapshot
        LOGGER.debug("Fetching dashboard snapshot");
        const snapshot = await fetchDashboardSnapshot(storedSession.token);

        if (cancelled) return;

        LOGGER.debug("Dashboard snapshot received", {
          hasProfile: !!snapshot.profile,
          hasShippingAddress: !!snapshot.profile?.shippingAddress?.line1,
          hasBillingAddress: !!snapshot.profile?.billingAddress?.line1,
          ordersCount: snapshot.orders?.length ?? 0,
          nftsCount: snapshot.nfts?.length ?? 0,
        });

        setUser(snapshot);
        setLoadingPhase("data");
        setStatus("authenticated");

        LOGGER.info("Authentication successful", {
          userId: snapshot.profile.userId,
          hasAddresses: !!snapshot.profile.shippingAddress?.line1,
        });
      } catch (err) {
        if (cancelled) return;

        const error = err instanceof Error ? err : new Error("Unknown error");
        LOGGER.error("Authentication failed", error);
        setError(error);
        setSession(null);
        setStatus("unauthenticated");
      }
    };

    authenticate();

    return () => {
      cancelled = true;
    };
  }, [reloadFlag, readSessionWithRetry]);

  /**
   * Inactivity timeout
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);

      const stored = readStoredSession();
      const nowSeconds = Math.floor(Date.now() / 1000);

      const timeUntilExpiryMs = stored?.expiresAt
        ? (stored.expiresAt - nowSeconds) * 1000
        : INACTIVITY_TIMEOUT_MS;

      const timeout = Math.min(timeUntilExpiryMs, INACTIVITY_TIMEOUT_MS);

      if (timeout <= 0) {
        LOGGER.info("Session expired, logging out");
        logout();
        return;
      }

      timer = setTimeout(() => {
        LOGGER.info("Inactivity timeout reached, logging out");
        logout();
      }, timeout);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [status, logout]);

  // Context value - includes token from session
  const contextValue = useMemo<DashboardAuthContextValue>(
    () => ({
      status,
      user,
      error,
      reload,
      logout,
      token: session?.token,
    }),
    [status, user, error, reload, logout, session?.token]
  );

  // Debug: Log context value changes
  useEffect(() => {
    LOGGER.debug("Context value updated", {
      status,
      hasUser: !!user,
      hasProfile: !!user?.profile,
      hasShippingAddress: !!user?.profile?.shippingAddress?.line1,
      hasBillingAddress: !!user?.profile?.billingAddress?.line1,
      hasToken: !!session?.token,
    });
  }, [status, user, session?.token]);

  // ============================================================================
  // Render Logic
  // ============================================================================

  if (status === "loading") {
    const loadingContent = loading ?? <DashboardLoading phase={loadingPhase} />;
    return <>{loadingContent}</>;
  }

  if (status === "authenticated" && user) {
    return (
      <DashboardAuthContext.Provider value={contextValue}>
        {children}
      </DashboardAuthContext.Provider>
    );
  }

  if (status === "unauthenticated" && error) {
    return (
      <DashboardAuthContext.Provider value={contextValue}>
        <DashboardErrorFallback error={error} onRetry={reload} />
      </DashboardAuthContext.Provider>
    );
  }

  // For login page, render fallback (login form) without redirect
  if (location.pathname === "/login") {
    return (
      <DashboardAuthContext.Provider value={contextValue}>
        {fallback ?? (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-sm text-neutral-400">
              Unable to load dashboard user.
            </p>
          </div>
        )}
      </DashboardAuthContext.Provider>
    );
  }

  // Redirect unauthenticated users to login
  return (
    <DashboardAuthContext.Provider value={contextValue}>
      <Navigate to="/login" replace />
    </DashboardAuthContext.Provider>
  );
};

export default DashboardRouteGuard;
