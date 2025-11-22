import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function BrandMarquee() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const headline = headlineRef.current;
    if (!section || !headline) return;

    const ctx = gsap.context(() => {
      const totalDistance = () => section.clientWidth + headline.scrollWidth;

      // start fully off to the right by the viewport width
      gsap.set(headline, {
        x: () => section.clientWidth,
        willChange: "transform",
      });

      const tween = gsap.to(headline, {
        x: () => -headline.scrollWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalDistance()}`,
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: false,
        },
      });

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section2"
      ref={sectionRef}
      className="relative flex items-center justify-start w-full h-screen overflow-hidden"
    >
      <h1
        ref={headlineRef}
        className="absolute text-white -translate-y-1/2 top-1/2 whitespace-nowrap font-lato"
        style={{
          fontSize: "clamp(18rem, 40vw, 64rem)",
          lineHeight: 0.95 as number,
          willChange: "transform",
        }}
      >
        The Babes Club
      </h1>
    </section>
  );
}
