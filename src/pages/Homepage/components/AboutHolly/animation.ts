import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitTextElementToSpans } from "@/utils/splitText";

// Simple line splitter using <span class="line"> wrappers based on clientRects.
// This keeps the DOM minimal and avoids external dependencies.
function splitIntoLines(el: HTMLElement): HTMLElement[] {
  // Reset any previous splits
  const prev = el.querySelectorAll("span.__line");
  if (prev.length) {
    const parent = prev[0].parentElement as HTMLElement;
    parent.innerHTML = parent.textContent || "";
  }

  const text = el.textContent || "";
  el.innerHTML = text;

  // Wrap words to allow measuring line breaks
  const words = text.split(/(\s+)/).filter(Boolean);
  el.innerHTML = words
    .map((w) => `<span class="__word inline-block whitespace-pre">${w}</span>`)
    .join("");

  // Group words that share the same top into lines
  const wordEls = Array.from(el.querySelectorAll<HTMLElement>("span.__word"));
  const lines: HTMLElement[][] = [];
  let currentTop: number | null = null;
  let currentLine: HTMLElement[] = [];

  wordEls.forEach((w) => {
    const top = w.getBoundingClientRect().top;
    if (currentTop === null) {
      currentTop = top;
      currentLine = [w];
      return;
    }
    if (Math.abs(top - currentTop) <= 1) {
      currentLine.push(w);
    } else {
      lines.push(currentLine);
      currentLine = [w];
      currentTop = top;
    }
  });
  if (currentLine.length) lines.push(currentLine);

  // Replace words with line wrappers
  el.innerHTML = "";
  const lineEls: HTMLElement[] = [];
  lines.forEach((line) => {
    const lineSpan = document.createElement("span");
    lineSpan.className = "block __line will-change-transform";
    line.forEach((w) => lineSpan.appendChild(w));
    el.appendChild(lineSpan);
    lineEls.push(lineSpan);
  });

  return lineEls;
}

export function initAboutHollyAnimation(section: HTMLElement) {
  if (typeof window === "undefined") return () => {};
  gsap.registerPlugin(ScrollTrigger);

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const ctx = gsap.context(() => {
    const SHOW_MARKERS = false;

    const image = section.querySelector<HTMLElement>("[data-ah-image]");
    const heading = section.querySelector<HTMLElement>("[data-ah-heading]");
    const headingParts = heading
      ? Array.from(
          heading.querySelectorAll<HTMLElement>("[data-ah-heading-part]")
        )
      : [];
    const paragraphs = Array.from(
      section.querySelectorAll<HTMLElement>("[data-ah-paragraph]")
    );
    const quote = section.querySelector<HTMLElement>("[data-ah-quote]");
    const cta = section.querySelector<HTMLElement>("[data-ah-cta]");

    if (prefersReduced) {
      gsap.set(
        [image, ...paragraphs, quote, cta].filter(Boolean) as HTMLElement[],
        {
          autoAlpha: 1,
          y: 0,
          clearProps: "transform",
        }
      );
      return;
    }

    // Char-by-char heading animation
    let headingReverts: Array<() => void> = [];
    if (heading && headingParts.length) {
      const allChars: HTMLElement[] = [];
      headingParts.forEach((part) => {
        const { spans, revert } = splitTextElementToSpans(part, {
          baseClass: "char",
          includeIndexClass: false,
          // Use normal spaces so lines can wrap on mobile
          preserveSpaces: false,
        });
        headingReverts.push(revert);
        allChars.push(...spans);
      });

      gsap.set(allChars, { autoAlpha: 0, y: 14 });

      const playIn = () =>
        gsap.to(allChars, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.015,
        });
      const playOut = (dir: "up" | "down") =>
        gsap.to(allChars, {
          autoAlpha: 0,
          y: dir === "up" ? -14 : 14,
          duration: 0.45,
          ease: "power2.inOut",
          stagger: 0.01,
        });

      ScrollTrigger.create({
        trigger: heading,
        start: "top bottom",
        end: "bottom top",
        onEnter: playIn, // play when first entering while scrolling down
        // do not replay on onEnterBack to avoid replays within the same pass
        // keep visible when leaving bottom; only reset when scrolled above completely
        onLeaveBack: () => playOut("down"),
      });

      // Ensure cleanup restores original text
      // Ensure cleanup restores original text handled in return below
    }

    // Image: fade/slide in and out, replay on re-entry
    if (image) {
      gsap.set(image, { autoAlpha: 0, y: 24 });
      const enter = () =>
        gsap.to(image, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      const exit = (dir: "up" | "down") =>
        gsap.to(image, {
          autoAlpha: 0,
          y: dir === "up" ? -24 : 24,
          duration: 0.55,
          ease: "power2.inOut",
        });

      ScrollTrigger.create({
        trigger: image,
        start: "top bottom",
        end: "bottom top",
        onEnter: enter,
        onLeaveBack: () => exit("down"),
        markers: SHOW_MARKERS,
      });
    }

    // Animate paragraphs line-by-line
    paragraphs.forEach((p) => {
      // Split into lines and set initial state
      const lines = splitIntoLines(p);
      gsap.set(lines, { autoAlpha: 0, y: 18 });

      const tlIn = gsap.timeline({ paused: true });
      tlIn.to(lines, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.06,
      });

      const fadeOut = (dir: "up" | "down") =>
        gsap.to(lines, {
          autoAlpha: 0,
          y: dir === "up" ? -18 : 18,
          duration: 0.5,
          ease: "power2.inOut",
          stagger: 0.05,
        });

      ScrollTrigger.create({
        trigger: p,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => tlIn.restart(true),
        // Don't replay on upward re-entry within the same pass
        // Keep visible when leaving bottom; reset only when scrolled above completely
        onLeaveBack: () => fadeOut("down"),
        markers: SHOW_MARKERS,
      });
    });

    // Quote block: fade/slide as a whole
    if (quote) {
      gsap.set(quote, { autoAlpha: 0, y: 18 });
      const enter = () =>
        gsap.to(quote, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      const exit = (dir: "up" | "down") =>
        gsap.to(quote, {
          autoAlpha: 0,
          y: dir === "up" ? -18 : 18,
          duration: 0.5,
          ease: "power2.inOut",
        });

      ScrollTrigger.create({
        trigger: quote,
        start: "top bottom",
        end: "bottom top",
        onEnter: enter,
        onLeaveBack: () => exit("down"),
      });
    }

    // CTA group: fade/slide as a whole
    if (cta) {
      gsap.set(cta, { autoAlpha: 0, y: 18 });
      const enter = () =>
        gsap.to(cta, {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      const exit = (dir: "up" | "down") =>
        gsap.to(cta, {
          autoAlpha: 0,
          y: dir === "up" ? -18 : 18,
          duration: 0.5,
          ease: "power2.inOut",
        });

      ScrollTrigger.create({
        trigger: cta,
        start: "top bottom",
        end: "bottom top",
        onEnter: enter,
        onLeaveBack: () => exit("down"),
      });
    }

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      // Revert heading split if applied
      if (headingReverts && headingReverts.length) {
        headingReverts.forEach((r) => r());
      }
    };
  }, section);

  return () => ctx.revert();
}
