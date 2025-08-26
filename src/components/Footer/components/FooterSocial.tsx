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
        return <Facebook className="footer-social-icon" />;
      case "instagram":
        return <Instagram className="footer-social-icon" />;
      case "map-pin":
        return <MapPin className="footer-social-icon" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-col items-center space-y-6">
      <h4 className="mb-10 heading-3 text-warm-ivory-200">Connect With Us</h4>

      {/* Online Ordering CTA - Always horizontal row */}
      <div className="items-center mb-10 lg:mb-6">
        <a
          href={onlineOrderingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center font-semibold transition-all duration-300 rounded-lg btn-md bg-champagne-gold-400 text-opera-blue-900 font-heading hover:bg-champagne-gold-500 hover:shadow-gold"
        >
          <span>Order Online</span>
          <svg
            className="w-6 h-6 ml-2"
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
        <h5 className="mt-10 mb-12 lg:mb-3 lg:mt-0 heading-3 text-champagne-gold-400">
          Follow Us
        </h5>
        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-20 h-20 transition-all duration-300 rounded-lg lg:w-11 lg:h-11 bg-warm-ivory-200/10 text-warm-ivory-200 hover:bg-champagne-gold-400 hover:text-opera-blue-900 hover:scale-110 touch-manipulation"
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
