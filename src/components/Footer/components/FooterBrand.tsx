// src/components/Footer/components/FooterBrand.tsx

import React from "react";
import { Link } from "react-router-dom";
import { FooterBrandProps } from "../types";

const FooterBrand: React.FC<FooterBrandProps> = ({
  businessName,
  tagline,
  description,
  logo,
  established,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Logo and Brand - Mobile optimized */}
      <Link to="/" className="block">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <img
            src={logo}
            alt={`${businessName} Logo`}
            className="object-contain w-10 h-10 sm:w-12 sm:h-12"
            loading="lazy"
          />
          <div>
            <h3 className="text-xl font-semibold sm:text-2xl font-heading text-heritage-ivory">
              {businessName}
            </h3>
            <p className="text-xs font-medium sm:text-sm text-heritage-gold">
              {tagline}
            </p>
          </div>
        </div>
      </Link>

      {/* Description - Mobile optimized line height and max width */}
      <p className="max-w-xs text-sm leading-relaxed sm:text-base sm:max-w-sm text-warm-ivory-200">
        {description}
      </p>

      {/* Established - Mobile optimized */}
      <div className="text-xs sm:text-sm text-heritage-gold">
        <span className="font-medium">Established {established}</span>
      </div>
    </div>
  );
};

export default FooterBrand;
