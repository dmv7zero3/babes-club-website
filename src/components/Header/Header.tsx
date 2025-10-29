import React from "react";
import { Link } from "react-router-dom";
import DesktopMenu from "@/components/Header/Header/DesktopMenu";
import MobileMenu from "@/components/Header/Header/MobileMenu";
import { BUSINESS_NAME } from "@/businessInfo/business";

const Header: React.FC = () => {
  return (
    // Sticky header with reserved height to avoid CLS; higher z-index to stay above content
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/92 text-neutral-900 shadow-sm supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 transition-[padding] duration-300 md:h-20 md:gap-6 md:px-6 lg:px-10">
        <Link to="/" className="flex flex-col min-w-0 leading-tight">
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-primary-500">
            {BUSINESS_NAME.toUpperCase()}
          </span>
          <span className="text-xl font-semibold text-neutral-900 sm:text-[1.6rem] md:text-[clamp(1.75rem,2vw,2rem)]">
            Community Life Fellowship
          </span>
        </Link>

        <div className="flex items-center gap-2 ml-auto sm:gap-3 md:gap-4">
          <div className="items-center hidden gap-4 md:flex">
            <DesktopMenu />
            <a
              href="#mission"
              className="inline-flex px-4 py-2 text-sm font-semibold transition border rounded-full border-primary-200 text-primary-700 hover:border-primary-300 hover:bg-primary-50/80 hover:text-primary-800"
            >
              Our Mission
            </a>
          </div>
          <a
            href="mailto:dahconsultants@gmail.com"
            className="inline-flex items-center whitespace-nowrap rounded-full bg-primary-700 px-2.5 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/70 focus-visible:ring-offset-1 sm:px-3 sm:text-xs md:px-4 md:py-2 md:text-sm md:tracking-[0.25em]"
          >
            Contact Us
          </a>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
