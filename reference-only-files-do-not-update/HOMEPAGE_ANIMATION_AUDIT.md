# Homepage Animation Performance Audit

## Executive Summary

After analyzing the homepage components, I've identified **7 components with animation performance issues** that could cause browser lag, jank, or crashes. The issues fall into these categories:

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
  start: "top top",
  end: () => `+=${...}`,
  pin: true,
  scrub: true, // OK for parallax
  // MISSING: Animation state guards
});

// PROBLEM: quickSetter on every tick without RAF throttle
const updateAll = (progress: number) => {
  layers.forEach((el, i) => {
    // This runs 60+ times/second during scroll
    setters[i](y);
  });
};
```

**CSS Issues:**
```jsx
// GOOD: Has will-change and containment
<style>{`
  .parallax-layer {
    will-change: transform;
    transform: translateZ(0);
    contain: layout paint style;
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
  y: 0,
  stagger: 0.03,
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
  start: "top bottom",
  end: "bottom top",
  onEnter: playIn,
  onLeaveBack: () => playOut("down"),
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
  start: "top 80%",
  end: "bottom 60%",
  // MISSING: once: true
  onEnter: (self) => {
    if (hasAnimated) return; // Guard is good but trigger still fires
    // ...
  },
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
  rafId = window.requestAnimationFrame(() => {
    rafId = null;
    ScrollTrigger.refresh();
  });
};

// PROBLEM: Image load listeners may not be cleaned up
imgs.forEach((img) => {
  if (!img.complete) {
    img.addEventListener("load", refresh, { once: true });
    // MISSING: cleanup for error listeners if component unmounts
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

| Class | Value | Risk Level |
|-------|-------|------------|
| `blur-3xl` | 64px | 🔴 High |
| `blur-[80px]` | 80px | 🔴 High |
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
className="supports-[backdrop-filter]:backdrop-blur-xl"
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

## Files to Search For Additional Context

Use this prompt to search the workspace for more information:

---

# LLM Workspace Search Prompt

You are auditing the Babes Club homepage for animation performance issues. Search the workspace for the following information to complete your optimization:

## Search Queries to Run

### 1. Find All Blur Usage
```
Search: blur-[  blur-3xl  blur-2xl  blur-xl
Purpose: Identify all CSS blur effects that may cause GPU strain
```

### 2. Find All ScrollTrigger Configurations
```
Search: ScrollTrigger.create  once: true  onEnter  onLeave
Purpose: Identify ScrollTriggers missing the `once: true` flag
```

### 3. Find All Text Split Animations
```
Search: splitTextElementToSpans  splitIntoLines  SplitText
Purpose: Find text animations that may not be cleaning up DOM elements
```

### 4. Find All useLayoutEffect Cleanup
```
Search: useLayoutEffect  ctx.revert()  .kill()  cleanup
Purpose: Verify all animations have proper cleanup chains
```

### 5. Find All Resize Handlers
```
Search: addEventListener("resize"  onResize  ResizeObserver
Purpose: Identify resize handlers that need debouncing
```

### 6. Find willChange Usage
```
Search: willChange  will-change
Purpose: Ensure willChange is reset to "auto" after animations
```

### 7. Find Animation Overwrite Settings
```
Search: overwrite  gsap.to  gsap.timeline
Purpose: Identify animations that may stack without overwrite control
```

### 8. Find Decorative Background Elements
```
Search: aria-hidden  pointer-events-none  -z-  decorative
Purpose: Identify decorative elements that should have CSS containment
```

## Key Files to Review

1. `src/pages/Homepage/index.tsx` - Homepage component order
2. `src/pages/Homepage/components/Hero.tsx` - Hero blur effects
3. `src/pages/Homepage/components/ParallaxScroll.tsx` - Parallax animations
4. `src/pages/Homepage/components/HeroClipReveal/animation.ts` - Text splits
5. `src/pages/Homepage/components/AboutHolly/animation.ts` - Line animations
6. `src/pages/Homepage/components/ProductCategories/animation.ts` - Card animations
7. `src/pages/Homepage/components/BrandMarquee.tsx` - Marquee scroll
8. `src/pages/Homepage/components/VerticalAbout.tsx` - About section
9. `src/components/SplitScreenPinning/SplitScreenPinning.tsx` - Split screen
10. `src/components/HorizontalScrollGallery.tsx` - Gallery scroll
11. `src/components/SubscriberForm/SubscriberForm.tsx` - Subscriber form
12. `tailwind.config.js` - Global animation definitions

## Optimization Checklist Per Component

For each animated component, verify:

- [ ] Blur values are ≤48px
- [ ] ScrollTriggers have `once: true` for one-shot animations
- [ ] Text splits have revert functions stored and called in cleanup
- [ ] useLayoutEffect returns a cleanup function that:
  - Kills timeline refs
  - Kills trigger refs  
  - Calls ctx.revert()
  - Removes event listeners
- [ ] Resize handlers are debounced (150ms minimum)
- [ ] Animated elements have `overwrite: true` or `overwrite: 'auto'`
- [ ] Decorative elements have:
  - `contain: strict` or `contain: layout paint`
  - `transform: translateZ(0)`
  - `pointer-events: none`
  - `aria-hidden="true"`
- [ ] willChange is reset to "auto" after animations complete
- [ ] gsap.delayedCall instances are killed in cleanup

## Expected Deliverables

After searching and analyzing, provide:

1. **Fixed component files** for each problematic component
2. **CSS utility file** with GPU-optimized blur classes
3. **Shared animation utilities** for consistent patterns
4. **Updated tailwind.config.js** if glow animations need optimization
5. **README** documenting all changes and testing checklist

## Testing Requirements

After fixes are applied:

1. Scroll through entire homepage rapidly - no jank
2. Scroll back and forth through each section - animations don't replay inappropriately
3. Open DevTools Performance tab - no long tasks during scroll
4. Test on mobile (iOS Safari, Chrome) - smooth 60fps
5. Test with `prefers-reduced-motion: reduce` - immediate visibility
6. Monitor GPU memory - should stay under 100MB
7. Check for memory leaks after navigating away and back

---

Use this audit to systematically fix each component, starting with the highest-priority items. The goal is smooth 60fps scrolling on all devices with no browser crashes.
