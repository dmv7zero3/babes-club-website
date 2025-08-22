import React from "react";
import ScrollIndicator from "./ScrollIndicator";

const CafeOperaHeroBanner = () => {
  return (
    <div className="relative flex items-center justify-center h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage: `url('/images/banner/cafe-opera-banner.jpg')`,
        }}
      >
        {/* Dark Overlay */}
      </div>
      {/* Scroll Indicator */}
      <ScrollIndicator />
    </div>
  );
};

export default CafeOperaHeroBanner;
