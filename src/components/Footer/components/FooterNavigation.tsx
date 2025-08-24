// src/components/Footer/components/FooterNavigation.tsx

import React from "react";
import { Link } from "react-router-dom";
import { FooterNavigationProps } from "../types";

const FooterNavigation: React.FC<FooterNavigationProps> = ({ links }) => {
  return (
    <div className="space-y-6">
      <h4 className="mb-8 lg:mb-4 footer-heading font-heading text-heritage-ivory">
        Quick Links
      </h4>

      <nav className="space-y-10 lg:space-y-3">
        {links.map((link) => {
          if (link.external) {
            return (
              <a
                key={link.label}
                href={link.path}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-medium transition-colors duration-300 footer-link text-warm-ivory-200 hover:text-heritage-gold"
              >
                {link.label}
                <svg
                  className="inline-block w-3 h-3 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            );
          }

          return (
            <Link
              key={link.label}
              to={link.path}
              className="block font-medium transition-colors duration-300 footer-link text-warm-ivory-200 hover:text-heritage-gold"
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default FooterNavigation;
