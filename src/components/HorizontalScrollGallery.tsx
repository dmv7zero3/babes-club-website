import React, { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Default image set (kept for backward compatibility/fallbacks)
const DEFAULT_IMAGES: string[] = [
  "/images/models/model-earrings-1.jpg",
  "/images/models/model-earrings-2.jpg",
  "/images/models/model-earrings-4.jpg",
  "/images/models/model-earrings-6.jpg",
  // "/images/models/model-earrings-7.jpg",
];

// Reusable, prop-driven HorizontalScrollGallery
// - Desktop (>= min width) uses a pinned scroll section with opposite-moving overlay text
// - Mobile (< min width) or reduced-motion shows a static vertical flow (no pinning)

type GalleryImage =
  | string
  | {
      src: string;
      alt?: string;
      // Optional responsive image hints
      srcSet?: string;
      sizes?: string;
      width?: number;
      height?: number;
      loading?: "lazy" | "eager";
      decoding?: "async" | "sync" | "auto";
    };

export interface HorizontalScrollGalleryProps {
  images?: GalleryImage[];
  overlayText?: React.ReactNode | React.ReactNode[] | string;
  overlayRepeat?: number; // how many times to repeat the overlayText when a string/node
  className?: string; // additional classes for the section container
  overlayClassName?: string; // customize overlay text style
  trackGapClassName?: string; // customize gaps between items
  imageWrapperClassName?: string; // customize image wrapper sizes
  ariaLabel?: string;
  // Behavior/config
  scrub?: number | boolean; // ScrollTrigger scrub
  pinReparent?: boolean;
  desktopMinWidth?: number; // breakpoint px for desktop behavior
  easing?: string; // GSAP ease name
  mobileStack?: boolean; // stack images vertically on mobile
}

const HorizontalScrollGallery: React.FC<HorizontalScrollGalleryProps> = ({
  images = DEFAULT_IMAGES,
  overlayText = "The Babes Club",
  overlayRepeat = 8,
  className = "",
  overlayClassName = "",
  trackGapClassName = "gap-6 md:gap-10",
  imageWrapperClassName = "w-[78vw] h-[36vh] xs:w-[74vw] sm:w-[68vw] md:w-[56vw] lg:w-[46vw] xl:w-[40vw] 2xl:w-[36vw]",
  ariaLabel = "Horizontal product gallery",
  scrub = 0.5,
  pinReparent = true,
  desktopMinWidth = 1024,
  easing = "power2.out",
  mobileStack = true,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  // Normalize images array to uniform objects
  const normalizedImages = useMemo(() => {
    return (images as GalleryImage[]).map((img, idx) =>
      typeof img === "string"
        ? { src: img, alt: `Gallery image ${idx + 1}` }
        : { alt: `Gallery image ${idx + 1}`, ...img }
    );
  }, [images]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    const text = textRef.current;
    if (!section || !wrapper || !track || !text) return;

    const ctx = gsap.context(() => {
      // QuickSetters for low-overhead transforms
      const setTrackX = gsap.quickSetter(track, "x", "px");
      const setTextX = gsap.quickSetter(text, "x", "px");

      // Compute length once per refresh to avoid DOM reads on every tick
      let len = 0;
      const computeLen = () => {
        len = Math.max(0, track.scrollWidth - wrapper.clientWidth);
        return len;
      };

      // Throttled refresh to avoid ResizeObserver loop errors
      let rafId: number | null = null;
      const scheduleRefresh = () => {
        if (rafId != null) return;
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          ScrollTrigger.refresh();
        });
      };

      // Observe real element size changes (beyond window resize)
      const ro = new ResizeObserver(() => scheduleRefresh());
      ro.observe(wrapper);
      ro.observe(track);

      // Refresh as images load (sizes can change)
      const imgs = Array.from(track.querySelectorAll<HTMLImageElement>("img"));
      imgs.forEach((img) => {
        if (!img.complete) {
          const refresh = () => scheduleRefresh();
          img.addEventListener("load", refresh, { once: true });
          img.addEventListener("error", refresh, { once: true });
        }
      });

      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: `(min-width: ${desktopMinWidth}px)`,
          mobile: `(max-width: ${desktopMinWidth - 0.02}px)`,
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { desktop, reduced } = context.conditions as {
            desktop: boolean;
            mobile: boolean;
            reduced: boolean;
          };

          // If reduced motion or not desktop, render static (no pin or animations)
          if (reduced || !desktop) {
            setTrackX(0);
            setTextX(0);
            return () => {};
          }

          // Desktop only: Build a timeline that matches the reference behavior
          computeLen();
          // Ensure elements are at their starting poses
          setTrackX(0);
          setTextX(-len);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              // Use computed length so duration matches the distance we translate
              end: () => `+=${computeLen()}`,
              pin: true,
              pinReparent: pinReparent,
              scrub: scrub,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: 100,
              // markers: true,
            },
          });

          // Text: from -len to 0
          tl.set(text, { x: () => -computeLen() });
          tl.to(text, { x: 0, ease: easing });
          // Gallery/track: from 0 to -len, in parallel
          tl.to(
            track,
            {
              x: () => -computeLen(),
              ease: easing,
            },
            "<"
          );

          return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
          };
        }
      );

      const onResize = () => scheduleRefresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        ro.disconnect();
        mm.kill();
        if (rafId != null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label={ariaLabel}
      className={`relative w-full overflow-hidden bg-transparent isolate ${className}`}
    >
      {/* Pinned wrapper holding a single moving row */}
      <div
        ref={wrapperRef}
        className="relative z-10 flex items-center w-full h-full px-6 md:px-12"
      >
        {/* Opposite-moving overlay text */}
        <div
          ref={textRef}
          className={`pointer-events-none absolute top-[40px] left-[5vw] z-[60] flex items-center gap-[18px] whitespace-nowrap text-[clamp(28px,15vw,80px)] leading-none font-grand-hotel text-white will-change-transform transform-gpu [backface-visibility:hidden] ${overlayClassName}`}
        >
          {(() => {
            // Render overlay content depending on prop type
            const repeated = (content: React.ReactNode, count: number) =>
              Array.from({ length: count }).map((_, i) => (
                <span key={i}>{content}</span>
              ));

            if (Array.isArray(overlayText)) {
              return overlayText.map((node, i) => <span key={i}>{node}</span>);
            }
            if (typeof overlayText === "string") {
              return repeated(overlayText, overlayRepeat);
            }
            // Single ReactNode
            return repeated(overlayText, overlayRepeat);
          })()}
        </div>
        <div
          ref={trackRef}
          className={`${mobileStack ? "flex flex-col sm:flex-row" : "inline-flex"} items-center ${trackGapClassName} will-change-transform transform-gpu [backface-visibility:hidden]`}
        >
          {normalizedImages.map((img, idx) => (
            <figure
              key={(img.src || "img") + idx}
              className="relative flex-none overflow-hidden rounded-2xl md:rounded-3xl"
            >
              {/* Uniform cropping wrapper */}
              <div className={imageWrapperClassName}>
                <img
                  src={img.src}
                  alt={img.alt ?? `Gallery image ${idx + 1}`}
                  className="object-cover w-full h-full pointer-events-none select-none"
                  draggable={false}
                  loading={img.loading ?? "lazy"}
                  decoding={img.decoding ?? "async"}
                  {...(img.srcSet ? { srcSet: img.srcSet } : {})}
                  {...(img.sizes ? { sizes: img.sizes } : {})}
                  {...(img.width ? { width: img.width } : {})}
                  {...(img.height ? { height: img.height } : {})}
                />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollGallery;
