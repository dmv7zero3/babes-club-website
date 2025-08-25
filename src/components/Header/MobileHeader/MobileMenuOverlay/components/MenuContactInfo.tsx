// src/components/Header/MobileHeader/MobileMenuOverlay/components/MenuContactInfo.tsx

import React from "react";
import { MapPin, Clock, Phone } from "lucide-react";
import {
  getFormattedAddress,
  BUSINESS_HOURS,
} from "../../../../../businessInfo/business";

const MenuContactInfo: React.FC = () => {
  // Format business hours for display
  const formatHours = () => {
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const todayHours = BUSINESS_HOURS[today as keyof typeof BUSINESS_HOURS];
    return todayHours || "11:00 AM - 9:00 PM";
  };

  return (
    <div className="flex justify-center w-full px-2 pb-8">
      <div className="flex flex-col items-center w-full max-w-lg px-4 py-8">
        <div className="flex flex-row items-center justify-center w-full gap-12 flex-nowrap">
          {/* Location */}
          <div className="flex flex-row items-center flex-shrink-0 gap-5">
            <MapPin className="w-12 h-12 text-opera-blue" />
            <p className="font-normal font-heading text-opera-blue whitespace-nowrap">
              Ashburn, VA
            </p>
          </div>
          {/* Phone */}
          <div className="flex flex-row items-center flex-shrink-0 gap-5">
            <a
              href="tel:(703) 858-1441"
              className="flex items-center justify-center rounded-full"
              aria-label="Call (703) 858-1441"
            >
              <Phone className="w-12 h-12 text-opera-blue" />
            </a>
            <p className=" text-opera-blue whitespace-nowrap">(703) 858-1441</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuContactInfo;
