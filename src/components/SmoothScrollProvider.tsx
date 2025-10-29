import React, { PropsWithChildren, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmoothScrollProvider
 * Wraps app content with ScrollSmoother (GSAP) for softened native scroll and data-speed/effects support.
 * Note: Requires access to GSAP bonus plugin ScrollSmoother.
 */
const SmoothScrollProvider: React.FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    // Respect reduced motion: skip smoothing entirely
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const wrapper = wrapperRef.current!;
    const content = contentRef.current!;
    if (!wrapper || !content) return;

    let smoother: any | null = null;
    // Detect plugin from globals (e.g., when included via separate script) to avoid hard import
    const AnyGSAP = gsap as unknown as { plugins?: Record<string, any> };
    // Some builds expose plugins on gsap.plugins, or on window
    const Global: any = typeof window !== "undefined" ? window : {};
    const Plugin =
      (AnyGSAP.plugins && (AnyGSAP as any).plugins.ScrollSmoother) ||
      Global.ScrollSmoother ||
      null;
    if (Plugin) {
      try {
        gsap.registerPlugin(Plugin);
        smoother = Plugin.create({
          wrapper,
          content,
          smooth: 1,
          smoothTouch: 0.1,
          effects: false, // disable built-in data-speed effects; we'll control parallax manually
          normalizeScroll: true,
        });
        // Expose instance globally for debugging/detection in child components
        (Global as any).__scrollSmoother = smoother;
        // Ensure ScrollTrigger syncs with scroller proxy immediately
        ScrollTrigger.refresh();
      } catch (_e) {
        // If registration fails, continue without smoothing
      }
    }

    // Optional: refresh on viewport changes
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (smoother) {
        try {
          (Global as any).__scrollSmoother = null;
        } catch {}
        smoother.kill();
      }
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <div id="smooth-wrapper" ref={wrapperRef} className="overflow-hidden">
      <div id="smooth-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default SmoothScrollProvider;
