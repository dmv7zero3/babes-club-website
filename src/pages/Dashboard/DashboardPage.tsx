/**
 * Dashboard Page for The Babes Club
 *
 * Main dashboard page with profile, orders, and NFT panels.
 */

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardErrorBoundary from "@/components/Dashboard/DashboardErrorBoundary";
import DashboardRouteGuard, {
  useDashboardAuth,
} from "@/components/Dashboard/DashboardRouteGuard";
import DashboardDataProvider from "@/components/Dashboard/DashboardDataProvider";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import ProfileOverviewCard from "@/components/Dashboard/ProfileOverviewCard";
import ProfileEditForm from "@/components/Dashboard/ProfileEditForm";
import OrderHistoryTable from "@/components/Dashboard/OrderHistoryTable";
import OrderDetailDrawer from "@/components/Dashboard/OrderDetailDrawer";
import NFTHoldingsGrid from "@/components/Dashboard/NFTHoldingsGrid";
import DashboardLoginScreen from "./DashboardLoginScreen";
import { ChronicLeafIcon } from "@/components/LoadingIcon";

// ============================================================================
// Custom Loading Component
// ============================================================================

const DashboardLoadingScreen: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
    <ChronicLeafIcon
      size={72}
      label="Loading dashboard..."
      showLabel={true}
      enableRotation={true}
      enableGlow={true}
    />
  </div>
);

// ============================================================================
// Header Actions Component
// ============================================================================

const HeaderActions: React.FC = () => {
  const { logout } = useDashboardAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium transition-colors border rounded-md border-rose-300 text-rose-600 hover:bg-rose-50"
    >
      Sign out
    </button>
  );
};

// ============================================================================
// Main Dashboard Page
// ============================================================================

const DashboardPage: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectOrder = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return (
    <DashboardErrorBoundary>
      <DashboardRouteGuard
        loading={<DashboardLoadingScreen />}
        fallback={<DashboardLoginScreen />}
      >
        <DashboardDataProvider>
          <DashboardLayout
            profilePanel={
              <div className="space-y-6">
                <ProfileOverviewCard />
                <ProfileEditForm />
              </div>
            }
            ordersPanel={
              <div className="space-y-6">
                <OrderHistoryTable onSelectOrder={handleSelectOrder} />
                <OrderDetailDrawer
                  isOpen={isDrawerOpen}
                  onClose={closeDrawer}
                />
              </div>
            }
            nftsPanel={<NFTHoldingsGrid />}
            headerActions={<HeaderActions />}
          />
        </DashboardDataProvider>
      </DashboardRouteGuard>
    </DashboardErrorBoundary>
  );
};

export default DashboardPage;
