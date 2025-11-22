import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import businessData from "@/businessInfo/business-data.json";

export default function VerticalAbout() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const colLeftRef = useRef<HTMLDivElement | null>(null);
  const debouncedRefresh = useDebouncedCallback(() => {
    if (typeof window === "undefined") return;
    ScrollTrigger.refresh();
  }, 150);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Skip animations if user prefers reduced motion
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const SHOW_MARKERS = false; // set true to debug

      // Right column: full-height sections; one visible at a time via fade in/out
      const itemSections = Array.from(
        section.querySelectorAll<HTMLElement>(".about-item-section")
      );

      itemSections.forEach((el) => {
        const header = el.querySelector("h3");
        const paragraph = el.querySelector("p");
        if (!header || !paragraph) return;

        gsap.set([header, paragraph], {
          autoAlpha: 0,
          yPercent: 20,
          // Remove scaling to avoid text resampling during scroll
          force3D: true,
          willChange: "transform, opacity",
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 65%", // start later to avoid pin transitions
            end: "bottom 35%", // finish earlier to leave room for next pin
            scrub: true,
            invalidateOnRefresh: true,
            refreshPriority: -10, // run after pinned sections
            markers: SHOW_MARKERS,
          },
        });

        // Enter
        tl.to([header, paragraph], {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power1.out",
        });
        // Exit
        tl.to([header, paragraph], {
          autoAlpha: 0,
          yPercent: -20,
          duration: 0.5,
          stagger: 0.05,
          ease: "power1.in",
        });
      });

      window.addEventListener("resize", debouncedRefresh);

      return () => {
        window.removeEventListener("resize", debouncedRefresh);
      };
    }, section);

    return () => {
      ctx.revert();
      debouncedRefresh.cancel();
    };
  }, []);

  const items = [
    { title: "About", text: businessData.description },
    { title: "Tagline", text: businessData.tagline },
    {
      title: "Specialties",
      text: businessData.specialties?.slice(0, 6).join(" • "),
    },
    {
      title: "Service Options",
      text: businessData.features?.service_options?.slice(0, 5).join(" • "),
    },
  ].filter((i) => i.text);

  return (
    <section id="vertical" ref={sectionRef} className="w-screen py-16 isolate">
      <div className="h-full max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
        <div className="grid items-start grid-cols-2 gap-10 ">
          {/* Left column: sticky heading */}
          <div ref={colLeftRef} className="sticky top-24">
            <h2 className="text-4xl font-extrabold uppercase leading-[0.9] sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block pl-4 border-l-4 border-rose-300">
                About
              </span>
              <span className="block pl-4 border-l-4 border-rose-300">
                The Babes
              </span>
              <span className="block pl-4 border-l-4 border-rose-300">
                Club
              </span>
            </h2>
          </div>

          {/* Right column: full-height sections, one visible at a time */}
          <div>
            {items.map((item) => (
              <section
                key={item.title}
                className="relative flex items-center min-h-[85vh] md:min-h-[90vh] lg:min-h-screen py-12 about-item-section [content-visibility:auto] [contain-intrinsic-size:1px_1000px]"
              >
                <div className="max-w-prose">
                  <h3 className="text-sm font-semibold tracking-wide uppercase md:text-base text-rose-300">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-[clamp(1.25rem,2.2vw,2.35rem)] text-white/90">
                    {item.text}
                  </p>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
