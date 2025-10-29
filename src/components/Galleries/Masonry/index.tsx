import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import { masonryItems, type MasonryItem } from "./data";
import { setupRevealOnScroll } from "./animation";
// Curtains.js removed per request

export type MasonryGalleryProps = {
  items?: MasonryItem[];
  className?: string;
  /**
   * Column classes for responsiveness. Defaults to 1/2/3/4 across breakpoints.
   * Override by passing Tailwind classes like 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4'.
   */
  columnClassName?: string;
  /** Gap between items (applied via column-gap and item margin). */
  gapClassName?: string;
  /** Rounded corners radius utility. */
  roundedClassName?: string;
};

export default function MasonryGallery({
  items = masonryItems,
  className,
  columnClassName = "columns-2 md:columns-3 xl:columns-4",
  gapClassName = "gap-2",
  roundedClassName = "rounded-sm",
}: MasonryGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    return setupRevealOnScroll(containerRef.current, {
      threshold: 0.15,
      stagger: 70,
    });
  }, []);

  // Curtains.js integration was removed.

  // Tailwind doesn't ship column-gap utilities for CSS multi-columns.
  // Map common gap utilities to rem values and apply via inline style.
  const gapScale: Record<string, string> = {
    "0": "0rem",
    "0.5": "0.125rem",
    "1": "0.25rem",
    "1.5": "0.375rem",
    "2": "0.5rem",
    "2.5": "0.625rem",
    "3": "0.75rem",
    "3.5": "0.875rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "7": "1.75rem",
    "8": "2rem",
    "9": "2.25rem",
    "10": "2.5rem",
    "11": "2.75rem",
    "12": "3rem",
  };
  const gapMatch = gapClassName.match(/gap-([\d.]+)/);
  const columnGapRem = gapMatch ? (gapScale[gapMatch[1]] ?? "1rem") : "1rem";

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-11/12 mx-auto max-w-[1920px]",
        columnClassName,
        className
      )}
      style={{ columnGap: columnGapRem }}
    >
      {items.map((item, idx) => (
        <figure
          key={`${item.src}-${idx}`}
          className={clsx(
            "mb-2 overflow-hidden bg-zinc-100",
            roundedClassName,
            "animate-on-scroll"
          )}
          style={{ breakInside: "avoid" }}
        >
          {(() => {
            const dot = item.src.lastIndexOf(".");
            const base = dot !== -1 ? item.src.slice(0, dot) : item.src;
            const avif = `${base}.avif`;
            const webp = `${base}.webp`;
            const original = item.src;
            return (
              <picture>
                <source srcSet={avif} type="image/avif" />
                <source srcSet={webp} type="image/webp" />
                <img
                  src={original}
                  alt={item.alt}
                  className="block w-full h-auto object-cover transition-transform duration-500 ease-out will-change-transform hover:scale-[1.02]"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // If a chosen <source> fails (404), force fallback to original
                    if (e.currentTarget.src !== original) {
                      e.currentTarget.src = original;
                    }
                  }}
                />
              </picture>
            );
          })()}
        </figure>
      ))}
    </div>
  );
}
