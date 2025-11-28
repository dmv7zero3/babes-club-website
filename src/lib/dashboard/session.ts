/**
 * Dashboard Session Storage Utilities for The Babes Club
 *
 * Handles persistent storage of dashboard authentication sessions.
 * IMPORTANT: This file MUST stay in sync with src/lib/auth/session.ts
 * Both files use the same storage key for compatibility.
 */

import type { DashboardUserData } from "@/lib/types/dashboard";

// ============================================================================
// Constants - CRITICAL: Must match src/lib/auth/session.ts
// ============================================================================

export const DASHBOARD_SESSION_STORAGE_KEY = "babes.dashboard.session";

// Event names for session updates (same as auth/session.ts)
export const SESSION_EVENTS = {
  UPDATED: "babes.dashboard.session.updated",
  CLEARED: "babes.dashboard.session.cleared",
} as const;

// ============================================================================
// Types
// ============================================================================

export interface StoredDashboardSession {
  token: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: Pick<DashboardUserData["profile"], "userId" | "email" | "displayName">;
  storedAt?: number;
}

// ============================================================================
// Debug Logger
// ============================================================================

const DEBUG = true; // Set to false in production

const log = {
  debug: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.debug(`[dashboard/session.ts] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[dashboard/session.ts] ${msg}`, ...args);
  },
};

// ============================================================================
// Storage Helpers
// ============================================================================

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Safely get sessionStorage (handles SSR and private browsing)
 */
const getSessionStorage = (): StorageLike | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const test = "__storage_test__";
    window.sessionStorage.setItem(test, test);
    window.sessionStorage.removeItem(test);
    return window.sessionStorage;
  } catch {
    log.warn("sessionStorage not available");
    return null;
  }
};

/**
 * Safely get localStorage (for "remember me" feature)
 */
const getLocalStorage = (): StorageLike | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const test = "__storage_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch {
    log.warn("localStorage not available");
    return null;
  }
};

/**
 * Dispatch custom event for same-tab session updates
 * The native 'storage' event only fires for OTHER tabs/windows.
 */
const dispatchSessionEvent = (eventName: string, detail?: unknown) => {
  if (typeof window !== "undefined") {
    log.debug(`Dispatching event: ${eventName}`);
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    // Also dispatch legacy event name for backward compatibility
    window.dispatchEvent(new CustomEvent("session-updated"));
  }
};

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Read the stored session from storage
 *
 * Checks sessionStorage first, then falls back to localStorage.
 * Returns null if session is expired or not found.
 */
export const readStoredSession = (): StoredDashboardSession | null => {
  log.debug("readStoredSession called");

  // Try sessionStorage first
  const sessionStorage = getSessionStorage();
  let raw: string | null = null;

  if (sessionStorage) {
    raw = sessionStorage.getItem(DASHBOARD_SESSION_STORAGE_KEY);
    log.debug("sessionStorage read", { found: !!raw });
  }

  // Fall back to localStorage if not found (for "remember me")
  if (!raw) {
    const localStorage = getLocalStorage();
    if (localStorage) {
      raw = localStorage.getItem(DASHBOARD_SESSION_STORAGE_KEY);
      log.debug("localStorage fallback read", { found: !!raw });

      // If found in localStorage, copy to sessionStorage for faster access
      if (raw && sessionStorage) {
        sessionStorage.setItem(DASHBOARD_SESSION_STORAGE_KEY, raw);
        log.debug("Copied session from localStorage to sessionStorage");
      }
    }
  }

  if (!raw) {
    log.debug("No session found in storage");
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredDashboardSession | undefined;

    // Validate required fields
    if (!parsed || typeof parsed.token !== "string") {
      log.warn("Invalid session: missing or invalid token");
      clearSession();
      return null;
    }

    // Check expiration
    if (typeof parsed.expiresAt === "number" && parsed.expiresAt > 0) {
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (parsed.expiresAt <= nowSeconds) {
        log.debug("Session expired", {
          expiresAt: parsed.expiresAt,
          now: nowSeconds,
        });
        clearSession();
        return null;
      }

      log.debug("Valid session found", {
        userId: parsed.user?.userId,
        expiresIn: parsed.expiresAt - nowSeconds,
      });
    }

    return parsed;
  } catch (error) {
    log.warn("Failed to parse stored dashboard session", error);
    clearSession();
    return null;
  }
};

/**
 * Persist a new session to storage
 *
 * @param session - The session object to store
 * @param remember - If true, also persist to localStorage for cross-session access
 */
export const persistSession = (
  session: StoredDashboardSession,
  remember: boolean = false
): void => {
  log.debug("persistSession called", {
    hasToken: !!session.token,
    expiresAt: session.expiresAt,
    userId: session.user?.userId,
    remember,
  });

  // Add storedAt timestamp if not present
  const sessionToStore: StoredDashboardSession = {
    ...session,
    storedAt: session.storedAt ?? Math.floor(Date.now() / 1000),
  };

  const sessionJson = JSON.stringify(sessionToStore);

  // Always store in sessionStorage (current tab)
  const storage = getSessionStorage();
  if (storage) {
    storage.setItem(DASHBOARD_SESSION_STORAGE_KEY, sessionJson);
    log.debug("Session written to sessionStorage");
  } else {
    log.warn("Failed to write session - sessionStorage not available");
  }

  // Optionally store in localStorage for "remember me"
  if (remember) {
    const local = getLocalStorage();
    if (local) {
      local.setItem(DASHBOARD_SESSION_STORAGE_KEY, sessionJson);
      log.debug("Session written to localStorage (remember me)");
    }
  }

  // Dispatch event so listeners can react
  dispatchSessionEvent(SESSION_EVENTS.UPDATED, sessionToStore);
};

/**
 * Clear all stored sessions (logout)
 *
 * IMPORTANT: Clears BOTH sessionStorage AND localStorage to ensure
 * complete logout even if "remember me" was used.
 */
export const clearSession = (): void => {
  log.debug("clearSession called");

  // Clear sessionStorage
  const sessionStorage = getSessionStorage();
  if (sessionStorage) {
    sessionStorage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
    log.debug("Session cleared from sessionStorage");
  }

  // CRITICAL: Also clear localStorage to handle "remember me" sessions
  const localStorage = getLocalStorage();
  if (localStorage) {
    localStorage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
    log.debug("Session cleared from localStorage");
  }

  // Dispatch event so listeners (like DashboardRouteGuard) can react
  dispatchSessionEvent(SESSION_EVENTS.CLEARED);
};

/**
 * Get just the token from storage
 */
export const getStoredToken = (): string | null => {
  const session = readStoredSession();
  return session?.token ?? null;
};

/**
 * Get the stored user data
 */
export const getStoredUser = (): StoredDashboardSession["user"] | null => {
  const session = readStoredSession();
  return session?.user ?? null;
};

/**
 * Check if there's a valid (non-expired) session
 */
export const hasValidSession = (): boolean => {
  return readStoredSession() !== null;
};

/**
 * Update just the user data in the session (without changing token)
 */
export const updateStoredUser = (
  user: Partial<StoredDashboardSession["user"]>
): void => {
  const session = readStoredSession();
  if (!session) {
    log.warn("Cannot update user - no session found");
    return;
  }

  const updatedSession: StoredDashboardSession = {
    ...session,
    user: {
      ...session.user,
      ...user,
    } as StoredDashboardSession["user"],
  };

  const sessionStorage = getSessionStorage();
  if (sessionStorage) {
    sessionStorage.setItem(
      DASHBOARD_SESSION_STORAGE_KEY,
      JSON.stringify(updatedSession)
    );
    log.debug("User data updated in session");
  }

  // Also update localStorage if it exists
  const localStorage = getLocalStorage();
  if (localStorage?.getItem(DASHBOARD_SESSION_STORAGE_KEY)) {
    localStorage.setItem(
      DASHBOARD_SESSION_STORAGE_KEY,
      JSON.stringify(updatedSession)
    );
    log.debug("User data updated in localStorage");
  }

  dispatchSessionEvent(SESSION_EVENTS.UPDATED, updatedSession);
};

/**
 * Get session info for debugging
 */
export const getSessionInfo = (): {
  exists: boolean;
  token: string | null;
  expiresAt: number | null;
  expiresIn: number | null;
  user: StoredDashboardSession["user"] | null;
  isRemembered: boolean;
} => {
  const session = readStoredSession();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const localStorage = getLocalStorage();
  const isRemembered =
    localStorage?.getItem(DASHBOARD_SESSION_STORAGE_KEY) !== null;

  return {
    exists: !!session,
    token: session?.token ?? null,
    expiresAt: session?.expiresAt ?? null,
    expiresIn: session?.expiresAt ? session.expiresAt - nowSeconds : null,
    user: session?.user ?? null,
    isRemembered,
  };
};
