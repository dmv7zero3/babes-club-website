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
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-babe-pink/40 bg-white/10 text-white shadow-[0_6px_18px_rgba(254,59,161,0.22)] backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-babe-pink/40"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => toggle("menu")}
      >
        <Menu
          size={22}
          strokeWidth={2.2}
          className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]"
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
