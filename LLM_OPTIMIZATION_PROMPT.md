# Animation Optimization Prompt for The Babes Club

You are an expert frontend animation developer specializing in GSAP, ScrollTrigger, and React performance optimization. You also care deeply about Technical SEO and accessibility.

## Context

The Babes Club is a production e-commerce website with a React SPA frontend. The homepage has multiple animated sections that are causing browser crashes and performance issues when users scroll. The root causes have been identified as:

1. **Excessively large CSS blur effects** (64px to 140px) that overwhelm the GPU
2. **ScrollTriggers without `once: true`** that fire continuously
3. **Missing animation cleanup** causing memory leaks
4. **No CSS containment** on decorative elements
5. **Text split animations** that don't revert DOM changes

## Your Task

Search the workspace and fix ALL homepage animation components. For each component:

### Step 1: Search for the Component

Use semantic search and file search to find each of these files:

- `src/pages/Homepage/components/Hero.tsx`
- `src/pages/Homepage/components/ParallaxScroll.tsx`
- `src/pages/Homepage/components/HeroClipReveal/animation.ts`
- `src/pages/Homepage/components/HeroClipReveal/index.tsx`
- `src/pages/Homepage/components/AboutHolly/animation.ts`
- `src/pages/Homepage/components/AboutHolly/index.tsx`
- `src/pages/Homepage/components/ProductCategories/animation.ts`
- `src/pages/Homepage/components/ProductCategories/index.tsx`
- `src/pages/Homepage/components/BrandMarquee.tsx`
- `src/pages/Homepage/components/VerticalAbout.tsx`
- `src/components/SplitScreenPinning/SplitScreenPinning.tsx`
- `src/components/HorizontalScrollGallery.tsx`

### Step 2: Apply These Fixes

#### Fix Pattern A: Blur Effects

```jsx
// BEFORE (crashes browser)
<div className="blur-[120px]" />

// AFTER (GPU-friendly)
<div
  className="blur-2xl"  // Max 40px
  aria-hidden="true"
  style={{
    contain: 'strict',
    transform: 'translateZ(0)',
    willChange: 'transform',
    pointerEvents: 'none',
  }}
/>
```

#### Fix Pattern B: ScrollTrigger with Once

```javascript
// BEFORE (fires continuously)
ScrollTrigger.create({
  trigger: section,
  start: "top 80%",
  onEnter: () => timeline.play(),
});

// AFTER (fires once, self-destructs)
const hasAnimatedRef = useRef(false);
const triggerRef = (useRef < ScrollTrigger) | (null > null);

ScrollTrigger.create({
  trigger: section,
  start: "top 80%",
  once: true, // CRITICAL
  onEnter: () => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;
    timeline.play();
  },
});
```

#### Fix Pattern C: Proper Cleanup Chain

```javascript
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    // animations...
  }, sectionRef);

  return () => {
    // 1. Kill timeline refs
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    // 2. Kill trigger refs
    if (triggerRef.current) {
      triggerRef.current.kill();
      triggerRef.current = null;
    }
    // 3. Kill any delayed calls
    gsap.killTweensOf(sectionRef.current);
    // 4. Revert text splits
    if (splitRevertRef.current) {
      splitRevertRef.current();
    }
    // 5. Revert context last
    ctx.revert();
  };
}, []);
```

#### Fix Pattern D: Text Split Cleanup

```javascript
// Store revert function
const splitRevertRef = useRef<(() => void) | null>(null);

const { spans, revert } = splitTextElementToSpans(element, options);
splitRevertRef.current = revert;

// Add overwrite to prevent stacking
gsap.to(spans, {
  autoAlpha: 1,
  y: 0,
  stagger: 0.03,
  overwrite: true,  // CRITICAL
});

// In cleanup
if (splitRevertRef.current) {
  splitRevertRef.current();
  splitRevertRef.current = null;
}
```

#### Fix Pattern E: Debounced Resize

```javascript
// BEFORE (fires on every resize event)
const onResize = () => ScrollTrigger.refresh();
window.addEventListener("resize", onResize);

// AFTER (debounced)
const debouncedRefresh = useDebouncedCallback(() => {
  ScrollTrigger.refresh();
}, 150);

window.addEventListener("resize", debouncedRefresh);

// In cleanup
debouncedRefresh.cancel();
window.removeEventListener("resize", debouncedRefresh);
```

#### Fix Pattern F: willChange Cleanup

```javascript
// Set during animation
gsap.set(element, {
  willChange: "transform, opacity",
  force3D: true,
});

// Reset after animation completes
timeline.eventCallback("onComplete", () => {
  gsap.set(element, {
    willChange: "auto",
    force3D: false,
  });
});
```

### Step 3: Verify Reduced Motion Support

Each component must have this pattern:

```javascript
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (prefersReducedMotion) {
  // Set final state immediately, skip animation
  gsap.set(elements, { autoAlpha: 1, x: 0, y: 0 });
  return; // Exit early
}
```

### Step 4: Create Fixed Files

For each component, create a complete fixed version that:

1. Reduces all blur values to ≤48px
2. Adds `once: true` to one-shot ScrollTriggers
3. Implements proper cleanup chain
4. Adds CSS containment to decorative elements
5. Adds `overwrite: true` to competing animations
6. Debounces resize handlers
7. Resets willChange after animations
8. Supports reduced motion preference

### Step 5: Create Shared Utilities

Create these utility files:

1. `src/styles/blur-optimize.css` - GPU-friendly blur classes
2. `src/lib/animation/animation-utils.ts` - Shared animation patterns
3. `src/hooks/use-scroll-animation.ts` - Custom hook for scroll animations

### Step 6: Document Changes

Create a comprehensive README that includes:

1. Summary of all changes made
2. Performance comparison (before/after)
3. Testing checklist
4. Accessibility improvements
5. Guidelines for future animation development

## Priority Order

Fix components in this order (highest impact first):

1. Hero.tsx - Massive blur effects (140px!)
2. ParallaxScroll.tsx - Complex scroll animations
3. HeroClipReveal - Text splits need cleanup
4. AboutHolly - Multiple ScrollTriggers
5. ProductCategories - Card animations
6. BrandMarquee - Heavy text layout
7. VerticalAbout - willChange cleanup
8. SplitScreenPinning - matchMedia verification
9. HorizontalScrollGallery - Image listener cleanup

## Search Strategies

When searching the workspace, use these patterns:

### 1. Find Blur Effects

Search for: `blur-[` and `blur-3xl` and `blur-2xl`
Purpose: Identify all CSS blur effects that may cause GPU strain

### 2. Find ScrollTrigger Configurations

Search for: `ScrollTrigger.create` and `once: true` and `onEnter` and `onLeave`
Purpose: Identify ScrollTriggers missing the `once: true` flag

### 3. Find Text Split Animations

Search for: `splitTextElementToSpans` and `splitIntoLines` and `SplitText` and `revert`
Purpose: Find text animations that may not be cleaning up DOM elements

### 4. Find useLayoutEffect Cleanup

Search for: `useLayoutEffect` and `ctx.revert()` and `.kill()` and `cleanup`
Purpose: Verify all animations have proper cleanup chains

### 5. Find Resize Handlers

Search for: `addEventListener("resize"` and `onResize` and `ResizeObserver` and `debouncedCallback`
Purpose: Identify resize handlers that need debouncing

### 6. Find willChange Usage

Search for: `willChange` and `will-change`
Purpose: Ensure willChange is reset to "auto" after animations

### 7. Find Animation Overwrite Settings

Search for: `overwrite:` and `gsap.to` and `gsap.timeline`
Purpose: Identify animations that may stack without overwrite control

### 8. Find Decorative Background Elements

Search for: `aria-hidden` and `pointer-events-none` and `-z-` and `decorative`
Purpose: Identify decorative elements that should have CSS containment

## Output Requirements

Provide complete, production-ready code for each fixed component. Include:

- Full file content (not just snippets)
- All imports
- TypeScript types
- Inline comments explaining fixes
- Accessibility attributes
- Proper cleanup patterns

## Testing Checklist

After fixes, the following should pass:

- [ ] Rapid scroll through entire homepage - no jank
- [ ] Scroll back and forth - no inappropriate replays
- [ ] DevTools Performance tab - no long tasks during scroll
- [ ] Mobile Safari - smooth 60fps
- [ ] Chrome DevTools GPU monitor - memory under 100MB
- [ ] `prefers-reduced-motion: reduce` - immediate visibility
- [ ] No console errors or warnings
- [ ] Lighthouse Performance score ≥90

## Success Criteria

All homepage animations should:

1. ✅ Use blur values ≤48px on decorative elements
2. ✅ Have `once: true` on one-shot ScrollTriggers
3. ✅ Implement full cleanup chains with timeline/trigger killing
4. ✅ Include `contain: strict` and GPU hints on decorative elements
5. ✅ Use `overwrite: true` on competing animations
6. ✅ Debounce all resize handlers (150ms)
7. ✅ Reset `willChange: "auto"` after animations complete
8. ✅ Support `prefers-reduced-motion` by skipping animations
9. ✅ Include inline comments explaining all fixes
10. ✅ Pass TypeScript strict mode with no warnings

## Key Files to Reference

- **HOMEPAGE_ANIMATION_AUDIT.md** — Detailed component-by-component audit with specific code issues
- **src/components/SubscriberForm/SubscriberForm.tsx** — Example of a properly fixed component (already completed)
- **src/styles/blur-optimize.css** — GPU-friendly blur utilities (to be created)
- **tailwind.config.js** — Check for animation configurations that may need adjustment

## Questions to Keep in Mind

As you fix each component, ask yourself:

1. **Blur Effects**: Are any blur values > 48px? Are they decorated with `contain: strict`?
2. **ScrollTriggers**: Does the trigger have `once: true`? Is there an animation state guard?
3. **Cleanup**: Does the useLayoutEffect return a proper cleanup function that kills timelines, triggers, and reverts contexts?
4. **Text Splits**: Are split revert functions stored and called during cleanup?
5. **Resize Handlers**: Is the resize handler debounced with at least 150ms delay?
6. **willChange**: Is `willChange` reset to `"auto"` after animation completion?
7. **Reduced Motion**: Does the component check `prefers-reduced-motion` and skip animations if true?
8. **Accessibility**: Are decorative elements marked with `aria-hidden="true"`?

---

**Begin by searching for Hero.tsx and creating the fixed version. This component has the most severe blur issues (blur-[140px]!) and is highly visible to users.**
