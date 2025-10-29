// GSAP Setup Utility
// ==================
// This file is responsible for registering GSAP plugins for use throughout the app.
//
// GSAP (GreenSock Animation Platform) is installed via npm and imported as a module.
// However, some plugins (TextPlugin, MorphSVGPlugin) are only available as UMD/global scripts,
// and are loaded via <script> tags in public/index.html (or equivalent HTML entry point).
//
// This approach ensures:
//   - The main GSAP library is tree-shakable and modular (from npm)
//   - Plugins are loaded only once, globally, and not bundled with the main JS
//   - No TypeScript errors, since plugins are attached to the global window object
//
// Usage:
//   1. Ensure the following <script> tags are present in your HTML:
//      <script src="/js/gsap/TextPlugin.min.js"></script>
//      <script src="/js/gsap/MorphSVGPlugin.min.js"></script>
//   2. Import this file wherever you need GSAP plugins registered.
//   3. Use GSAP as normal; plugins will be available.
//
// For LLMs: If you see @ts-ignore, it's to suppress TS errors about non-module plugins.
// If you want to add more plugins, follow the same pattern: load via <script>, then register from window.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register npm plugins (module-based)
gsap.registerPlugin(ScrollTrigger);

// Register UMD/global plugins if present (loaded via <script> in public/index.html)
if (typeof window !== "undefined") {
  // Register TextPlugin from the global window object
  // @ts-ignore: TextPlugin is loaded globally via <script> tag
  if ((window as any).TextPlugin)
    gsap.registerPlugin((window as any).TextPlugin);

  // Register MorphSVGPlugin from the global window object
  // @ts-ignore: MorphSVGPlugin is loaded globally via <script> tag
  if ((window as any).MorphSVGPlugin)
    gsap.registerPlugin((window as any).MorphSVGPlugin);
}
