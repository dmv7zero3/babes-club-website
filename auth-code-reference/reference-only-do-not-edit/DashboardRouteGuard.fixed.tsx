/**
 * DashboardRouteGuard.tsx - FIXED VERSION
 * 
 * Key fixes:
 * 1. Added storage event listener to detect session changes across tabs/writes
 * 2. Added retry logic with exponential backoff for initial session read
 * 3. Moved session read into useEffect to catch late writes
 * 4. Added dependency on location.pathname to re-check after navigation
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
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
  readStoredSession,
  clearSession,
  type StoredDashboardSession,
} from "../../lib/dashboard/session";
import { fetchDashboardSnapshot } from "../../lib/dashboard/api";
import DashboardErrorFallback from "./DashboardErrorFallback";

// Logger utility
const LOGGER = {
  info: (msg: string, ...args: unknown[]) => console.info(`[DashboardRouteGuard] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[DashboardRouteGuard] ${msg}`, ...args),
  debug: (msg: string, ...args: unknown[]) => console.debug(`[DashboardRouteGuard] ${msg}`, ...args),
};

// Types
type DashboardAuthStatus = "loading" | "authenticated" | "unauthenticated";

interface DashboardUserData {
  userId: string;
  email: string;
  displayName: string;
  // ... other profile fields
}

interface DashboardAuthContextValue {
  status: DashboardAuthStatus;
  user?: DashboardUserData;
  error?: Error;
  token?: string;
  reload: () => void;
  logout: () => void;
}

// Context
const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

export const useDashboardAuth = (): DashboardAuthContextValue => {
  const context = useContext(DashboardAuthContext);
  if (!context) {
    throw new Error("useDashboardAuth must be used within a DashboardRouteGuard.");
  }
  return context;
};

// Helper functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAuthError = (error: unknown): boolean => {
  if (!error) return false;
  const maybeAxios = error as AxiosError;
  const status = maybeAxios?.response?.status;
  return status === 401 || status === 403;
};

const isRetryableError = (error: unknown): boolean => {
  if (!error) return false;
  const maybeAxios = error as AxiosError;
  const status = maybeAxios?.response?.status;
  // Network errors or 5xx are retryable
  return !status || (status >= 500 && status < 600);
};

// Constants
const MAX_RETRIES = 3;
const SESSION_CHECK_RETRIES = 3;
const SESSION_CHECK_DELAY_MS = 100; // Wait 100ms between session read retries
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Session storage key (MUST match the key used in session.ts)
const SESSION_STORAGE_KEY = "babes.dashboard.session";

interface DashboardRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

const DashboardRouteGuard = ({
  children,
  fallback,
  loading,
}: DashboardRouteGuardProps) => {
  const [status, setStatus] = useState<DashboardAuthStatus>("loading");
  const [user, setUser] = useState<DashboardUserData | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [session, setSession] = useState<StoredDashboardSession | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<
    "session" | "profile" | "data" | null
  >("session");
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
   * FIX #1: Read session with retry logic
   * 
   * The session might not be immediately available after login due to:
   * - Async storage operations
   * - React's concurrent rendering
   * - Navigation completing before storage write
   */
  const readSessionWithRetry = useCallback(async (): Promise<StoredDashboardSession | null> => {
    for (let attempt = 1; attempt <= SESSION_CHECK_RETRIES; attempt++) {
      const storedSession = readStoredSession();
      
      if (storedSession && storedSession.token) {
        LOGGER.debug(`Session found on attempt ${attempt}`, { 
          hasToken: !!storedSession.token,
          expiresAt: storedSession.expiresAt 
        });
        return storedSession;
      }
      
      if (attempt < SESSION_CHECK_RETRIES) {
        LOGGER.debug(`No session found on attempt ${attempt}, retrying in ${SESSION_CHECK_DELAY_MS}ms`);
        await delay(SESSION_CHECK_DELAY_MS);
      }
    }
    
    LOGGER.debug("No session found after all retries");
    return null;
  }, []);

  /**
   * FIX #2: Listen for storage events
   * 
   * This catches session writes from:
   * - Other tabs
   * - Login flow completing after guard mounts
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only react to our session key changes
      if (event.key === SESSION_STORAGE_KEY || event.key === null) {
        LOGGER.debug("Storage event detected, reloading session");
        reload();
      }
    };

    // Also listen to sessionStorage changes (same tab)
    // Note: storage event only fires for OTHER tabs/windows
    // For same-tab changes, we need a custom event
    const handleSessionUpdate = () => {
      LOGGER.debug("Custom session update event detected");
      reload();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("session-updated", handleSessionUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("session-updated", handleSessionUpdate);
    };
  }, [reload]);

  /**
   * FIX #3: Main authentication effect
   * 
   * Now includes:
   * - Retry logic for session read
   * - Better state management
   * - Proper cleanup
   */
  useEffect(() => {
    let isMounted = true;
    
    LOGGER.debug("Auth effect triggered", { 
      reloadFlag, 
      pathname: location.pathname 
    });

    const loadUser = async (attempt = 1): Promise<void> => {
      try {
        setLoadingPhase("session");
        setStatus("loading");
        setError(undefined);

        // FIX: Use retry logic for session read
        const activeSession = await readSessionWithRetry();
        
        LOGGER.debug("Session read result", { 
          hasSession: !!activeSession,
          hasToken: !!activeSession?.token 
        });

        if (!isMounted) return;

        if (!activeSession || !activeSession.token) {
          LOGGER.debug("No valid session, setting unauthenticated");
          setSession(null);
          setUser(undefined);
          setStatus("unauthenticated");
          setLoadingPhase(null);
          return;
        }

        // Valid session found
        setSession(activeSession);
        setLoadingPhase("profile");

        // Fetch dashboard data
        LOGGER.debug("Fetching dashboard snapshot");
        const snapshot = await fetchDashboardSnapshot(activeSession.token);
        
        if (!isMounted) return;

        LOGGER.debug("Dashboard snapshot received", { 
          hasProfile: !!snapshot 
        });

        setLoadingPhase("data");
        setUser(snapshot);
        setStatus("authenticated");
        setLoadingPhase(null);
        
        LOGGER.info("User authenticated successfully");

      } catch (err) {
        if (!isMounted) return;
        setLoadingPhase(null);

        // Handle auth errors (401/403) - logout immediately
        if (isAuthError(err)) {
          LOGGER.warn("Authentication error during profile fetch", err);
          logout();
          return;
        }

        // Retryable errors - try again with exponential backoff
        if (isRetryableError(err) && attempt < MAX_RETRIES) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          LOGGER.info(
            `Profile fetch failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${backoffMs}ms`
          );
          await delay(backoffMs);
          return loadUser(attempt + 1);
        }

        // Other errors or max retries exceeded
        LOGGER.warn("Failed to load user after retries", err);
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
  }, [reloadFlag, location.pathname, readSessionWithRetry, logout]);

  /**
   * Inactivity timeout effect
   */
  useEffect(() => {
    if (status !== "authenticated") {
      return undefined;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }

      const stored = readStoredSession();
      if (!stored) {
        logout();
        return;
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      const timeUntilExpiryMs = stored.expiresAt
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

    // Reset timer on user activity
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

  // Render logic
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

  // For login page, render fallback without redirect
  if (location.pathname === "/login") {
    return (
      <DashboardAuthContext.Provider value={contextValue}>
        {fallback ?? <div>Unable to load dashboard user.</div>}
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
