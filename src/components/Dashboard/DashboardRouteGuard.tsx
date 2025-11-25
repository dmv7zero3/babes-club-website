import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
// Fix 1.4: Retry logic helpers
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const LOGGER = {
  info: (...args: any[]) => console.info("[DashboardRouteGuard]", ...args),
  warn: (...args: any[]) => console.warn("[DashboardRouteGuard]", ...args),
  error: (...args: any[]) => console.error("[DashboardRouteGuard]", ...args),
};

const isRetryableError = (error: unknown): boolean => {
  if (!error) return false;
  const maybeAxios = error as any;
  const status = maybeAxios?.response?.status;
  return (
    !maybeAxios?.response || // Network error
    status === 408 || // Timeout
    status === 429 || // Rate limit
    (status >= 500 && status < 600) // Server errors
  );
};
import DashboardErrorFallback from "./DashboardErrorFallback";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { fetchDashboardSnapshot } from "@/lib/dashboard/api";
import {
  clearSession,
  readStoredSession,
  type StoredDashboardSession,
  SESSION_EVENTS,
} from "@/lib/auth/session";
import type { DashboardUserData } from "@/lib/types/dashboard";

export const DASHBOARD_USER_STORAGE_KEY = "babes.dashboard.session";

type DashboardAuthStatus = "loading" | "authenticated" | "unauthenticated";

interface DashboardAuthContextValue {
  status: DashboardAuthStatus;
  user?: DashboardUserData;
  error?: Error;
  token?: string;
  reload: () => void;
  logout: () => void;
}

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(
  null
);

export const useDashboardAuth = (): DashboardAuthContextValue => {
  const context = useContext(DashboardAuthContext);

  if (!context) {
    throw new Error(
      "useDashboardAuth must be used within a DashboardRouteGuard."
    );
  }

  return context;
};

interface DashboardRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

const isAuthError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  const maybeAxios = error as AxiosError;
  const status = maybeAxios?.response?.status;
  return status === 401 || status === 403;
};

const DashboardRouteGuard: React.FC<DashboardRouteGuardProps> = (props) => {
  const { children, fallback, loading } = props;
  // Stable navigation ref for useEffect
  const navigate = useNavigate();
  const navigateRef = React.useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  // Prevent multiple simultaneous auth checks
  const isCheckingAuth = React.useRef(false);
  const [status, setStatus] = useState<DashboardAuthStatus>("loading");
  const [user, setUser] = useState<DashboardUserData | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [session, setSession] = useState<StoredDashboardSession | null>(() =>
    readStoredSession()
  );
  const [loadingPhase, setLoadingPhase] = useState<
    "session" | "profile" | "data" | null
  >(null);

  // Stable reload flag
  const [reloadFlag, setReloadFlag] = useState(0);

  const reload = useCallback(() => {
    setReloadFlag((value) => value + 1);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setUser(undefined);
    setStatus((prev) =>
      prev === "unauthenticated" ? prev : "unauthenticated"
    );
  }, []);

  useEffect(() => {
    LOGGER.info("[DashboardRouteGuard] useEffect triggered", { reloadFlag });
    let isMounted = true;

    // Listen for custom session change events to trigger reload only if session state changed
    const handleSessionUpdate = () => {
      const currentSession = readStoredSession();
      // Only reload if session changed (null <-> not null, or token changed)
      if (
        (!currentSession && session !== null) ||
        (currentSession && (!session || currentSession.token !== session.token))
      ) {
        reload();
      }
    };
    window.addEventListener(SESSION_EVENTS.UPDATED, handleSessionUpdate);
    window.addEventListener(SESSION_EVENTS.CLEARED, handleSessionUpdate);

    const loadUser = async (attempt = 1): Promise<void> => {
      if (isCheckingAuth.current) return;
      isCheckingAuth.current = true;
      const MAX_RETRIES = 3;
      LOGGER.info("loadUser called", { attempt });
      try {
        setLoadingPhase("session");
        setStatus("loading");
        setError(undefined);
        isCheckingAuth.current = false;

        // Always re-read session from storage for latest value
        const activeSession = readStoredSession();
        LOGGER.info("activeSession", activeSession);

        if (!activeSession || !activeSession.token) {
          if (!isMounted) return;
          // Prevent redundant state updates if already unauthenticated and session is null
          if (status === "unauthenticated" && session === null) {
            LOGGER.info(
              "Already unauthenticated and no session, skipping state update"
            );
            setLoadingPhase(null);
            return;
          }
          LOGGER.info("No active session, setting unauthenticated");
          setSession(null);
          setUser(undefined);
          setStatus((prev) =>
            prev === "unauthenticated" ? prev : "unauthenticated"
          );
          setLoadingPhase(null);
          return;
        }

        if (!isMounted) return;
        setSession(activeSession);
        setLoadingPhase("profile");
        // Fetch dashboard snapshot with retry logic
        const snapshot = await fetchDashboardSnapshot(activeSession.token);
        LOGGER.info("dashboard snapshot", snapshot);
        if (!isMounted) return;
        setLoadingPhase("data");
        setUser(snapshot);
        setStatus("authenticated");
        setLoadingPhase(null);
        LOGGER.info("Authenticated, user set");
      } catch (err) {
        setLoadingPhase(null);
        if (!isMounted) return;
        // Auth errors (401/403) - logout immediately
        if (isAuthError(err)) {
          LOGGER.warn("Authentication error during profile fetch", err);
          LOGGER.info("Auth error, calling logout");
          logout();
          return;
        }
        // Retryable errors - try again with exponential backoff
        if (isRetryableError(err) && attempt < MAX_RETRIES) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          LOGGER.info(
            `Profile fetch failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${backoffMs}ms...`
          );
          await delay(backoffMs);
          return loadUser(attempt + 1);
        }
        // Other errors or max retries exceeded
        setStatus("unauthenticated");
        setUser(undefined);
        setError(
          err instanceof Error
            ? err
            : new Error("Unable to load dashboard. Please refresh the page.")
        );
        LOGGER.error("Error, set unauthenticated", err);
      }
    };
    void loadUser();
    return () => {
      isMounted = false;
      window.removeEventListener(SESSION_EVENTS.UPDATED, handleSessionUpdate);
      window.removeEventListener(SESSION_EVENTS.CLEARED, handleSessionUpdate);
    };
  }, [reloadFlag]);

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
  // Auto-logout after a period of inactivity (client-side). This is a UX
  // convenience; for strict security you should also revoke sessions server-side.
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    if (status !== "authenticated") {
      return undefined;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }

      // Calculate timeout considering both inactivity AND token expiry
      const stored = readStoredSession();
      if (!stored) {
        logout();
        return;
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      const timeUntilExpiryMs = stored.expiresAt
        ? Math.max(0, (stored.expiresAt - nowSeconds) * 1000)
        : INACTIVITY_TIMEOUT_MS;

      // Use the shorter of: inactivity timeout or time until token expires
      const actualTimeoutMs = Math.min(
        INACTIVITY_TIMEOUT_MS,
        timeUntilExpiryMs
      );

      if (actualTimeoutMs <= 0) {
        // Token already expired
        logout();
        try {
          navigateRef.current("/login", { replace: true });
        } catch (e) {
          // ignore navigation errors
        }
        return;
      }

      LOGGER.info(`Setting inactivity timer for ${actualTimeoutMs}ms`);

      timer = setTimeout(() => {
        LOGGER.info("Inactivity timeout or token expiry reached - logging out");
        logout();
        try {
          navigateRef.current("/login", { replace: true });
        } catch (e) {
          // ignore navigation errors
        }
      }, actualTimeoutMs);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    resetTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [status, logout]);

  const location = useLocation();

  if (status === "loading") {
    const loadingContent = loading ?? (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="inline-block w-8 h-8 border-4 border-solid rounded-full animate-spin border-cotton-candy border-r-transparent"></div>
          <p className="text-sm text-neutral-400">
            {loadingPhase === "session" && "Checking authentication..."}
            {loadingPhase === "profile" && "Loading your profile..."}
            {loadingPhase === "data" && "Fetching dashboard data..."}
            {!loadingPhase && "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
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

  // Allow the login page to render the fallback (login form) without
  // redirecting back to `/login` (which would cause a loop). For any other
  // path, redirect unauthenticated users to `/login`.
  if (location.pathname === "/login") {
    return (
      <DashboardAuthContext.Provider value={contextValue}>
        {fallback ?? <div>Unable to load dashboard user.</div>}
      </DashboardAuthContext.Provider>
    );
  }

  return (
    <DashboardAuthContext.Provider value={contextValue}>
      <Navigate to="/login" replace />
    </DashboardAuthContext.Provider>
  );
};

export default DashboardRouteGuard;
