import React from "react";
import { Link, useLocation } from "react-router-dom";

const DesktopMenu: React.FC = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) => {
    if (to === "/") return pathname === "/"; // exact for home
    return pathname === to || pathname.startsWith(`${to}/`);
  };
  const link = (to: string, label: string) => {
    const active = isActive(to);
    const baseClasses =
      "relative inline-flex items-center justify-center px-3 py-2 text-sm font-semibold uppercase tracking-[0.24em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
    const activeClasses =
      "text-primary-700 after:scale-x-100 after:opacity-100";
    const inactiveClasses =
      "text-neutral-500 hover:text-neutral-900 focus-visible:text-primary-700";
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      >
        <span className="relative z-[1]">{label}</span>
        <span
          aria-hidden="true"
          className={`absolute left-1/2 bottom-0 h-[2px] w-7 -translate-x-1/2 transform rounded-full bg-primary-500 transition duration-200 ease-out ${active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
        />
      </Link>
    );
  };

  return (
    <nav
      aria-label="Primary navigation"
      className="relative hidden items-center justify-center gap-6 md:flex"
    >
      <div className="relative z-[1] flex items-center gap-6">
        {link("/", "Home")}
      </div>
    </nav>
  );
};

export default DesktopMenu;
