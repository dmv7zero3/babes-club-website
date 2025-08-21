// src/core/Components/Header/MobileHeader/MobileMenuOverlay/components/MenuContactInfo.tsx

import React from "react";
import { MapPin, Clock } from "lucide-react";

/**
 * Contact information component for the mobile menu overlay
 * Displays location, hours, and brief description
 */
const MenuContactInfo: React.FC = () => {
  return (
    <div className="pb-6">
      <div className="p-4 border border-white/10 bg-white/5 rounded-xl backdrop-blur-sm">
        <div className="flex items-center justify-center gap-6 mb-2 text-sm sm:text-base md:text-lg text-moon-silver">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-moon-gold" />
            <span>Sterling, VA</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-moon-gold" />
            <span>Open until 2 AM</span>
          </div>
        </div>
        <p className="m-0 text-xs font-light text-center sm:text-sm md:text-base text-moon-silver font-poppins">
          Premium hookah • Craft cocktails • Mediterranean cuisine
        </p>
      </div>
    </div>
  );
};

export default MenuContactInfo;
