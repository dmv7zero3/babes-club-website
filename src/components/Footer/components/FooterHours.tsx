// src/components/Footer/components/FooterHours.tsx

import React from "react";
import { FooterHoursProps } from "../types";
import { formatHours } from "../data/footerData";

const FooterHours: React.FC<FooterHoursProps> = ({ hours, diningNotice }) => {
  const formattedHours = formatHours(hours);

  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold font-heading text-heritage-ivory">
        Hours of Operation
      </h4>

      {/* Hours List */}
      <div className="space-y-2">
        {formattedHours.map(({ day, hours: dayHours }) => (
          <div key={day} className="flex items-center justify-between">
            <span className="text-sm font-medium text-heritage-gold">
              {day}:
            </span>
            <span className="text-sm text-warm-ivory-200">{dayHours}</span>
          </div>
        ))}
      </div>

      {/* Dining Notice */}
      {diningNotice && (
        <div className="p-4 mt-6 border rounded-lg bg-heritage-gold/10 border-heritage-gold/20">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-4 h-4 text-heritage-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h5 className="mb-1 text-sm font-medium text-heritage-gold">
                Important Notice
              </h5>
              <p className="text-sm text-warm-ivory-200">{diningNotice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FooterHours;
