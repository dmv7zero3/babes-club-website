// src/components/Footer/index.tsx

import React from "react";
import FooterBrand from "./components/FooterBrand";
import FooterContact from "./components/FooterContact";
import FooterHours from "./components/FooterHours";
import FooterNavigation from "./components/FooterNavigation";
import FooterSocial from "./components/FooterSocial";
import FooterBottom from "./components/FooterBottom";
import Credentials from "./components/Credentials";
import { footerNavigationLinks, socialMediaLinks } from "./data/footerData";

// Import business data
import businessData from "../../businessInfo/business-data.json";

const Footer: React.FC = () => {
  const business = businessData["cafe-opera"];

  return (
    <footer className="relative overflow-hidden bg-heritage-blue text-warm-ivory-200">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-heritage-blue to-opera-blue-900 opacity-90" />

      <div className="relative z-10">
        {/* Main Footer Content - Optimized for mobile */}
        <div className="px-4 py-12 md:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Mobile-First Grid Layout */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-12">
              {/* Brand Column - Full width on mobile */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <FooterBrand
                  businessName={business.business_name}
                  tagline={business.tagline}
                  description="Experience authentic Chinese & Pan-Asian cuisine with fresh ingredients and meticulous cooking."
                  logo={business.logo}
                  established={business.established}
                />
              </div>

              {/* Contact Column */}
              <div className="col-span-1">
                <FooterContact
                  address={business.address}
                  phone={business.contact.phone}
                  email={business.contact.email}
                  parking={business.location_details.parking}
                />
              </div>

              {/* Hours Column */}
              <div className="col-span-1">
                <FooterHours
                  hours={business.hours}
                  diningNotice={business.dine_in_notice}
                />
              </div>

              {/* Navigation & Social Column */}
              <div className="col-span-1 space-y-8 sm:col-span-2 lg:col-span-1">
                <FooterNavigation links={footerNavigationLinks} />
                <FooterSocial
                  socialLinks={socialMediaLinks}
                  onlineOrderingUrl={business.online_ordering}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="px-4 pb-6 md:px-6 md:pb-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <FooterBottom
              businessName={business.business_name}
              established={business.established}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
