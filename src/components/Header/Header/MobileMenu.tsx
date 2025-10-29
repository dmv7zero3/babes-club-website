import React from "react";
import { Menu } from "lucide-react";
import Portal from "@/components/Shared/Portal";
import { useDrawerManager } from "@/lib/context/DrawerManagerContext";
// Lazy-load overlay to defer offscreen UI for better LCP
const MobileMenuOverlay = React.lazy(() => import("./MobileMenuOverlay"));

const MobileMenu: React.FC = () => {
  const { isOpen, toggle, close } = useDrawerManager();
  const open = isOpen("menu");
  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300/60 md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => toggle("menu")}
      >
        <Menu
          size={22}
          strokeWidth={2.2}
          className="text-current"
          aria-hidden="true"
        />
      </button>
      <Portal>
        <React.Suspense fallback={null}>
          {open ? <MobileMenuOverlay open={open} onClose={close} /> : null}
        </React.Suspense>
      </Portal>
    </>
  );
};

export default MobileMenu;
