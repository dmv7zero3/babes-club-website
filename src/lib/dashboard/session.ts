import type { DashboardUserData } from "@/lib/types/dashboard";

export const DASHBOARD_SESSION_STORAGE_KEY = "babes.dashboard.session";

export interface StoredDashboardSession {
  token: string;
  expiresAt?: number;
  user?: Pick<DashboardUserData["profile"], "userId" | "email" | "displayName">;
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getStorage = (): StorageLike | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
};

export const readStoredSession = (): StoredDashboardSession | null => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(DASHBOARD_SESSION_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredDashboardSession | undefined;

    if (!parsed || typeof parsed.token !== "string") {
      storage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
      return null;
    }

    if (typeof parsed.expiresAt === "number" && parsed.expiresAt > 0) {
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (parsed.expiresAt <= nowSeconds) {
        storage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
        return null;
      }
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored dashboard session", error);
    storage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
    return null;
  }
};

export const persistSession = (session: StoredDashboardSession): void => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(DASHBOARD_SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(DASHBOARD_SESSION_STORAGE_KEY);
};
