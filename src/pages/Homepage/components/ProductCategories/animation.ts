import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  splitTextElementToSpans,
  type SplitTextResult,
} from "@/utils/splitText";

export type SetupOptions = {
  respectReducedMotion?: boolean;
};

export function setupProductCategoriesAnimation(
  section: HTMLElement,
  opts: SetupOptions = {}
): () => void {
  const { respectReducedMotion = true } = opts;

  if (typeof window === "undefined") return () => {};
  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = respectReducedMotion
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Use a GSAP context bound to the section for easy cleanup
  const ctx = gsap.context(() => {
    // Animate the section heading characters on enter
    const heading = section.querySelector<HTMLElement>("[data-pc-heading]");
    let headingSplit: SplitTextResult | null = null;
    if (heading) {
      if (prefersReduced) {
        gsap.set(heading, { autoAlpha: 1, y: 0 });
      } else {
        headingSplit = splitTextElementToSpans(heading, {
          baseClass: "pc-char",
          includeIndexClass: false,
          preserveSpaces: true,
        });
        const chars = headingSplit.spans;
        gsap.set(chars, { autoAlpha: 0, y: 12 });

        const tl = gsap.timeline({ paused: true });
        tl.to(chars, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.03,
          overwrite: true,
        });

        let headingState: "initial" | "animating" | "done" = "initial";

        const playHeading = () => {
          if (headingState !== "initial") return;
          headingState = "animating";
          tl.play(0);
        };

        const revealHeadingInstantly = () => {
          if (headingState === "done") return;
          headingState = "done";
          tl.progress(1);
        };

        tl.eventCallback("onComplete", () => {
          headingState = "done";
        });

        ScrollTrigger.create({
          trigger: heading,
          start: "top 85%",
          end: "bottom 10%",
          onEnter: (self) => {
            if (headingState !== "initial") return;
            if (self.direction < 0) {
              revealHeadingInstantly();
              return;
            }
            playHeading();
          },
          onEnterBack: (self) => {
            if (headingState !== "initial") return;
            if (self.direction > 0) {
              playHeading();
            } else {
              revealHeadingInstantly();
            }
          },
        });
      }
    }
    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".blob-card")
    );

    if (prefersReduced) {
      cards.forEach((card) => {
        const media = card.querySelector<HTMLElement>(".blob-media");
        const title = card.querySelector<HTMLElement>(".blob-title");
        gsap.set([media, title].filter(Boolean) as HTMLElement[], {
          autoAlpha: 1,
          y: 0,
          clearProps: "transform",
        });
      });
      return;
    }

    cards.forEach((card) => {
      const media = card.querySelector<HTMLElement>(".blob-media");
      const title = card.querySelector<HTMLElement>(".blob-title");
      if (!media || !title) return;

      gsap.set([media, title], {
        autoAlpha: 0,
        y: 24,
        willChange: "opacity, transform",
        force3D: true,
      });

      const tl = gsap
        .timeline({ paused: true, defaults: { ease: "power2.out" } })
        .to(media, { autoAlpha: 1, y: 0, duration: 0.8 })
        .to(title, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.25");

      let hasAnimated = false;

      const animateCard = () => {
        if (hasAnimated) return;
        hasAnimated = true;
        gsap.set([media, title], {
          willChange: "opacity, transform",
          force3D: true,
        });
        tl.play(0);
      };

      const revealCardInstantly = () => {
        if (hasAnimated) return;
        hasAnimated = true;
        gsap.set([media, title], {
          autoAlpha: 1,
          y: 0,
          willChange: "auto",
          force3D: false,
        });
      };

      tl.eventCallback("onComplete", () => {
        gsap.set([media, title], {
          willChange: "auto",
          force3D: false,
        });
      });

      ScrollTrigger.create({
        trigger: card,
        start: "top 80%",
        end: "bottom 60%",
        invalidateOnRefresh: true,
        onEnter: (self) => {
          if (hasAnimated) return;
          if (self.direction < 0) {
            revealCardInstantly();
            return;
          }
          animateCard();
        },
        onEnterBack: (self) => {
          if (hasAnimated) return;
          if (self.direction > 0) {
            animateCard();
          } else {
            revealCardInstantly();
          }
        },
      });

      // If already in view at mount time, animate immediately
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const rect = card.getBoundingClientRect();
      if (rect.top <= vh * 0.8 && rect.bottom >= 0) {
        animateCard();
      }
    });

    // Ensure proper measurements after image sizing
    gsap.delayedCall(0, () => ScrollTrigger.refresh());

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      // Cleanup heading split
      if (headingSplit) headingSplit.revert();
      window.removeEventListener("resize", onResize);
    };
  }, section);

  // Return cleanup to revert context and kill triggers
  return () => ctx.revert();
}

export default setupProductCategoriesAnimation;
