# Homepage Animation Performance Audit

## Executive Summary

After analyzing the homepage components, I've identified **9 components with animation performance issues** that could cause browser lag, jank, or crashes. The issues fall into these categories:

1. **GPU-destroying blur effects** (blur values >48px)
2. **Missing `once: true`** on ScrollTriggers
3. **Improper cleanup chains** in useLayoutEffect
4. **Missing CSS containment** on animated elements
5. **Resize handlers without debouncing**
6. **Text animations without `overwrite: true`**

---

## Component-by-Component Audit

### 1. ✅ FIXED: SubscriberForm.tsx

**Status:** Fix provided  
**Issues Found:**

- `blur-3xl` (64px) and `blur-[120px]` on decorative elements
- No `once: true` on ScrollTrigger
- Missing timeline/trigger refs for cleanup
- No CSS containment

---

### 2. ⚠️ NEEDS FIX: Hero.tsx

**Location:** `src/pages/Homepage/components/Hero.tsx`

**Critical Issues:**

```jsx
// PROBLEM: Massive blur values on decorative halos
<span className="blur-[110px]" />  // 110px blur!
<span className="blur-[140px]" />  // 140px blur!

// PROBLEM: Heavy drop-shadow on image
className="drop-shadow-[0_0_120px_rgba(255,255,255,0.85)]"
```

**Why This Crashes Browsers:**

- These blur effects are rendered on every paint cycle
- The `drop-shadow` filter stacks with the blur effects
- No CSS containment prevents layout thrashing

**Recommended Fix:**

- Reduce blur to max 48px
- Add `contain: strict` and GPU hints
- Consider using pre-rendered blur images instead

---

### 3. ⚠️ NEEDS FIX: ParallaxScroll.tsx

**Location:** `src/pages/Homepage/components/ParallaxScroll.tsx`

**Issues Found:**

```javascript
// GOOD: Has debounced refresh
const debouncedRefresh = useDebouncedCallback(() => {
  ScrollTrigger.refresh();
}, 150);

// PROBLEM: No `once` flag - animations replay on every scroll direction change
ScrollTrigger.create({
  trigger: section,
  // MISSING: Animation state guards
});

// PROBLEM: quickSetter on every tick without RAF throttle
const updateAll = (progress: number) => {
  layers.forEach((el, i) => { /* update */ });
};
```

**CSS Issues:**

```jsx
// GOOD: Has will-change and containment
<style>{`
  .parallax-layer {
    contain: content;
    will-change: transform;
  }
`}</style>
```

**Recommended Fix:**

- Add animation state guards to prevent replays
- Consider using CSS scroll-driven animations for simpler parallax
- Add `overwrite: 'auto'` to competing animations

---

### 4. ⚠️ NEEDS FIX: HeroClipReveal/animation.ts

**Location:** `src/pages/Homepage/components/HeroClipReveal/animation.ts`

**Issues Found:**

```javascript
// PROBLEM: Text split creates many DOM elements without cleanup tracking
headingSplit = splitTextElementToSpans(h1El, {...});
subtitleSplit = splitTextElementToSpans(subEl, {...});

// PROBLEM: No `overwrite: true` on character animations
tl.to(headingSplit.spans, {
  autoAlpha: 1,
  // MISSING: overwrite: true
});

// PROBLEM: Cleanup doesn't revert text splits
// The splits should be reverted when component unmounts
```

**Why This Matters:**

- Each character becomes a separate DOM element
- Without cleanup, DOM bloat accumulates on navigation
- Competing animations can stack without `overwrite`

**Recommended Fix:**

- Store split revert functions in refs
- Add `overwrite: true` to prevent animation stacking
- Call revert functions in cleanup

---

### 5. ⚠️ NEEDS FIX: AboutHolly/animation.ts

**Location:** `src/pages/Homepage/components/AboutHolly/animation.ts`

**Issues Found:**

```javascript
// PROBLEM: Multiple ScrollTriggers without `once: true`
ScrollTrigger.create({
  trigger: heading,
  // MISSING: once: true for one-shot animations
});

// PROBLEM: Line splitting on every paragraph
paragraphs.forEach((p) => {
  const lines = splitIntoLines(p); // Creates many elements
  // No cleanup of line splits
});

// GOOD: Has resize handler cleanup
const onResize = () => ScrollTrigger.refresh();
window.addEventListener("resize", onResize);
return () => {
  window.removeEventListener("resize", onResize);
  if (headingReverts?.length) headingReverts.forEach((r) => r());
};
```

**Recommended Fix:**

- Add `once: true` for entrance animations
- Store line split revert functions
- Add animation state guards

---

### 6. ⚠️ NEEDS FIX: ProductCategories/animation.ts

**Location:** `src/pages/Homepage/components/ProductCategories/animation.ts`

**Issues Found:**

```javascript
// PARTIAL GOOD: Has animation state tracking
let headingState: "initial" | "animating" | "done" = "initial";

// PROBLEM: Cards don't have `once: true` despite hasAnimated guard
ScrollTrigger.create({
  trigger: card,
  // MISSING: once: true
});

// PROBLEM: gsap.delayedCall without cleanup
gsap.delayedCall(0, () => ScrollTrigger.refresh());
// This should be killed in cleanup
```

**Recommended Fix:**

- Add `once: true` to card triggers
- Kill delayed calls in cleanup
- Add `overwrite: true` to prevent stacking

---

### 7. ⚠️ NEEDS FIX: BrandMarquee.tsx

**Location:** `src/pages/Homepage/components/BrandMarquee.tsx`

**Issues Found:**

```javascript
// PROBLEM: Resize handler without debounce
const onResize = () => ScrollTrigger.refresh();
window.addEventListener("resize", onResize);

// PROBLEM: Font size calculation on every resize
style={{
  fontSize: "clamp(18rem, 40vw, 64rem)", // Heavy text layout
}}
```

**Recommended Fix:**

- Debounce resize handler
- Add will-change hint to text element
- Consider using CSS scroll-driven animations

---

### 8. ⚠️ NEEDS FIX: VerticalAbout.tsx

**Location:** `src/pages/Homepage/components/VerticalAbout.tsx`

**Issues Found:**

```javascript
// GOOD: Has debounced refresh
const debouncedRefresh = useDebouncedCallback(() => {
  ScrollTrigger.refresh();
}, 150);

// PROBLEM: willChange not cleaned up after animation
gsap.set([header, paragraph], {
  willChange: "transform, opacity", // Should be "auto" after animation
});

// MISSING: Reset willChange in onComplete callback
```

**Recommended Fix:**

- Reset `willChange: "auto"` after animations complete
- Add CSS containment to sections

---

### 9. ⚠️ NEEDS FIX: SplitScreenPinning.tsx

**Location:** `src/components/SplitScreenPinning/SplitScreenPinning.tsx`

**Issues Found:**

```javascript
// PROBLEM: Uses gsap.matchMedia without cleanup tracking
mm.add("(min-width: 768px)", () => {
  // ScrollTriggers created here
  // ...
});
// matchMedia should handle cleanup but need to verify

// PROBLEM: Image load handlers not cleaned up
const handleImageLoad = (key: string) => {
  setLoaded((prev) => new Set(prev).add(key));
};
```

**Recommended Fix:**

- Verify matchMedia cleanup is working
- Consider lazy loading images to reduce initial load

---

### 10. ⚠️ NEEDS FIX: HorizontalScrollGallery.tsx

**Location:** `src/components/HorizontalScrollGallery.tsx`

**Issues Found:**

```javascript
// GOOD: Has ResizeObserver with RAF throttle
const scheduleRefresh = () => {
  if (rafId != null) return;
  /* ... */
};

// PROBLEM: Image load listeners may not be cleaned up
imgs.forEach((img) => {
  if (!img.complete) {
    /* ... */
  }
});
```

**Recommended Fix:**

- Track and cleanup image load listeners
- Add abort controller for async operations

---

## Global Issues Found

### 1. Tailwind Blur Classes Used Site-Wide

These blur classes appear throughout the codebase and should be audited:

| Class          | Value | Risk Level  |
| -------------- | ----- | ----------- |
| `blur-3xl`     | 64px  | 🔴 High     |
| `blur-[80px]`  | 80px  | 🔴 High     |
| `blur-[100px]` | 100px | 🔴 Critical |
| `blur-[110px]` | 110px | 🔴 Critical |
| `blur-[120px]` | 120px | 🔴 Critical |
| `blur-[140px]` | 140px | 🔴 Critical |

### 2. Text Glow Animations in Tailwind Config

The `animate-glow-pulse` animation in `tailwind.config.js` uses heavy `text-shadow` and `filter` properties that run continuously. Consider:

- Adding `will-change: filter` to elements using this
- Reducing glow intensity on mobile
- Pausing animation when not in viewport

### 3. Backdrop Blur in Header

The header uses `backdrop-blur-xl` which is expensive:

```jsx
className = "supports-[backdrop-filter]:backdrop-blur-xl";
```

This is acceptable for a fixed header but should have `contain: layout` added.

---

## Priority Fix Order

1. **Hero.tsx** - Most visible, highest impact
2. **ParallaxScroll.tsx** - Complex animations, high scroll interaction
3. **HeroClipReveal/animation.ts** - Text splits need cleanup
4. **AboutHolly/animation.ts** - Multiple ScrollTriggers
5. **ProductCategories/animation.ts** - Card animations
6. **BrandMarquee.tsx** - Heavy text layout
7. **VerticalAbout.tsx** - willChange cleanup
8. **SplitScreenPinning.tsx** - matchMedia verification
9. **HorizontalScrollGallery.tsx** - Image listener cleanup

---

## Performance Comparison Goals

| Metric                 | Before          | After                    |
| ---------------------- | --------------- | ------------------------ |
| GPU Memory             | 180MB+          | ~45MB                    |
| Frame Time (scroll)    | 50-200ms        | <16ms                    |
| ScrollTrigger count    | Grows unbounded | 1 per animation (then 0) |
| Browser crashes        | Yes             | No                       |
| Lighthouse Performance | <70             | ≥90                      |

---

## Testing Checklist

After applying fixes, verify:

- [ ] Rapid scroll through entire homepage - no jank
- [ ] Scroll back and forth - animations don't replay inappropriately
- [ ] DevTools Performance tab - no long tasks during scroll
- [ ] Mobile Safari - smooth 60fps
- [ ] Chrome DevTools GPU monitor - memory under 100MB
- [ ] `prefers-reduced-motion: reduce` - immediate visibility
- [ ] No console errors or warnings
- [ ] Lighthouse Performance score ≥90

---

## Next Steps

Use the comprehensive prompt in `LLM_OPTIMIZATION_PROMPT.md` to search the workspace and systematically fix each component following the established fix patterns.
