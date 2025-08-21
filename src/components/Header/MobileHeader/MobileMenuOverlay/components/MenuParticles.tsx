// src/core/Components/Header/MobileHeader/MobileMenuOverlay/components/MenuParticles.tsx

import React from "react";

/**
 * Background particles component for the mobile menu overlay
 * Creates animated floating particles for visual enhancement
 */
const MenuParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-30">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: "2px",
            height: "2px",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `pulse ${2 + Math.random() * 2}s infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

export default MenuParticles;
