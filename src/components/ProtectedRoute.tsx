/**
 * Protected Route Components for The Babes Club
 *
 * Route guards that ensure only authenticated users can access certain pages.
 * Uses the branded ChronicLeafIcon loading component.
 */

import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";
import { ChronicLeafIcon } from "./LoadingIcon";

// ============================================================================
// Loading Components
// ============================================================================

/**
 * Branded loading spinner for auth state checks.
 * Uses the ChronicLeafIcon with full-page centered layout.
 */
export const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Loading...",
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
    <ChronicLeafIcon
      size={64}
      label={message}
      showLabel={true}
      enableRotation={true}
      enableGlow={true}
    />
  </div>
);

/**
 * Message displayed when user lacks required authorization.
 */
export const UnauthorizedMessage: React.FC<{ message?: string }> = ({
  message = "You are not authorized to view this page.",
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d] px-4 text-center">
    <ChronicLeafIcon
      size={48}
      showLabel={false}
      enableRotation={false}
      enableGlow={true}
      colors={["#ef4444", "#f87171", "#fca5a5"]}
    />
    <p className="max-w-md text-sm text-white/70">{message}</p>
    <a
      href="/"
      className="px-6 py-2 mt-2 text-sm font-medium text-white transition-colors rounded-lg bg-babe-pink hover:bg-babe-pink-600"
    >
      Go Home
    </a>
  </div>
);

// ============================================================================
// Protected Route
// ============================================================================

interface ProtectedRouteProps {
  /** The content to render when authenticated */
  children: ReactNode;
  /** Path to redirect unauthenticated users (default: /auth) */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactElement;
  /** Custom loading message */
  loadingMessage?: string;
}

/**
 * Route guard that requires authentication.
 * Redirects unauthenticated users to the login page.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = "/login",
  loadingComponent,
  loadingMessage = "Checking authentication...",
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return loadingComponent ?? <LoadingSpinner message={loadingMessage} />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

// ============================================================================
// Public Only Route
// ============================================================================

interface PublicOnlyRouteProps {
  /** The content to render when not authenticated */
  children: ReactNode;
  /** Path to redirect authenticated users (default: /dashboard) */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactElement;
}

/**
 * Route that only allows unauthenticated users.
 * Useful for login/signup pages that should redirect logged-in users.
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
  redirectTo = "/dashboard",
  loadingComponent,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return loadingComponent ?? <LoadingSpinner message="Loading..." />;
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render public content
  return <>{children}</>;
};

export default ProtectedRoute;
