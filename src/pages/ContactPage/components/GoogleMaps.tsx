// src/pages/ContactPage/components/GoogleMaps.tsx

import React from "react";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import {
  getFormattedAddress,
  GOOGLE_MAPS_URL,
  BUSINESS_NAME,
} from "../../../businessInfo/business";
import { GOOGLE_MAPS_API_KEY } from "../../../env/env";

const GoogleMaps: React.FC = () => {
  // Cafe Opera address for Google Maps embed
  const address = "46950 Community Plaza, Sterling, VA 20164";
  const encodedAddress = encodeURIComponent(address);
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}&zoom=15`;

  const handleDirectionsClick = () => {
    if (GOOGLE_MAPS_URL) {
      window.open(GOOGLE_MAPS_URL, "_blank", "noopener,noreferrer");
    } else {
      // Fallback to Google Maps search
      const directionsUrl = `https://www.google.com/maps/search/${encodedAddress}`;
      window.open(directionsUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-jade-green/10">
          <MapPin className="w-8 h-8 text-jade-green" />
        </div>
        <h3 className="heading-2-sub text-opera-blue-900">Find Us</h3>
        <p className="mt-2 paragraph text-rich-mahogany-600">
          Located in the heart of Sterling, VA
        </p>
      </div>

      {/* Address Info */}
      <div className="p-6 border rounded-xl bg-warm-ivory-100 border-warm-ivory-200">
        <div className="flex items-center space-x-4 lg:items-start">
          <div className="flex-shrink-0">
            <MapPin className="mt-1 w-9 h-9 lg:w-6 lg:h-6 text-opera-blue-900" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold paragraph-md text-opera-blue-900">
              {BUSINESS_NAME}
            </h1>
            <p className="mt-1 paragraph-md text-rich-mahogany-700">
              {getFormattedAddress()}
            </p>
            {/* <p className="mt-2 paragraph text-jade-green-600">
              Community Plaza Shopping Center
            </p> */}
          </div>
        </div>
      </div>

      {/* Google Maps Embed */}
      <div className="relative overflow-hidden rounded-xl shadow-opera">
        <div className="aspect-[16/10] bg-warm-ivory-100">
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map showing location of ${BUSINESS_NAME}`}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleMaps;
