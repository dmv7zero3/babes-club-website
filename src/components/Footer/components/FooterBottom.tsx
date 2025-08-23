// src/components/Footer/components/FooterBottom.tsx

import React from "react";
import { FooterBottomProps } from "../types";

const FooterBottom: React.FC<FooterBottomProps> = ({
  businessName,
  established,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="pt-6 mt-6 border-t sm:mt-8 border-warm-ivory-200/20">
      <div className="flex flex-col items-center justify-between space-y-4 text-center md:flex-row md:space-y-0 md:text-left">
        {/* Copyright - Mobile optimized */}
        <div className="text-xs sm:text-sm text-warm-ivory-300">
          <p>
            © {currentYear} {businessName}. All rights reserved.
          </p>
          <p className="mt-1">Serving authentic cuisine since {established}.</p>
        </div>

        {/* Additional Links - Mobile optimized with better touch targets */}
        <div className="flex flex-col items-center space-y-3 text-xs sm:text-sm sm:flex-row sm:space-y-0 sm:space-x-4 md:space-x-6 text-warm-ivory-300">
          <span className="flex items-center px-2 py-1">
            <svg
              className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4 text-heritage-gold"
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
            <span className="whitespace-nowrap">Wheelchair Accessible</span>
          </span>
          <span className="flex items-center px-2 py-1">
            <svg
              className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4 text-heritage-gold"
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
            <span className="whitespace-nowrap">No Trans Fats</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
