/**
 * Authentication API Client for The Babes Club
 *
 * Handles all HTTP requests to the authentication endpoints,
 * with proper error handling and response normalization.
 */

import axios, { AxiosError } from "axios";
import type { AuthResponse, AuthUser, AuthAPIError } from "../types/auth";

// ============================================================================
// API Client Setup
// ============================================================================

export const authClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// Error Handling
// ============================================================================

const transformError = (error: unknown): AuthAPIError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; code?: string }>;

    if (axiosError.response) {
      return {
        status: axiosError.response.status,
        code: axiosError.response.data?.code || "UNKNOWN_ERROR",
        message:
          axiosError.response.data?.message ||
          "An error occurred during authentication",
      };
    }

    if (axiosError.code === "ECONNABORTED") {
      return {
        status: 0,
        code: "NETWORK_ERROR",
        message: "Request timed out. Please try again.",
      };
    }

    return {
      status: 0,
      code: "NETWORK_ERROR",
      message: "Unable to connect to the server. Please check your connection.",
    };
  }

  return {
    status: 0,
    code: "UNKNOWN_ERROR",
    message:
      error instanceof Error ? error.message : "An unknown error occurred",
  };
};

// ============================================================================
// Auth API Functions
// ============================================================================

/**
 * Login with email and password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await authClient.post("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data as AuthResponse;
  } catch (error) {
    throw transformError(error);
  }
};

/**
 * Create a new account
 */
export const signupUser = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse> => {
  try {
    const response = await authClient.post("/auth/signup", {
      email,
      password,
      displayName,
    });
    return response.data as AuthResponse;
  } catch (error) {
    throw transformError(error);
  }
};

/**
 * Fetch current user's profile
 */
export const fetchUserProfile = async (token: string): Promise<AuthUser> => {
  try {
    const response = await authClient.get("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data as AuthUser;
  } catch (error) {
    throw transformError(error);
  }
};

/**
 * Revoke the current session (logout)
 */
export const revokeSession = async (
  token: string,
  options?: { revokeAll?: boolean }
): Promise<void> => {
  try {
    await authClient.post(
      "/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        params: options,
      }
    );
  } catch (error) {
    throw transformError(error);
  }
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
};

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 7 characters
 * - Must contain at least one letter (A-Z or a-z)
 * - Numbers and special characters are allowed but not required
 */
export const isValidPassword = (
  password: string
): {
  valid: boolean;
  message?: string;
} => {
  if (!password || password.length < 7) {
    return { valid: false, message: "Password must be at least 7 characters." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one letter.",
    };
  }
  return { valid: true };
};

/**
 * Get password strength indicator
 *
 * Scoring:
 * - 7+ characters: +1
 * - 10+ characters: +1
 * - Has uppercase and lowercase: +1
 * - Has numbers: +1
 * - Has special characters: +1
 */
export const getPasswordStrength = (
  password: string
): {
  score: 0 | 1 | 2 | 3 | 4;
  label: "weak" | "fair" | "good" | "strong" | "excellent";
} => {
  let score = 0;

  // Length checks
  if (password.length >= 7) score++;
  if (password.length >= 10) score++;

  // Character variety checks
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4
  const finalScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  const labels: Record<
    number,
    "weak" | "fair" | "good" | "strong" | "excellent"
  > = {
    0: "weak",
    1: "fair",
    2: "good",
    3: "strong",
    4: "excellent",
  };

  return { score: finalScore, label: labels[finalScore] };
};
