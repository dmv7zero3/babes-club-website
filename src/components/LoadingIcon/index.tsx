/**
 * Loading Components for The Babes Club
 *
 * This module exports three loading indicators:
 * - ChronicLeafIcon: Animated SVG icon with GSAP color transitions
 * - LoadingOverlay: Full-page loading screen with backdrop blur
 * - InlineSpinner: Lightweight CSS-only spinner for buttons/cards
 *
 * @example
 * import { ChronicLeafIcon, LoadingOverlay, InlineSpinner } from "@/components/LoadingIcon";
 */

import React, { useEffect, useRef } from "react";

// ============================================================================
// Re-exports
// ============================================================================

export { default as ChronicLeafIcon } from "./ChronicLeafIcon";
export type { ChronicLeafIconProps } from "./ChronicLeafIcon";

export { default as LoadingOverlay } from "./LoadingOverlay";
export type { LoadingOverlayProps } from "./LoadingOverlay";

// ============================================================================
// InlineSpinner Types
// ============================================================================

export type InlineSpinnerProps = {
  /** Size in pixels */
  size?: number;
  /** Primary spinner color */
  color?: string;
  /** Track (background circle) color */
  trackColor?: string;
  /** Border thickness in pixels */
  thickness?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
};

// ============================================================================
// Style Injection Hook
// ============================================================================

/**
 * Injects the spinner keyframes into the document head.
 * Safe for SSR - only runs on client.
 */
function useSpinnerKeyframes(): void {
  const injectedRef = useRef(false);

  useEffect(() => {
    // Only inject once per app lifecycle
    if (injectedRef.current) return;
    if (typeof window === "undefined") return;
    if (document.getElementById("inline-spinner-keyframes")) {
      injectedRef.current = true;
      return;
    }

    const style = document.createElement("style");
    style.id = "inline-spinner-keyframes";
    style.textContent = `
      @keyframes babes-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    injectedRef.current = true;
  }, []);
}

// ============================================================================
// InlineSpinner Component
// ============================================================================

/**
 * Lightweight inline spinner for buttons, cards, and small loading states.
 *
 * Uses CSS animation instead of GSAP for minimal overhead. Perfect for
 * submit buttons, inline loading indicators, and small UI elements.
 *
 * @example
 * // In a button
 * <button disabled={isSubmitting}>
 *   {isSubmitting ? (
 *     <>
 *       <InlineSpinner size={18} className="mr-2" />
 *       Saving...
 *     </>
 *   ) : (
 *     "Save Changes"
 *   )}
 * </button>
 *
 * @example
 * // Standalone
 * <InlineSpinner size={24} color="#fe3ba1" />
 */
export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  size = 24,
  color = "#fe3ba1",
  trackColor = "rgba(254, 59, 161, 0.2)",
  thickness = 3,
  className = "",
  label = "Loading",
}) => {
  // Inject keyframes on mount (SSR-safe)
  useSpinnerKeyframes();

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 50 50"
        style={{
          animation: "babes-spin 0.8s linear infinite",
          width: "100%",
          height: "100%",
        }}
        aria-hidden="true"
        focusable="false"
      >
        {/* Track circle (background) */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {/* Animated arc (foreground) */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        />
      </svg>
      {/* Screen reader text */}
      <span className="sr-only">{label}</span>
    </span>
  );
};

// Default export for convenience
export default {
  ChronicLeafIcon: require("./ChronicLeafIcon").default,
  LoadingOverlay: require("./LoadingOverlay").default,
  InlineSpinner,
};
