import React from "react";
import { GOOGLE_MAPS_API_KEY } from "../../../env/env";
import {
  BUSINESS_ADDRESS,
  BUSINESS_CITY,
  BUSINESS_STATE,
  BUSINESS_ZIP,
  GOOGLE_MAPS_URL,
} from "../../../businessInfo/business";

const GoogleMaps: React.FC = () => {
  // Fallback to Google Maps embed if API key is not set
  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY);
  const address = `${BUSINESS_ADDRESS}, ${BUSINESS_CITY}, ${BUSINESS_STATE} ${BUSINESS_ZIP}`;
  const embedUrl = hasApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(address)}`
    : GOOGLE_MAPS_URL;

  return (
    <div className="w-full h-64 md:h-80 rounded overflow-hidden shadow">
      {hasApiKey ? (
        <iframe
          title="Google Map"
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <a
          href={GOOGLE_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full bg-gray-100 flex items-center justify-center text-blue-600 underline"
        >
          View on Google Maps
        </a>
      )}
    </div>
  );
};

export default GoogleMaps;
