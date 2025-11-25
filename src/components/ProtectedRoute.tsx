import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";

export const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner">Loading...</div>
);

export const UnauthorizedMessage: React.FC = () => (
  <div className="unauthorized-message">
    You are not authorized to view this page.
  </div>
);

export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated)
    return <Navigate to="/auth" state={{ from: location }} replace />;
  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  // Show loading spinner while checking auth status
  if (isLoading) return <LoadingSpinner />;
  // Only redirect if definitely authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  // Not authenticated or still checking - show the public page
  return <>{children}</>;
};

export default ProtectedRoute;
