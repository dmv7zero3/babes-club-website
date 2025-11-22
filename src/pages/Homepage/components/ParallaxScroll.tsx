import React, { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { useSplitTextReveal } from "@/lib/hooks/useSplitTextReveal";

// Simple sticky parallax section inspired by the referenced repo, implemented with GSAP ScrollTrigger.
// Layers move at different speeds using data-speed attributes. No code copied verbatim.

const IMAGES: string[] = [
  "/images/models/model-earrings-1.jpg",
  "/images/models/model-earrings-2.jpg",
  "/images/models/model-earrings-4.jpg",
];

const ParallaxScroll: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);

  // Debounced refresh for ScrollTrigger to avoid excessive recalculations
  const debouncedRefresh = useDebouncedCallback(() => {
    if (typeof window === "undefined") return;
    ScrollTrigger.refresh();
  }, 150);

  // Set up parallax animations once the component is laid out in the browser
  // (useLayoutEffect ensures measurements are correct before painting).
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context((self) => {
      const isDebug = (() => {
        try {
          const sp = new URLSearchParams(window.location.search);
          return (
            sp.has("parallaxDebug") ||
            localStorage.getItem("parallaxDebug") === "1"
          );
        } catch {
          return false;
        }
      })();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const layers = gsap.utils.toArray<HTMLElement>(
        section.querySelectorAll("[data-speed]")
      );

      // Detect an active ScrollSmoother instance exposed by the provider
      const Global: any = typeof window !== "undefined" ? window : {};
      const ActiveSmoother = Global.__scrollSmoother || null;
      const HasSmoother = !!ActiveSmoother;

      if (isDebug) {
        // Log basic diagnostics
        // eslint-disable-next-line no-console
        console.info("[ParallaxScroll] Debug on", {
          HasSmoother,
          layerCount: layers.length,
          speeds: layers.map((el) => el.getAttribute("data-speed")),
        });
      }

      {
        // Fallback: manual parallax using a single ScrollTrigger and quickSetters
        gsap.set(layers, { force3D: true, willChange: "transform" });

        const baseDistance = () => Math.max(window.innerHeight * 0.7, 400);
        const setters = layers.map((el) => gsap.quickSetter(el, "y", "px"));
        const getSpeed = (el: HTMLElement) =>
          parseFloat(el.getAttribute("data-speed") || "0");

        let dist = baseDistance();
        const updateAll = (progress: number) => {
          layers.forEach((el, i) => {
            const s = getSpeed(el);
            const y = gsap.utils.interpolate(s * dist, -s * dist, progress);
            setters[i](y);
          });
        };

        const st = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          // use a generous distance to verify motion; tweak as needed
          end: () => `+=${Math.max(window.innerHeight * 1.6, 1200)}`,
          pin: true,
          anticipatePin: 1,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateAll(self.progress),
          onRefresh: (self) => updateAll(self.progress),
          markers: isDebug,
        });

        // Initialize positions immediately
        updateAll(st.progress || 0);

        // Kill the manual trigger on cleanup
        self.add(() => st.kill());
      }

      // Refresh after images load to keep ScrollSmoother/ScrollTrigger in sync
      const imgs = Array.from(
        section.querySelectorAll<HTMLImageElement>("img")
      );
      imgs.forEach((img) => {
        if (!img.complete) {
          const onLoad = () => {
            if (isDebug)
              console.info("[ParallaxScroll] image load -> refresh", img.src);
            debouncedRefresh();
          };
          img.addEventListener("load", onLoad, { once: true });
          img.addEventListener("error", onLoad, { once: true });
        }
      });

      const onResize = () => {
        if (isDebug) console.info("[ParallaxScroll] resize -> refresh");
        debouncedRefresh();
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }, section);

    return () => {
      ctx.revert();
      debouncedRefresh.cancel();
    };
  }, []);

  // Animate headline characters once fonts are ready
  const splitTextOptions = useMemo(
    () => ({
      selector: "[data-split='headline']",
      splitOptions: { baseClass: "char", includeIndexClass: true },
      from: { y: 80, opacity: 0 },
      stagger: 0.06,
      duration: 0.4,
      ease: "none",
      waitForFonts: true,
      // Let the hook default the trigger to the container (sectionRef)
      scrollTrigger: {
        start: "top 30%",
        end: "+=800",
        scrub: true,
        markers: false,
        onEnter: () => {
          const el = sectionRef.current?.querySelector(
            "[data-split='headline']"
          ) as HTMLElement | null;
          if (el) gsap.set(el, { opacity: 1 });
        },
        onLeaveBack: () => {
          const el = sectionRef.current?.querySelector(
            "[data-split='headline']"
          ) as HTMLElement | null;
          if (el) gsap.set(el, { opacity: 0 });
        },
      },
    }),
    []
  );

  useSplitTextReveal(
    sectionRef as React.RefObject<HTMLElement>,
    splitTextOptions
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Parallax showcase"
      className="relative min-h-[250vh] w-full"
      id="parallax-section"
    >
      {/* Viewport for the parallax layers (ScrollTrigger will pin) */}
      <div className="relative h-[100svh] overflow-hidden">
        {/* Background gradient layer (slow) */}
        {/* <div
          aria-hidden
          data-speed={0.2}
          className="parallax-layer absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,220,238,0.18),rgba(0,0,0,0)_45%),radial-gradient(ellipse_at_bottom,rgba(202,180,255,0.22),rgba(0,0,0,0)_40%)]"
        /> */}

        {/* Large decorative headline (very slow) */}
        <div
          aria-hidden
          data-speed={1.1}
          className="parallax-layer absolute inset-x-0 top-[10%] flex justify-center pointer-events-none"
        >
          <h1
            data-split="headline"
            style={{ opacity: 0 }}
            className="p-5 pointer-events-none text-center whitespace-nowrap text-[clamp(40px,16vw,115px)] font-grand-hotel leading-none text-cotton-candy-400"
          >
            Holly Chronic
          </h1>
        </div>

        {/* CTA copy (fastest) */}
        <div
          data-speed={1.7}
          className="parallax-layer will-change-transform z-[50] absolute bottom-[8%] left-1/2 -translate-x-1/2"
        >
          {/* <div className="mx-auto max-w-[78vw]">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full shadow-lg bg-black/35 backdrop-blur-sm ring-1 ring-white/10">
              <span className="text-[clamp(16px,2.4vw,22px)] text-white/90">
                Handcrafted jewelry that moves with you.
              </span>
              <a
                href="/shop"
                className="shrink-0 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[0.85em] text-white/95 transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Explore the collection
              </a>
            </div>
          </div> */}
        </div>

        {/* Individually positioned photos with unique speeds */}
        <div className="absolute inset-0">
          {/* Photo 1 */}
          <figure
            aria-hidden
            data-speed={0.9}
            className="parallax-layer absolute left-[2%] md:left-[15%] top-[27%] z-20 overflow-hidden rounded-2xl md:rounded-2xl ring-1 ring-white/10 bg-black/30 pointer-events-none"
          >
            <div className="w-[48vw] h-[39vh] lg:h-[44vh] xs:w-[46vw] sm:w-[44vw] md:w-[38vw] lg:w-[34vw] xl:w-[21vw]">
              <img
                src={IMAGES[0]}
                alt="Parallax image 1"
                className="object-cover w-full h-full pointer-events-none select-none"
                draggable={false}
                loading="lazy"
                decoding="async"
                {...{ fetchpriority: "low" }}
              />
            </div>
          </figure>

          {/* Photo 2 */}
          <figure
            aria-hidden
            data-speed={1.1}
            className="parallax-layer absolute left-[17%] md:left-[42%] top-[68%] z-40 overflow-hidden rounded-2xl md:rounded-3xl ring-1 ring-white/10 bg-black/30 pointer-events-none"
          >
            <div className="w-[46vw] h-[42vh] xs:w-[44vw] sm:w-[42vw] md:w-[36vw] lg:w-[32vw] xl:w-[19vw]">
              <img
                src={IMAGES[2]}
                alt="Parallax image 3"
                className="object-cover w-full h-full pointer-events-none select-none"
                draggable={false}
                loading="lazy"
                decoding="async"
                {...{ fetchpriority: "low" }}
              />
            </div>
          </figure>

          {/* Photo 3 */}
          <figure
            aria-hidden
            data-speed={0.4}
            className="parallax-layer absolute right-[2%] md:right-[10%] top-[44%] z-30 overflow-hidden rounded-2xl md:rounded-3xl ring-1 ring-white/10 bg-black/30 pointer-events-none"
          >
            <div className="w-[42vw] h-[38vh] xs:w-[40vw] sm:w-[38vw] md:w-[32vw] lg:w-[24vw] xl:w-full">
              <img
                src={IMAGES[1]}
                alt="Parallax image 2"
                className="object-cover w-full h-full pointer-events-none select-none"
                draggable={false}
                loading="lazy"
                decoding="async"
                {...{ fetchpriority: "low" }}
              />
            </div>
          </figure>
        </div>
      </div>
      {/* Lightweight GPU/compositing hints for all layers */}
      <style>{`
        #parallax-section .parallax-layer {
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
          contain: layout paint style;
        }
      `}</style>
    </section>
  );
};

export default ParallaxScroll;
