// src/pages/ContactPage/components/BusinessHours.tsx

import React from "react";
import { Clock } from "lucide-react";
import { BUSINESS_HOURS } from "../../../businessInfo/business";

const BusinessHours: React.FC = () => {
  const formatHours = (hours: string): string => {
    if (hours.toLowerCase() === "closed") return "Closed";
    return hours;
  };

  const getDayLabel = (day: string): string => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const days = Object.keys(BUSINESS_HOURS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-opera-blue/10">
          <Clock className="w-8 h-8 text-opera-blue" />
        </div>
        <h3 className="text-center heading-2-sub">Business Hours</h3>
        <p className="mt-2 paragraph text-rich-mahogany-600">
          We're here to serve you delicious Asian cuisine
        </p>
      </div>

      {/* Hours List */}
      <div className="space-y-3">
        {days.map((day) => {
          const hours = BUSINESS_HOURS[day as keyof typeof BUSINESS_HOURS];
          const isToday =
            new Date()
              .toLocaleDateString("en-US", { weekday: "long" })
              .toLowerCase() === day;

          return (
            <div
              key={day}
              className={`flex justify-between paragraph items-center py-3 px-4 rounded-lg transition-all duration-200 ${
                isToday
                  ? "bg-heritage-gold/20 border border-heritage-gold/30"
                  : "bg-warm-ivory-100 hover:bg-warm-ivory-200"
              }`}
            >
              <span
                className={`font-medium ${
                  isToday
                    ? "text-heritage-blue font-semibold"
                    : "text-rich-mahogany-700"
                }`}
              >
                {getDayLabel(day)}
                {isToday && (
                  <span className="px-2 py-1 ml-2 rounded-full paragraph bg-heritage-gold text-heritage-blue">
                    Today
                  </span>
                )}
              </span>
              <span
                className={`font-medium ${
                  hours.toLowerCase() === "closed"
                    ? "text-rich-mahogany-400"
                    : isToday
                      ? "text-heritage-blue font-semibold"
                      : "text-rich-mahogany-700"
                }`}
              >
                {formatHours(hours)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="py-12 text-center rounded-xl bg-gradient-to-br from-heritage-blue to-opera-blue-800 text-heritage-ivory">
        <h4 className="mb-6 text-center heading-2-sub text-warm-ivory-50">
          Ready to Order?
        </h4>
        <p className="mb-6 font-normal paragraph-md text-warm-ivory-50">
          Call ahead for faster pickup or dine in for the full experience
        </p>
        <a
          href="tel:7038581441"
          className="inline-flex items-center tracking-wide rounded-full bg-champagne-gold text-opera-blue-900 hover:bg-champagne-gold-500 btn-md"
        >
          <Clock className="w-6 h-6 mr-2" />
          Call: (703) 858-1441
        </a>
      </div>
    </div>
  );
};

export default BusinessHours;
