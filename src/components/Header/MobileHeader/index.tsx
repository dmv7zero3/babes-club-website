// src/components/Header/MobileHeader/index.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import MobileMenuOverlay from "./MobileMenuOverlay/index";
import MenuButton from "./MenuButton";

/**
 * Main mobile header component for Cafe Opera
 * Renders the mobile navigation bar with logo and menu button
 */
const MobileHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="block lg:hidden">
      <div className="flex items-center justify-between px-10 py-10 bg-warm-ivory-200 shadow-opera-sm">
        {/* Cafe Opera Logo */}
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <img
            src="/images/logo/cafe-opera-logo.svg"
            alt="Cafe Opera"
            className="w-auto h-20 "
          />
        </Link>

        {/* Menu Button Component */}
        <MenuButton isOpen={isMenuOpen} onClick={toggleMenu} />
      </div>

      {/* Mobile Menu Overlay */}
      <MobileMenuOverlay isOpen={isMenuOpen} onClose={closeMenu} />
    </header>
  );
};

export default MobileHeader;
