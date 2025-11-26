import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useDashboardData } from "./DashboardDataProvider";

export type DashboardPanelKey = "profile" | "orders" | "nfts";

interface DashboardLayoutProps {
  profilePanel: ReactNode;
  ordersPanel: ReactNode;
  nftsPanel: ReactNode;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  className?: string;
}

const PANEL_LABELS: Record<DashboardPanelKey, string> = {
  profile: "Profile",
  orders: "Orders",
  nfts: "NFTs",
};

const DashboardLayout = ({
  profilePanel,
  ordersPanel,
  nftsPanel,
  headerActions,
  sidebarFooter,
  className,
}: DashboardLayoutProps) => {
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
      return (
        <div className="flex h-full items-center justify-center text-sm text-neutral-500">
          Loading dashboard data...
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutral-500">
            {error?.message ?? "Something went wrong loading the dashboard."}
          </p>
          {/* Refresh button removed */}
        </div>
      );
    }

    return panels[activePanel] ?? null;
  };

  const summaryLabel = profile
    ? `${profile.displayName}${profile.category ? ` · ${profile.category}` : ""}`
    : "Babes Club";

  return (
    <div className={clsx("flex min-h-screen bg-neutral-50", className)}>
      <aside className="hidden w-72 flex-col border-r border-neutral-200 bg-white p-6 md:flex">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-neutral-400">
            Dashboard
          </span>
          <h1 className="text-lg font-semibold text-neutral-900">
            {summaryLabel}
          </h1>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {((Object.keys(panels) as DashboardPanelKey[]) || []).map(
            (panelKey) => (
              <button
                key={panelKey}
                type="button"
                onClick={() => setActivePanel(panelKey)}
                className={clsx(
                  "rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  activePanel === panelKey
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:bg-neutral-100",
                  status === "loading" && "pointer-events-none opacity-60"
                )}
              >
                {PANEL_LABELS[panelKey]}
              </button>
            )
          )}
        </nav>
        {sidebarFooter ? (
          <div className="mt-auto pt-6 text-sm">{sidebarFooter}</div>
        ) : null}
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-neutral-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-neutral-900">
              {PANEL_LABELS[activePanel]}
            </h2>
            {profile ? (
              <p className="text-sm text-neutral-500">
                Updated {new Date(profile.updatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {/* Refresh button removed */}
            {headerActions}
          </div>
        </header>
        <section className="flex flex-1 flex-col px-4 py-6 md:px-8">
          {renderMainContent()}
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
