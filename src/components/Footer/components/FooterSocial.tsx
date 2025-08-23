// src/components/Footer/components/FooterSocial.tsx

import React from "react";
import { FooterSocialProps } from "../types";
import { Facebook, Instagram, MapPin } from "lucide-react";

const FooterSocial: React.FC<FooterSocialProps> = ({
  socialLinks,
  onlineOrderingUrl,
}) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "map-pin":
        return <MapPin className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold font-heading text-heritage-ivory">
        Connect With Us
      </h4>

      {/* Online Ordering CTA - Mobile optimized */}
      <div className="mb-6">
        <a
          href={onlineOrderingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full px-4 py-3 text-sm sm:text-base bg-heritage-gold text-heritage-blue font-heading font-semibold rounded-lg hover:bg-champagne-gold-500 transition-all duration-300 hover:shadow-gold hover:-translate-y-0.5"
        >
          Order Online
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Social Media Links - Mobile optimized spacing */}
      <div>
        <h5 className="mb-3 text-sm font-medium tracking-wide uppercase text-heritage-gold">
          Follow Us
        </h5>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg sm:w-11 sm:h-11 bg-warm-ivory-200/10 text-warm-ivory-200 hover:bg-heritage-gold hover:text-heritage-blue hover:scale-110 touch-manipulation"
              aria-label={`Follow us on ${social.platform}`}
            >
              {renderIcon(social.icon)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FooterSocial;
