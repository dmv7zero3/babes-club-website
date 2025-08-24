// src/components/Footer/components/FooterHours.tsx

import React from "react";
import { FooterHoursProps } from "../types";

const FooterHours: React.FC<FooterHoursProps> = ({ hours, diningNotice }) => {
  const formatHours = (hoursString: string) => {
    if (hoursString.toLowerCase() === "closed") {
      return <span className="text-warm-ivory-400">Closed</span>;
    }
    return hoursString;
  };

  const getCurrentDayIndex = () => {
    return new Date().getDay();
  };

  const daysOrder = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const currentDayIndex = getCurrentDayIndex();
  const currentDay = daysOrder[currentDayIndex];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h4 className="mb-3 footer-heading font-heading text-heritage-ivory">
        Hours
      </h4>

      {/* Hours List - Mobile optimized with better spacing */}
      <div className="space-y-2">
        {Object.entries(hours).map(([day, time]) => {
          const isToday = day.toLowerCase() === currentDay;
          return (
            <div
              key={day}
              className={`footer-hours-row py-1 px-2 -mx-2 rounded ${
                isToday ? "bg-heritage-gold/10 is-today" : ""
              }`}
            >
              <span
                className={`capitalize footer-text ${
                  isToday ? "text-heritage-gold" : "text-warm-ivory-200"
                }`}
              >
                {day}
                {isToday && (
                  <span className="ml-1 text-heritage-gold footer-text">
                    (Today)
                  </span>
                )}
              </span>
              <span
                className={`footer-text ${
                  isToday
                    ? "font-medium text-heritage-gold"
                    : "text-warm-ivory-300"
                }`}
              >
                {formatHours(time)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dining Notice - Mobile optimized */}
      {diningNotice && (
        <div className="pt-3 mt-3 border-t border-warm-ivory-200/20">
          <p className="flex items-center footer-small text-heritage-gold">
            {/* Optionally replace with an icon from lucide-react if desired */}
            {diningNotice}
          </p>
        </div>
      )}
    </div>
  );
};

export default FooterHours;
