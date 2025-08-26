// src/pages/ContactPage/index.tsx

import React from "react";
import { Phone, Clock } from "lucide-react";
import InnerPageHero from "../../components/Hero/InnerPageHero";
import BusinessHours from "./components/BusinessHours";
import GoogleMaps from "./components/GoogleMaps";
import ContactCards from "./components/ContactCards";
import SocialMediaSection from "./components/SocialMediaSection";
import FinalCTA from "./components/FinalCTA";

const ContactPage: React.FC = () => {
  const CONTACT_HERO_IMAGE = "/images/banner/appetizer-layout.jpg";

  return (
    <>
      {/* Hero Section */}
      <InnerPageHero backgroundImage={CONTACT_HERO_IMAGE} text="Contact Us" />

      {/* Main Contact Content */}
      <section className="relative overflow-hidden bg-warm-ivory-100">
        <div className="w-11/12 py-16 mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-5xl font-normal font-kristi md:text-5xl text-champagne-gold-900">
              Get in
            </h2>
            <h1 className="mb-10 text-5xl font-normal tracking-wide text-center uppercase font-heading text-heritage-blue">
              TOUCH
            </h1>
            <p className="max-w-2xl mx-auto paragraph text-rich-mahogany-700">
              Visit us for authentic Hong Kong cuisine or get in touch for
              reservations, catering, and special events. We're here to serve
              you!
            </p>
          </div>

          {/* Contact Cards Grid */}
          <ContactCards />

          {/* Business Hours & Map Section */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Business Hours */}
            <div>
              <BusinessHours />
            </div>

            {/* Google Maps */}
            <div>
              <GoogleMaps />
            </div>
          </div>

          {/* Social Media & Additional Info */}
          <div className="mt-16">
            <SocialMediaSection />
          </div>

          {/* Final CTA */}
          <FinalCTA />
        </div>
      </section>
    </>
  );
};

export default ContactPage;
