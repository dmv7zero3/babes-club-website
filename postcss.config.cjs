// postcss.config.cjs - Enhanced Configuration for Complex React App
//
// ===================== USAGE & MAINTENANCE INSTRUCTIONS =====================
//
// This configuration is tailored for a React project with dynamic class usage,
// GSAP/Framer Motion animations, and third-party integrations.
//
// HOW TO USE:
// 1. This file is automatically picked up by PostCSS when you run your build or dev scripts (e.g., `npm run build`, `npm run dev`).
// 2. No manual steps are needed for most development workflows.
//
// DURING DEVELOPMENT:
// - All Tailwind and custom CSS classes are available (no purging in dev mode).
// - You can use any Tailwind utility, custom class, or dynamic class in JS/TS/JSX/TSX.
//
// DURING PRODUCTION BUILD:
// - PurgeCSS runs to remove unused CSS, using the enhanced extractor and safelist below.
// - Only classes found in your source, templates, and safelist are kept in the final CSS.
// - cssnano further optimizes and minifies the CSS output.
//
// MAINTENANCE:
// - If you add new dynamic classes (e.g., via JS, GSAP, or third-party libs),
//   add them to the appropriate safelist (standard, deep, or greedy) below.
// - If you add new UI libraries, add their paths to the `content` array.
// - If you see missing styles in production, check the safelist and extractor logic.
// - For debugging, set `rejected: true` to see which classes are being purged.
//
// FOR LLMS:
// - When updating this config, preserve the extractor and safelist logic for dynamic classes.
// - Always document new patterns or libraries added to the config.
//
// ============================================================================

module.exports = {
  plugins: {
    // Enable CSS nesting support
    "tailwindcss/nesting": {},

    // Tailwind CSS (v3+ with built-in JIT)
    tailwindcss: {},

    // Auto-prefix for browser compatibility
    autoprefixer: {
      // Target browsers (can also be defined in browserslist)
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions",
        "Firefox ESR",
        "not ie <= 8",
      ],
      // Disable CSS Grid prefixing to avoid warnings
      grid: false,
      // Remove outdated prefixes
      remove: true,
    },

    // Production optimizations
    ...(process.env.NODE_ENV === "production" && {
      // Enhanced PurgeCSS configuration for complex React app with GSAP + third-party libraries
      "@fullhuman/postcss-purgecss": {
        content: [
          // Application source files
          "./src/**/*.{js,jsx,ts,tsx}",
          "./public/**/*.html",
          "./webpack/templates/**/*.html",

          // Third-party libraries that inject CSS classes
          "./node_modules/@react-google-maps/api/**/*.js",
          "./node_modules/lucide-react/**/*.js",
          "./node_modules/framer-motion/**/*.js",
          "./node_modules/react-router-dom/**/*.js",
          "./node_modules/@tailwindcss/forms/**/*.js",
          "./node_modules/@tailwindcss/typography/**/*.js",
          "./node_modules/tailwindcss-animate/**/*.js",

          // Add any additional UI libraries as needed
          // "./node_modules/@headlessui/react/**/*.js",
          // "./node_modules/@heroicons/react/**/*.js",
        ],

        // Enhanced content extraction for complex patterns
        defaultExtractor: (content) => {
          // Extract standard Tailwind classes
          const tailwindMatches = content.match(/[\w-/:%.!]+(?<!:)/g) || [];

          // Extract classes from className attributes
          const classNameMatches =
            content.match(/(?:class|className)=['"`]([^'"`]*?)['"`]/g) || [];
          const extractedClassNames = classNameMatches
            .map((match) =>
              match
                .replace(/(?:class|className)=['"`]([^'"`]*?)['"`]/, "$1")
                .split(/\s+/)
            )
            .flat();

          // Extract classes from classList operations (GSAP animations)
          const classListMatches =
            content.match(
              /classList\.(add|remove|toggle)\(['"`]([^'"`]*?)['"`]\)/g
            ) || [];
          const extractedClassList = classListMatches.map((match) =>
            match.replace(/classList\.\w+\(['"`]([^'"`]*?)['"`]\)/, "$1")
          );

          // Extract classes from string templates and concatenation
          const templateMatches =
            content.match(/`[^`]*\$\{[^}]*\}[^`]*`/g) || [];
          const templateClassNames =
            templateMatches.join(" ").match(/[\w-]+/g) || [];

          // Combine all matches and remove duplicates
          const allMatches = [
            ...tailwindMatches,
            ...extractedClassNames,
            ...extractedClassList,
            ...templateClassNames,
          ].filter(Boolean);

          return [...new Set(allMatches)];
        },

        // Comprehensive safelist for complex React app
        safelist: {
          standard: [
            // GSAP animation classes (from your codebase)
            "is-animating",
            "is-open",
            "menu-nav-item",
            "bounce-card-wrapper",

            // Video/image optimization classes (from your docs)
            "opacity-0",
            "opacity-100",
            "video-loaded",
            "video-loading",
            "video-error",
            "image-loaded",

            // Your custom gradient classes (from tailwind.config.js)
            "text-gradient-primary",
            "text-gradient-forest",
            "bg-gradient-primary",
            "bg-gradient-forest",
            "bg-gradient-smoke",

            // Your custom section classes
            "section-padding",
            "section-light",
            "section-dark",
            "section-accent",
            "animate-on-scroll",

            // Base responsive breakpoints
            /^(sm|md|lg|xl|2xl):/,

            // Interactive states
            /^(hover|focus|active|disabled|group-hover|peer-focus):/,

            // Layout utilities that might be dynamic
            /^(grid|flex|block|inline|hidden|visible|absolute|relative|fixed|sticky)/,

            // Animation and transition classes
            /^(animate|transition|transform|duration|ease|delay)/,
            /^(scale|rotate|translate|skew)/,

            // Background, text, and border utilities
            /^(bg|text|border|ring|shadow|opacity)/,

            // Spacing utilities (often dynamic)
            /^(m|p|space|gap|inset|top|right|bottom|left)-/,

            // Sizing utilities
            /^(w|h|min-w|min-h|max-w|max-h)-/,

            // Framer Motion classes
            /^motion-/,

            // React Router classes
            /^(active|pending)/,

            // Google Maps API classes
            /^(gm|google-maps)/,

            // Loading and state indicators
            /^(loading|error|success|warning|info)/,
          ],

          deep: [
            // Animation state classes with modifiers
            /^(hover|focus|active|disabled|group|peer):/,

            // Tailwind animation classes
            /animate-/,

            // Enter/exit transition classes (for page transitions, modals, etc.)
            /^.*-(enter|exit|appear)/,
            /^.*-(enter|exit|appear)-(active|done|from|to)/,

            // GSAP timeline and animation classes
            /^(tl|gsap|timeline|tween)-/,
          ],

          greedy: [
            // Your custom color palette (sls-* naming from your config)
            /^(bg|text|border)-(sls-gold|sls-forest|sls-purple|sls-charcoal|sls-marble)/,

            // Semantic color classes
            /^(bg|text|border)-(primary|secondary|accent|success|warning|error|info)/,

            // Foreground and background system classes
            /^(background|foreground)/,

            // Dynamic animation classes that might be generated
            /bounce/,
            /slide/,
            /fade/,
            /zoom/,
            /spin/,

            // State management classes
            /active/,
            /current/,
            /selected/,
            /highlighted/,

            // GSAP-specific classes
            /^gsap/,

            // Framer Motion classes
            /^motion/,

            // Video component states
            /video/,
            /poster/,

            // Form states
            /valid/,
            /invalid/,

            // Component states
            /open/,
            /closed/,
            /expanded/,
            /collapsed/,
          ],
        },

        // Additional PurgeCSS options for better optimization
        variables: true, // Keep CSS custom properties
        keyframes: true, // Keep @keyframes (essential for GSAP)
        // Do NOT remove @font-face (we serve local fonts)
        fontFace: false,

        // Skip certain content patterns
        skippedContentGlobs: [
          // Skip most node_modules except explicitly included ones
          "node_modules/**/!(lucide-react|framer-motion|@react-google-maps|@tailwindcss|tailwindcss-animate)/**",
        ],

        // Blocklist - explicitly remove unused utility variants
        blocklist: [
          // Remove print utilities if not used
          /^print:/,
          // Remove dark mode if not implemented
          // /^dark:/,
          // Remove portrait/landscape if not used
          /^portrait:/,
          /^landscape:/,
        ],

        // Debugging options (set to true to see what's being removed)
        rejected: false,
        printRejected: false,
      },

      // Enhanced CSS optimization
      cssnano: {
        preset: [
          "default",
          {
            // Comment handling
            discardComments: {
              removeAll: false,
              removeAllButFirst: true,
            },

            // Whitespace and formatting
            normalizeWhitespace: true,

            // Rule optimization
            mergeRules: true,

            // Mathematical expressions
            calc: {
              precision: 5,
              warnWhenCannotResolve: false,
            },

            // Color optimization
            colormin: {
              legacy: false, // Use modern color functions
            },

            // Font optimization
            minifyFontValues: {
              removeAfterKeyword: false,
              removeDuplicates: true,
              removeQuotes: false,
            },

            // Gradient optimization
            minifyGradients: true,

            // Preserve important declarations for animations
            reduceInitial: false,

            // Don't remove unused at-rules (important for GSAP/animations)
            discardUnused: {
              keyframes: false, // Keep @keyframes for animations
              fontFace: false, // Keep @font-face declarations
              counterStyle: false, // Keep @counter-style
              namespace: false, // Keep @namespace
            },

            // Don't optimize z-index (can break layered animations)
            zindex: false,

            // Don't merge/reduce identifiers (safer for dynamic content)
            mergeIdents: false,
            reduceIdents: false,

            // Media query optimization
            mergeMediaQueries: true,

            // URL optimization
            normalizeUrl: {
              stripWWW: false,
              stripHash: false,
            },

            // Unicode optimization
            normalizeUnicode: true,

            // Selector optimization (be conservative)
            uniqueSelectors: true,
            mergeLonghand: false, // Safer for animations
          },
        ],
      },
    }),
  },
};
