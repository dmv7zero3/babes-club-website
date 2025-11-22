import React from "react";
import CartIcon from "@/components/Cart/CartIcon";
// Lazy-load the non-critical CartDrawer to reduce initial JS for better LCP
const CartDrawer = React.lazy(() => import("@/components/Cart/CartDrawer"));
import { Link } from "react-router-dom";
import DesktopMenu from "@/components/Header/Header/DesktopMenu";
import MobileMenu from "@/components/Header/Header/MobileMenu";
import Portal from "@/components/Shared/Portal";
import { useDrawerManager } from "@/lib/context/DrawerManagerContext";

const Header: React.FC = () => {
  const { isOpen, toggle, close } = useDrawerManager();
  const cartOpen = isOpen("cart");

  return (
    // Sticky header with reserved height to avoid CLS; higher z-index to stay above content
    <header className="sticky top-0 z-50 text-white border-b border-white/20 bg-babe-pink/95 shadow-[0_12px_32px_rgba(254,59,161,0.25)] supports-[backdrop-filter]:bg-babe-pink/75 supports-[backdrop-filter]:backdrop-blur-xl md:py-2 lg:py-3">
      <div className="flex items-center justify-between h-16 px-4 mx-auto transition-[padding] duration-300 max-w-7xl gap-3 md:h-auto md:gap-4 md:px-6 lg:px-10">
        <div className="flex items-center gap-3 md:gap-6 md:flex-1">
          <Link
            to="/"
            className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-grand-hotel text-[clamp(1.55rem,2.2vw,2.5rem)] leading-none text-cotton-candy-200 text-glow-soft transition-all duration-500 ease-out hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-babe-pink-500"
            style={
              {
                "--glow-color": "rgba(255, 224, 249, 0.92)",
              } as React.CSSProperties
            }
          >
            <span className="relative z-[2] drop-shadow-[0_0_16px_rgba(255,255,255,0.55)]">
              The Babes Club
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-[1] rounded-full bg-white/20 opacity-30 blur-xl transition-all duration-500 group-hover:opacity-60 group-focus-visible:opacity-70"
            />
          </Link>
        </div>
        <div className="hidden md:flex md:flex-1 md:justify-center">
          <DesktopMenu />
        </div>
        <div className="flex items-center gap-3 ml-auto md:ml-0 md:flex-1 md:justify-end">
          <MobileMenu />
          <CartIcon onClick={() => toggle("cart")} />
        </div>
      </div>
      <Portal>
        <React.Suspense fallback={null}>
          {cartOpen ? <CartDrawer open={cartOpen} onClose={close} /> : null}
        </React.Suspense>
      </Portal>
    </header>
  );
};

export default Header;
