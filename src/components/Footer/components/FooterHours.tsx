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
      <h4 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl font-heading text-heritage-ivory">
        Hours
      </h4>

      {/* Hours List - Mobile optimized with better spacing */}
      <div className="space-y-2">
        {Object.entries(hours).map(([day, time]) => {
          const isToday = day.toLowerCase() === currentDay;
          return (
            <div
              key={day}
              className={`flex justify-between items-center py-1 px-2 -mx-2 rounded ${
                isToday ? "bg-heritage-gold/10" : ""
              }`}
            >
              <span
                className={`text-base sm:text-sm capitalize ${
                  isToday
                    ? "font-semibold text-heritage-gold"
                    : "text-warm-ivory-200"
                }`}
              >
                {day}
                {isToday && (
                  <span className="ml-1 text-base text-heritage-gold">
                    (Today)
                  </span>
                )}
              </span>
              <span
                className={`text-base sm:text-sm ${
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
          <p className="text-base sm:text-sm text-heritage-gold">
            <svg
              className="inline-block w-3 h-3 sm:w-4 sm:h-4 mr-1 -mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {diningNotice}
          </p>
        </div>
      )}
    </div>
  );
};

export default FooterHours;
