import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import PrimaryGlowButton from "../../../../components/Buttons/Primary/Glow";
import OutlineGlowButton from "../../../../components/Buttons/Outline/Glow";
import { EMAIL } from "@/businessInfo/business";
import { initAboutHollyAnimation } from "./animation";
import "./AboutHolly.styles.css";

/**
 * AboutHolly
 * A responsive About section for the homepage highlighting the founder.
 * Uses an image from public assets: /images/models/holly-chronic.png
 */
const AboutHolly: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgVisible, setImgVisible] = useState(false);
  const replayArmedRef = useRef(true);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const cleanup = initAboutHollyAnimation(section);
    return () => cleanup();
  }, []);

  // Minimal fade in/out with replay gating:
  // - Fade in once when the section first enters view while scrolling down.
  // - Keep visible throughout this pass (no replays within the section).
  // - Fade out and re-arm only after the entire section is scrolled above the viewport.
  useEffect(() => {
    const section = sectionRef.current;
    const el = imgRef.current;
    if (!section || !el) return;

    let raf = 0;
    const update = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const srect = section.getBoundingClientRect();
      const sectionAbove = srect.bottom <= 0; // fully above
      const sectionBelow = srect.top >= vh; // fully below
      const sectionInView = !sectionAbove && !sectionBelow;

      if (sectionAbove) {
        // left above: fade out and arm a replay
        if (imgVisible) setImgVisible(false);
        replayArmedRef.current = true;
        return;
      }

      if (sectionInView) {
        if (replayArmedRef.current) {
          // first entry this pass: fade in and disarm
          if (!imgVisible) setImgVisible(true);
          replayArmedRef.current = false;
        } else {
          // keep visible during this pass
          if (!imgVisible) setImgVisible(true);
        }
        return;
      }
      // Section is fully below (pre-entry). Keep current state (usually hidden on initial load from top).
    };

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const contactEmail = EMAIL;

  return (
    <section
      ref={sectionRef}
      id="about-holly"
      className="relative py-16 about-holly sm:py-20"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-center w-11/12 gap-3 mx-auto mb-10">
          {/* <span className="w-1 h-6 rounded bg-white/80" aria-hidden /> */}
          <h2 className="header header-fluid " data-ah-heading>
            <span data-ah-heading-part>Meet Our Founder: </span>
            <span className="text-white" data-ah-heading-part>
              Holly Chronic
            </span>
          </h2>
        </div>

        <div className="grid items-start gap-14 md:grid-cols-2 ">
          <div className="order-2 md:order-1">
            <div className="prose prose-invert text-white/90 prose-p:leading-relaxed max-w-none">
              <p data-ah-paragraph>
                Holly has been a member of both the cnbs industry and the talent
                industry for 10+ years. Both extremely fulfilling, both needing
                crossover.
              </p>
              <p data-ah-paragraph>
                When opening{" "}
                <a
                  className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  href="https://www.instagram.com/thechronicshopdc/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @thechronicshopdc
                </a>{" "}
                in 2020, it became increasingly clear how hard it is to find
                both professional talent AND photographers comfortable around
                cnbs. This forced{" "}
                <a
                  className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  href="https://www.instagram.com/holly.chronic/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @holly.chronic
                </a>{" "}
                to be the face of her own company even though that was far from
                the plan.
              </p>
              <p data-ah-paragraph>
                With the market needing to be filled, and a squad of cnbs
                friendly enthusiasts and talent ready to be utilized, it only
                made sense to open{" "}
                <a
                  className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  href="https://www.instagram.com/thechronicagency/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @thechronicagency
                </a>
                .
              </p>
              <p data-ah-paragraph>
                Whether you need models, actors, talent of all kinds, and
                everything in between (photographers, reach out!!) we have what
                you need. And coming soon
                <a
                  className="ml-1 text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  href="https://www.instagram.com/thechronicmarketingfirm/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  @thechronicmarketingfirm
                </a>
                <span role="img" aria-label="eyes">
                  {" "}
                  👀
                </span>
              </p>
            </div>

            <blockquote
              className="p-6 mt-8 text-white border border-white/20 rounded-xl bg-white/5"
              data-ah-quote
            >
              <p className="italic">
                “Thank you so much for coming on this journey with me.”
              </p>
              <footer className="mt-3 font-medium text-white/80">
                Love Always, Holly Chronic
              </footer>
            </blockquote>

            <div className="flex flex-wrap gap-3 mt-8" data-ah-cta>
              <PrimaryGlowButton
                href="https://www.instagram.com/thechronicagency/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Book Talent
              </PrimaryGlowButton>
              <OutlineGlowButton href={`mailto:${contactEmail}`}>
                Contact
              </OutlineGlowButton>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-visible md:max-w-none">
              {/* Optimized sources with AVIF/WebP + JPG fallback */}
              <picture>
                <source
                  srcSet="/images/models/holly-chronic-2.avif"
                  type="image/avif"
                />
                <source
                  srcSet="/images/models/holly-chronic-2.webp"
                  type="image/webp"
                />
                <img
                  src="/images/models/holly-chronic-2.jpg"
                  alt="Founder portrait"
                  ref={imgRef}
                  className={`object-contain w-full h-full glow-white-soft will-change-transform transition duration-700 ease-out ${imgVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHolly;
