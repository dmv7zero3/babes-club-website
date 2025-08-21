// src/core/Components/Header/MobileHeader/MobileMenuOverlay/components/MenuSocial.tsx

import React from "react";
import { Instagram, Facebook } from "lucide-react";
import { INSTAGRAM_URL, FACEBOOK_URL } from "@/businessInfo/business";

const MenuSocial: React.FC = () => {
  return (
    <div className="py-6">
      <div className="flex justify-center gap-8 mb-6">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 transition-all duration-200 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-electric-blue"
          aria-label="Follow us on Instagram"
        >
          <Instagram className="w-6 h-6 text-white" />
        </a>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 transition-all duration-200 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-electric-blue"
          aria-label="Follow us on Facebook"
        >
          <Facebook className="w-6 h-6 text-white" />
        </a>
      </div>
    </div>
  );
};

export default MenuSocial;
