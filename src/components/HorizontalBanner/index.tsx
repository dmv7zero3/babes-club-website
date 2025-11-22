import React from "react";
import HorizontalIcon from "./icon";
import "./animation.css";

type HorizontalBannerProps = {
  color?: string;
  height?: number; // px height for icons
  speed?: number; // logical units for helper, default 1
  paddingRight?: number; // extra width to add at the end of the strip
  className?: string;
  count?: number; // how many icons to render in the strip
};

const HorizontalBanner: React.FC<HorizontalBannerProps> = ({
  color = "#fff",
  height = 32,
  speed = 2,
  paddingRight = 0,
  className,
  count = 12,
}) => {
  // CSS marquee doesn't need JS for animation; we only use JS to ensure enough icons to cover width.
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Keep it simple: render a base sequence and duplicate once.
  // Ensure at least enough items to visually cover on common widths.
  const base = Math.max(8, count);
  const [needed, setNeeded] = React.useState<number>(base);

  React.useLayoutEffect(() => {
    const gap = 24; // must match --hb-gap
    const perItem = height + gap; // icon width equals height; gap added between items

    const compute = () => {
      const w = containerRef.current?.offsetWidth ?? 0;
      if (perItem > 0) {
        const minItems = Math.ceil((w + gap) / perItem); // ensure one sequence >= container width
        setNeeded((prev) => Math.max(base, minItems));
      } else {
        setNeeded(base);
      }
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [base, height]);

  const seq = React.useMemo(
    () => Array.from({ length: needed }, (_, i) => i),
    [needed]
  );

  return (
    <div
      className={`hb-container ${className ?? ""}`}
      style={{
        // Expose styling knobs via CSS variables
        // speed is duration for one half-track (two sequences total width)
        ["--hb-speed" as any]: `${Math.max(6, 36 / Math.max(0.25, speed))}s`,
        ["--hb-height" as any]: `${height}px`,
        ["--hb-gap" as any]: `24px`,
        ["--hb-color" as any]: color,
      }}
      aria-label="Decorative moving icon banner"
      ref={containerRef}
    >
      <div className="hb-track">
        <div className="hb-seq">
          {seq.map((i) => (
            <div className="hb-item" key={`a-${i}`}>
              <HorizontalIcon className="hb-icon" fill="currentColor" />
            </div>
          ))}
        </div>
        <div className="hb-seq" aria-hidden="true">
          {seq.map((i) => (
            <div className="hb-item" key={`b-${i}`}>
              <HorizontalIcon className="hb-icon " fill="currentColor" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HorizontalBanner;
