import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import {
  splitTextElementToSpans,
  type SplitTextResult,
} from "@/utils/splitText";

gsap.registerPlugin(Flip);

type HeroRefs = {
  wrapperRef: React.RefObject<HTMLDivElement>;
  heroRef: React.RefObject<HTMLElement>;
  heroImageRef: React.RefObject<HTMLDivElement>;
  originalImageContainerRef: React.RefObject<HTMLDivElement>;
  headingImageContainerRef: React.RefObject<HTMLDivElement>;
  imgRef: React.RefObject<HTMLImageElement>;
  headingTextRef: React.RefObject<HTMLDivElement>;
  indicatorRef: React.RefObject<HTMLDivElement>;
};

type HeroOptions = {
  duration?: number;
  delay?: number;
};

export function initHeroClipRevealAnimation(
  refs: HeroRefs,
  opts: HeroOptions = {}
) {
  const {
    heroImageRef,
    originalImageContainerRef,
    headingImageContainerRef,
    imgRef,
    headingTextRef,
    indicatorRef,
  } = refs;

  const duration = opts.duration ?? 1;
  const delay = opts.delay ?? 0;

  const heroImageEl = heroImageRef.current;
  const originalImageContainerEl = originalImageContainerRef.current;
  const headingImageContainerEl = headingImageContainerRef.current;
  const imgEl = imgRef.current;
  const headingTextEl = headingTextRef.current;
  const indicatorEl = indicatorRef.current;

  if (
    !heroImageEl ||
    !originalImageContainerEl ||
    !headingImageContainerEl ||
    !imgEl
  ) {
    return () => {};
  }

  let active = true;
  let currentTimeline: gsap.core.Timeline | null = null;
  let headingSplit: SplitTextResult | null = null;
  let subtitleSplit: SplitTextResult | null = null;
  const hasPlayedRef = { current: false };

  const runAnimation = () => {
    if (!active || hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    currentTimeline?.kill();
    gsap.set([originalImageContainerEl, imgEl], { clearProps: "all" });
    if (headingTextEl) gsap.set(headingTextEl, { autoAlpha: 0, y: 12 });
    if (indicatorEl) gsap.set(indicatorEl, { autoAlpha: 0, y: 8 });

    if (headingSplit) {
      headingSplit.revert();
      headingSplit = null;
    }
    if (subtitleSplit) {
      subtitleSplit.revert();
      subtitleSplit = null;
    }

    if (originalImageContainerEl.parentElement !== heroImageEl) {
      heroImageEl.appendChild(originalImageContainerEl);
    }

    const state = Flip.getState(originalImageContainerEl);
    headingImageContainerEl.appendChild(originalImageContainerEl);

    gsap.set(imgEl, { scale: 1.8, willChange: "transform" });

    const tl = gsap.timeline({ defaults: { ease: "power4.inOut" }, delay });

    tl.to(
      originalImageContainerEl,
      {
        clipPath: "polygon(100% 100%, 0% 100%, 0% 0%, 100% 0%)",
        duration,
        ease: "power4.in",
      },
      0
    ).to(
      imgEl,
      {
        scale: 1.5,
        duration,
        ease: "power4.in",
      },
      0
    );

    tl.add(
      Flip.to(state, {
        duration,
        absolute: true,
        ease: "power4.out",
        delay: 0.1,
      })
    );

    tl.to(
      imgEl,
      {
        scale: 1,
        duration,
        ease: "power4.out",
      },
      "+=0"
    );

    if (headingTextEl) {
      const h1El = headingTextEl.querySelector("h1") as HTMLElement | null;
      const subEl = headingTextEl.querySelector(
        ".hero__subtitle"
      ) as HTMLElement | null;
      if (h1El) {
        headingSplit = splitTextElementToSpans(h1El, {
          baseClass: "hero-char",
          includeIndexClass: false,
          preserveSpaces: true,
        });
        gsap.set(headingSplit.spans, { autoAlpha: 0, y: 12 });

        tl.to(
          headingTextEl,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.2,
            ease: "power2.out",
          },
          ">-0.1"
        ).to(
          headingSplit.spans,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.03,
          },
          "<"
        );

        if (subEl) {
          subtitleSplit = splitTextElementToSpans(subEl, {
            baseClass: "hero-sub-char",
            includeIndexClass: false,
            preserveSpaces: true,
          });
          gsap.set(subtitleSplit.spans, { autoAlpha: 0, y: 10 });

          tl.to(
            subtitleSplit.spans,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              stagger: 0.015,
            },
            ">-0.05"
          );
        }
      }
    }

    if (indicatorEl) {
      tl.to(
        indicatorEl,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "<0.1"
      );
    }

    currentTimeline = tl;
  };

  const startWhenReady = () => {
    if (!imgEl) return;
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      runAnimation();
    } else {
      const onLoad = () => runAnimation();
      imgEl.addEventListener("load", onLoad, { once: true });
    }
  };

  startWhenReady();

  // Removed resize re-triggering to avoid user-controlled replay.
  // If a responsive recalculation is ever needed in the future,
  // it should not reset hasPlayedRef or replay the animation.

  return () => {
    active = false;
    currentTimeline?.kill();
    if (headingSplit) headingSplit.revert();
    if (subtitleSplit) subtitleSplit.revert();
    if (
      originalImageContainerEl &&
      heroImageEl &&
      originalImageContainerEl.parentElement !== heroImageEl
    ) {
      heroImageEl.appendChild(originalImageContainerEl);
    }
  };
}
