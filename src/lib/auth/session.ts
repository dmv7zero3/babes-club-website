import type { StoredSession, AuthUser } from "../types/auth";
import { isTokenExpired, decodeJWT } from "./jwt";

const SESSION_STORAGE_KEY = "babes.auth.session";
const LOCAL_STORAGE_KEY = "babes.auth.remembered";

const getStorage = (persistent: boolean = false): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return persistent ? window.localStorage : window.sessionStorage;
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

  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionJson);
    console.debug(
      "[persistSession] sessionStorage set",
      SESSION_STORAGE_KEY,
      sessionJson
    );
  }

  const localStorage = getStorage(true);
  if (localStorage) {
    if (remember) {
      localStorage.setItem(LOCAL_STORAGE_KEY, sessionJson);
      console.debug(
        "[persistSession] localStorage set",
        LOCAL_STORAGE_KEY,
        sessionJson
      );
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.debug("[persistSession] localStorage removed", LOCAL_STORAGE_KEY);
    }
  }
};

export const persistSessionObject = (session: {
  token: string;
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
  persistSession(session.token, expiresAt, user);
};

export const readStoredSession = (): StoredSession | null => {
  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    const sessionData = safeParseJSON<StoredSession>(
      sessionStorage.getItem(SESSION_STORAGE_KEY)
    );
    if (sessionData && isSessionValid(sessionData)) {
      return sessionData;
    }
    if (sessionData) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
  const localStorage = getStorage(true);
  if (localStorage) {
    const rememberedData = safeParseJSON<StoredSession>(
      localStorage.getItem(LOCAL_STORAGE_KEY)
    );
    if (rememberedData && isSessionValid(rememberedData)) {
      if (sessionStorage) {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(rememberedData)
        );
      }
      return rememberedData;
    }
    if (rememberedData) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
  console.debug("[readStoredSession] no valid session found");
  return null;
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
  const sessionStorage = getStorage(false);
  if (sessionStorage) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  const localStorage = getStorage(true);
  if (localStorage) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};

export const getStoredToken = (): string | null => {
  const session = readStoredSession();
  return session?.token ?? null;
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
