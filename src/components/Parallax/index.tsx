// src/components/Parallax/index.tsx
import React from "react";

interface ParallaxSectionProps {
  /** Image path relative to public folder (e.g., "/images/banner/golden-chicken.jpg") */
  imagePath: string;
  /** Height of the section (default: "60vh") */
  height?: string;
  /** Darkness of overlay 0-1 (default: 0.4) */
  overlay?: number;
  /** Content to display over the image */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pure CSS Parallax Component
 * Simple, performant, no dependencies required
 *
 * Usage:
 * <ParallaxSection imagePath="/images/banner/golden-chicken.jpg" height="80vh">
 *   <h1>Your Content</h1>
 * </ParallaxSection>
 */
const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  imagePath,
  height = "30vh",
  overlay = 0.0,
  children,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{
        height,
        backgroundImage: `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${imagePath})`,
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxSection;
