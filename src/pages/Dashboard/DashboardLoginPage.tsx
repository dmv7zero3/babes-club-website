/**
 * Dashboard Login Page for The Babes Club
 *
 * Entry point for dashboard authentication with branded loading state.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { readStoredSession, clearSession } from "@/lib/dashboard/session";
import DashboardRouteGuard, {
  useDashboardAuth,
} from "@/components/Dashboard/DashboardRouteGuard";
import DashboardLoginScreen from "./DashboardLoginScreen";
import { ChronicLeafIcon } from "@/components/LoadingIcon";

// ============================================================================
// Loading Component
// ============================================================================

const DashboardAccessLoading: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
    <ChronicLeafIcon
      size={64}
      label="Loading dashboard access..."
      showLabel={true}
      enableRotation={true}
      enableGlow={true}
    />
  </div>
);

// ============================================================================
// Redirect Screen
// ============================================================================

const RedirectingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
    <ChronicLeafIcon
      size={56}
      label="Redirecting to your dashboard..."
      showLabel={true}
      enableRotation={true}
      enableGlow={true}
      colors={["#A7F3D0", "#6EE7B7", "#34D399"]} // Green tones for success
    />
  </div>
);

// ============================================================================
// Dashboard Login Content
// ============================================================================

const DashboardLoginContent: React.FC = () => {
  const navigate = useNavigate();
  const { status, user } = useDashboardAuth();

  useEffect(() => {
    if (status === "authenticated" && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [status, user, navigate]);

  // Show redirecting state when authenticated
  if (status === "authenticated" && user) {
    return <RedirectingScreen />;
  }

  return <DashboardLoginScreen />;
};

// ============================================================================
// Main Login Page
// ============================================================================

const DashboardLoginPage: React.FC = () => {
  const navigate = useNavigate();

  // If there's a stored session (token), eagerly redirect to dashboard
  // to avoid a flash of the login UI.
  useEffect(() => {
    const stored = readStoredSession();
    if (stored?.token) {
      // Validate token expiry before redirect
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (stored.expiresAt && stored.expiresAt > nowSeconds) {
        navigate("/dashboard", { replace: true });
      } else {
        clearSession();
      }
    }
  }, [navigate]);

  return (
    <DashboardRouteGuard
      loading={<DashboardAccessLoading />}
      fallback={<DashboardLoginScreen />}
    >
      <DashboardLoginContent />
    </DashboardRouteGuard>
  );
};

export default DashboardLoginPage;
