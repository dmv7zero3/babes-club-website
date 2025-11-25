/**
 * Authentication API Client for The Babes Club
 *
 * Functions for communicating with the authentication backend.
 * All endpoints use the API Gateway at api.thebabesclub.com
 */

import axios, { AxiosInstance } from "axios";
import type {
  AuthUser,
  AuthResponse,
  AuthAPIError,
  AuthErrorCode,
} from "../types/auth";

// ============================================================================
// Configuration
// ============================================================================

// API base URL - should come from environment variables (Webpack)
const API_BASE_URL = process.env.API_BASE_URL || "https://api.thebabesclub.com";

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// ============================================================================
// API Client Setup
// ============================================================================

const authClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request logging (development only)
if (process.env.NODE_ENV === "development") {
  authClient.interceptors.request.use((config) => {
    console.log("[Auth API] Request:", config);
    return config;
  });

  authClient.interceptors.response.use(
    (response) => {
      console.log("[Auth API] Response:", response);
      return response;
    },
    (error) => {
      console.warn("[Auth API] Error:", error);
      return Promise.reject(error);
    }
  );
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Map HTTP status codes to error codes
 */
const getErrorCodeFromStatus = (
  status: number,
  responseData?: { error?: string; code?: string }
): AuthErrorCode => {
  // Check for explicit error code in response
  if (responseData?.code) return responseData.code as AuthErrorCode;

  // Map status codes
  switch (status) {
    case 400:
      return "INVALID_CREDENTIALS";
    case 401:
      return "TOKEN_INVALID";
    case 403:
      return "ACCOUNT_SUSPENDED";
    case 404:
      return "EMAIL_NOT_FOUND";
    case 409:
      return "EMAIL_EXISTS";
    case 429:
      return "RATE_LIMITED";
    case 500:
      return "SERVER_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
};

/**
 * Get user-friendly error message
 */
const getErrorMessage = (
  code: AuthErrorCode,
  responseMessage?: string
): string => {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Invalid email or password.";
    case "EMAIL_EXISTS":
      return "An account with this email already exists.";
    case "EMAIL_NOT_FOUND":
      return "No account found for this email.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "WEAK_PASSWORD":
      return "Password is too weak.";
    case "ACCOUNT_LOCKED":
      return "Your account is locked.";
    case "ACCOUNT_SUSPENDED":
      return "Your account is suspended.";
    case "TOKEN_EXPIRED":
      return "Session expired. Please log in again.";
    case "TOKEN_INVALID":
      return "Invalid session. Please log in again.";
    case "RATE_LIMITED":
      return "Too many requests. Please try again later.";
    case "NETWORK_ERROR":
      return "Network error. Please check your connection.";
    case "SERVER_ERROR":
      return "Server error. Please try again later.";
    default:
      return responseMessage || "An unknown error occurred.";
  }
};

/**
 * Transform Axios error into structured AuthAPIError
 */
const transformError = (error: unknown): AuthAPIError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const code = getErrorCodeFromStatus(status, error.response?.data);
    const message = getErrorMessage(
      code,
      error.response?.data?.error || error.message
    );
    return {
      status,
      code,
      message,
      field: error.response?.data?.field,
    };
  }
  return {
    status: 0,
    code: "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
  };
};

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Log in with email and password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await authClient.post("/auth/login", { email, password });
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
 */
export const isValidPassword = (
  password: string
): {
  valid: boolean;
  message?: string;
} => {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters." };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain an uppercase letter.",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain a lowercase letter.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain a special character.",
    };
  }
  return { valid: true };
};

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (
  password: string
): {
  score: 0 | 1 | 2 | 3 | 4;
  label: "weak" | "fair" | "good" | "strong" | "excellent";
} => {
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score === 0) return { score: 0, label: "weak" };
  if (score === 1) return { score: 1, label: "fair" };
  if (score === 2) return { score: 2, label: "good" };
  if (score === 3) return { score: 3, label: "strong" };
  return { score: 4, label: "excellent" };
};
