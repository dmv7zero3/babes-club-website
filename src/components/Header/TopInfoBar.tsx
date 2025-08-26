// src/components/Header/TopInfoBar.tsx
import React from "react";
import { Phone, Clock, MapPin } from "lucide-react";
import {
  getFormattedAddress,
  BUSINESS_HOURS,
} from "../../businessInfo/business";

const TopInfoBar: React.FC = () => {
  // Format business hours for display
  const formatHours = () => {
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const todayHours = BUSINESS_HOURS[today as keyof typeof BUSINESS_HOURS];
    return todayHours || "11:00 AM - 9:00 PM";
  };

  return (
    <div className="bg-opera-blue-900">
      <div className="flex items-center justify-between w-11/12 py-2 mx-auto max-w-7xl">
        {/* Left: Contact Info */}
        <div className="flex items-center gap-6 text-sm text-warm-ivory-200">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="font-medium">(703) 858-1441</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Today: {formatHours()}</span>
          </div>
        </div>

        {/* Right: Location */}
        <div className="flex items-center gap-2 text-sm text-warm-ivory-200">
          <MapPin className="w-4 h-4" />
          <span>{getFormattedAddress()}</span>
        </div>
      </div>
    </div>
  );
};

export default TopInfoBar;
