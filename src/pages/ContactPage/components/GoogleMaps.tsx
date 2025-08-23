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
        <h3 className="text-2xl font-semibold font-heading text-heritage-blue">
          Find Us
        </h3>
        <p className="mt-2 text-rich-mahogany-600">
          Located in the heart of Sterling, VA
        </p>
      </div>

      {/* Address Info */}
      <div className="p-6 border rounded-xl bg-warm-ivory-100 border-warm-ivory-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <MapPin className="w-6 h-6 mt-1 text-heritage-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-semibold text-heritage-blue">
              {BUSINESS_NAME}
            </h4>
            <p className="mt-1 text-rich-mahogany-700">
              {getFormattedAddress()}
            </p>
            <p className="mt-2 text-sm text-rich-mahogany-600">
              Community Plaza Shopping Center
            </p>
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

        {/* Map Overlay with Actions */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-3">
            <button
              onClick={handleDirectionsClick}
              className="flex items-center justify-center flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-lg shadow-lg bg-heritage-blue text-heritage-ivory backdrop-blur-sm hover:bg-opera-blue-800 hover:shadow-opera-lg"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/${encodedAddress}`,
                  "_blank"
                )
              }
              className="flex items-center justify-center px-4 py-3 text-sm font-semibold transition-all duration-200 rounded-lg shadow-lg bg-heritage-gold text-heritage-blue backdrop-blur-sm hover:bg-champagne-gold-500 hover:shadow-gold"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Additional Location Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="p-4 text-center rounded-lg bg-warm-ivory-50">
          <div className="w-8 h-8 mx-auto mb-2 text-jade-green">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <h4 className="font-medium text-heritage-blue">Free Parking</h4>
          <p className="text-sm text-rich-mahogany-600">
            Ample parking available
          </p>
        </div>
        <div className="p-4 text-center rounded-lg bg-warm-ivory-50">
          <div className="w-8 h-8 mx-auto mb-2 text-jade-green">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <h4 className="font-medium text-heritage-blue">Easy Access</h4>
          <p className="text-sm text-rich-mahogany-600">
            Ground level location
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleMaps;
