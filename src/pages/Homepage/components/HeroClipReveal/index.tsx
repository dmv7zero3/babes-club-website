import React, { useEffect, useMemo, useRef } from "react";
import "./HeroClipReveal.css";
import ScrollIndicator from "../ScrollIndicator";
import { initHeroClipRevealAnimation } from "./animation";
import { Helmet } from "react-helmet";
// Importing the font asset to get the correct, hashed URL from the bundler
// This ensures the preload href matches the emitted file path in production
import grandHotelWoff2Url from "@/fonts/Grand-Hotel/GrandHotel-Regular.woff2";

export type HeroClipRevealProps = {
  imageSrc: string;
  duration?: number; // seconds for each phase
  delay?: number; // seconds before the animation starts
  alt?: string;
  className?: string;
};

/**
 * HeroClipReveal
 *
 * A reusable React component that reproduces a GSAP Flip-based image reveal:
 * 1) The image starts masked using clip-path and scaled up.
 * 2) The clip-path reveals the full area while slightly reducing scale.
 * 3) The element is then "flipped" (moved) from the hero image container
 *    into the centered heading-image container using GSAP Flip.
 * 4) Finally, the image scales back to 1.0.
 *
 * Key notes:
 * - Uses refs to access DOM nodes for GSAP.
 * - Cleans up timelines on unmount and reattaches the image to its original container.
 * - Recomputes on resize (debounced) to maintain correct Flip layout measurements.
 *
 * Usage example:
 * <HeroClipReveal imageSrc="/images/hero.jpg" duration={1} delay={0.5} />
 */
export const HeroClipReveal: React.FC<HeroClipRevealProps> = ({
  imageSrc,
  duration = 1,
  delay = 0,
  alt = "",
  className,
}) => {
  // Derive alternate formats from the provided image path
  const { avifSrc, webpSrc } = useMemo(() => {
    const dotIdx = imageSrc.lastIndexOf(".");
    if (dotIdx === -1) {
      return { avifSrc: imageSrc, webpSrc: imageSrc };
    }
    const base = imageSrc.slice(0, dotIdx);
    return { avifSrc: `${base}.avif`, webpSrc: `${base}.webp` };
  }, [imageSrc]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroImageRef = useRef<HTMLDivElement | null>(null); // .hero__image
  const originalImageContainerRef = useRef<HTMLDivElement | null>(null); // .hero__originalimage
  const headingImageContainerRef = useRef<HTMLDivElement | null>(null); // .hero__headingimage
  const imgRef = useRef<HTMLImageElement | null>(null);
  const headingTextRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const hasPlayedRef = useRef<boolean>(false);

  // Keep a stable refs snapshot for cleanup/debug
  const refs = useMemo(
    () => ({
      wrapperRef,
      heroRef,
      heroImageRef,
      originalImageContainerRef,
      headingImageContainerRef,
      imgRef,
      headingTextRef,
      indicatorRef,
    }),
    []
  );

  useEffect(() => {
    const cleanup = initHeroClipRevealAnimation(
      {
        wrapperRef,
        heroRef,
        heroImageRef,
        originalImageContainerRef,
        headingImageContainerRef,
        imgRef,
        headingTextRef,
        indicatorRef,
      },
      { duration, delay }
    );
    return () => cleanup?.();
  }, [duration, delay]);

  return (
    <div
      ref={wrapperRef}
      className={"hero-wrapper" + (className ? ` ${className}` : "")}
    >
      <Helmet>
        <link
          rel="preload"
          as="font"
          href={grandHotelWoff2Url}
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="image"
          href={avifSrc}
          type="image/avif"
          {...{ fetchpriority: "high" }}
        />
        <link
          rel="preload"
          as="image"
          href={webpSrc}
          type="image/webp"
          {...{ fetchpriority: "high" }}
        />
        <link
          rel="preload"
          as="image"
          href={imageSrc}
          type="image/jpeg"
          {...{ fetchpriority: "high" }}
        />
      </Helmet>
      <section
        ref={heroRef}
        className="hero mx-auto flex items-end justify-end relative overflow-hidden z-[2] h-screen w-full pointer-events-none select-none max-w-[1920px]"
      >
        <div ref={heroImageRef} className="hero__image">
          <div ref={originalImageContainerRef} className="hero__originalimage">
            <picture>
              <source srcSet={avifSrc} type="image/avif" />
              <source srcSet={webpSrc} type="image/webp" />
              <img
                ref={imgRef}
                src={imageSrc}
                alt={alt}
                data-speed="0.5"
                draggable={false}
                loading="eager"
                decoding="async"
                {...{ fetchpriority: "high" }}
              />
            </picture>
          </div>
        </div>

        <div className="hero__headings">
          <div ref={headingImageContainerRef} className="hero__headingimage" />
          <div
            ref={headingTextRef}
            className="flex flex-col w-11/12 mx-auto items-center gap-2 mt-[clamp(1.25rem,2.5vw,2rem)] text-center select-none"
          >
            <h1
              style={{ fontSize: "clamp(3.75rem, 8vw, 6rem)" }}
              className="leading-none tracking-wider text-cotton-candy-400 animate-glow-pulse-soft font-grand-hotel"
            >
              The Babes Club
            </h1>
            <p className=" hero__subtitle text-cotton-candy-100">
              Shop online for handmade jewelry
            </p>
          </div>
        </div>
      </section>

      <div ref={indicatorRef} className="hero__indicator">
        <ScrollIndicator />
      </div>
    </div>
  );
};

export default HeroClipReveal;

/*
Explanation of the GSAP timeline:
- We first capture the element's state with Flip.getState before moving it in the DOM.
- We then animate the clip-path from a collapsed polygon to a full rectangle to "reveal" the image area.
- Scale eases the perceived motion (zoom out slightly), matching the CodePen demo.
- Flip.to() animates the element from the heading container back to the original hero image container using the captured state.
- Finally, we scale the image back to 1 for a crisp final frame.

About clip-path:
- The initial CSS sets a polygon that effectively hides most of the image (a thin band).
- Animating to a full rectangle reveals the entire image.

Refs usage:
- Refs point to the key DOM nodes (containers and img) that GSAP needs to measure and animate.
*/
