// src/components/Header/MobileHeader/MobileMenuOverlay/components/MenuNavigation.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { MenuNavigationProps, MenuNavLink } from "../types/menuTypes";

/**
 * Navigation links component for the mobile menu overlay
 * Renders the main navigation menu with smooth animations
 */
const MenuNavigation: React.FC<MenuNavigationProps> = ({
  navRef,
  onNavClick,
  links,
}) => {
  const location = useLocation();

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav
      ref={navRef}
      className="flex flex-col items-center justify-center flex-1 pb-8 gap-18"
    >
      {links.map((link: MenuNavLink) => (
        <div
          key={link.path}
          className="flex justify-center w-full menu-nav-item"
        >
          <Link
            to={link.path}
            onClick={onNavClick}
            className={`relative px-8 py-5 menu-overlay-link-size font-bold tracking-wider text-center transition-all duration-300 rounded-xl font-heading group
              ${
                isActiveRoute(link.path)
                  ? "text-jade-green bg-warm-ivory-200/10"
                  : "text-opera-blue hover:text-heritage-gold"
              }
              hover:bg-warm-ivory-200/20 focus:outline-none focus:ring-2 focus:ring-heritage-gold focus:ring-opacity-50`}
          >
            {link.label}
            <span
              className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 h-1 bg-jade-green transition-all duration-300 ${
                isActiveRoute(link.path) ? "w-16" : "w-0 group-hover:w-10"
              }`}
            ></span>
          </Link>
        </div>
      ))}

      {/* Call to Action Button */}
      <div className="mt-6 menu-nav-item">
        <a
          href="tel:(703) 858-1441"
          className="inline-flex items-center gap-3 px-10 py-8 text-4xl font-semibold tracking-wide transition-all duration-300 border-2 rounded-full md:10 md:py-8 md:text-xl font-heading bg-opera-blue text-champagne-gold border-opera-blue hover:bg-champagne-gold-500 hover:border-champagne-gold-500 hover:scale-105 hover:shadow-lg"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          ORDER NOW
        </a>
      </div>
    </nav>
  );
};

export default MenuNavigation;
