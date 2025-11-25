/**
 * Authentication Context for The Babes Club
 * 
 * Centralized authentication state management using React Context.
 * Provides login, signup, logout functionality and user state to the entire app.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import type { 
  AuthContextValue, 
  AuthStatus, 
  AuthUser, 
  AuthAPIError 
} from '../types/auth';

import { 
  loginUser, 
  signupUser, 
  fetchUserProfile,
  revokeSession 
} from './api';

import {
  persistSession,
  readStoredSession,
  clearSession,
  getStoredToken,
} from './session';

import {
  decodeJWT,
  isTokenExpired,
  willTokenExpireSoon,
} from './jwt';

// ============================================================================
// State Management
// ============================================================================

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  error: Error | null;
}

type AuthAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; user: AuthUser; token: string }
  | { type: 'INIT_FAIL' }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; user: AuthUser; token: string }
  | { type: 'AUTH_FAIL'; error: Error }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; user: Partial<AuthUser> };

const initialState: AuthState = {
  status: 'idle',
  user: null,
  token: null,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        status: 'loading',
        error: null,
      };
    
    case 'INIT_SUCCESS':
      return {
        status: 'authenticated',
        user: action.user,
        token: action.token,
        error: null,
      };
    
    case 'INIT_FAIL':
      return {
        status: 'unauthenticated',
        user: null,
        token: null,
        error: null,
      };
    
    case 'AUTH_START':
      return {
        ...state,
        status: 'loading',
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        status: 'authenticated',
        user: action.user,
        token: action.token,
        error: null,
      };
    
    case 'AUTH_FAIL':
      return {
        ...state,
        status: 'unauthenticated',
        error: action.error,
      };
    
    case 'LOGOUT':
      return {
        status: 'unauthenticated',
        user: null,
        token: null,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          ...action.user,
        },
      };
    
    default:
      return state;
  }
};

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Optional callback when authentication state changes
   */
  onAuthChange?: (authenticated: boolean) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children,
  onAuthChange,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ========================================
  // Initialize from stored session
  // ========================================
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'INIT_START' });

      const storedSession = readStoredSession();
      
      if (!storedSession?.token) {
        dispatch({ type: 'INIT_FAIL' });
        return;
      }

      // Check if token is expired
      if (isTokenExpired(storedSession.token)) {
        clearSession();
        dispatch({ type: 'INIT_FAIL' });
        return;
      }

      // Try to use stored user data immediately for fast UI
      const storedUser: AuthUser = {
        userId: storedSession.user.userId,
        email: storedSession.user.email,
        displayName: storedSession.user.displayName,
      };

      dispatch({ 
        type: 'INIT_SUCCESS', 
        user: storedUser, 
        token: storedSession.token 
      });

      // Optionally refresh user data from server in background
      // (only if token isn't about to expire)
      if (!willTokenExpireSoon(storedSession.token, 300)) {
        try {
          const freshUser = await fetchUserProfile(storedSession.token);
          dispatch({ type: 'UPDATE_USER', user: freshUser });
        } catch (error) {
          // Silent fail - we already have user data
          console.warn('[Auth] Failed to refresh user profile:', error);
        }
      }
    };

    initializeAuth();
  }, []);

  // ========================================
  // Notify on auth state changes
  // ========================================
  useEffect(() => {
    if (state.status === 'authenticated' || state.status === 'unauthenticated') {
      onAuthChange?.(state.status === 'authenticated');
    }
  }, [state.status, onAuthChange]);

  // ========================================
  // Token expiration monitoring
  // ========================================
  useEffect(() => {
    if (!state.token || state.status !== 'authenticated') {
      return;
    }

    // Check token expiration every minute
    const checkExpiration = () => {
      if (isTokenExpired(state.token!)) {
        console.log('[Auth] Token expired, logging out');
        clearSession();
        dispatch({ type: 'LOGOUT' });
      }
    };

    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [state.token, state.status]);

  // ========================================
  // Actions
  // ========================================
  
  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await loginUser(email, password);
      
      // Extract expiration from token if not provided
      let expiresAt = response.expiresAt;
      if (!expiresAt) {
        const payload = decodeJWT(response.accessToken);
        expiresAt = payload?.exp;
      }
      
      // Default to 1 hour if still not available
      if (!expiresAt) {
        expiresAt = Math.floor(Date.now() / 1000) + 3600;
      }

      // Store session
      persistSession(response.accessToken, expiresAt, response.user);

      dispatch({ 
        type: 'AUTH_SUCCESS', 
        user: response.user, 
        token: response.accessToken 
      });
    } catch (error) {
      const authError = error as AuthAPIError;
      dispatch({ 
        type: 'AUTH_FAIL', 
        error: new Error(authError.message || 'Login failed') 
      });
      throw error;
    }
  }, []);

  const signup = useCallback(async (
    email: string, 
    password: string, 
    displayName?: string
  ) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await signupUser(email, password, displayName);
      
      // Extract expiration from token if not provided
      let expiresAt = response.expiresAt;
      if (!expiresAt) {
        const payload = decodeJWT(response.accessToken);
        expiresAt = payload?.exp;
      }
      
      // Default to 1 hour if still not available
      if (!expiresAt) {
        expiresAt = Math.floor(Date.now() / 1000) + 3600;
      }

      // Store session
      persistSession(response.accessToken, expiresAt, response.user);

      dispatch({ 
        type: 'AUTH_SUCCESS', 
        user: response.user, 
        token: response.accessToken 
      });
    } catch (error) {
      const authError = error as AuthAPIError;
      dispatch({ 
        type: 'AUTH_FAIL', 
        error: new Error(authError.message || 'Signup failed') 
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    // Revoke session on server (fire and forget)
    const token = getStoredToken();
    if (token) {
      revokeSession(token).catch(() => {
        // Ignore errors - we're logging out anyway
      });
    }

    // Clear local storage
    clearSession();
    
    // Update state
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // ========================================
  // Context Value
  // ========================================
  
  const value = useMemo<AuthContextValue>(() => ({
    // State
    status: state.status,
    user: state.user,
    token: state.token,
    error: state.error,
    
    // Computed
    isAuthenticated: state.status === 'authenticated',
    isLoading: state.status === 'loading' || state.status === 'idle',
    
    // Actions
    login,
    signup,
    logout,
    clearError,
  }), [state, login, signup, logout, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// Additional Hooks
// ============================================================================

/**
 * Hook to get just the current user (or null)
 */
export const useCurrentUser = (): AuthUser | null => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook to get the current auth token
 */
export const useAuthToken = (): string | null => {
  const { token } = useAuth();
  return token;
};

export default AuthProvider;
