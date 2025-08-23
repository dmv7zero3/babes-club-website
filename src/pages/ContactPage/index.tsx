import React from "react";
import InnerPageHero from "../../components/Hero/InnerPageHero";
import BusinessHours from "./components/BusinessHours";
import GoogleMaps from "./components/GoogleMaps";
import {
  BUSINESS_NAME,
  BUSINESS_ADDRESS,
  BUSINESS_CITY,
  BUSINESS_STATE,
  BUSINESS_ZIP,
  EMAIL,
  SOCIAL_MEDIA,
  getFormattedAddress,
} from "../../businessInfo/business";

const CONTACT_HERO_IMAGE = "/images/banner/cafe-opera-banner.jpg";

const ContactPage: React.FC = () => {
  return (
    <div>
      <InnerPageHero backgroundImage={CONTACT_HERO_IMAGE} text="Contact Us" />
      <div className="max-w-3xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-2">
        {/* Contact Info */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">{BUSINESS_NAME}</h2>
          <div className="mb-2">
            <span className="block font-medium">Address:</span>
            <span>{getFormattedAddress()}</span>
          </div>
          <div className="mb-2">
            <span className="block font-medium">Email:</span>
            <a href={`mailto:${EMAIL}`} className="text-blue-600 underline">
              {EMAIL}
            </a>
          </div>
          <div className="mb-2">
            <span className="block font-medium">Phone:</span>
            <a href="tel:+17038581441" className="text-blue-600 underline">
              (703) 858-1441
            </a>
          </div>
          <div className="mb-2">
            <span className="block font-medium">Follow us:</span>
            <div className="flex gap-3 mt-1">
              <a
                href={SOCIAL_MEDIA.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="text-blue-700"
                >
                  <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5 3.657 9.127 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.127 22 17 22 12" />
                </svg>
              </a>
              <a
                href={SOCIAL_MEDIA.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <svg
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="text-pink-600"
                >
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 2.25a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5zm0 1.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5zm6.125 1.125a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0z" />
                </svg>
              </a>
            </div>
          </div>
          <BusinessHours />
        </div>
        {/* Google Map */}
        <div>
          <GoogleMaps />
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
