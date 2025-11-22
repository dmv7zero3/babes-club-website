import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ADJECTIVES = [
  "Handmade Jewelry",
  "by Holly Chronic",
  // "Cannabis Lifestyle",
  // "Iconic",
] as const;

export default function AdjectivesScroller() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // words NodeList inside this section
    const words = Array.from(
      section.querySelectorAll<HTMLElement>(".adjective")
    );

    // Extend scroll length by the count of words (minus last) to allow pin + transitions
    section.style.marginBottom = `${Math.max(0, words.length - 1) * 100}vh`;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${words.length * 100}%`,
          scrub: true,
          pin: true,
          pinSpacing: false,
          markers: false,
        },
      });

      // Ensure all words start hidden/stacked, centered, and animate from their own center
      gsap.set(words, {
        autoAlpha: 0,
        yPercent: 20,
        transformOrigin: "50% 50%",
        willChange: "transform, opacity",
      });

      words.forEach((word, i) => {
        // fade/slide in
        tl.fromTo(
          word,
          { yPercent: 20, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 1 }
        );
        // fade/slide out for all but the last word
        if (i < words.length - 1) {
          tl.to(word, { yPercent: -20, autoAlpha: 0, duration: 1 });
        }
      });

      // small pause at the end
      tl.to({}, { duration: 0.5 });

      // Refresh on resize
      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section1"
      ref={sectionRef}
      className="relative flex items-center justify-center w-full min-h-[90vh] overflow-hidden word-section"
      // optional inline style for stacking context
      style={{ isolation: "isolate" }}
    >
      <div className="relative flex items-center justify-center w-full text-center adjectives">
        {ADJECTIVES.map((word) => (
          <span
            key={word}
            className="absolute text-4xl font-light leading-none tracking-tight text-center -translate-x-1/2 -translate-y-1/2 font-lato text-cotton-candy-400 adjective left-1/2 top-1/2"
            style={{ whiteSpace: "nowrap", transformOrigin: "-50% -50%" }}
          >
            {word}
          </span>
        ))}
      </div>
    </section>
  );
}
