// src/components/Header/MobileHeader/MobileMenuOverlay/components/MenuSocial.tsx
import React from "react";
import { Instagram, Facebook, Phone } from "lucide-react";
import {
  INSTAGRAM_URL,
  FACEBOOK_URL,
} from "../../../../../businessInfo/business";
import "../styles/mobilemenu.styles.css";
const MenuSocial: React.FC = () => {
  return (
    <div className="flex justify-center pb-8">
      <div className="flex flex-row gap-8">
        {INSTAGRAM_URL && (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-overlay-social-btn"
            aria-label="Instagram"
          >
            <Instagram className="w-14 h-14 text-opera-blue" />
          </a>
        )}
        {FACEBOOK_URL && (
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-overlay-social-btn"
            aria-label="Facebook"
          >
            <Facebook className="w-14 h-14 text-opera-blue" />
          </a>
        )}
        <a
          href="tel:(703) 858-1441"
          className="menu-overlay-social-btn"
          aria-label="Call us"
        >
          <Phone className="w-14 h-14 text-opera-blue" />
        </a>
      </div>
    </div>
  );
};

export default MenuSocial;
