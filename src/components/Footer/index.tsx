// src/components/Footer/index.tsx

import React from "react";
import FooterBrand from "./components/FooterBrand";
import FooterContact from "./components/FooterContact";
import FooterHours from "./components/FooterHours";
import FooterNavigation from "./components/FooterNavigation";
import FooterSocial from "./components/FooterSocial";
import FooterBottom from "./components/FooterBottom";
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
        {/* Main Footer Content */}
        <div className="py-16 layout-container">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <FooterBrand
                businessName={business.business_name}
                tagline={business.tagline}
                description="Experience authentic Chinese & Pan-Asian cuisine with fresh ingredients and meticulous cooking."
                logo={business.logo}
                established={business.established}
              />
            </div>

            {/* Contact Column */}
            <div className="lg:col-span-1">
              <FooterContact
                address={business.address}
                phone={business.contact.phone}
                email={business.contact.email}
                parking={business.location_details.parking}
              />
            </div>

            {/* Hours Column */}
            <div className="lg:col-span-1">
              <FooterHours
                hours={business.hours}
                diningNotice={business.dine_in_notice}
              />
            </div>

            {/* Navigation & Social Column */}
            <div className="space-y-8 lg:col-span-1">
              <FooterNavigation links={footerNavigationLinks} />
              <FooterSocial
                socialLinks={socialMediaLinks}
                onlineOrderingUrl={business.online_ordering}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="layout-container">
          <FooterBottom
            businessName={business.business_name}
            established={business.established}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
