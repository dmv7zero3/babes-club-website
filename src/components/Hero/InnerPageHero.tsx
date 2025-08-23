// src/components/Hero/InnerPageHero.tsx

import React from "react";

interface InnerPageHeroProps {
  /** Background image URL */
  backgroundImage: string;
  /** Hero text to display */
  text: string;
  /** Optional custom height (defaults to 60vh) */
  height?: string;
  /** Optional overlay opacity (0-100, defaults to 40) */
  overlayOpacity?: number;
}

const InnerPageHero: React.FC<InnerPageHeroProps> = ({
  backgroundImage,
  text,
  height = "60vh",
  overlayOpacity = 40,
}) => {
  return (
    <div
      className="relative flex items-end justify-center overflow-hidden"
      style={{ height }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
        }}
      />

      {/* Dark Overlay for better text contrast */}
      <div
        className="absolute inset-0 bg-black"
        style={{
          opacity: overlayOpacity / 100,
        }}
      />

      {/* Hero Text - Centered at bottom */}
      <div className="relative z-10 pb-4 text-center">
        <h1 className="text-white font-lato font-light tracking-[0.2em] text-4xl md:text-5xl lg:text-6xl uppercase">
          {text}
        </h1>
      </div>
    </div>
  );
};

export default InnerPageHero;
