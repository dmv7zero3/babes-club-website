// Payload for updating user profile (dashboard)
export interface ProfileUpdatePayload {
  email?: string;
  displayName?: string;
  phone?: string;
  shippingAddress?: Record<string, any>;
  dashboardSettings?: Record<string, any>;
  preferredWallet?: string;
}
// TypeScript type definitions for authentication system
export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  lastLoginAt?: string;
  roles?: string[];
  status?: "active" | "suspended" | "deleted";
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp (seconds)
  user: AuthUser;
}

export type AuthStatus =
  | "idle" // Initial state, checking for stored session
  | "loading" // Actively authenticating or fetching user data
  | "authenticated" // User is logged in with valid token
  | "unauthenticated"; // No valid session

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
  signup: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface StoredSession {
  token: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp (seconds)
  user: {
    userId: string;
    email: string;
    displayName: string;
  };
  storedAt: number; // When the session was stored (Unix timestamp)
}

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

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  acceptTerms: boolean;
}

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: FormFieldError[];
  isSubmitting: boolean;
  isValid: boolean;
}

export interface AuthAPIError {
  status: number;
  code: AuthErrorCode;
  message: string;
  field?: string; // For validation errors
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_EXISTS"
  | "EMAIL_NOT_FOUND"
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_SUSPENDED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";
