/**
 * Dashboard Route Guard for The Babes Club
 *
 * Provides authentication context and loading states for dashboard pages.
 * Uses the branded ChronicLeafIcon loading component.
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
  type StoredDashboardSession,
} from "@/lib/dashboard/session";
import { fetchDashboardSnapshot } from "@/lib/dashboard/api";
import { ChronicLeafIcon } from "@/components/LoadingIcon";

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
  user?: DashboardUserData;
  error?: Error;
  reload: () => void;
  logout: () => void;
  token?: string;
}

type LoadingPhase = "session" | "profile" | "data" | null;

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
// Loading Component
// ============================================================================

interface DashboardLoadingProps {
  phase?: LoadingPhase;
}

/**
 * Branded loading screen for dashboard with phase-specific messages.
 */
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
// Error Fallback Component
// ============================================================================

interface DashboardErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
}

const DashboardErrorFallback: React.FC<DashboardErrorFallbackProps> = ({
  error,
  onRetry,
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d] px-4 text-center">
    <ChronicLeafIcon
      size={56}
      showLabel={false}
      enableRotation={false}
      enableGlow={true}
      colors={["#fca5a5", "#f87171", "#ef4444"]}
    />
    <div className="space-y-2">
      <p className="text-sm text-white/70">
        Unable to load dashboard. Please try again later.
      </p>
      {error.message && (
        <p className="text-xs text-white/40">{error.message}</p>
      )}
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-babe-pink hover:bg-babe-pink-600"
      >
        Try Again
      </button>
    )}
  </div>
);

// ============================================================================
// Constants
// ============================================================================

const SESSION_CHECK_RETRIES = 3;
const SESSION_CHECK_DELAY_MS = 100;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Simple logger
const LOGGER = {
  info: (msg: string, data?: unknown) =>
    console.log(`[DashboardAuth] ${msg}`, data ?? ""),
  debug: (msg: string, data?: unknown) =>
    console.debug(`[DashboardAuth] ${msg}`, data ?? ""),
  error: (msg: string, data?: unknown) =>
    console.error(`[DashboardAuth] ${msg}`, data ?? ""),
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
  const [user, setUser] = useState<DashboardUserData | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [session, setSession] = useState<StoredDashboardSession | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("session");
  const [reloadFlag, setReloadFlag] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const reload = useCallback(() => {
    setReloadFlag((value) => value + 1);
  }, []);

  const logout = useCallback(() => {
    LOGGER.info("Logging out user");
    clearSession();
    setSession(null);
    setUser(undefined);
    setStatus("unauthenticated");
  }, []);

  /**
   * Read session with retry logic
   */
  const readSessionWithRetry =
    useCallback(async (): Promise<StoredDashboardSession | null> => {
      for (let attempt = 1; attempt <= SESSION_CHECK_RETRIES; attempt++) {
        const storedSession = readStoredSession();

        if (storedSession && storedSession.token) {
          LOGGER.debug(`Session found on attempt ${attempt}`);
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
          setStatus("unauthenticated");
          return;
        }

        // Check token expiry
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (storedSession.expiresAt && storedSession.expiresAt <= nowSeconds) {
          clearSession();
          setStatus("unauthenticated");
          return;
        }

        // Step 2: Fetch dashboard snapshot
        const snapshot = await fetchDashboardSnapshot(storedSession.token);
        setUser({
          userId: snapshot.profile.userId,
          email: snapshot.profile.email,
          displayName: snapshot.profile.displayName,
          category: snapshot.profile.category,
        });

        setLoadingPhase("data");
        setStatus("authenticated");
        LOGGER.info("Authentication successful", {
          userId: snapshot.profile.userId,
        });
      } catch (err) {
        if (cancelled) return;

        const error = err instanceof Error ? err : new Error("Unknown error");
        LOGGER.error("Authentication failed", error);
        setError(error);
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

    let timer: NodeJS.Timeout | undefined;

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

  // Context value
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
