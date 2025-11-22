import React from "react";
import { Link } from "react-router-dom";
import "./Footer.styles.css";
import businessData from "@/businessInfo/business-data.json";
import HorizontalBanner from "@/components/HorizontalBanner";

import SubscriberForm from "@/components/SubscriberForm";
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcDiscover,
  FaInstagram,
} from "react-icons/fa";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const year = new Date().getFullYear();
  const quickLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Shop", to: "/shop" },
    { label: "Gallery", to: "/gallery" },

    // { label: "Earrings", to: "/products/earrings" },
    // { label: "Necklaces", to: "/products/necklaces" },
    { label: "Contact", to: "/contact" },
  ];

  const policyLinks = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms of Service", to: "/terms-of-service" },
    { label: "Shipping Policy", to: "/shipping-policy" },
    { label: "Return Policy", to: "/return-policy" },
  ];

  return (
    <div>
      <div className="w-11/12 pt-16 mx-auto ">
        <SubscriberForm
          headline="Join the club list"
          description="Sign up for Babes Club drops, limited restocks, and in-person events before anyone else."
          className="bg-white/10"
        />
      </div>
      <HorizontalBanner
        className="pt-[4.5rem] pb-[5.25rem]"
        color="#111"
        height={28}
        speed={1}
      />

      <footer
        role="contentinfo"
        className={`footer  w-full mx-auto   ${className}`}
      >
        <div className="w-11/12 pb-8 mx-auto">
          <div className="grid items-start gap-10 md:grid-cols-2 xl:grid-cols-4">
            {/* Brand */}
            <div>
              <p
                className="group footer-logo relative inline-flex items-center gap-3 rounded-full shadow-[0_8px_24px_rgba(254,59,161,0.25)]"
                style={
                  {
                    "--glow-color": "rgba(255, 224, 249, 0.92)",
                  } as React.CSSProperties
                }
              >
                <span
                  className="relative z-[1] font-grand-hotel text-cotton-candy-200 text-glow-soft drop-shadow-[0_0_16px_rgba(255,255,255,0.55)]"
                  style={{ fontSize: "clamp(1.95rem,3vw,2.65rem)" }}
                >
                  {businessData.business_name}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-[1] rounded-full bg-white/15 opacity-30 blur-xl transition-opacity duration-500 group-hover:opacity-60"
                />
              </p>
              {businessData.tagline && (
                <p className="mt-1 text-white/80" data-ft-subtle>
                  {businessData.tagline}
                </p>
              )}
              {/* Social */}
              <div className="flex items-center gap-2 mt-3 text-white/80">
                <span
                  className="tracking-wide uppercase text-white/70"
                  data-ft-label
                >
                  Follow us
                </span>
                <a
                  href="https://www.instagram.com/thebabesclub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="The Babes Club on Instagram"
                  className="transition-colors hover:text-white"
                >
                  <FaInstagram size={22} />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <nav aria-label="Quick links" className="text-white/80">
              <p
                className="tracking-wide uppercase text-white/70"
                data-ft-label
              >
                Quick links
              </p>
              <ul className="mt-3 space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="transition-colors text-white/80 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Policies */}
            <nav aria-label="Policy links" className="text-white/80">
              <p
                className="tracking-wide uppercase text-white/70"
                data-ft-label
              >
                Policies
              </p>
              <ul className="mt-3 space-y-2">
                {policyLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="transition-colors text-white/80 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Payments */}
            <div className="flex flex-col gap-4 text-white/80">
              <span
                className="tracking-wide uppercase text-white/70"
                data-ft-label
              >
                We accept
              </span>
              <div className="flex items-center gap-3">
                <FaCcVisa size={28} aria-label="Visa accepted" />
                <FaCcMastercard size={28} aria-label="Mastercard accepted" />
                <FaCcAmex size={28} aria-label="American Express accepted" />
                <FaCcDiscover size={28} aria-label="Discover accepted" />
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col gap-3 pt-6 mt-6 border-t border-white/10 md:flex-row md:items-center md:justify-between"
            data-ft-meta
          >
            <p className="text-white/70">
              © {year} {businessData.business_name}. All rights reserved.
            </p>

            <p className="text-white/70">
              Powered by{" "}
              <a
                href="https://www.marketbrewer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-rose-200 hover:text-rose-100 underline-offset-4 hover:underline"
              >
                MarketBrewer
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
