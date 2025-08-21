// src/core/Components/Header/DesktopHeader/index.tsx
import React from "react";
import { Link } from "react-router-dom";

const DesktopHeader: React.FC = () => {
  return (
    <header className="z-40 hidden w-full bg-black lg:block">
      <div className="relative flex items-center justify-between w-full px-8 py-6 mx-auto max-w-7xl">
        {/* Logo/Brand Name */}
        <div className="flex items-center">
          <Link to="/" className="block">
            <h1 className="text-4xl tracking-widest font-bebas text-electric-blue text-shadow-glow-blue">
              MOON LOUNGE
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-10">
          <Link
            to="/"
            className="relative px-3 py-2 text-xl font-bebas text-moon-silver hover:text-electric-blue transition-all duration-300 tracking-wider after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-electric-blue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
          >
            HOME
          </Link>
          <Link
            to="/menu"
            className="relative px-3 py-2 text-xl font-bebas text-moon-silver hover:text-electric-blue transition-all duration-300 tracking-wider after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-electric-blue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
          >
            MENU
          </Link>
          <Link
            to="/catering"
            className="relative px-3 py-2 text-xl font-bebas text-moon-silver hover:text-electric-blue transition-all duration-300 tracking-wider after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-electric-blue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
          >
            CATERING
          </Link>
          <Link
            to="/events"
            className="relative px-3 py-2 text-xl font-bebas text-moon-silver hover:text-electric-blue transition-all duration-300 tracking-wider after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-electric-blue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
          >
            EVENTS
          </Link>
          <Link
            to="/contact"
            className="relative px-3 py-2 text-xl font-bebas text-moon-silver hover:text-electric-blue transition-all duration-300 tracking-wider after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-electric-blue after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left"
          >
            CONTACT
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Reserve Table Button */}
          {/* <a
            href={RESERVE_TABLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 text-lg tracking-wider text-black transition-all duration-300 rounded-full font-bebas bg-electric-blue hover:bg-electric-blue-600 shadow-neon-blue hover:scale-105"
          >
            RESERVE TABLE
          </a> */}

          {/* Order Now Button */}
          {/* <Link
            to="/menu"
            className="px-6 py-2 text-lg tracking-wider text-white transition-all duration-300 border-2 rounded-full font-bebas bg-moon-purple hover:bg-moon-purple border-moon-purple shadow-neon-purple hover:scale-105"
          >
            Call
          </Link> */}
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;
