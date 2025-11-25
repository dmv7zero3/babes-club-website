/**
 * Authentication API Client for The Babes Club
 * 
 * Functions for communicating with the authentication backend.
 * All endpoints use the API Gateway at api.thebabesclub.com
 */

import axios, { AxiosError, type AxiosInstance } from 'axios';
import type { 
  AuthResponse, 
  AuthUser, 
  AuthAPIError, 
  AuthErrorCode 
} from '../types/auth';

// ============================================================================
// Configuration
// ============================================================================

// API base URL - should come from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'https://api.thebabesclub.com';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// ============================================================================
// API Client Setup
// ============================================================================

const authClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request logging (development only)
if (import.meta.env.DEV) {
  authClient.interceptors.request.use((config) => {
    console.log('[Auth API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data ? '(redacted)' : undefined,
    });
    return config;
  });

  authClient.interceptors.response.use(
    (response) => {
      console.log('[Auth API] Response:', {
        status: response.status,
        url: response.config.url,
      });
      return response;
    },
    (error) => {
      console.error('[Auth API] Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
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
  if (responseData?.code) {
    return responseData.code as AuthErrorCode;
  }

  // Map status codes
  switch (status) {
    case 400:
      return 'INVALID_EMAIL';
    case 401:
      return 'INVALID_CREDENTIALS';
    case 403:
      return 'TOKEN_INVALID';
    case 409:
      return 'EMAIL_EXISTS';
    case 423:
      return 'ACCOUNT_LOCKED';
    case 429:
      return 'RATE_LIMITED';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'SERVER_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
};

/**
 * Get user-friendly error message
 */
const getErrorMessage = (code: AuthErrorCode, responseMessage?: string): string => {
  const messages: Record<AuthErrorCode, string> = {
    INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    EMAIL_EXISTS: 'An account with this email already exists.',
    EMAIL_NOT_FOUND: 'No account found with this email address.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    WEAK_PASSWORD: 'Password must be at least 8 characters long.',
    ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
    ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    TOKEN_INVALID: 'Invalid session. Please log in again.',
    RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    UNKNOWN_ERROR: responseMessage || 'An unexpected error occurred.',
  };

  return messages[code];
};

/**
 * Transform Axios error into structured AuthAPIError
 */
const transformError = (error: unknown): AuthAPIError => {
  // Network errors
  if (error instanceof Error && !('response' in error)) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: getErrorMessage('NETWORK_ERROR'),
    };
  }

  const axiosError = error as AxiosError<{ error?: string; code?: string; message?: string }>;
  
  if (!axiosError.response) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: getErrorMessage('NETWORK_ERROR'),
    };
  }

  const { status, data } = axiosError.response;
  const code = getErrorCodeFromStatus(status, data);
  const message = getErrorMessage(code, data?.error || data?.message);

  return {
    status,
    code,
    message,
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
    const { data } = await authClient.post<{
      accessToken: string;
      expiresAt?: number;
      user?: Partial<AuthUser>;
    }>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    // Normalize response
    return {
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
      user: {
        userId: data.user?.userId ?? '',
        email: data.user?.email ?? email.trim().toLowerCase(),
        displayName: data.user?.displayName ?? email.split('@')[0],
        lastLoginAt: data.user?.lastLoginAt,
        roles: data.user?.roles,
        status: data.user?.status,
      },
    };
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
    const { data } = await authClient.post<{
      accessToken: string;
      expiresAt?: number;
      user?: Partial<AuthUser>;
    }>('/auth/signup', {
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName?.trim() || undefined,
    });

    // Normalize response
    return {
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
      user: {
        userId: data.user?.userId ?? '',
        email: data.user?.email ?? email.trim().toLowerCase(),
        displayName: data.user?.displayName ?? displayName?.trim() ?? email.split('@')[0],
        lastLoginAt: data.user?.lastLoginAt,
        roles: data.user?.roles ?? ['member'],
        status: data.user?.status ?? 'active',
      },
    };
  } catch (error) {
    throw transformError(error);
  }
};

/**
 * Fetch current user's profile
 */
export const fetchUserProfile = async (token: string): Promise<AuthUser> => {
  try {
    const { data } = await authClient.get<{ profile: Partial<AuthUser> }>(
      '/dashboard/profile',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const profile = data.profile;
    return {
      userId: profile.userId ?? '',
      email: profile.email ?? '',
      displayName: profile.displayName ?? 'Member',
      lastLoginAt: profile.lastLoginAt,
      roles: profile.roles,
      status: profile.status ?? 'active',
    };
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
      '/dashboard/revoke-session',
      { revokeAll: options?.revokeAll ?? false },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    // Silently fail - we're logging out anyway
    console.warn('[Auth API] Session revocation failed:', error);
  }
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { 
  valid: boolean; 
  message?: string 
} => {
  if (password.length < 8) {
    return { 
      valid: false, 
      message: 'Password must be at least 8 characters' 
    };
  }
  
  // Additional checks could be added here:
  // - Uppercase letters
  // - Numbers
  // - Special characters
  
  return { valid: true };
};

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const finalScore = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const labels: Record<number, 'weak' | 'fair' | 'good' | 'strong' | 'excellent'> = {
    0: 'weak',
    1: 'fair',
    2: 'good',
    3: 'strong',
    4: 'excellent',
  };
  
  return {
    score: finalScore,
    label: labels[finalScore],
  };
};
