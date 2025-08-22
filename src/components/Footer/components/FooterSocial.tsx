// src/components/Footer/components/FooterSocial.tsx

import React from "react";
import { FooterSocialProps } from "../types";

const FooterSocial: React.FC<FooterSocialProps> = ({
  socialLinks,
  onlineOrderingUrl,
}) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "facebook":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case "instagram":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.477-3.34-1.388-.892-.91-1.388-2.062-1.388-3.359s.477-2.448 1.388-3.34c.892-.91 2.043-1.388 3.34-1.388s2.448.477 3.34 1.388c.91.892 1.388 2.043 1.388 3.34s-.477 2.448-1.388 3.359c-.892.91-2.043 1.388-3.34 1.388zm7.518-11.018c-.477 0-.892-.172-1.216-.496-.324-.343-.496-.739-.496-1.216s.172-.892.496-1.216c.324-.343.739-.496 1.216-.496s.892.172 1.216.496c.324.343.496.739.496 1.216s-.172.892-.496 1.216c-.343.324-.739.496-1.216.496z" />
            <circle cx="12.017" cy="12.017" r="3.708" />
          </svg>
        );
      case "map-pin":
        return (
          <svg
            className="w-5 h-5"
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h4 className="mb-4 text-lg font-semibold font-heading text-heritage-ivory">
        Connect With Us
      </h4>

      {/* Online Ordering CTA */}
      <div className="mb-6">
        <a
          href={onlineOrderingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full px-6 py-3 bg-heritage-gold text-heritage-blue font-heading font-semibold rounded-lg hover:bg-champagne-gold-500 transition-all duration-300 hover:shadow-gold hover:-translate-y-0.5"
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

      {/* Social Media Links */}
      <div>
        <h5 className="mb-3 text-sm font-medium tracking-wide uppercase text-heritage-gold">
          Follow Us
        </h5>
        <div className="flex space-x-4">
          {socialLinks.map((social) => (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-lg bg-warm-ivory-200/10 text-warm-ivory-200 hover:bg-heritage-gold hover:text-heritage-blue hover:scale-110"
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
