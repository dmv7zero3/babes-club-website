// src/components/Footer/components/FooterBottom.tsx

import React from "react";
import { FooterBottomProps } from "../types";

const FooterBottom: React.FC<FooterBottomProps> = ({
  businessName,
  established,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="pt-6 mt-8 border-t border-warm-ivory-200/20">
      <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
        {/* Copyright */}
        <div className="text-sm text-center text-warm-ivory-300 md:text-left">
          <p>
            © {currentYear} {businessName}. All rights reserved.
          </p>
          <p className="mt-1">Serving authentic cuisine since {established}.</p>
        </div>

        {/* Additional Links */}
        <div className="flex flex-col items-center space-y-2 text-sm md:flex-row md:space-y-0 md:space-x-6 text-warm-ivory-300">
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-heritage-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Wheelchair Accessible
          </span>
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-1 text-heritage-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            No Trans Fats
          </span>
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
