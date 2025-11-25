/**
 * Authentication Module Exports
 * 
 * Central export point for all authentication-related functionality
 */

// Context and Provider
export { 
  AuthProvider,
  useAuth,
  useCurrentUser,
  useIsAuthenticated,
  useAuthToken,
} from './AuthContext';

// API Functions
export {
  loginUser,
  signupUser,
  fetchUserProfile,
  revokeSession,
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
} from './api';

// Session Management
export {
  persistSession,
  persistSessionObject,
  readStoredSession,
  clearSession,
  getStoredToken,
  getStoredUser,
  hasValidSession,
  updateStoredUser,
  getSessionInfo,
} from './session';

// JWT Utilities
export {
  decodeJWT,
  getTokenExpiration,
  isTokenExpired,
  getTokenTimeRemaining,
  willTokenExpireSoon,
  getUserIdFromToken,
  getEmailFromToken,
  getUserClaimsFromToken,
  formatTokenExpiration,
  isValidJWTFormat,
} from './jwt';

// Types
export type {
  AuthUser,
  AuthResponse,
  AuthStatus,
  AuthContextValue,
  StoredSession,
  JWTPayload,
  LoginFormData,
  SignupFormData,
  FormFieldError,
  FormState,
  AuthAPIError,
  AuthErrorCode,
} from '../types/auth';
