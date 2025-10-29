import React from "react";
import { Link, useLocation } from "react-router-dom";

type Props = { open: boolean; onClose: () => void };

const MobileMenuOverlay: React.FC<Props> = ({ open, onClose }) => {
  const { pathname } = useLocation();
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
        className={`absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 top-0 z-[121] h-full w-[min(19rem,80%)] border-r border-neutral-200 bg-white px-5 py-6 text-neutral-900 shadow-xl transition-transform duration-300 ease-out will-change-transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-semibold uppercase tracking-wide text-neutral-700">
            Menu
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full text-2xl leading-none text-neutral-400 transition hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-300/50"
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
                ? "bg-primary-50 text-primary-700 shadow-inner shadow-primary-200/40"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            Home
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
