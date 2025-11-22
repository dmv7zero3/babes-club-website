import React from "react";
import { Link, useLocation } from "react-router-dom";

import { useDrawerManager } from "@/lib/context/DrawerManagerContext";
import { emitCartCheckoutEvent } from "@/lib/cart/drawerEvents";

type Props = { open: boolean; onClose: () => void };

const MobileMenuOverlay: React.FC<Props> = ({ open, onClose }) => {
  const { pathname } = useLocation();
  const { open: openDrawer } = useDrawerManager();
  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(`${to}/`);
  };
  return (
    <div
      className={`fixed inset-0 z-[120] md:hidden ${open ? "" : "pointer-events-none"}`}
      role="dialog"
      aria-modal={open}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-babe-pink/25 backdrop-blur-sm saturate-150 transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 top-0 z-[121] h-full w-[min(19rem,80%)] bg-gradient-to-b from-babe-pink-700 via-babe-pink-600 to-babe-pink-500 text-white px-5 py-6 shadow-[0_0_60px_rgba(254,59,161,0.35)] border-r border-white/20 transition-transform duration-300 ease-out will-change-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-semibold tracking-wide uppercase text-cotton-candy-50">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-2xl leading-none rounded-full text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            ×
          </button>
        </div>
        <nav className="flex flex-col gap-2 text-base font-medium">
          <Link
            to="/"
            onClick={onClose}
            aria-current={isActive("/") ? "page" : undefined}
            className={`px-3 py-2 rounded-lg transition ${
              isActive("/")
                ? "bg-white/15 text-white shadow-inner shadow-white/20"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            onClick={onClose}
            aria-current={isActive("/about") ? "page" : undefined}
            className={`px-3 py-2 rounded-lg transition ${
              isActive("/about")
                ? "bg-white/15 text-white shadow-inner shadow-white/20"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            About
          </Link>
          <Link
            to="/shop"
            onClick={onClose}
            aria-current={isActive("/shop") ? "page" : undefined}
            className={`px-3 py-2 rounded-lg transition ${
              isActive("/shop")
                ? "bg-white/15 text-white shadow-inner shadow-white/20"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Shop
          </Link>
          <Link
            to="/gallery"
            onClick={onClose}
            aria-current={isActive("/gallery") ? "page" : undefined}
            className={`px-3 py-2 rounded-lg transition ${
              isActive("/gallery")
                ? "bg-white/15 text-white shadow-inner shadow-white/20"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Gallery
          </Link>
          <Link
            to="/contact"
            onClick={onClose}
            aria-current={isActive("/contact") ? "page" : undefined}
            className={`px-3 py-2 rounded-lg transition ${
              isActive("/contact")
                ? "bg-white/15 text-white shadow-inner shadow-white/20"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            Contact
          </Link>
          {/* <button
            type="button"
            onClick={() => {
              onClose();
              openDrawer("cart");
              emitCartCheckoutEvent();
            }}
            className="px-3 py-2 text-left transition rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          >
            Checkout
          </button> */}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
