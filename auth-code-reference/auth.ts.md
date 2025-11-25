/**
 * Authentication Types for The Babes Club
 * 
 * These types define the shape of authentication data flowing through
 * the frontend application, from API responses to stored session data.
 */

// ============================================================================
// API Response Types
// ============================================================================

/**
 * User data returned from authentication endpoints
 */
export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  lastLoginAt?: string;
  roles?: string[];
  status?: 'active' | 'suspended' | 'deleted';
}

/**
 * Response from POST /auth/login and POST /auth/signup
 */
export interface AuthResponse {
  accessToken: string;
  expiresAt?: number; // Unix timestamp (seconds)
  user: AuthUser;
}

/**
 * Decoded JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  displayName?: string;
  role?: string;
  exp: number; // Expiration time (Unix timestamp)
  iat: number; // Issued at (Unix timestamp)
  aud?: string; // Audience
  iss?: string; // Issuer
}

// ============================================================================
// Session Storage Types
// ============================================================================

/**
 * Session data persisted in browser storage
 */
export interface StoredSession {
  token: string;
  expiresAt: number; // Unix timestamp (seconds)
  user: {
    userId: string;
    email: string;
    displayName: string;
  };
  storedAt: number; // When the session was stored (Unix timestamp)
}

// ============================================================================
// Auth Context Types
// ============================================================================

/**
 * Authentication status states
 */
export type AuthStatus = 
  | 'idle'           // Initial state, checking for stored session
  | 'loading'        // Actively authenticating or fetching user data
  | 'authenticated'  // User is logged in with valid token
  | 'unauthenticated'; // No valid session

/**
 * Auth context value exposed to consumers
 */
export interface AuthContextValue {
  // State
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  error: Error | null;
  
  // Computed
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ============================================================================
// Form Types
// ============================================================================

/**
 * Login form field values
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Signup form field values
 */
export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  acceptTerms: boolean;
}

/**
 * Form validation error structure
 */
export interface FormFieldError {
  field: string;
  message: string;
}

/**
 * Generic form state
 */
export interface FormState<T> {
  values: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// API Error Types
// ============================================================================

/**
 * Standardized API error response
 */
export interface AuthAPIError {
  status: number;
  code: string;
  message: string;
  field?: string; // For validation errors
}

/**
 * Error codes returned by the authentication API
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_EXISTS'
  | 'EMAIL_NOT_FOUND'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_SUSPENDED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';
