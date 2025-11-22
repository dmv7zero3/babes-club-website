import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { readStoredSession, clearSession } from "@/lib/dashboard/session";
import DashboardRouteGuard, {
  useDashboardAuth,
} from "@/components/Dashboard/DashboardRouteGuard";
import DashboardLoginScreen from "./DashboardLoginScreen";

const DashboardLoginContent = () => {
  const navigate = useNavigate();
  const { status, user } = useDashboardAuth();

  useEffect(() => {
    if (status === "authenticated" && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [status, user, navigate]);

  if (status === "authenticated" && user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">
        Redirecting to your dashboard…
      </div>
    );
  }

  return <DashboardLoginScreen />;
};

const DashboardLoginPage = () => {
  const navigate = useNavigate();

  // If there's a stored session (token) we can eagerly redirect to dashboard
  // to avoid a flash of the login UI.
  useEffect(() => {
    const stored = readStoredSession();
    if (stored?.token) {
      // Fix 1.2: Validate token expiry before redirect
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
      loading={
        <div className="flex min-h-screen items-center justify-center">
          Loading dashboard access…
        </div>
      }
      fallback={<DashboardLoginScreen />}
    >
      <DashboardLoginContent />
    </DashboardRouteGuard>
  );
};

export default DashboardLoginPage;
