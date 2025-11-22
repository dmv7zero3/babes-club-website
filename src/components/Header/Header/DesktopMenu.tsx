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
      "group relative inline-flex items-center justify-center px-4 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.32em] leading-4 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-babe-pink-500 before:absolute before:inset-[2px] before:rounded-full before:opacity-0 before:transition-all before:duration-300 before:content-[''] before:pointer-events-none";
    const activeClasses =
      "text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.4)] before:opacity-100 before:bg-white/20 before:shadow-[0_0_26px_rgba(255,255,255,0.35)]";
    const inactiveClasses =
      "text-white/70 hover:text-white focus-visible:text-white hover:before:opacity-90 hover:before:bg-white/10 hover:before:shadow-[0_0_20px_rgba(255,255,255,0.3)]";
    return (
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      >
        <span className="relative z-[1] transition duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Primary navigation"
      className="relative hidden items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-1.5 shadow-[0_10px_32px_rgba(254,59,161,0.18)] supports-[backdrop-filter]:bg-white/5 supports-[backdrop-filter]:backdrop-blur-lg before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-white/30 before:via-transparent before:to-white/15 before:opacity-60 before:content-[''] md:flex md:mx-auto"
    >
      <div className="relative z-[1] flex items-center gap-1">
        {link("/", "Home")}
        {link("/about", "About")}
        {link("/shop", "Shop")}
        {link("/gallery", "Gallery")}
        {link("/contact", "Contact")}
      </div>
    </nav>
  );
};

export default DesktopMenu;
