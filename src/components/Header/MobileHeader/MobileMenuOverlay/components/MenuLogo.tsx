// src/components/Header/MobileHeader/MobileMenuOverlay/components/MenuLogo.tsx
import React from "react";
import "../styles/mobilemenu.styles.css";

/**
 * Logo section component for the mobile menu overlay
 * Displays the Cafe Opera branding and tagline
 */
const MenuLogo: React.FC = () => {
  return (
    <div className="flex justify-center">
      <div className="text-center">
        <div>
          <img
            src="/images/logo/cafe-opera-logo.svg"
            alt="Cafe Opera Asian Cuisine"
            className="mx-auto duration-500 "
          />
        </div>

        {/* <p className="m-0 mt-2 text-3xl font-light text-opera-blue font-lato">
          Authentic • Delicious • Fresh
        </p> */}
      </div>
    </div>
  );
};

export default MenuLogo;
