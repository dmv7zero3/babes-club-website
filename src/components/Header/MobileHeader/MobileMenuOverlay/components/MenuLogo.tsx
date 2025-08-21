// src/core/Components/Header/MobileHeader/MobileMenuOverlay/components/MenuLogo.tsx

import React from "react";

/**
 * Logo section component for the mobile menu overlay
 * Displays the Moon Lounge branding and tagline
 */
const MenuLogo: React.FC = () => {
  return (
    <div className="flex justify-center pt-8 pb-6">
      <div className="text-center">
        <h1 className="m-0 text-3xl tracking-widest sm:text-4xl md:text-5xl font-bebas text-electric-blue">
          MOON LOUNGE
        </h1>
        <p className="m-0 mt-2 text-base font-light tracking-wide sm:text-lg md:text-xl text-moon-gold font-poppins">
          Where Night Comes Alive
        </p>
      </div>
    </div>
  );
};

export default MenuLogo;
