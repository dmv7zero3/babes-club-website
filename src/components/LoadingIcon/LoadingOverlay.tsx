import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import ChronicLeafIcon from "./ChronicLeafIcon";

export type LoadingOverlayProps = {
  isLoading?: boolean;
  message?: string;
  subMessage?: string;
  iconSize?: number;
  zIndex?: number;
  backdropBlur?: number;
  animateExit?: boolean;
  onExitComplete?: () => void;
  className?: string;
};

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

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (isLoading) {
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
      }
    } else if (!isFirstRender.current && animateExit) {
      if (prefersReducedMotion) {
        gsap.set(overlay, { autoAlpha: 0 });
        onExitComplete?.();
      } else {
        const tl = gsap.timeline({
          onComplete: () => onExitComplete?.(),
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
      }
    }
    isFirstRender.current = false;
  }, [isLoading, animateExit, onExitComplete]);

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
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(254, 59, 161, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(245, 220, 238, 0.1) 0%, transparent 50%)",
        }}
      />
      <div
        ref={contentRef}
        className="relative flex flex-col items-center gap-6 p-8"
        style={{ visibility: "hidden", opacity: 0 }}
      >
        <ChronicLeafIcon size={iconSize} label={message} />
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
export { LoadingOverlay };
