/**
 * Session Storage Utilities - FIXED VERSION
 * 
 * Key fixes:
 * 1. Unified storage key constant
 * 2. Added custom event dispatch for same-tab session updates
 * 3. Added debug logging
 * 4. Better error handling
 */

// ============================================================================
// Constants - CRITICAL: This key must match in all files!
// ============================================================================

export const SESSION_STORAGE_KEY = "babes.dashboard.session";

// ============================================================================
// Types
// ============================================================================

export interface DashboardUser {
  userId: string;
  email: string;
  displayName: string;
}

export interface StoredDashboardSession {
  token: string;
  expiresAt: number; // Unix timestamp in seconds
  user: DashboardUser;
  storedAt?: number; // When the session was stored
}

// ============================================================================
// Debug Logger
// ============================================================================

const DEBUG = true; // Set to false in production

const log = {
  debug: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.debug(`[session.ts] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[session.ts] ${msg}`, ...args);
  },
};

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Safely get sessionStorage (handles SSR and private browsing)
 */
const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    // Test if sessionStorage is available
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
const getLocalStorage = (): Storage | null => {
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
 * FIX: Dispatch custom event for same-tab session updates
 * 
 * The native 'storage' event only fires for OTHER tabs/windows.
 * We need a custom event for same-tab changes.
 */
const dispatchSessionUpdate = () => {
  if (typeof window !== "undefined") {
    log.debug("Dispatching session-updated event");
    window.dispatchEvent(new CustomEvent("session-updated"));
  }
};

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Persist a new session to storage
 * 
 * @param token - The JWT/session token
 * @param expiresAt - Expiration timestamp (Unix seconds)
 * @param user - User data to store
 * @param remember - If true, also persist to localStorage for cross-session access
 */
export const persistSession = (
  token: string,
  expiresAt: number,
  user: DashboardUser,
  remember: boolean = false
): void => {
  log.debug("persistSession called", { 
    hasToken: !!token, 
    expiresAt, 
    userId: user.userId,
    remember 
  });

  const session: StoredDashboardSession = {
    token,
    expiresAt,
    user: {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
    },
    storedAt: Math.floor(Date.now() / 1000),
  };

  const sessionJson = JSON.stringify(session);

  // Always store in sessionStorage (current tab)
  const storage = getSessionStorage();
  if (storage) {
    storage.setItem(SESSION_STORAGE_KEY, sessionJson);
    log.debug("Session written to sessionStorage");
  } else {
    log.warn("Failed to write session - sessionStorage not available");
  }

  // Optionally store in localStorage for "remember me"
  if (remember) {
    const local = getLocalStorage();
    if (local) {
      local.setItem(SESSION_STORAGE_KEY, sessionJson);
      log.debug("Session written to localStorage (remember me)");
    }
  }

  // FIX: Dispatch event so same-tab listeners can react
  dispatchSessionUpdate();
};

/**
 * Read the stored session
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
    raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    log.debug("sessionStorage read", { found: !!raw });
  }

  // Fall back to localStorage if not found
  if (!raw) {
    const localStorage = getLocalStorage();
    if (localStorage) {
      raw = localStorage.getItem(SESSION_STORAGE_KEY);
      log.debug("localStorage fallback read", { found: !!raw });
      
      // If found in localStorage, copy to sessionStorage for faster access
      if (raw && sessionStorage) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, raw);
        log.debug("Copied session from localStorage to sessionStorage");
      }
    }
  }

  if (!raw) {
    log.debug("No session found in storage");
    return null;
  }

  // Parse the session
  try {
    const session: StoredDashboardSession = JSON.parse(raw);

    // Validate required fields
    if (!session.token) {
      log.warn("Invalid session: missing token");
      clearSession();
      return null;
    }

    // Check expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expiresAt && session.expiresAt <= nowSeconds) {
      log.debug("Session expired", { 
        expiresAt: session.expiresAt, 
        now: nowSeconds 
      });
      clearSession();
      return null;
    }

    log.debug("Valid session found", { 
      userId: session.user?.userId,
      expiresIn: session.expiresAt ? session.expiresAt - nowSeconds : "unknown"
    });

    return session;
  } catch (error) {
    log.warn("Failed to parse session", error);
    clearSession();
    return null;
  }
};

/**
 * Clear all stored sessions
 */
export const clearSession = (): void => {
  log.debug("clearSession called");

  const sessionStorage = getSessionStorage();
  if (sessionStorage) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  const localStorage = getLocalStorage();
  if (localStorage) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  dispatchSessionUpdate();
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
export const getStoredUser = (): DashboardUser | null => {
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
export const updateStoredUser = (user: Partial<DashboardUser>): void => {
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
    },
  };

  const sessionStorage = getSessionStorage();
  if (sessionStorage) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    dispatchSessionUpdate();
    log.debug("User data updated in session");
  }
};

/**
 * Get session info for debugging
 */
export const getSessionInfo = (): {
  exists: boolean;
  token: string | null;
  expiresAt: number | null;
  expiresIn: number | null;
  user: DashboardUser | null;
} => {
  const session = readStoredSession();
  const nowSeconds = Math.floor(Date.now() / 1000);

  return {
    exists: !!session,
    token: session?.token ?? null,
    expiresAt: session?.expiresAt ?? null,
    expiresIn: session?.expiresAt ? session.expiresAt - nowSeconds : null,
    user: session?.user ?? null,
  };
};
