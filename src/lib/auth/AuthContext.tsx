// ...existing imports...
import { updateProfile } from "@/lib/api/updateProfile";
import { updateSessionTokens } from "./session";
import { useState } from "react";
// =============================================================================
// PART 4: useProfileUpdate hook for profile update and session refresh
// =============================================================================

export const useProfileUpdate = () => {
  const { token, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (updates: {
    displayName?: string;
    email?: string;
    shippingAddress?: any;
    phone?: string;
    dashboardSettings?: Record<string, boolean>;
    preferredWallet?: string;
  }) => {
    if (!token) {
      setError("Not authenticated");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await updateProfile(token, updates);
      // If new tokens were issued, update session
      if (
        result.emailChanged &&
        result.accessToken &&
        result.refreshToken &&
        result.expiresAt
      ) {
        updateSessionTokens(
          result.accessToken,
          result.refreshToken,
          result.expiresAt,
          {
            email: result.profile.email,
            displayName: result.profile.displayName,
          }
        );
      } else if (result.emailChanged && result.tokenError) {
        alert(
          "Your email was updated, but we could not refresh your session. Please log out and log back in."
        );
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleUpdateProfile,
    isLoading,
    error,
  };
};

// =============================================================================
// PART 5: Example ProfileForm component
// =============================================================================

export const ProfileForm: React.FC = () => {
  const { user } = useAuth();
  const { handleUpdateProfile, isLoading, error } = useProfileUpdate();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    try {
      const result = await handleUpdateProfile(formData);
      if (result?.emailChanged) {
        setSuccessMessage(
          "Profile and email updated successfully! Your session has been refreshed."
        );
      } else {
        setSuccessMessage("Profile updated successfully!");
      }
    } catch {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      <input
        type="text"
        value={formData.displayName}
        onChange={(e) =>
          setFormData({ ...formData, displayName: e.target.value })
        }
        placeholder="Display Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
};
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type {
  AuthContextValue,
  AuthStatus,
  AuthUser,
  AuthAPIError,
} from "../types/auth";
import { loginUser, signupUser, fetchUserProfile, revokeSession } from "./api";
import {
  persistSession,
  readStoredSession,
  clearSession,
  getStoredToken,
} from "./session";
import { decodeJWT, isTokenExpired, willTokenExpireSoon } from "./jwt";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  error: Error | null;
}

type AuthAction =
  | { type: "INIT_START" }
  | { type: "INIT_SUCCESS"; user: AuthUser; token: string }
  | { type: "INIT_FAIL" }
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; user: AuthUser; token: string }
  | { type: "AUTH_FAIL"; error: Error }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; user: Partial<AuthUser> };

const initialState: AuthState = {
  status: "idle",
  user: null,
  token: null,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "INIT_START":
      return { ...state, status: "loading", error: null };
    case "INIT_SUCCESS":
      return {
        status: "authenticated",
        user: action.user,
        token: action.token,
        error: null,
      };
    case "INIT_FAIL":
      return {
        status: "unauthenticated",
        user: null,
        token: null,
        error: null,
      };
    case "AUTH_START":
      return { ...state, status: "loading", error: null };
    case "AUTH_SUCCESS":
      return {
        status: "authenticated",
        user: action.user,
        token: action.token,
        error: null,
      };
    case "AUTH_FAIL":
      return { ...state, status: "unauthenticated", error: action.error };
    case "LOGOUT":
      return {
        status: "unauthenticated",
        user: null,
        token: null,
        error: null,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "UPDATE_USER":
      if (!state.user) return state;
      return { ...state, user: { ...state.user, ...action.user } };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  onAuthChange?: (authenticated: boolean) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onAuthChange,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: "INIT_START" });
      const storedSession = readStoredSession();
      if (!storedSession?.token) {
        dispatch({ type: "INIT_FAIL" });
        return;
      }
      if (isTokenExpired(storedSession.token)) {
        clearSession();
        dispatch({ type: "INIT_FAIL" });
        return;
      }
      const storedUser: AuthUser = {
        userId: storedSession.user.userId,
        email: storedSession.user.email,
        displayName: storedSession.user.displayName,
      };
      dispatch({
        type: "INIT_SUCCESS",
        user: storedUser,
        token: storedSession.token,
      });
      if (!willTokenExpireSoon(storedSession.token, 300)) {
        try {
          const freshUser = await fetchUserProfile(storedSession.token);
          dispatch({ type: "UPDATE_USER", user: freshUser });
        } catch (error) {
          console.warn("[Auth] Failed to refresh user profile:", error);
        }
      }
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (
      state.status === "authenticated" ||
      state.status === "unauthenticated"
    ) {
      onAuthChange?.(state.status === "authenticated");
    }
  }, [state.status, onAuthChange]);

  useEffect(() => {
    if (!state.token || state.status !== "authenticated") return;
    const checkExpiration = () => {
      if (isTokenExpired(state.token!)) {
        clearSession();
        dispatch({ type: "LOGOUT" });
      }
    };
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [state.token, state.status]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await loginUser(email, password);
      let expiresAt = response.expiresAt;
      if (!expiresAt) {
        const payload = decodeJWT(response.accessToken);
        expiresAt = payload?.exp;
      }
      if (!expiresAt) {
        expiresAt = Math.floor(Date.now() / 1000) + 3600;
      }
      // Always persist to localStorage (persistent)
      persistSession(
        response.accessToken,
        expiresAt,
        response.user,
        true,
        response.refreshToken
      );
      dispatch({
        type: "AUTH_SUCCESS",
        user: response.user,
        token: response.accessToken,
      });
    } catch (error) {
      const authError = error as AuthAPIError;
      dispatch({
        type: "AUTH_FAIL",
        error: new Error(authError.message || "Login failed"),
      });
      throw error;
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, displayName?: string) => {
      dispatch({ type: "AUTH_START" });
      try {
        const response = await signupUser(email, password, displayName);
        let expiresAt = response.expiresAt;
        if (!expiresAt) {
          const payload = decodeJWT(response.accessToken);
          expiresAt = payload?.exp;
        }
        if (!expiresAt) {
          expiresAt = Math.floor(Date.now() / 1000) + 3600;
        }
        // Always persist to localStorage (persistent)
        persistSession(
          response.accessToken,
          expiresAt,
          response.user,
          true,
          response.refreshToken
        );
        dispatch({
          type: "AUTH_SUCCESS",
          user: response.user,
          token: response.accessToken,
        });
      } catch (error) {
        const authError = error as AuthAPIError;
        dispatch({
          type: "AUTH_FAIL",
          error: new Error(authError.message || "Signup failed"),
        });
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    const token = getStoredToken();
    if (token) {
      revokeSession(token).catch(() => {});
    }
    clearSession();
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      token: state.token,
      error: state.error,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading" || state.status === "idle",
      login,
      signup,
      logout,
      clearError,
    }),
    [state, login, signup, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useCurrentUser = (): AuthUser | null => {
  const { user } = useAuth();
  return user;
};

export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useAuthToken = (): string | null => {
  const { token } = useAuth();
  return token;
};
