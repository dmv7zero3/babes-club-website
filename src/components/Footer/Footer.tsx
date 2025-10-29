import React from "react";
import { Link } from "react-router-dom";
import "./Footer.styles.css";
import businessData from "@/businessInfo/business-data.json";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const year = new Date().getFullYear();
  const quickLinks = [{ label: "Home", to: "/" }];

  const policyLinks = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms of Service", to: "/terms-of-service" },
  ];

  return (
    <div>
      <footer
        role="contentinfo"
        className={`footer w-full mx-auto bg-neutral-900 pt-12 text-neutral-100 ${className}`}
      >
        <div className="w-11/12 pb-8 mx-auto">
          <div className="grid items-start gap-10 md:grid-cols-2 xl:grid-cols-3">
            {/* Brand */}
            <div>
              <p className="inline-flex flex-col gap-2">
                <span
                  className="font-heading text-gradient-primary"
                  style={{ fontSize: "clamp(1.95rem,3vw,2.65rem)" }}
                  data-ft-heading
                >
                  {businessData.business_name}
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                  Compassion • Education • Sustainable Growth
                </span>
              </p>
              {businessData.tagline && (
                <p className="max-w-sm mt-3 text-neutral-300" data-ft-subtle>
                  {businessData.tagline}
                </p>
              )}
            </div>

            {/* Quick links */}
            <nav aria-label="Quick links" className="text-neutral-300">
              <p
                className="tracking-wide uppercase text-white/60"
                data-ft-label
              >
                Quick links
              </p>
              <ul className="mt-3 space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="transition-colors text-neutral-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Policies */}
            <nav aria-label="Policy links" className="text-neutral-300">
              <p
                className="tracking-wide uppercase text-white/60"
                data-ft-label
              >
                Policies
              </p>
              <ul className="mt-3 space-y-2">
                {policyLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="transition-colors text-neutral-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Bottom bar */}
          <div
            className="flex flex-col gap-3 pt-6 mt-6 border-t border-white/10 text-neutral-400 md:flex-row md:items-center md:justify-between"
            data-ft-meta
          >
            <p>
              © {year} {businessData.business_name}. All rights reserved.
            </p>

            <p>
              Powered by{" "}
              <a
                href="https://www.marketbrewer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-highlight-500 underline-offset-4 hover:text-highlight-500/80 hover:underline"
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
