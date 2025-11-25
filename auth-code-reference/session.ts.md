/**
 * Session Storage Utilities for The Babes Club
 * 
 * Handles persistent storage of authentication sessions in the browser.
 * Uses sessionStorage by default (cleared on browser close) for security,
 * with optional localStorage support for "remember me" functionality.
 */

import type { StoredSession, AuthUser } from '../types/auth';
import { isTokenExpired, decodeJWT } from './jwt';

// ============================================================================
// Constants
// ============================================================================

const SESSION_STORAGE_KEY = 'babes.auth.session';
const LOCAL_STORAGE_KEY = 'babes.auth.remembered';

// ============================================================================
// Storage Helpers
// ============================================================================

/**
 * Get the appropriate storage mechanism
 */
const getStorage = (persistent: boolean = false): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return persistent ? window.localStorage : window.sessionStorage;
};

/**
 * Safely parse JSON from storage
 */
const safeParseJSON = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

// ============================================================================
// Session Operations
// ============================================================================

/**
 * Store a new authentication session
 * @param token - JWT access token
 * @param expiresAt - Token expiration (Unix timestamp in seconds)
 * @param user - User data to store
 * @param remember - If true, also store in localStorage for persistence
 */
export const persistSession = (
  token: string,
  expiresAt: number,
  user: Pick<AuthUser, 'userId' | 'email' | 'displayName'>,
  remember: boolean = false
): void => {
  const session: StoredSession = {
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

  // Always store in sessionStorage for current tab
  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionJson);
  }

  // Optionally store in localStorage for cross-session persistence
  const localStorage = getStorage(true);
  if (localStorage) {
    if (remember) {
      localStorage.setItem(LOCAL_STORAGE_KEY, sessionJson);
    } else {
      // Clear any remembered session if not remembering
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
};

/**
 * Alternative signature matching the existing codebase
 */
export const persistSessionObject = (session: {
  token: string;
  expiresAt?: number;
  user?: Pick<AuthUser, 'userId' | 'email' | 'displayName'>;
}): void => {
  // Try to extract expiry from token if not provided
  let expiresAt = session.expiresAt;
  if (!expiresAt && session.token) {
    const payload = decodeJWT(session.token);
    expiresAt = payload?.exp;
  }

  // Default expiry to 1 hour from now if still not available
  if (!expiresAt) {
    expiresAt = Math.floor(Date.now() / 1000) + 3600;
  }

  // Default user from token if not provided
  let user = session.user;
  if (!user && session.token) {
    const payload = decodeJWT(session.token);
    if (payload) {
      user = {
        userId: payload.userId,
        email: payload.email,
        displayName: payload.displayName ?? payload.email.split('@')[0],
      };
    }
  }

  // Fallback user if still missing
  if (!user) {
    user = {
      userId: 'unknown',
      email: 'unknown@example.com',
      displayName: 'User',
    };
  }

  persistSession(session.token, expiresAt, user);
};

/**
 * Read the stored session, checking both storage types
 * @returns Stored session or null if not found/expired
 */
export const readStoredSession = (): StoredSession | null => {
  // First check sessionStorage (current tab)
  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    const sessionData = safeParseJSON<StoredSession>(
      sessionStorage.getItem(SESSION_STORAGE_KEY)
    );
    
    if (sessionData && isSessionValid(sessionData)) {
      return sessionData;
    }
    
    // Clear invalid session
    if (sessionData) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  // Fall back to localStorage (remembered session)
  const localStorage = getStorage(true);
  if (localStorage) {
    const rememberedData = safeParseJSON<StoredSession>(
      localStorage.getItem(LOCAL_STORAGE_KEY)
    );
    
    if (rememberedData && isSessionValid(rememberedData)) {
      // Copy to sessionStorage for this tab
      if (sessionStorage) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(rememberedData));
      }
      return rememberedData;
    }
    
    // Clear invalid remembered session
    if (rememberedData) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  return null;
};

/**
 * Check if a stored session is still valid
 */
const isSessionValid = (session: StoredSession): boolean => {
  if (!session.token) {
    return false;
  }

  // Check expiration from stored value
  if (session.expiresAt) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= nowSeconds) {
      return false;
    }
  }

  // Double-check with token itself
  const expired = isTokenExpired(session.token);
  if (expired === true) {
    return false;
  }

  return true;
};

/**
 * Clear all stored sessions (logout)
 */
export const clearSession = (): void => {
  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  const localStorage = getStorage(true);
  if (localStorage) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};

/**
 * Get the stored token without the full session data
 */
export const getStoredToken = (): string | null => {
  const session = readStoredSession();
  return session?.token ?? null;
};

/**
 * Get stored user data without the token
 */
export const getStoredUser = (): StoredSession['user'] | null => {
  const session = readStoredSession();
  return session?.user ?? null;
};

/**
 * Check if there's a valid stored session
 */
export const hasValidSession = (): boolean => {
  return readStoredSession() !== null;
};

/**
 * Update only the user data in the stored session
 */
export const updateStoredUser = (
  updates: Partial<StoredSession['user']>
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

  // Also update localStorage if it exists
  const localStorage = getStorage(true);
  if (localStorage && localStorage.getItem(LOCAL_STORAGE_KEY)) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSession));
  }
};

// ============================================================================
// Session Info
// ============================================================================

/**
 * Get session metadata for debugging/display
 */
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
