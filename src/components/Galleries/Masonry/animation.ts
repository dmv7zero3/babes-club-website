// Simple IntersectionObserver-powered reveal helper
// Adds 'is-visible' to any element with the 'animate-on-scroll' class
// within the provided container element. Tailwind utilities in tailwind.config.js
// define the animation styles for these classes.

export type RevealOptions = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  /** Stagger delay between sibling items in ms */
  stagger?: number;
  /** If true, remove visibility when leaving so it can fade in again on re-enter */
  replay?: boolean;
  /** If true, strip any pre-existing is-visible on setup so animations replay on mount */
  resetOnMount?: boolean;
};

/**
 * Observe children with class 'animate-on-scroll' and toggle 'is-visible'
 * when they enter the viewport.
 */
export function setupRevealOnScroll(
  container: HTMLElement,
  options: RevealOptions = {}
) {
  if (!container || typeof IntersectionObserver === "undefined")
    return () => {};

  const {
    root = null,
    rootMargin = "0px",
    threshold = 0.15,
    stagger = 60,
    replay = true,
    resetOnMount = true,
  } = options;

  const targets = Array.from(
    container.querySelectorAll<HTMLElement>(".animate-on-scroll")
  );

  // Ensure a clean state so animations can replay when component remounts
  if (resetOnMount) {
    targets.forEach((el) => el.classList.remove("is-visible"));
  }

  // Assign progressive delays for a subtle cascade effect
  targets.forEach((el, i) => {
    if (!el.style.transitionDelay) {
      el.style.transitionDelay = `${(i % 15) * stagger}ms`;
    }
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          // If not replaying, unobserve after first reveal
          if (!replay) io.unobserve(el);
        } else if (replay) {
          // Leaving viewport: remove visibility so it can animate again
          el.classList.remove("is-visible");
        }
      });
    },
    { root, rootMargin, threshold }
  );

  targets.forEach((el) => io.observe(el));

  // Cleanup
  return () => io.disconnect();
}
