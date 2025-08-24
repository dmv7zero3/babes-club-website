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
            src="/images/logo/cafe-opera-white.svg"
            alt={`${businessName} Logo`}
            className="object-contain w-40 h-auto"
            loading="lazy"
          />
          {/* <div>
            <h3 className="text-xl font-semibold sm:text-2xl font-heading text-heritage-ivory">
              {businessName}
            </h3>
            <p className="text-xs font-medium sm:text-sm text-heritage-gold">
              {tagline}
            </p>
          </div> */}
        </div>
      </Link>

      {/* Description - Mobile optimized line height and max width */}
      <p className="max-w-xs text-base leading-relaxed sm:text-lg sm:max-w-sm text-warm-ivory-200">
        {description}
      </p>

      {/* Established - Mobile optimized */}
      <div className="text-base sm:text-sm text-heritage-gold">
        <span className="font-medium">Established {established}</span>
      </div>
    </div>
  );
};

export default FooterBrand;
