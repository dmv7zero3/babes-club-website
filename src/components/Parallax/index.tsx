// src/components/Parallax/index.tsx
import React, { useRef } from "react";

interface ParallaxSectionProps {
  /** Image path relative to public folder (e.g., "/images/banner/golden-chicken.jpg") */
  imagePath: string;
  /** Height of the section on desktop (default: "60vh") */
  height?: string;
  /** Darkness of overlay 0-1 (default: 0.4) */
  overlay?: number;
  /** Content to display over the image */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio for mobile (width/height, e.g. 16/9 = 1.78) */
  mobileAspectRatio?: number;
}

/**
 * Mobile-Optimized Parallax Component
 * Shows full image without cropping on mobile, maintains parallax on desktop
 *
 * Usage:
 * <ParallaxSection
 *   imagePath="/images/banner/golden-chicken.jpg"
 *   height="60vh"
 *   mobileAspectRatio={16/9}
 * >
 *   <h1>Your Content</h1>
 * </ParallaxSection>
 */

// ParallaxSection: Parallax effect (desktop), static on mobile
const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  imagePath,
  height = "60vh",
  overlay = 0.0,
  children,
  className = "",
}) => {
  // Generate a unique class for each instance
  const uniqueClass = useRef(
    `parallax-section-${Math.random().toString(36).substr(2, 9)}`
  ).current;
  return (
    <div
      className={`parallax-section edge-to-edge ${uniqueClass} ${className}`}
    >
      {children}
      <style>{`
        html, body { overflow-x: hidden; }

        .${uniqueClass} {
          position: relative;
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          margin-right: calc(-50vw + 50%);
          padding: 0;
          box-sizing: border-box;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          background-image: linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${imagePath});
          background-size: cover;
          background-attachment: scroll;
          min-height: 400px;
        }

        @media (min-width: 1024px) {
          .${uniqueClass} {
            height: ${height};
            background-attachment: fixed;
          }
        }

        .${uniqueClass} > * {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default ParallaxSection;
