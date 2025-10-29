// src/lib/hooks/useSplitTextReveal.ts
// React hook to split text into character spans and animate them with GSAP.
// Works without GSAP's SplitText plugin by using a local splitter utility.

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  splitTextElementToSpans,
  type SplitTextOptions,
} from "@/utils/splitText";

export type SplitTextRevealOptions = {
  selector?: string; // CSS selector to find elements within container
  splitOptions?: SplitTextOptions; // splitting behavior
  from?: gsap.TweenVars; // gsap.from() vars for initial state
  to?: gsap.TweenVars; // gsap.to() or extra vars merged into animation
  stagger?: number; // per-char stagger
  duration?: number; // per-char duration
  ease?: string; // easing
  waitForFonts?: boolean; // wait for document.fonts to be ready
  scrollTrigger?: boolean | Partial<ScrollTrigger.Vars>; // enable and configure scroll-scrubbed animation
};

export function useSplitTextReveal(
  container: React.RefObject<HTMLElement | null>,
  options: SplitTextRevealOptions = {}
) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = container.current;
    if (!root) return;

    const {
      selector = "h1",
      splitOptions,
      from = { y: 50, opacity: 0 },
      to = {},
      stagger = 0.05,
      duration = 0.6,
      ease = "power2.out",
      waitForFonts = true,
      scrollTrigger,
    } = options;

    let cleaners: Array<() => void> = [];
    let timeline: gsap.core.Timeline | null = null;

    const run = () => {
      // Register ScrollTrigger if a scroll config is provided
      if (scrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
      }

      timeline = gsap.timeline(
        scrollTrigger
          ? (() => {
              const stOpts =
                typeof scrollTrigger === "object" ? scrollTrigger : {};
              const merged: ScrollTrigger.Vars = {
                trigger: stOpts.trigger ?? root,
                start: stOpts.start ?? "top top",
                end: stOpts.end ?? "+=800",
                scrub: stOpts.scrub ?? true,
                invalidateOnRefresh: stOpts.invalidateOnRefresh ?? true,
                markers: stOpts.markers ?? false,
                ...stOpts,
              };
              return { scrollTrigger: merged };
            })()
          : {}
      );

      const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
      targets.forEach((el) => {
        const { spans, revert } = splitTextElementToSpans(el, splitOptions);
        cleaners.push(revert);

        timeline!.from(
          spans,
          {
            ...from,
            duration,
            ease,
            stagger,
            ...to,
          },
          0
        );
      });
    };

    const start = () => run();

    if (waitForFonts && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(start);
    } else {
      start();
    }

    return () => {
      // Revert split text to original content
      cleaners.forEach((c) => c());
      // Kill the timeline and its ScrollTrigger (if any)
      if (timeline) {
        timeline.kill();
        timeline = null;
      }
    };
  }, [container, options]);
}
