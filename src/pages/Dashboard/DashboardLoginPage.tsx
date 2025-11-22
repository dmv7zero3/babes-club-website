import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { readStoredSession } from "@/lib/dashboard/session";
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
      navigate("/dashboard", { replace: true });
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
