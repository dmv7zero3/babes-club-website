// src/components/Footer/components/FooterContact.tsx

import React from "react";
import { FooterContactProps } from "../types";

const FooterContact: React.FC<FooterContactProps> = ({
  address,
  phone,
  email,
  parking,
}) => {
  const formatPhoneForDisplay = (phoneNumber: string) => {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, "");
    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phoneNumber;
  };

  const formatPhoneForTel = (phoneNumber: string) => {
    // Remove all non-digits for tel: link
    return phoneNumber.replace(/\D/g, "");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h4 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg font-heading text-heritage-ivory">
        Visit Us
      </h4>

      {/* Address - Mobile optimized with better touch target */}
      <div className="space-y-3">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2 -m-2 group"
        >
          <div className="flex items-start space-x-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-heritage-gold flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div className="text-sm transition-colors sm:text-base text-warm-ivory-200 group-hover:text-heritage-gold">
              <p>{address.street}</p>
              <p>
                {address.city}, {address.state} {address.zipCode}
              </p>
            </div>
          </div>
        </a>

        {/* Phone - Mobile optimized with tap-to-call */}
        <a
          href={`tel:${formatPhoneForTel(phone)}`}
          className="flex items-center p-2 -m-2 space-x-3 group"
        >
          <svg
            className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-heritage-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span className="text-sm transition-colors sm:text-base text-warm-ivory-200 group-hover:text-heritage-gold">
            {formatPhoneForDisplay(phone)}
          </span>
        </a>

        {/* Email - Mobile optimized */}
        <a
          href={`mailto:${email}`}
          className="flex items-center p-2 -m-2 space-x-3 group"
        >
          <svg
            className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-heritage-gold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm break-all transition-colors sm:text-base text-warm-ivory-200 group-hover:text-heritage-gold">
            {email}
          </span>
        </a>

        {/* Parking Info - Mobile optimized */}
        {parking && (
          <div className="flex items-start pt-2 space-x-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-heritage-gold flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs sm:text-sm text-warm-ivory-300">
              <span className="font-medium">Parking:</span> {parking}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FooterContact;
