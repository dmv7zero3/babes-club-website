import { useEffect, useRef } from "react";
import gsap from "gsap";

const ScrollIndicator = () => {
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return;

    const tl = gsap.timeline({ repeat: -1 });
    tl.set(dot, { attr: { cy: 12 }, opacity: 0 })
      // Fade in instantly at the start
      .to(dot, { opacity: 1, duration: 0.1, ease: "linear" }, 0)
      // Move down and fade out at a constant speed
      .to(
        dot,
        {
          attr: { cy: 44 },
          opacity: 0,
          duration: 1.1,
          ease: "linear",
        },
        0.1
      )
      // Reset
      .set(dot, { attr: { cy: 12 }, opacity: 0 }, "+=0.2");

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      className="absolute flex items-center justify-center transform -translate-x-1/2 left-1/2 bottom-8"
      style={{ zIndex: 20 }}
    >
      <svg
        className="w-16 h-24 text-white lg:w-9 lg:h-12"
        viewBox="0 0 32 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* Mouse outline */}
        <rect
          x="2"
          y="2"
          width="28"
          height="52"
          rx="14"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        {/* Animated dot */}
        <circle
          ref={dotRef}
          className="scroll-dot"
          cx="16"
          cy="12"
          r="3"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default ScrollIndicator;
