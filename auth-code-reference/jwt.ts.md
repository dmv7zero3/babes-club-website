/**
 * JWT Utilities for The Babes Club
 * 
 * Helper functions for working with JSON Web Tokens in the frontend.
 * Note: These utilities do NOT verify signatures - that's the backend's job.
 * They only decode and check expiration for UX purposes.
 */

import type { JWTPayload } from '../types/auth';

// ============================================================================
// Constants
// ============================================================================

/**
 * Buffer time before expiration to consider token "expired" (in seconds)
 * This prevents race conditions where a token expires during a request
 */
const EXPIRY_BUFFER_SECONDS = 60;

// ============================================================================
// Token Decoding
// ============================================================================

/**
 * Decode a JWT without verifying the signature
 * @param token - The JWT string
 * @returns Decoded payload or null if invalid
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[JWT] Invalid token format - expected 3 parts');
      return null;
    }

    const payload = parts[1];
    // Handle URL-safe base64 encoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.warn('[JWT] Failed to decode token:', error);
    return null;
  }
};

// ============================================================================
// Expiration Checks
// ============================================================================

/**
 * Get the expiration timestamp from a JWT
 * @param token - The JWT string
 * @returns Expiration timestamp in seconds, or null if invalid
 */
export const getTokenExpiration = (token: string): number | null => {
  const payload = decodeJWT(token);
  return payload?.exp ?? null;
};

/**
 * Check if a token is expired (with buffer)
 * @param token - The JWT string
 * @param bufferSeconds - Extra seconds to consider token expired early
 * @returns true if expired, false if valid, null if token is invalid
 */
export const isTokenExpired = (
  token: string,
  bufferSeconds: number = EXPIRY_BUFFER_SECONDS
): boolean | null => {
  const exp = getTokenExpiration(token);
  if (exp === null) {
    return null; // Invalid token
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp <= nowSeconds + bufferSeconds;
};

/**
 * Get time remaining until token expires
 * @param token - The JWT string
 * @returns Seconds until expiration, 0 if expired, null if invalid
 */
export const getTokenTimeRemaining = (token: string): number | null => {
  const exp = getTokenExpiration(token);
  if (exp === null) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - nowSeconds);
};

/**
 * Check if token will expire within a given time window
 * @param token - The JWT string  
 * @param windowSeconds - Time window to check
 * @returns true if token will expire within the window
 */
export const willTokenExpireSoon = (
  token: string,
  windowSeconds: number = 300 // 5 minutes default
): boolean => {
  const remaining = getTokenTimeRemaining(token);
  if (remaining === null) {
    return true; // Invalid token, treat as expiring
  }
  return remaining <= windowSeconds;
};

// ============================================================================
// Token Claims
// ============================================================================

/**
 * Extract user ID from a JWT
 * @param token - The JWT string
 * @returns User ID or null if not present
 */
export const getUserIdFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.userId ?? null;
};

/**
 * Extract email from a JWT
 * @param token - The JWT string
 * @returns Email or null if not present
 */
export const getEmailFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.email ?? null;
};

/**
 * Extract all user-relevant claims from a JWT
 * @param token - The JWT string
 * @returns User claims object or null if invalid
 */
export const getUserClaimsFromToken = (token: string): {
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
    displayName: payload.displayName ?? payload.email.split('@')[0],
    role: payload.role,
  };
};

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format token expiration as a human-readable string
 * @param token - The JWT string
 * @returns Human-readable expiration string
 */
export const formatTokenExpiration = (token: string): string => {
  const remaining = getTokenTimeRemaining(token);
  
  if (remaining === null) {
    return 'Invalid token';
  }
  
  if (remaining === 0) {
    return 'Expired';
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

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that a string looks like a JWT
 * @param token - String to validate
 * @returns true if the string has JWT structure
 */
export const isValidJWTFormat = (token: unknown): token is string => {
  if (typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Check that each part is valid base64
  const base64Regex = /^[A-Za-z0-9_-]*$/;
  return parts.every((part) => base64Regex.test(part));
};
