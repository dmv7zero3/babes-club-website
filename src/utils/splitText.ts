// src/utils/splitText.ts
// Utility to split a text element into individual character spans for animation.
// This avoids using GSAP's paid SplitText plugin while enabling similar effects.

export type SplitTextOptions = {
  baseClass?: string; // base class added to each span (default: 'char')
  includeIndexClass?: boolean; // add class with index (e.g., char-1)
  preserveSpaces?: boolean; // convert spaces to non-breaking spaces
  wrapperTag?: keyof HTMLElementTagNameMap; // element to wrap each char (default: 'span')
};

export type SplitTextResult = {
  spans: HTMLSpanElement[];
  revert: () => void; // restore original content
};

export function splitTextElementToSpans(
  el: HTMLElement,
  options: SplitTextOptions = {}
): SplitTextResult {
  const {
    baseClass = "char",
    includeIndexClass = true,
    preserveSpaces = true,
    wrapperTag = "span",
  } = options;

  // Store original content to allow clean revert
  const originalHTML = el.innerHTML;
  const text = el.textContent ?? "";

  // Clear element and rebuild with spans
  el.innerHTML = "";
  const spans: HTMLSpanElement[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const span = document.createElement(wrapperTag) as HTMLSpanElement;

    // Preserve spaces to maintain layout and kerning
    span.textContent = ch === " " && preserveSpaces ? "\u00A0" : ch;

    const classes = [baseClass];
    if (includeIndexClass) classes.push(`${baseClass}-${i + 1}`);
    span.className = classes.join(" ");

    el.appendChild(span);
    spans.push(span);
  }

  const revert = () => {
    el.innerHTML = originalHTML;
  };

  return { spans, revert };
}
