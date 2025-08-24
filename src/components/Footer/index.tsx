// src/components/Footer/index.tsx

import React from "react";
import FooterBrand from "./components/FooterBrand";
import FooterContact from "./components/FooterContact";
import FooterHours from "./components/FooterHours";
import FooterNavigation from "./components/FooterNavigation";
import FooterSocial from "./components/FooterSocial";
import FooterBottom from "./components/FooterBottom";
import { footerNavigationLinks, socialMediaLinks } from "./data/footerData";

// Import the CSS file for font size management
import "./styles/footer.styles.css";

// Import business data
import businessData from "../../businessInfo/business-data.json";

const Footer: React.FC = () => {
  const business = businessData["cafe-opera"];

  return (
    <footer className="relative overflow-hidden bg-heritage-blue text-warm-ivory-200">
      {/* Background Pattern */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-heritage-blue to-opera-blue-900 opacity-90" /> */}

      <div className="relative z-10 w-10/12 mx-auto">
        {/* Main Footer Content */}
        <div className="py-22 lg:py-16">
          <div className="mx-auto max-w-7xl">
            {/* Single Column Layout up to 1024px (lg breakpoint) */}
            {/* Only becomes multi-column at lg (1024px) and above */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 xl:grid-cols-4 lg:gap-12">
              {/* Brand Column */}
              <div className="items-center col-span-1 text-center lg:text-left lg:items-start">
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
              <div className="col-span-1 space-y-8">
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
        <div className="px-4 pb-14 lg:pb-8">
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
