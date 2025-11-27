/**
 * ChronicLeafIcon - Animated Loading Icon for The Babes Club
 *
 * A branded SVG chronic leaf icon that animates through brand colors
 * using GSAP. Supports reduced motion preferences and is fully accessible.
 *
 * @example
 * // Basic usage
 * <ChronicLeafIcon />
 *
 * @example
 * // Customized
 * <ChronicLeafIcon
 *   size={48}
 *   label="Fetching products..."
 *   colors={["#fe3ba1", "#f5dcee", "#A7F3D0"]}
 *   showLabel={true}
 *   enableRotation={true}
 *   enableGlow={true}
 * />
 */

import React, { useRef, useEffect, useId } from "react";
import gsap from "gsap";

// ============================================================================
// Types
// ============================================================================

export type ChronicLeafIconProps = {
  /** Size of the icon in pixels */
  size?: number;
  /** Array of brand colors to animate through */
  colors?: string[];
  /** Loading label text */
  label?: string;
  /** Whether to show the text label below the icon */
  showLabel?: boolean;
  /** Enable subtle rotation/floating animation */
  enableRotation?: boolean;
  /** Enable pulsing glow effect */
  enableGlow?: boolean;
  /** Custom glow color (defaults to first color in array) */
  glowColor?: string;
  /** Animation duration per color transition in seconds */
  colorDuration?: number;
  /** Additional CSS classes */
  className?: string;
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Official Babes Club chronic leaf SVG path
 * Source: src/components/HorizontalBanner/icon.tsx
 * ViewBox: 0 0 150 150
 */
const CHRONIC_LEAF_PATH =
  "M143.2,87.6s-18.9-1.3-37.5,6.6c3.5-4.1,6.9-8.6,10-13.7,15.4-25.1,16.8-52.3,16.8-52.3,0,0-23.6,13.5-39.1,38.7-2.3,3.7-4.2,7.4-5.9,11.1,1-6.2,1.7-12.8,1.7-19.7,0-32.2-14.3-58.3-14.3-58.3,0,0-14.3,26.1-14.3,58.3s.7,13.6,1.7,19.7c-1.7-3.7-3.6-7.4-5.9-11.1C41.1,41.8,17.5,28.2,17.5,28.2c0,0,1.4,27.2,16.8,52.3,3.1,5,6.5,9.6,10,13.7-18.7-7.9-37.5-6.6-37.5-6.6,0,0,11.4,14.2,30.1,22.2,7.1,3,14.3,4.7,20.5,5.7-2.9.2-6,.6-9.2,1.4-13.6,3.3-23.1,11.7-23.1,11.7,0,0,12.6,2.9,26.3-.4,8.8-2.2,15.9-6.4,19.8-9.1l-3.3,26.1c-.2,1.2.2,2.5.9,3.4.8.9,1.8,1.5,3,1.5h6.2c1.1,0,2.2-.5,3-1.5.8-.9,1.1-2.2.9-3.4l-3.3-26.1c3.9,2.7,10.9,7,19.8,9.1,13.6,3.3,26.3.4,26.3.4,0,0-9.5-8.3-23.1-11.7-3.2-.8-6.3-1.2-9.2-1.4,6.2-.9,13.3-2.6,20.5-5.7,18.7-8,30.1-22.2,30.1-22.2Z";

/** Default brand colors for animation */
const DEFAULT_COLORS = [
  "#fe3ba1", // babe-pink-500
  "#f5dcee", // cotton-candy-500
  "#ffc6e3", // babe-pink-200
  "#A7F3D0", // mint/emerald
  "#ff75bb", // babe-pink-400
];

// ============================================================================
// Component
// ============================================================================

const ChronicLeafIcon: React.FC<ChronicLeafIconProps> = ({
  size = 64,
  colors = DEFAULT_COLORS,
  label = "Loading...",
  showLabel = true,
  enableRotation = true,
  enableGlow = true,
  glowColor,
  colorDuration = 0.6,
  className = "",
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const filterId = useId();

  // Compute effective glow color
  const effectiveGlowColor = glowColor ?? colors[0] ?? "#fe3ba1";

  useEffect(() => {
    const path = pathRef.current;
    const container = containerRef.current;
    const labelEl = labelRef.current;

    if (!path || !container) return;

    // Respect reduced motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Static fallback: just set initial color, no animation
      gsap.set(path, { fill: colors[0] });
      return;
    }

    // Clear any existing animations
    tweensRef.current.forEach((tween) => tween.kill());
    tweensRef.current = [];
    tlRef.current?.kill();

    // === Color cycling animation ===
    tlRef.current = gsap.timeline({ repeat: -1 });
    colors.forEach((color) => {
      tlRef.current!.to(path, {
        fill: color,
        duration: colorDuration,
        ease: "sine.inOut",
      });
    });

    // === Optional rotation animation (subtle floating effect) ===
    if (enableRotation) {
      const rotationTween = gsap.to(container, {
        rotation: 3,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "center center",
      });
      tweensRef.current.push(rotationTween);

      // Subtle scale pulse
      const scaleTween = gsap.to(container, {
        scale: 1.03,
        duration: 1.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      tweensRef.current.push(scaleTween);
    }

    // === Optional glow pulse animation ===
    if (enableGlow) {
      const glowTween = gsap.to(container, {
        "--glow-opacity": 0.9,
        duration: 1.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      tweensRef.current.push(glowTween);
    }

    // === Label pulse animation ===
    if (labelEl && showLabel) {
      const labelTween = gsap.to(labelEl, {
        opacity: 0.6,
        duration: 1.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      tweensRef.current.push(labelTween);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
      tweensRef.current.forEach((tween) => tween.kill());
      tweensRef.current = [];
      // Also kill any tweens on the elements directly
      gsap.killTweensOf(path);
      gsap.killTweensOf(container);
      if (labelEl) gsap.killTweensOf(labelEl);
    };
  }, [colors, colorDuration, enableRotation, enableGlow, showLabel]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
      style={
        {
          "--glow-opacity": 0.5,
          "--glow-color": effectiveGlowColor,
        } as React.CSSProperties
      }
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 150 150"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
        focusable="false"
        style={{
          filter: enableGlow
            ? `drop-shadow(0 0 ${size * 0.12}px var(--glow-color))`
            : undefined,
          opacity: enableGlow ? "var(--glow-opacity, 1)" : 1,
        }}
      >
        {/* Optional blur filter for enhanced glow effect */}
        {enableGlow && (
          <defs>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
        )}

        {/* Main chronic leaf path */}
        <path ref={pathRef} d={CHRONIC_LEAF_PATH} fill={colors[0]} />
      </svg>

      {/* Visible label */}
      {showLabel && (
        <span
          ref={labelRef}
          className="text-lg select-none text-babe-pink font-grand-hotel text-glow-soft"
          style={{
            textShadow: `0 0 10px ${effectiveGlowColor}40, 0 0 20px ${effectiveGlowColor}20`,
          }}
        >
          {label}
        </span>
      )}

      {/* Screen reader announcement (always present) */}
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default ChronicLeafIcon;
