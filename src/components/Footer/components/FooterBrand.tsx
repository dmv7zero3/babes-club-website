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
    <div className="space-y-6">
      {/* Logo and Brand */}
      <Link to="/" className="block">
        <div className="flex items-center space-x-4">
          <img
            src={logo}
            alt={`${businessName} Logo`}
            className="object-contain w-12 h-12"
            loading="lazy"
          />
          <div>
            <h3 className="text-2xl font-semibold font-heading text-heritage-ivory">
              {businessName}
            </h3>
            <p className="text-sm font-medium text-heritage-gold">{tagline}</p>
          </div>
        </div>
      </Link>

      {/* Description */}
      <p className="max-w-xs leading-relaxed text-warm-ivory-200">
        {description}
      </p>

      {/* Established */}
      <div className="text-sm text-heritage-gold">
        <span className="font-medium">Established {established}</span>
      </div>
    </div>
  );
};

export default FooterBrand;
