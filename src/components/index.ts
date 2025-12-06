/**
 * Component Exports for The Babes Club
 *
 * Central export file for all shared components.
 */

// ============================================================================
// Authentication Components
// ============================================================================

// Forms
export { LoginForm } from "./LoginForm";
export { SignupForm } from "./SignupForm";

// Pages
export { AuthPage, LoginPage, SignupPage } from "./AuthPage";

// Route Guards
export {
  ProtectedRoute,
  PublicOnlyRoute,
  LoadingSpinner,
  UnauthorizedMessage,
} from "./ProtectedRoute";

// ============================================================================
// Loading Components
// ============================================================================

export {
  ChronicLeafIcon,
  LoadingOverlay,
  InlineSpinner,
  type ChronicLeafIconProps,
  type LoadingOverlayProps,
  type InlineSpinnerProps,
} from "./LoadingIcon";

// ============================================================================
// Dashboard Components
// ============================================================================

export { default as DashboardRouteGuard } from "./Dashboard/DashboardRouteGuard";
export { useDashboardAuth } from "./Dashboard/DashboardRouteGuard";
export { default as DashboardLayout } from "./Dashboard/DashboardLayout";
export { default as DashboardDataProvider } from "./Dashboard/DashboardDataProvider";
export { default as DashboardErrorBoundary } from "./Dashboard/DashboardErrorBoundary";
