// src/pages/Homepage/components/FoodShowcase/components/SectionHeader.tsx

import React from "react";
import { SectionHeaderProps } from "../types";

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-16 text-center">
      <h2 className="mb-4 text-4xl font-kristi md:text-5xl lg:text-6xl text-heritage-gold">
        {title}
      </h2>
      <h3 className="text-2xl font-semibold tracking-wide uppercase font-heading md:text-3xl lg:text-4xl text-heritage-blue">
        {subtitle}
      </h3>
    </div>
  );
};

export default SectionHeader;
