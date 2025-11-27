/**
 * Dashboard Layout for The Babes Club
 *
 * Main layout component for the dashboard with sidebar navigation,
 * header actions, and panel content areas.
 */

import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useDashboardData } from "./DashboardDataProvider";
import { ChronicLeafIcon, InlineSpinner } from "@/components/LoadingIcon";

// ============================================================================
// Types
// ============================================================================

export type DashboardPanelKey = "profile" | "orders" | "nfts";

interface DashboardLayoutProps {
  profilePanel: ReactNode;
  ordersPanel: ReactNode;
  nftsPanel: ReactNode;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PANEL_LABELS: Record<DashboardPanelKey, string> = {
  profile: "Profile",
  orders: "Orders",
  nfts: "NFTs",
};

// ============================================================================
// Loading State Component
// ============================================================================

const DashboardContentLoading: React.FC = () => (
  <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4">
    <ChronicLeafIcon
      size={48}
      label="Loading dashboard data..."
      showLabel={true}
      enableRotation={true}
      enableGlow={true}
      colors={["#fe3ba1", "#f5dcee", "#ffc6e3"]}
    />
  </div>
);

// ============================================================================
// Error State Component
// ============================================================================

interface DashboardContentErrorProps {
  message?: string;
  onRetry?: () => void;
}

const DashboardContentError: React.FC<DashboardContentErrorProps> = ({
  message = "Something went wrong loading the dashboard.",
  onRetry,
}) => (
  <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
    <ChronicLeafIcon
      size={40}
      showLabel={false}
      enableRotation={false}
      enableGlow={true}
      colors={["#fca5a5", "#f87171"]}
    />
    <p className="max-w-sm text-sm text-neutral-500">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium transition-colors border rounded-md border-babe-pink text-babe-pink hover:bg-babe-pink hover:text-white"
      >
        Try Again
      </button>
    )}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  profilePanel,
  ordersPanel,
  nftsPanel,
  headerActions,
  sidebarFooter,
  className,
}) => {
  const { profile, status, error, refresh } = useDashboardData();
  const [activePanel, setActivePanel] = useState<DashboardPanelKey>("profile");

  const panels = useMemo<Record<DashboardPanelKey, ReactNode>>(
    () => ({
      profile: profilePanel,
      orders: ordersPanel,
      nfts: nftsPanel,
    }),
    [profilePanel, ordersPanel, nftsPanel]
  );

  const renderMainContent = () => {
    if (status === "loading") {
      return <DashboardContentLoading />;
    }

    if (status === "error") {
      return (
        <DashboardContentError
          message={error?.message}
          // onRetry={refresh} // Uncomment to enable retry button
        />
      );
    }

    return panels[activePanel] ?? null;
  };

  const summaryLabel = profile
    ? `${profile.displayName}${profile.category ? ` · ${profile.category}` : ""}`
    : "Babes Club";

  return (
    <div className={clsx("flex min-h-screen bg-neutral-50", className)}>
      {/* Sidebar */}
      <aside className="flex-col hidden p-6 bg-white border-r w-72 border-neutral-200 md:flex">
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-wide uppercase text-neutral-400">
            Dashboard
          </span>
          <h1 className="text-lg font-semibold text-neutral-900">
            {summaryLabel}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 mt-6">
          {(Object.keys(panels) as DashboardPanelKey[]).map((panelKey) => (
            <button
              key={panelKey}
              type="button"
              onClick={() => setActivePanel(panelKey)}
              className={clsx(
                "flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                activePanel === panelKey
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-100",
                status === "loading" && "pointer-events-none opacity-60"
              )}
            >
              {status === "loading" && activePanel === panelKey && (
                <InlineSpinner size={14} color="currentColor" />
              )}
              {PANEL_LABELS[panelKey]}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {sidebarFooter && (
          <div className="pt-6 mt-auto text-sm">{sidebarFooter}</div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex flex-col gap-4 px-4 py-4 bg-white border-b border-neutral-200 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-neutral-900">
              {PANEL_LABELS[activePanel]}
            </h2>
            {profile && (
              <p className="text-sm text-neutral-500">
                Updated {new Date(profile.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">{headerActions}</div>
        </header>

        {/* Content Area */}
        <section className="flex flex-col flex-1 px-4 py-6 md:px-8">
          {renderMainContent()}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
