import type { JWTPayload } from "../types/auth";

const EXPIRY_BUFFER_SECONDS = 60;

export const decodeJWT = (token: string): JWTPayload | null => {
  if (!token || typeof token !== "string") {
    return null;
  }
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("[JWT] Invalid token format - expected 3 parts");
      return null;
    }
    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.warn("[JWT] Failed to decode token:", error);
    return null;
  }
};

export const getTokenExpiration = (token: string): number | null => {
  const payload = decodeJWT(token);
  return payload?.exp ?? null;
};

export const isTokenExpired = (
  token: string,
  bufferSeconds: number = EXPIRY_BUFFER_SECONDS
): boolean | null => {
  const exp = getTokenExpiration(token);
  if (exp === null) {
    return null;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowSeconds + bufferSeconds;
};

export const getTokenTimeRemaining = (token: string): number | null => {
  const exp = getTokenExpiration(token);
  if (exp === null) {
    return null;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - nowSeconds);
};

export const willTokenExpireSoon = (
  token: string,
  windowSeconds: number = 300
): boolean => {
  const remaining = getTokenTimeRemaining(token);
  if (remaining === null) {
    return true;
  }
  return remaining <= windowSeconds;
};

export const getUserIdFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.userId ?? null;
};

export const getEmailFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.email ?? null;
};

export const getUserClaimsFromToken = (
  token: string
): {
  userId: string;
  email: string;
  displayName: string;
  role?: string;
} | null => {
  const payload = decodeJWT(token);
  if (!payload || !payload.userId || !payload.email) {
    return null;
  }
  return {
    userId: payload.userId,
    email: payload.email,
    displayName: payload.displayName ?? payload.email.split("@")[0],
    role: payload.role,
  };
};

export const formatTokenExpiration = (token: string): string => {
  const remaining = getTokenTimeRemaining(token);
  if (remaining === null) {
    return "Invalid token";
  }
  if (remaining === 0) {
    return "Expired";
  }
  if (remaining < 60) {
    return `${remaining}s`;
  }
  if (remaining < 3600) {
    const minutes = Math.floor(remaining / 60);
    return `${minutes}m`;
  }
  if (remaining < 86400) {
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
};

export const isValidJWTFormat = (token: unknown): token is string => {
  if (typeof token !== "string") {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }
  const base64Regex = /^[A-Za-z0-9_-]*$/;
  return parts.every((part) => base64Regex.test(part));
};
