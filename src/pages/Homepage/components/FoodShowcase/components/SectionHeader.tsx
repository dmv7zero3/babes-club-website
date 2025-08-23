// src/pages/Homepage/components/FoodShowcase/components/SectionHeader.tsx

import React from "react";
import { SectionHeaderProps } from "../types";

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-16 text-center">
      <h1 className="mb-4 text-4xl font-normal font-kristi md:text-5xl text-champagne-gold-900">
        {title}
      </h1>
      <h1 className="text-5xl font-normal tracking-wide uppercase font-heading md:text-5xl lg:text-5xl text-heritage-blue">
        {subtitle}
      </h1>
    </div>
  );
};

export default SectionHeader;
