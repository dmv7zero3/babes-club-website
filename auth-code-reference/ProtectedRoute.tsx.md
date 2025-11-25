/**
 * Protected Route Component for The Babes Club
 * 
 * A route guard that ensures only authenticated users can access
 * certain pages. Redirects unauthenticated users to login.
 */

import React, { type ReactNode, type ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// ============================================================================
// Loading Spinner Component
// ============================================================================

const LoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
      color: 'rgba(255, 255, 255, 0.7)',
      gap: '1rem',
    }}
  >
    <style>
      {`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}
    </style>
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255, 182, 193, 0.2)',
        borderTopColor: '#FFB6C1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <p
      style={{
        fontSize: '0.875rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      {message}
    </p>
  </div>
);

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
  /** The content to render when authenticated */
  children: ReactNode;
  /** Path to redirect unauthenticated users (default: /login) */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: ReactElement;
  /** Custom loading message */
  loadingMessage?: string;
  /** Required roles (if any) */
  requiredRoles?: string[];
  /** Fallback when user lacks required role */
  unauthorizedComponent?: ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  loadingComponent,
  loadingMessage = 'Checking authentication...',
  requiredRoles,
  unauthorizedComponent,
}) => {
  const { status, user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading || status === 'idle') {
    return loadingComponent ?? <LoadingSpinner message={loadingMessage} />;
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = user?.roles ?? [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return unauthorizedComponent ?? (
        <UnauthorizedMessage 
          message="You don't have permission to access this page."
        />
      );
    }
  }

  // Render children when authenticated and authorized
  return <>{children}</>;
};

// ============================================================================
// Unauthorized Message Component
// ============================================================================

interface UnauthorizedMessageProps {
  message?: string;
  showBackButton?: boolean;
}

const UnauthorizedMessage: React.FC<UnauthorizedMessageProps> = ({
  message = "You don't have permission to access this resource.",
  showBackButton = true,
}) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)',
      padding: '2rem',
    }}
  >
    <div
      style={{
        maxWidth: '400px',
        padding: '2rem',
        borderRadius: '16px',
        background: 'rgba(26, 26, 26, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 1rem',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
      >
        🔒
      </div>
      <h2
        style={{
          color: '#ffffff',
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}
      >
        Access Denied
      </h2>
      <p
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        {message}
      </p>
      {showBackButton && (
        <button
          onClick={() => window.history.back()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#0a0a0a',
            background: '#FFB6C1',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Go Back
        </button>
      )}
    </div>
  </div>
);

// ============================================================================
// Public Only Route (for login/signup pages)
// ============================================================================

interface PublicOnlyRouteProps {
  /** The content to render when NOT authenticated */
  children: ReactNode;
  /** Path to redirect authenticated users (default: /dashboard) */
  redirectTo?: string;
  /** Custom loading component */
  loadingComponent?: ReactElement;
}

/**
 * Route that only allows unauthenticated users
 * Useful for login/signup pages that should redirect logged-in users
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
  redirectTo = '/dashboard',
  loadingComponent,
}) => {
  const { status, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading || status === 'idle') {
    return loadingComponent ?? <LoadingSpinner message="Loading..." />;
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    // Check if there's a redirect path from a previous protected route
    const from = (location.state as { from?: string })?.from ?? redirectTo;
    return <Navigate to={from} replace />;
  }

  // Render children when not authenticated
  return <>{children}</>;
};

// ============================================================================
// Exports
// ============================================================================

export { LoadingSpinner, UnauthorizedMessage };
export default ProtectedRoute;
