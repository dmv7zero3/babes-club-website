// Unified session event constants
export const SESSION_EVENTS = {
  UPDATED: "babes.dashboard.session.updated",
  CLEARED: "babes.dashboard.session.cleared",
} as const;
// Unified session key for dashboard auth
import type { AuthUser, StoredSession } from "@/lib/types/auth";
import { decodeJWT, isTokenExpired } from "@/lib/auth/jwt";

// For legacy compatibility, define LOCAL_STORAGE_KEY and getStorage
export const SESSION_STORAGE_KEY = "babes.dashboard.session";
export const LOCAL_STORAGE_KEY = SESSION_STORAGE_KEY;
const getStorage = (local: boolean): Storage | null => {
  return local ? getLocalStorage() : getSessionStorage();
};

export interface DashboardUser {
  userId: string;
  email: string;
  displayName: string;
}

export interface StoredDashboardSession {
  token: string;
  refreshToken?: string;
  expiresAt: number;
  user: DashboardUser;
  storedAt?: number;
}

const DEBUG = true;
const log = {
  debug: (msg: string, ...args: unknown[]) => {
    if (DEBUG) console.debug(`[session.ts] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[session.ts] ${msg}`, ...args);
  },
};

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
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

const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") return null;
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

const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const persistSession = (
  token: string,
  expiresAt: number,
  user: Pick<AuthUser, "userId" | "email" | "displayName">,
  remember: boolean = false,
  refreshToken?: string
): void => {
  log.debug("persistSession called", {
    hasToken: !!token,
    expiresAt,
    userId: user.userId,
    remember,
    hasRefreshToken: !!refreshToken,
  });
  const session: StoredDashboardSession = {
    token,
    refreshToken,
    expiresAt,
    user: {
      userId: user.userId,
      email: user.email,
      displayName: user.displayName,
    },
    storedAt: Math.floor(Date.now() / 1000),
  };
  const sessionJson = JSON.stringify(session);
  // Always write to sessionStorage for current tab
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionJson);
  log.debug("Session written to sessionStorage");
  // Optionally persist to localStorage for cross-tab/persistence
  if (remember) {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionJson);
    log.debug("Session written to localStorage (remember me)");
  }
  window.dispatchEvent(
    new CustomEvent(SESSION_EVENTS.UPDATED, { detail: session })
  );
};

export const persistSessionObject = (session: {
  token: string;
  refreshToken?: string;
  expiresAt?: number;
  user?: Pick<AuthUser, "userId" | "email" | "displayName">;
}): void => {
  let expiresAt = session.expiresAt;
  if (!expiresAt && session.token) {
    const payload = decodeJWT(session.token);
    expiresAt = payload?.exp;
  }
  if (!expiresAt) {
    expiresAt = Math.floor(Date.now() / 1000) + 3600;
  }
  let user = session.user;
  if (!user && session.token) {
    const payload = decodeJWT(session.token);
    if (payload) {
      user = {
        userId: payload.userId,
        email: payload.email,
        displayName: payload.displayName ?? payload.email.split("@")[0],
      };
    }
  }
  if (!user) {
    user = {
      userId: "unknown",
      email: "unknown@example.com",
      displayName: "User",
    };
  }
  persistSession(session.token, expiresAt, user, false, session.refreshToken);
};

export const readStoredSession = (): StoredSession | null => {
  // Always prefer sessionStorage for current tab, fallback to localStorage for persistence
  log.debug("readStoredSession called");
  let raw: string | null = null;
  const sessionStore = getSessionStorage();
  const localStore = getLocalStorage();
  if (sessionStore) raw = sessionStore.getItem(SESSION_STORAGE_KEY);
  if (!raw && localStore) {
    raw = localStore.getItem(SESSION_STORAGE_KEY);
    // If found in localStorage, copy to sessionStorage for current tab
    if (raw && sessionStore) {
      sessionStore.setItem(SESSION_STORAGE_KEY, raw);
      log.debug("Copied session from localStorage to sessionStorage");
    }
  }
  if (!raw) {
    log.debug("No session found in storage");
    return null;
  }
  try {
    const session: StoredSession = JSON.parse(raw);
    // Validate token presence
    if (!session.token) {
      log.warn("Invalid session: missing token");
      clearSession();
      return null;
    }
    // Validate expiry
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expiresAt && session.expiresAt <= nowSeconds) {
      log.debug("Session expired", {
        expiresAt: session.expiresAt,
        now: nowSeconds,
      });
      clearSession();
      return null;
    }
    log.debug("Valid session found", {
      userId: session.user?.userId,
      expiresIn: session.expiresAt ? session.expiresAt - nowSeconds : "unknown",
    });
    return session;
  } catch (error) {
    log.warn("Failed to parse session", error);
    clearSession();
    return null;
  }
};

const isSessionValid = (session: StoredSession): boolean => {
  if (!session.token) {
    return false;
  }
  if (session.expiresAt) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= nowSeconds) {
      return false;
    }
  }
  const expired = isTokenExpired(session.token);
  if (expired === true) {
    return false;
  }
  return true;
};

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
  window.dispatchEvent(new CustomEvent(SESSION_EVENTS.CLEARED));
};

export const getStoredToken = (): string | null => {
  const session = readStoredSession();
  return session?.token ?? null;
};

export const getStoredRefreshToken = (): string | null => {
  const session = readStoredSession();
  return session?.refreshToken ?? null;
};

export const getStoredUser = (): StoredSession["user"] | null => {
  const session = readStoredSession();
  return session?.user ?? null;
};

export const hasValidSession = (): boolean => {
  return readStoredSession() !== null;
};

export const updateStoredUser = (
  updates: Partial<StoredSession["user"]>
): void => {
  const session = readStoredSession();
  if (!session) return;
  const updatedSession: StoredSession = {
    ...session,
    user: {
      ...session.user,
      ...updates,
    },
  };
  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
  }
  const localStorage = getStorage(true);
  if (localStorage && localStorage.getItem(LOCAL_STORAGE_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSession));
  }
};

export const getSessionInfo = (): {
  hasSession: boolean;
  isRemembered: boolean;
  expiresAt: Date | null;
  storedAt: Date | null;
  userId: string | null;
} => {
  const session = readStoredSession();
  const localStorage = getStorage(true);
  const isRemembered = localStorage?.getItem(LOCAL_STORAGE_KEY) !== null;
  return {
    hasSession: session !== null,
    isRemembered,
    expiresAt: session?.expiresAt ? new Date(session.expiresAt * 1000) : null,
    storedAt: session?.storedAt ? new Date(session.storedAt * 1000) : null,
    userId: session?.user?.userId ?? null,
  };
};
