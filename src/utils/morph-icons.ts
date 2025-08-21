// morph-icons.ts
// Utility for morphing SVG icons using GSAP MorphSVGPlugin
// For usage and details, see: ./morph-icons.md

// Import GSAP and MorphSVGPlugin (assumes they are loaded globally or via script tags)
// Paths: public/js/gsap/MorphSVGPlugin.min.js, public/js/gsap/MorphSVGPlugin.min.js.map

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    gsap: any;
    MorphSVGPlugin: any;
  }
}

// Example usage (see morph-icons.md for more):
// morphIcon('#fromIcon', '#toIcon');

/**
 * Morph one SVG icon into another using GSAP MorphSVGPlugin.
 * @param {string} fromSelector - CSS selector for the source SVG/path.
 * @param {string} toSelector - CSS selector for the target SVG/path.
 * @param {object} [options] - Optional GSAP animation options.
 */
export function morphIcon(
  fromSelector: string,
  toSelector: string,
  options: Record<string, any> = {}
) {
  if (typeof window === "undefined" || !window.gsap || !window.MorphSVGPlugin) {
    throw new Error("GSAP and MorphSVGPlugin must be loaded globally.");
  }
  window.gsap.registerPlugin(window.MorphSVGPlugin);
  return window.gsap.to(fromSelector, {
    ...options,
    duration: options.duration || 1,
    morphSVG: toSelector,
    ease: options.ease || "power1.inOut",
  });
}
