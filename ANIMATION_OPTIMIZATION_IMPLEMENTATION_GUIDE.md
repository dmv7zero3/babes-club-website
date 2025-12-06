# Homepage Animation Optimization - Implementation Guide

## Overview

This guide provides step-by-step instructions for optimizing all homepage animations to fix browser crashes, performance issues, and accessibility concerns.

## Status Summary

| Component               | Status       | Priority    | Notes                                                       |
| ----------------------- | ------------ | ----------- | ----------------------------------------------------------- |
| SubscriberForm          | ✅ FIXED     | -           | Already optimized with GPU-friendly blur and proper cleanup |
| Hero                    | ⏳ Needs Fix | 🔴 Critical | blur-[140px] causing severe GPU strain                      |
| ParallaxScroll          | ⏳ Needs Fix | 🔴 High     | Complex scroll animations, multiple triggers                |
| HeroClipReveal          | ⏳ Needs Fix | 🟠 Medium   | Text splits need proper cleanup                             |
| AboutHolly              | ⏳ Needs Fix | 🟠 Medium   | Multiple ScrollTriggers without `once: true`                |
| ProductCategories       | ⏳ Needs Fix | 🟠 Medium   | Card animations, cleanup needed                             |
| BrandMarquee            | ⏳ Needs Fix | 🟡 Low      | Resize handler needs debouncing                             |
| VerticalAbout           | ⏳ Needs Fix | 🟡 Low      | willChange reset needed                                     |
| SplitScreenPinning      | ⏳ Needs Fix | 🟡 Low      | matchMedia verification                                     |
| HorizontalScrollGallery | ⏳ Needs Fix | 🟡 Low      | Image listeners cleanup                                     |

## Files Created

### 1. `src/styles/blur-optimize.css`

GPU-optimized blur utilities for decorative elements. Use these classes instead of large blur values.

**Key Classes:**

- `.blur-glow--sm` → 16px blur (instead of blur-2xl)
- `.blur-glow--md` → 24px blur (instead of blur-3xl)
- `.blur-glow--lg` → 32px blur (instead of blur-[80px]/[100px])
- `.blur-glow--xl` → 48px blur (instead of blur-[120px]/[140px])

### 2. `src/lib/animation/animation-utils.ts`

Shared utilities for GSAP animations enforcing best practices:

**Key Functions:**

- `createOptimizedTimeline()` - Creates timeline with `overwrite: 'auto'`
- `createScrollTrigger()` - Creates triggers with `once: true` by default
- `cleanupAnimations()` - Proper cleanup chain with timeline/trigger killing
- `prefersReducedMotion()` - Checks accessibility preference
- `handleReducedMotion()` - Sets final state immediately if needed
- `createAnimationCleanup()` - Helper for useLayoutEffect cleanup

### 3. Supporting Files

- `HOMEPAGE_ANIMATION_AUDIT.md` - Detailed audit of all components
- `LLM_OPTIMIZATION_PROMPT.md` - Comprehensive prompt for fixing all components

## Implementation Steps

### Phase 1: Create Utility Files ✅ COMPLETE

- [x] Create `src/styles/blur-optimize.css`
- [x] Create `src/lib/animation/animation-utils.ts`
- [x] Create audit and prompt documentation

### Phase 2: Fix Components (In Priority Order)

#### Step 2.1: Hero.tsx (CRITICAL - Blur values up to 140px!)

1. Search for: `src/pages/Homepage/components/Hero.tsx`
2. Replace `blur-[140px]` and `blur-[110px]` with `blur-glow--xl` or `blur-glow--lg`
3. Add GPU hints: `contain: 'strict'`, `transform: 'translateZ(0)'`, `willChange: 'transform'`
4. Add `aria-hidden="true"` to decorative elements
5. Import and use utilities from `animation-utils.ts`

**Expected Changes:**

- Reduce blur from 140px → 48px maximum
- GPU memory usage: 180MB → ~45MB
- Frame time: 50-200ms → <16ms

#### Step 2.2: ParallaxScroll.tsx (HIGH - Complex scroll animations)

1. Search for: `src/pages/Homepage/components/ParallaxScroll.tsx`
2. Add animation state guard to prevent replays
3. Add `once: true` to ScrollTrigger.create() calls
4. Import `createScrollTrigger` from `animation-utils.ts`

#### Step 2.3: HeroClipReveal/animation.ts (MEDIUM - Text splits)

1. Search for: `src/pages/Homepage/components/HeroClipReveal/animation.ts`
2. Store split revert functions in refs
3. Add `overwrite: true` to gsap.to() calls on split text
4. Add proper cleanup of split reverts

#### Step 2.4: AboutHolly/animation.ts (MEDIUM - Multiple triggers)

1. Search for: `src/pages/Homepage/components/AboutHolly/animation.ts`
2. Add `once: true` to all ScrollTrigger.create() calls
3. Store and revert text split functions
4. Add animation state guards

#### Step 2.5: ProductCategories/animation.ts (MEDIUM - Card animations)

1. Search for: `src/pages/Homepage/components/ProductCategories/animation.ts`
2. Add `once: true` to card triggers
3. Kill delayed calls in cleanup
4. Add `overwrite: true` to prevent stacking

#### Step 2.6: BrandMarquee.tsx (LOW - Resize handler)

1. Search for: `src/pages/Homepage/components/BrandMarquee.tsx`
2. Use `createDebouncedRefresh` from `animation-utils.ts`
3. Debounce resize handler with 150ms delay
4. Add cleanup to remove resize listener

#### Step 2.7: VerticalAbout.tsx (LOW - willChange cleanup)

1. Search for: `src/pages/Homepage/components/VerticalAbout.tsx`
2. Use `setWillChange` helper from `animation-utils.ts`
3. Reset willChange to "auto" after animations complete
4. Add CSS containment to sections

#### Step 2.8: SplitScreenPinning.tsx (LOW - matchMedia)

1. Search for: `src/components/SplitScreenPinning/SplitScreenPinning.tsx`
2. Verify matchMedia cleanup is working
3. Add animation state guards
4. Consider lazy loading images

#### Step 2.9: HorizontalScrollGallery.tsx (LOW - Image listeners)

1. Search for: `src/components/HorizontalScrollGallery.tsx`
2. Track and cleanup image load listeners
3. Add AbortController for async operations
4. Verify ResizeObserver cleanup

### Phase 3: Testing & Validation

#### Performance Testing

```bash
# Run type check
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Check Lighthouse scores
# Navigate to: https://developers.google.com/web/tools/lighthouse
```

#### Manual Testing Checklist

- [ ] Scroll rapidly through entire homepage - no jank or stuttering
- [ ] Scroll back and forth - animations don't replay inappropriately
- [ ] Check DevTools Performance tab - no long tasks during scroll
- [ ] Test on mobile Safari - smooth 60fps scrolling
- [ ] Check Chrome GPU monitor - memory usage under 100MB
- [ ] Test with `prefers-reduced-motion: reduce` - immediate visibility
- [ ] No console errors or warnings
- [ ] Lighthouse Performance score ≥90

#### Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

### Phase 4: Documentation

After completing all fixes:

1. **Update README with:**
   - Summary of all optimizations applied
   - Performance metrics (before/after)
   - Testing results
   - Accessibility improvements

2. **Create CONTRIBUTING guidelines for animations:**
   - Always import from `animation-utils.ts`
   - Never use blur > 48px on decorative elements
   - Always add `once: true` to one-shot ScrollTriggers
   - Always implement full cleanup chains
   - Always check `prefers-reduced-motion`

3. **Add to developer documentation:**
   - How to use `createScrollTrigger()`
   - How to implement proper cleanup
   - Common pitfalls to avoid
   - Performance best practices

## Common Fix Patterns

### Pattern 1: GPU-Friendly Blur

```jsx
// BEFORE
<div className="blur-[140px]" />

// AFTER
<div
  className="blur-glow blur-glow--xl"
  aria-hidden="true"
/>
```

### Pattern 2: One-Shot ScrollTrigger

```javascript
// BEFORE
ScrollTrigger.create({
  trigger: section,
  onEnter: () => timeline.play(),
});

// AFTER
const { trigger, cleanup } = createScrollTrigger({
  trigger: section,
  once: true, // Critical
  onEnter: () => timeline.play(),
});
triggerRef.current = trigger;
```

### Pattern 3: Proper Cleanup

```javascript
// BEFORE
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    /* ... */
  });
  return () => ctx.revert();
}, []);

// AFTER
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    /* ... */
  });

  return createAnimationCleanup({
    ctx,
    timelineRef,
    triggerRef,
    splitRevertRef,
    element: sectionRef.current,
  });
}, []);
```

### Pattern 4: Text Split with Cleanup

```javascript
// Store revert
const splitRevertRef = useRef<(() => void) | null>(null);
const { spans, revert } = splitTextElementToSpans(element, options);
splitRevertRef.current = revert;

// Animate with overwrite
gsap.to(spans, {
  autoAlpha: 1,
  y: 0,
  overwrite: true, // Critical
});

// In cleanup
if (splitRevertRef.current) {
  splitRevertRef.current();
}
```

### Pattern 5: Reduced Motion Support

```javascript
useLayoutEffect(() => {
  const prefersReducedMotion = handleReducedMotion(elements, {
    autoAlpha: 1,
    x: 0,
    y: 0,
  });

  if (prefersReducedMotion) return;

  // Create animations only if not reduced motion
  const timeline = createOptimizedTimeline();
  // ...
}, []);
```

## Debugging Tips

### GPU Memory Leaks

- Chrome DevTools → Memory → Take heap snapshot
- Look for `gsap.core.Tween` and `ScrollTrigger` objects
- Each component should cleanup completely on unmount

### Excessive ScrollTrigger Count

- Chrome DevTools → Console → `gsap.plugins.ScrollTrigger.getAll().length`
- Should return 0 after component unmount
- Should not grow unbounded on scroll

### Animation Stacking

- Check if `overwrite: 'auto'` is set on timelines
- Verify `overwrite: true` on competing animations
- Look for multiple tweens on the same element

### Blur Performance Issues

- DevTools → Rendering → Composite
- Look for "Paint" tasks during scroll
- Blur radius should be ≤48px
- Check `contain: strict` is applied

## Success Criteria

All fixes should result in:

1. ✅ **Zero browser crashes** during rapid scrolling
2. ✅ **Consistent 60fps** on modern hardware
3. ✅ **GPU memory < 100MB** during homepage view
4. ✅ **Lighthouse Performance ≥90**
5. ✅ **No console errors or warnings**
6. ✅ **Full accessibility support** (reduced motion)
7. ✅ **Mobile smooth scroll** (iOS Safari tested)
8. ✅ **Fast load time** (<3s on 4G)

## Rollback Plan

If issues arise:

1. Verify TypeScript compilation: `npm run type-check`
2. Check ESLint: `npm run lint`
3. Build locally: `npm run build`
4. Test in dev: `npm start`
5. Check Git diff: See exact changes made
6. Revert specific components if needed: `git checkout -- src/pages/...`

## Support

For questions about:

- **GSAP animations**: See `src/lib/animation/animation-utils.ts` examples
- **ScrollTrigger**: Refer to GSAP documentation and `createScrollTrigger` helper
- **Text splitting**: Check `HeroClipReveal` component implementation
- **Reduced motion**: Review `prefersReducedMotion()` usage patterns

---

## Next Steps

1. **Copy this implementation guide** and keep it accessible
2. **Use the `LLM_OPTIMIZATION_PROMPT.md`** to get AI assistance with fixes
3. **Reference `SubscriberForm.tsx`** as a complete example of a fixed component
4. **Validate each fix** against the testing checklist before commit
5. **Document any deviations** from the standard patterns

**Target Completion Date:** 2-3 weeks for all 9 components (part-time work)
