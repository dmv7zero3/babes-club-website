// src/components/Header/DesktopHeader/index.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Phone } from "lucide-react";
import TopInfoBar from "../TopInfoBar";

const DesktopHeader: React.FC = () => {
  const location = useLocation();

  // Helper function to check if current route is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // ...existing code...
  return (
    <header className="relative z-40 hidden w-full shadow-lg bg-warm-ivory-200 lg:block">
      <TopInfoBar />
      {/* Main Header */}
      <div className="relative flex items-center justify-between w-11/12 py-4 mx-auto max-w-7xl lg:py-6">
        {/* Logo/Brand Name */}
        <div className="flex items-center">
          <Link to="/" className="block group">
            {/* SVG Logo */}
            <img
              src="/images/logo/cafe-opera-logo.svg"
              alt="Cafe Opera Asian Cuisine"
              className="h-12 transition-all duration-300 lg:h-14 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-8 text-center xl:gap-10">
          <Link
            to="/"
            className="relative px-3 py-2 text-lg font-semibold transition-all duration-300 font-heading text-opera-blue-900 hover:text-opera-blue-700 group"
          >
            HOME
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-champagne-gold-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            to="/menu"
            className="relative px-3 py-2 text-lg font-semibold transition-all duration-300 font-heading text-opera-blue-900 hover:text-opera-blue-700 group"
          >
            MENU
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-champagne-gold-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            to="/about"
            className="relative px-3 py-2 text-lg font-semibold transition-all duration-300 font-heading text-opera-blue-900 hover:text-opera-blue-700 group"
          >
            ABOUT
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-champagne-gold-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <Link
            to="/contact"
            className="relative px-3 py-2 text-lg font-semibold transition-all duration-300 font-heading text-opera-blue-900 hover:text-opera-blue-700 group"
          >
            CONTACT
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-champagne-gold-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 text-center">
          {/* Order Online Button */}
          <Link
            to="/menu"
            className="px-6 py-2.5 text-sm font-semibold transition-all duration-300 border-2 rounded-full font-heading bg-champagne-gold-400 text-opera-blue-900 border-champagne-gold-400 hover:bg-champagne-gold-500 hover:border-champagne-gold-500 hover:shadow-lg hover:scale-105"
          >
            ORDER ONLINE
          </Link>

          {/* Call Now Button */}
          <a
            href="tel:(703) 858-1441"
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 border-2 rounded-full font-heading bg-jade-green-600 border-jade-green-600 hover:bg-jade-green-700 hover:border-jade-green-700 hover:shadow-lg hover:scale-105"
          >
            <Phone className="w-4 h-4" />
            CALL NOW
          </a>
        </div>
      </div>

      {/* Decorative Border */}
      <div className="w-full h-1 bg-gradient-to-r from-champagne-gold-400 via-champagne-gold-400 to-champagne-gold-400 opacity-60"></div>
    </header>
  );
};

export default DesktopHeader;
