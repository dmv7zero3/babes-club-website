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
    <div className="pt-10 mt-8 border-t border-warm-ivory-200/20">
      <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:gap-0 lg:text-left">
        {/* Copyright - Mobile optimized */}
        <div>
          <p className="paragraph-md text-warm-ivory-300">
            © {currentYear} {businessName}. All rights reserved.
          </p>
          {/* <p className="hidden mt-1 lg:block">
            Serving authentic cuisine since {established}.
          </p> */}
        </div>
        {/* Credentials on the right (desktop) or below (mobile) */}
        <div className=" md:mt-0">
          <Credentials />
        </div>
      </div>
    </div>
  );
};

export default FooterBottom;
