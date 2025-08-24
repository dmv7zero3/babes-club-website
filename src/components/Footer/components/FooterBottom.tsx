// src/components/Footer/components/FooterBottom.tsx

import React from "react";
import { FooterBottomProps } from "../types";
import Credentials from "./Credentials";

const FooterBottom: React.FC<FooterBottomProps> = ({
  businessName,
  established,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="pt-6 mt-6 border-t sm:mt-8 border-warm-ivory-200/20">
      <div className="flex flex-col items-center justify-between space-y-4 text-center md:flex-row md:space-y-0 md:text-left">
        {/* Copyright - Mobile optimized */}
        <div className="text-base sm:text-sm text-warm-ivory-300">
          <p>
            © {currentYear} {businessName}. All rights reserved.
          </p>
          <p className="mt-1">Serving authentic cuisine since {established}.</p>
        </div>
        {/* Credentials on the right (desktop) or below (mobile) */}
        <div className="mt-2 md:mt-0">
          <Credentials />
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
