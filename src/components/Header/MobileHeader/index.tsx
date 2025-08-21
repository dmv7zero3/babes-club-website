// src/core/Components/Header/MobileHeader/index.tsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import MobileMenuOverlay from "./MobileMenuOverlay";
import MenuButton from "./MenuButton";

/**
 * Main mobile header component
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
      <div className="my-3.5 rounded-full mx-4 py-2 px-4 flex items-center justify-between text-white relative">
        {/* Moon Lounge Logo on left */}
        <Link to="/" className="flex items-center" onClick={closeMenu}>
          <h1 className="text-3xl tracking-widest font-bebas text-electric-blue text-shadow-glow-blue">
            MOON LOUNGE
          </h1>
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
