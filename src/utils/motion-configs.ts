import { Variants } from "framer-motion";

// Slide in/out from the left, for simple entrance/exit transitions.
// Use for sidebars, modals, or elements entering horizontally.
export const slideVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Performance-optimized pop/scale animation.
// Use for cards, popups, or elements that should scale in/out.
// Uses only transform and opacity for best GPU performance.
export const performantVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 17 },
  },
};
