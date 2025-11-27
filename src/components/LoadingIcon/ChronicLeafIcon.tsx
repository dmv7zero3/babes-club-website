import React, { useRef, useEffect } from "react";
import gsap from "gsap";

export type ChronicLeafIconProps = {
  size?: number;
  colors?: string[]; // Array of brand colors to animate through
  label?: string;
  className?: string;
};

const LEAF_PATH =
  "M12 2C10.5 6 7 9 2 10c5 1 8.5 4 10 8 1.5-4 5-7 10-8-5-1-8.5-4-10-8z";

const ChronicLeafIcon: React.FC<ChronicLeafIconProps> = ({
  size = 64,
  colors = ["#FFB6C1", "#F7CFE3", "#A7F3D0"],
  label = "Loading Babes Club...",
  className = "",
}) => {
  const pathRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (pathRef.current) {
      tlRef.current = gsap.timeline({ repeat: -1, yoyo: true });
      colors.forEach((color, i) => {
        tlRef.current!.to(
          pathRef.current,
          {
            fill: color,
            duration: 0.8,
            ease: "power1.inOut",
          },
          i * 0.8
        );
      });
    }
    return () => {
      tlRef.current?.kill();
    };
  }, [colors]);

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={colors[0]}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={label}
        focusable="false"
      >
        <path ref={pathRef} d={LEAF_PATH} />
      </svg>
      <span className="mt-2 text-lg text-babe-pink font-script text-glow-soft">
        {label}
      </span>
    </div>
  );
};

export default ChronicLeafIcon;
