dimensions.boundedWidth =
dimensions.width - dimensions.margin.left - dimensions.margin.right;
dimensions.boundedHeight =
dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
d3.select("#incancross").classed("incancross", true);
d3.select("#dollarsign").classed("dollarsign", true);
gsap

# Morph Icons Utility Usage

This document explains how to use the `morphIcon` utility from `morph-icons.ts` to morph SVG icons using GSAP's MorphSVGPlugin.

## Prerequisites

- Ensure GSAP and MorphSVGPlugin are loaded globally in your project.
  - Place these files in your HTML or load them before using the utility:
    - `public/js/gsap/MorphSVGPlugin.min.js`
    - `public/js/gsap/MorphSVGPlugin.min.js.map`

## Import

```typescript
import { morphIcon } from "./morph-icons";
```

## Usage

### Basic Example

```js
// Morph the path of one SVG icon into another
morphIcon("#fromIcon", "#toIcon");
```

### With Options

```js
morphIcon("#fromIcon", "#toIcon", {
  duration: 2,
  ease: "power2.inOut",
  onComplete: () => console.log("Morph complete!"),
});
```

## Notes

- The utility expects both source and target SVG elements to be present in the DOM.
- Do not use the Halal icon as a morph target or source.
- For a list of available icons, see `src/core/constants/icons.tsx` (excluding Halal).

## Troubleshooting

- If you see an error about GSAP or MorphSVGPlugin, ensure they are loaded globally before calling `morphIcon`.

---

For more advanced usage, refer to the [GSAP MorphSVGPlugin documentation](https://greensock.com/morphSVG/).
