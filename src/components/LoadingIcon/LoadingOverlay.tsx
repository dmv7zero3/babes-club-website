/**
 * LoadingOverlay - Full-page Loading Screen for The Babes Club
 *
 * A branded full-page loading overlay with animated entrance/exit,
 * backdrop blur, and the ChronicLeafIcon. Supports reduced motion
 * preferences and is fully accessible.
 *
 * @example
 * // Basic usage
 * <LoadingOverlay isLoading={isLoading} />
 *
 * @example
 * // With custom message and callback
 * <LoadingOverlay
 *   isLoading={isLoading}
 *   message="Loading your dashboard..."
 *   subMessage="Please wait while we fetch your data"
 *   onExitComplete={() => console.log("Done!")}
 * />
 */

import React, { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import ChronicLeafIcon from "./ChronicLeafIcon";

// ============================================================================
// Types
// ============================================================================

export type LoadingOverlayProps = {
  /** Whether the overlay is visible */
  isLoading?: boolean;
  /** Primary loading message */
  message?: string;
  /** Secondary message (smaller text below main message) */
  subMessage?: string;
  /** Size of the loading icon in pixels */
  iconSize?: number;
  /** Custom z-index for the overlay */
  zIndex?: number;
  /** Backdrop blur amount in pixels */
  backdropBlur?: number;
  /** Whether to animate the exit transition */
  animateExit?: boolean;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
  /** Additional CSS classes */
  className?: string;
};

// ============================================================================
// Component
// ============================================================================

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading = true,
  message = "Loading...",
  subMessage,
  iconSize = 80,
  zIndex = 9999,
  backdropBlur = 8,
  animateExit = true,
  onExitComplete,
  className = "",
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Memoize the exit callback to prevent stale closures
  const handleExitComplete = useCallback(() => {
    onExitComplete?.();
  }, [onExitComplete]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;

    if (!overlay || !content) return;

    // Kill any existing timeline before creating a new one
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    // Respect reduced motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isLoading) {
      // === Entrance Animation ===
      if (prefersReducedMotion) {
        gsap.set(overlay, { autoAlpha: 1 });
        gsap.set(content, { autoAlpha: 1, y: 0, scale: 1 });
      } else {
        const tl = gsap.timeline();
        tl.set(overlay, { autoAlpha: 0 })
          .set(content, { autoAlpha: 0, y: 20, scale: 0.95 })
          .to(overlay, {
            autoAlpha: 1,
            duration: 0.3,
            ease: "power2.out",
          })
          .to(
            content,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.4,
              ease: "back.out(1.2)",
            },
            "-=0.1"
          );

        tlRef.current = tl;
      }
    } else if (!isFirstRender.current && animateExit) {
      // === Exit Animation ===
      if (prefersReducedMotion) {
        gsap.set(overlay, { autoAlpha: 0 });
        handleExitComplete();
      } else {
        const tl = gsap.timeline({
          onComplete: handleExitComplete,
        });

        tl.to(content, {
          autoAlpha: 0,
          y: -10,
          scale: 0.98,
          duration: 0.25,
          ease: "power2.in",
        }).to(
          overlay,
          {
            autoAlpha: 0,
            duration: 0.2,
            ease: "power2.in",
          },
          "-=0.1"
        );

        tlRef.current = tl;
      }
    }

    isFirstRender.current = false;

    // Cleanup on unmount
    return () => {
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }
      // Kill any tweens on elements directly
      gsap.killTweensOf(overlay);
      gsap.killTweensOf(content);
    };
  }, [isLoading, animateExit, handleExitComplete]);

  // Don't render if not loading and no exit animation
  if (!isLoading && !animateExit) return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 flex items-center justify-center ${className}`}
      style={{
        zIndex,
        backdropFilter: `blur(${backdropBlur}px)`,
        WebkitBackdropFilter: `blur(${backdropBlur}px)`,
        background:
          "linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.9) 50%, rgba(13, 13, 13, 0.95) 100%)",
        visibility: "hidden",
        opacity: 0,
      }}
      role="alert"
      aria-busy={isLoading}
      aria-live="assertive"
    >
      {/* Subtle animated gradient background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(254, 59, 161, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(245, 220, 238, 0.1) 0%, transparent 50%)",
        }}
      />

      {/* Content container */}
      <div
        ref={contentRef}
        className="relative flex flex-col items-center gap-6 p-8"
        style={{ visibility: "hidden", opacity: 0 }}
      >
        <ChronicLeafIcon
          size={iconSize}
          label={message}
          showLabel={true}
          enableRotation={true}
          enableGlow={true}
        />

        {subMessage && (
          <p className="max-w-xs text-sm text-center text-white/50 animate-pulse">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;

// Named export for flexibility
export { LoadingOverlay };
