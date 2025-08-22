// src/components/Footer/components/FooterContact.tsx

import React from "react";
import { FooterContactProps } from "../types";

const FooterContact: React.FC<FooterContactProps> = ({
  address,
  phone,
  email,
  parking,
}) => {
  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold font-heading text-heritage-ivory">
        Contact Information
      </h4>

      {/* Address */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium tracking-wide uppercase text-heritage-gold">
          Location
        </h5>
        <address className="not-italic leading-relaxed text-warm-ivory-200">
          {address.street}
          <br />
          {address.city}, {address.state} {address.zipCode}
        </address>
        <p className="text-sm text-warm-ivory-300">{parking}</p>
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium tracking-wide uppercase text-heritage-gold">
          Phone
        </h5>
        <a
          href={`tel:${phone.replace(/[^\d]/g, "")}`}
          className="transition-colors duration-300 text-warm-ivory-200 hover:text-heritage-gold"
        >
          {phone}
        </a>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium tracking-wide uppercase text-heritage-gold">
          Email
        </h5>
        <a
          href={`mailto:${email}`}
          className="transition-colors duration-300 text-warm-ivory-200 hover:text-heritage-gold"
        >
          {email}
        </a>
      </div>
    </div>
  );
};

export default FooterContact;
