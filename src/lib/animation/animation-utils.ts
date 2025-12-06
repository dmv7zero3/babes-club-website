/**
 * Animation Utilities
 * ==================
 *
 * Shared utilities and patterns for GSAP animations across the site.
 * These utilities enforce best practices for performance and cleanup.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React from "react";

/**
 * Configuration for scroll-triggered animations
 */
export interface ScrollAnimationConfig {
  trigger: Element;
  start?: string;
  end?: string;
  once?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
  markers?: boolean;
}

/**
 * Creates a GPU-optimized animation timeline
 * Applies best practices for performance
 */
export function createOptimizedTimeline(options?: {
  [key: string]: unknown;
}) {
  return gsap.timeline({
    ...options,
    overwrite: "auto", // Prevent animation stacking
  });
}

/**
 * Sets up a scroll trigger with proper cleanup support
 * Returns a cleanup function to kill the trigger
 */
export function createScrollTrigger(config: ScrollAnimationConfig): {
  trigger: any;
  cleanup: () => void;
} {
  let trigger: any = null;

  try {
    trigger = ScrollTrigger.create({
      trigger: config.trigger,
      start: config.start || "top 80%",
      end: config.end,
      once: config.once !== false, // Default to true for performance
      onEnter: config.onEnter,
      onLeave: config.onLeave,
      onEnterBack: config.onEnterBack,
      onLeaveBack: config.onLeaveBack,
      markers: config.markers === true,
    });
  } catch (error) {
    console.error("Failed to create ScrollTrigger:", error);
  }

  return {
    trigger,
    cleanup: () => {
      if (trigger) {
        trigger.kill();
      }
    },
  };
}

/**
 * Applies GPU acceleration hints to an element
 * Improves performance of animated elements
 */
export function applyGpuAcceleration(element: Element) {
  gsap.set(element, {
    force3D: true,
    backfaceVisibility: "hidden",
    perspective: 1000,
  });
}

/**
 * Sets willChange on elements, optionally auto-resets after animation
 */
export function setWillChange(
  elements: gsap.TweenTarget,
  properties: string,
  timeline?: gsap.core.Timeline
) {
  gsap.set(elements, {
    willChange: properties,
  });

  // Auto-reset willChange after timeline completes
  if (timeline) {
    timeline.eventCallback("onComplete", () => {
      gsap.set(elements, {
        willChange: "auto",
      });
    });
  }
}

/**
 * Debounces scroll trigger refresh
 * Prevents excessive reflow calculations
 */
export function createDebouncedRefresh(delay: number = 150) {
  let timeoutId: NodeJS.Timeout | null = null;

  const refresh = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
      timeoutId = null;
    }, delay);
  };

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { refresh, cleanup };
}

/**
 * Cleans up all GSAP state for a component
 * Call this in useLayoutEffect cleanup function
 */
export function cleanupAnimations(options: {
  ctx?: gsap.Context;
  timelineRef?: React.MutableRefObject<gsap.core.Timeline | null>;
  triggerRef?: React.MutableRefObject<any>;
  splitRevertRef?: React.MutableRefObject<(() => void) | null>;
  element?: Element;
}) {
  const { ctx, timelineRef, triggerRef, splitRevertRef, element } = options;

  // 1. Kill timeline
  if (timelineRef?.current) {
    timelineRef.current.kill();
    (timelineRef as any).current = null;
  }

  // 2. Kill trigger
  if (triggerRef?.current) {
    triggerRef.current.kill();
    (triggerRef as any).current = null;
  }

  // 3. Kill any tweens on the element
  if (element) {
    gsap.killTweensOf(element);
  }

  // 4. Revert text splits
  if (splitRevertRef?.current) {
    splitRevertRef.current();
    (splitRevertRef as any).current = null;
  }

  // 5. Revert context last
  if (ctx) {
    ctx.revert();
  }
}

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Skips animations if user prefers reduced motion
 * Sets elements to final state immediately
 */
export function handleReducedMotion(
  elements: gsap.TweenTarget,
  finalState: gsap.TweenVars
) {
  if (prefersReducedMotion()) {
    gsap.set(elements, finalState);
    return true;
  }
  return false;
}

/**
 * Stagger configuration helper
 * Returns optimized stagger values for different element counts
 */
export function getOptimalStagger(elementCount: number): number {
  if (elementCount <= 5) return 0.05;
  if (elementCount <= 10) return 0.03;
  if (elementCount <= 20) return 0.02;
  return 0.01;
}

/**
 * Animation state guard
 * Prevents animations from running multiple times
 */
export class AnimationStateGuard {
  private state: "initial" | "animating" | "done" = "initial";

  isInitial(): boolean {
    return this.state === "initial";
  }

  isAnimating(): boolean {
    return this.state === "animating";
  }

  isDone(): boolean {
    return this.state === "done";
  }

  markAnimating() {
    if (this.state === "initial") {
      this.state = "animating";
    }
  }

  markDone() {
    this.state = "done";
  }

  reset() {
    this.state = "initial";
  }
}

/**
 * Batch creates animations with proper cleanup
 * Useful for animating multiple elements with the same properties
 */
export interface BatchAnimationOptions {
  targets: gsap.TweenTarget;
  vars: gsap.TweenVars;
  stagger?: number;
  duration?: number;
  delay?: number;
}

export function createBatchAnimation(
  options: BatchAnimationOptions,
  timeline: gsap.core.Timeline
): any {
  return timeline.to(options.targets, {
    ...options.vars,
    stagger: options.stagger,
    duration: options.duration || 0.6,
    delay: options.delay,
    overwrite: true,
  } as gsap.TweenVars);
}

/**
 * Cleanup helper for useLayoutEffect
 * Combines common cleanup patterns
 */
export function createAnimationCleanup(options: {
  ctx?: gsap.Context;
  timelineRef?: React.MutableRefObject<gsap.core.Timeline | null>;
  triggerRef?: React.MutableRefObject<any>;
  splitRevertRef?: React.MutableRefObject<(() => void) | null>;
  element?: Element;
  onResize?: () => void;
  removeResizeListener?: boolean;
}): () => void {
  return () => {
    // Cleanup animations
    cleanupAnimations({
      ctx: options.ctx,
      timelineRef: options.timelineRef,
      triggerRef: options.triggerRef,
      splitRevertRef: options.splitRevertRef,
      element: options.element,
    });

    // Remove resize listener
    if (options.removeResizeListener && options.onResize) {
      window.removeEventListener("resize", options.onResize);
    }
  };
}

export default {
  createOptimizedTimeline,
  createScrollTrigger,
  applyGpuAcceleration,
  setWillChange,
  createDebouncedRefresh,
  cleanupAnimations,
  prefersReducedMotion,
  handleReducedMotion,
  getOptimalStagger,
  AnimationStateGuard,
  createBatchAnimation,
  createAnimationCleanup,
};
