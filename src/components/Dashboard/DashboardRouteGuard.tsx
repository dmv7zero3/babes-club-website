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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { fetchDashboardSnapshot } from "@/lib/dashboard/api";
import {
  clearSession,
  readStoredSession,
  type StoredDashboardSession,
} from "@/lib/dashboard/session";
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

const DashboardRouteGuard = ({
  children,
  fallback,
  loading,
}: DashboardRouteGuardProps) => {
  const [status, setStatus] = useState<DashboardAuthStatus>("loading");
  const [user, setUser] = useState<DashboardUserData | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [session, setSession] = useState<StoredDashboardSession | null>(() =>
    readStoredSession()
  );

  const navigate = useNavigate();

  const [reloadFlag, setReloadFlag] = useState(0);

  const reload = useCallback(() => {
    setReloadFlag((value) => value + 1);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
    setUser(undefined);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async (attempt = 1): Promise<void> => {
      const MAX_RETRIES = 3;
      try {
        setStatus("loading");
        setError(undefined);

        const activeSession = readStoredSession();

        if (!activeSession || !activeSession.token) {
          if (!isMounted) return;
          setSession(null);
          setUser(undefined);
          setStatus("unauthenticated");
          return;
        }

        if (!isMounted) return;
        setSession(activeSession);
        // Fetch dashboard snapshot with retry logic
        const snapshot = await fetchDashboardSnapshot(activeSession.token);
        if (!isMounted) return;
        setUser(snapshot);
        setStatus("authenticated");
      } catch (err) {
        if (!isMounted) return;
        // Auth errors (401/403) - logout immediately
        if (isAuthError(err)) {
          LOGGER.warn("Authentication error during profile fetch", err);
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
      }
    };
    void loadUser();
    return () => {
      isMounted = false;
    };
    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [reloadFlag, logout]);

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

      timer = setTimeout(() => {
        logout();
        try {
          navigate("/login", { replace: true });
        } catch (e) {
          // ignore navigation errors in environments without router
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    // start the timer
    resetTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [status, logout, navigate]);

  const location = useLocation();

  if (status === "loading") {
    return <>{loading ?? <div>Loading dashboard…</div>}</>;
  }

  if (status === "authenticated" && user) {
    return (
      <DashboardAuthContext.Provider value={contextValue}>
        {children}
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
