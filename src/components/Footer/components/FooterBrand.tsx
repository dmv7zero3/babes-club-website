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
    <div className="space-y-8 ">
      {/* Logo - Keep as is */}
      <Link to="/" className="block ">
        <div className="flex justify-center lg:justify-start">
          <img
            src="/images/logo/cafe-opera-white.svg"
            alt={`${businessName} Logo`}
            className="object-contain w-10/12 h-auto max-w-[26rem] lg:w-40"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Description - Use only footer-text for font size */}
      <p className="lg:max-w-xs footer-text lg:text-left text-warm-ivory-200">
        {description}
      </p>

      {/* Established - Use only footer-small for font size */}
      <div className="footer-text text-champagne-gold-400">
        <span className="font-medium">
          Serving authentic cuisine since {established}
        </span>
      </div>
    </div>
  );
};

export default FooterBrand;
