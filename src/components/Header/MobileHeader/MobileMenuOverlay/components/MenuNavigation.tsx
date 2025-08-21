// src/core/Components/Header/MobileHeader/MobileMenuOverlay/components/MenuNavigation.tsx

import React from "react";
import { Link } from "react-router-dom";
import type { MenuNavigationProps } from "../types/menuTypes";

/**
 * Navigation links component for the mobile menu overlay
 * Renders the main navigation menu with smooth animations
 */
const MenuNavigation: React.FC<MenuNavigationProps> = ({
  navRef,
  onNavClick,
  links,
}) => {
  return (
    <nav
      ref={navRef}
      className="flex flex-col items-center justify-center flex-1 gap-2 pb-8"
    >
      {links.map((link) => (
        <div
          key={link.path}
          className="flex justify-center w-full menu-nav-item"
        >
          <Link
            to={link.path}
            onClick={onNavClick}
            className="relative px-6 py-5 text-2xl tracking-wide text-center transition-all duration-200 rounded-lg sm:text-3xl md:text-4xl font-bebas text-moon-silver hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-electric-blue focus:ring-opacity-50"
            style={{
              fontFamily: "Bebas Neue, cursive",
              letterSpacing: "0.1em",
            }}
          >
            {link.label}
          </Link>
        </div>
      ))}
    </nav>
  );
};

export default MenuNavigation;
