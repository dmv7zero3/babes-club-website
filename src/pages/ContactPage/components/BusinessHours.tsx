import React from "react";
import { BUSINESS_HOURS, DINE_IN_NOTICE } from "../../../businessInfo/business";
import type { DayOfWeek } from "../../../businessInfo/business";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const dayKeys: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const BusinessHours: React.FC = () => (
  <div className="mb-6">
    <h2 className="mb-2 text-xl font-semibold">Business Hours</h2>
    <ul className="mb-2">
      {dayKeys.map((key, idx) => (
        <li key={key} className="flex justify-between">
          <span>{days[idx]}</span>
          <span>{BUSINESS_HOURS[key]}</span>
        </li>
      ))}
    </ul>
    {DINE_IN_NOTICE && (
      <div className="mt-2 text-sm font-medium text-red-600">
        {DINE_IN_NOTICE}
      </div>
    )}
  </div>
);

export default BusinessHours;
