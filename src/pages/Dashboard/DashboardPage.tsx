import { useCallback, useState } from "react";
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

import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectOrder = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const HeaderActions = () => {
    const { logout } = useDashboardAuth();
    const navigate = useNavigate();

    return (
      <>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          Sign out
        </button>
      </>
    );
  };

  return (
    <DashboardErrorBoundary>
      <DashboardRouteGuard
        loading={
          <div className="flex items-center justify-center min-h-screen">
            Loading dashboard…
          </div>
        }
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
