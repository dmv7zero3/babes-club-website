import React from "react";
import { Link } from "react-router-dom";
import { ONLINE_ORDERING_URL } from "@/businessInfo/business";

const RestaurantSection: React.FC = () => {
  return (
    <section className="relative flex items-center overflow-hidden bg-warm-ivory">
      <div className="container">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content Container */}
          <div className="space-y-6 lg:pr-8">
            {/* Section Header */}
            <div className="flex flex-col items-start lg:items-start">
              <h2 className="mb-0.5 text-6xl font-normal  font-kristi lg:text-5xl text-champagne-gold-900">
                Our
              </h2>
              <h3 className="heading-2 text-opera-blue-900">Restaurant</h3>
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <p className="text-left text-opera-blue-900 heading-2-sub">
                Checkout our restaurant and special dishes
              </p>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <p className="paragraph">
                Cafe Opera is serving real Hong Kong flavor to community in an
                ambient environment. Order online or come visit us and enjoy a
                dine in experience.
              </p>

              {/* Phone Number */}
              <div className="pt-4">
                <a
                  href="tel:7038581441"
                  className="inline-flex items-center font-semibold heading-2-sub"
                  style={{ color: "#1e335c" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#bfa14a")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#1e335c")}
                >
                  703.858.1441
                </a>
              </div>
            </div>

            {/* Call-to-Action Buttons */}
            <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:gap-6">
              <a
                href={ONLINE_ORDERING_URL}
                className="btn-md bg-opera-blue text-warm-ivory-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                Order Online
              </a>
              <Link
                to="/menu"
                className="border border-opera-blue text-opera-blue btn-md"
              >
                View Full Menu
              </Link>
            </div>
            {/* Additional Info */}
            <div className="pt-4">
              <p className="paragraph-md text-champagne-gold-950">
                Experience authentic Hong Kong cuisine in the heart of
                Broadlands, Va.
              </p>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative order-first lg:order-last">
            <div className="relative overflow-hidden rounded-xl shadow-opera-lg">
              <img
                src="/images/banner/food-layout.jpg"
                alt="Elegant display of Cafe Opera's signature dishes including honey walnut shrimp, General Tso's chicken, and traditional Hong Kong specialties"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              {/* Subtle overlay for better visual depth */}
              <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-l from-opera-blue-900/10 to-transparent hover:opacity-100" />

              {/* Decorative Element */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center justify-center w-16 h-16 border rounded-full bg-champagne-gold-400/20 backdrop-blur-sm border-champagne-gold-400/30">
                  <div className="w-8 h-8 rounded-full bg-champagne-gold-400/40"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RestaurantSection;
