//tailwind.config.js
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssForms from "@tailwindcss/forms";
import tailwindcssTypography from "@tailwindcss/typography";

// Cafe Opera Heritage Opera Design Tokens
const designTokens = {
  colors: {
    // Heritage Opera Primary - Deep Opera Blue
    "opera-blue": {
      50: "#f0f4f8",
      100: "#d9e2ec",
      200: "#bcccdc",
      300: "#9fb3c8",
      400: "#829ab1",
      500: "#627d98",
      600: "#486581",
      700: "#334e68",
      800: "#243b53",
      900: "#1B365D", // Primary Heritage Opera Blue
      950: "#102a4c",
      DEFAULT: "#1B365D",
    },
    // Heritage Accent - Champagne Gold
    "champagne-gold": {
      50: "#fefdf8",
      100: "#fdf9e7",
      200: "#fbf1c7",
      300: "#f9e79f",
      400: "#F7E7B4", // Primary Champagne Gold
      500: "#f4dc7a",
      600: "#f0ce4e",
      700: "#e8b923",
      800: "#d4a017",
      900: "#b8860b",
      950: "#8b6914",
      DEFAULT: "#F7E7B4",
    },
    // Heritage Background - Warm Ivory
    "warm-ivory": {
      50: "#fdfdfc",
      100: "#fcfbf9",
      200: "#FAF7F0", // Primary Warm Ivory
      300: "#f6f2e8",
      400: "#f0ead8",
      500: "#e8dfc4",
      600: "#ddd1aa",
      700: "#cebf8a",
      800: "#b8a474",
      900: "#9d8a5f",
      950: "#52452f",
      DEFAULT: "#FAF7F0",
    },
    // Heritage Text - Rich Mahogany
    "rich-mahogany": {
      50: "#faf7f5",
      100: "#f3ede8",
      200: "#e5d7ce",
      300: "#d3bcab",
      400: "#bc9780",
      500: "#a97a5e",
      600: "#956650",
      700: "#7d5544",
      800: "#67473b",
      900: "#5D2E1F", // Primary Rich Mahogany
      950: "#2f1611",
      DEFAULT: "#5D2E1F",
    },
    // Heritage Accent 2 - Jade Green
    "jade-green": {
      50: "#f4f8f5",
      100: "#e6f0e8",
      200: "#cfe1d3",
      300: "#adc9b4",
      400: "#84a890",
      500: "#628a70",
      600: "#4A7C59", // Primary Jade Green
      700: "#3e6147",
      800: "#344f3a",
      900: "#2c4130",
      950: "#172319",
      DEFAULT: "#4A7C59",
    },
  },
  typography: {
    fontFamily: {
      heading: ["Playfair Display", "ui-serif", "Georgia", "Cambria", "serif"],
      body: ["Lato", "ui-sans-serif", "system-ui", "sans-serif"],
    },
    fontSize: {
      hero: [
        "clamp(2.5rem, 8vw, 4rem)",
        { lineHeight: "1.1", letterSpacing: "-0.02em" },
      ],
      display: [
        "clamp(2rem, 6vw, 3rem)",
        { lineHeight: "1.2", letterSpacing: "-0.02em" },
      ],
      "heading-1": [
        "clamp(1.75rem, 4vw, 2.5rem)",
        { lineHeight: "1.2", letterSpacing: "-0.01em" },
      ],
      "heading-2": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.3" }],
      "heading-3": ["clamp(1.25rem, 2.5vw, 1.5rem)", { lineHeight: "1.4" }],
      "body-lg": ["1.125rem", { lineHeight: "1.6" }],
      body: ["1rem", { lineHeight: "1.6" }],
      "body-sm": ["0.875rem", { lineHeight: "1.5" }],
      caption: ["0.75rem", { lineHeight: "1.4" }],
    },
  },
};

export default {
  darkMode: ["class"],

  // Optimized content paths for maximum performance
  content: [
    "./src/**/*.{js,jsx,ts,tsx,vue,svelte}",
    "./components/**/*.{js,jsx,ts,tsx,vue,svelte}",
    "./app/**/*.{js,jsx,ts,tsx,vue,svelte}",
    "./pages/**/*.{js,jsx,ts,tsx,vue,svelte}",
    "./layouts/**/*.{js,jsx,ts,tsx,vue,svelte}",
    "./lib/**/*.{js,jsx,ts,tsx}", // For utility components
    "./styles/**/*.css", // For @apply usage
    // Add specific patterns to avoid false positives
    "!./node_modules/**/*",
    "!./dist/**/*",
    "!./build/**/*",
  ],

  theme: {
    extend: {
      // Centralized Heritage Opera design tokens
      colors: {
        ...designTokens.colors,

        // Semantic aliases for consistent usage
        primary: {
          ...designTokens.colors["opera-blue"],
          foreground: designTokens.colors["warm-ivory"][200],
        },
        secondary: {
          ...designTokens.colors["champagne-gold"],
          foreground: designTokens.colors["opera-blue"][900],
        },
        accent: {
          ...designTokens.colors["jade-green"],
          foreground: designTokens.colors["warm-ivory"][200],
        },

        // Background system - Heritage Opera
        background: {
          DEFAULT: designTokens.colors["warm-ivory"][200],
          dark: designTokens.colors["opera-blue"][900],
          light: designTokens.colors["warm-ivory"][50],
          muted: designTokens.colors["warm-ivory"][300],
          card: designTokens.colors["warm-ivory"][100],
        },

        // Foreground system - Heritage Opera
        foreground: {
          DEFAULT: designTokens.colors["rich-mahogany"][900],
          muted: designTokens.colors["rich-mahogany"][600],
          light: designTokens.colors["warm-ivory"][200],
          subtle: designTokens.colors["rich-mahogany"][400],
          heading: designTokens.colors["opera-blue"][900],
        },

        // Status colors (adapted to Heritage Opera palette)
        success: designTokens.colors["jade-green"][600],
        warning: designTokens.colors["champagne-gold"][600],
        error: designTokens.colors["rich-mahogany"][800],
        info: designTokens.colors["opera-blue"][700],

        // Heritage Opera specific colors for direct use
        "heritage-blue": designTokens.colors["opera-blue"][900],
        "heritage-gold": designTokens.colors["champagne-gold"][400],
        "heritage-ivory": designTokens.colors["warm-ivory"][200],
        "heritage-mahogany": designTokens.colors["rich-mahogany"][900],
        "heritage-jade": designTokens.colors["jade-green"][600],
      },

      // Typography system
      fontFamily: {
        ...designTokens.typography.fontFamily,
        kristi: ["Kristi", "cursive"],
      },
      fontSize: designTokens.typography.fontSize,

      // Consistent spacing system (8px grid)
      spacing: {
        18: "4.5rem", // 72px
        22: "5.5rem", // 88px
        26: "6.5rem", // 104px
        30: "7.5rem", // 120px
        34: "8.5rem", // 136px
        38: "9.5rem", // 152px
      },

      // Container system for consistent layouts
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1400px",
        },
      },

      // Enhanced shadow system for Heritage Opera
      boxShadow: {
        opera: "0 4px 20px rgba(27, 54, 93, 0.08)",
        "opera-lg": "0 8px 40px rgba(27, 54, 93, 0.12)",
        gold: "0 8px 32px rgba(247, 231, 180, 0.15)",
        "gold-lg": "0 16px 48px rgba(247, 231, 180, 0.2)",
        mahogany: "0 12px 40px rgba(93, 46, 31, 0.15)",
        "mahogany-lg": "0 20px 60px rgba(93, 46, 31, 0.2)",
        "glow-gold": "0 0 20px rgba(247, 231, 180, 0.4)",
        "glow-blue": "0 0 20px rgba(27, 54, 93, 0.3)",
        "inner-soft": "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
      },

      // Performance-optimized animations
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": {
            textShadow: "0 0 5px currentColor",
            opacity: "1",
          },
          "50%": {
            textShadow: "0 0 20px currentColor, 0 0 30px currentColor",
            opacity: "0.8",
          },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
      },

      // Responsive breakpoints
      screens: {
        xs: "475px",
        "3xl": "1600px",
      },
    },
  },

  plugins: [
    tailwindcssAnimate,
    tailwindcssForms,
    tailwindcssTypography,

    // Cafe Opera Heritage Design System Plugin
    function ({ addBase, addComponents, addUtilities, theme }) {
      // Base layer - foundational styles
      addBase({
        // Reset and base typography
        html: {
          fontFamily: theme("fontFamily.body"),
          fontSize: theme("fontSize.body"),
          lineHeight: theme("fontSize.body[1].lineHeight"),
          color: theme("colors.foreground.DEFAULT"),
          backgroundColor: theme("colors.background.DEFAULT"),
        },
        "h1, h2, h3, h4, h5, h6": {
          fontFamily: theme("fontFamily.heading"),
          fontWeight: theme("fontWeight.semibold"),
          lineHeight: "1.2",
          color: theme("colors.foreground.heading"),
        },
        h1: { fontSize: theme("fontSize.heading-1") },
        h2: { fontSize: theme("fontSize.heading-2") },
        h3: { fontSize: theme("fontSize.heading-3") },

        // Focus styles for accessibility
        "*:focus-visible": {
          outline: `2px solid ${theme("colors.primary.DEFAULT")}`,
          outlineOffset: "2px",
        },
      });

      // Component layer - Heritage Opera specific components
      addComponents({
        // Button system
        ".btn": {
          "@apply inline-flex items-center justify-center font-heading font-semibold tracking-wide transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed":
            {},
        },
        ".btn-sm": {
          "@apply btn px-4 py-2 text-sm rounded-lg": {},
        },
        ".btn-md": {
          "@apply btn px-6 py-3 text-body rounded-lg": {},
        },
        ".btn-lg": {
          "@apply btn px-8 py-4 text-body-lg rounded-xl": {},
        },
        ".btn-primary": {
          "@apply btn-md bg-heritage-blue text-heritage-ivory hover:bg-opera-blue-800 focus:ring-heritage-blue/50 shadow-opera hover:shadow-opera-lg hover:-translate-y-0.5":
            {},
        },
        ".btn-secondary": {
          "@apply btn-md bg-heritage-gold text-heritage-blue hover:bg-champagne-gold-500 focus:ring-heritage-gold/50 shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5":
            {},
        },
        ".btn-outline": {
          "@apply btn-md bg-transparent text-heritage-blue border-2 border-heritage-blue hover:bg-heritage-blue hover:text-heritage-ivory focus:ring-heritage-blue/50":
            {},
        },
        ".btn-ghost": {
          "@apply btn-md bg-transparent text-foreground hover:bg-foreground/5 focus:ring-foreground/20":
            {},
        },

        // Card system
        ".card": {
          "@apply bg-background-card border border-warm-ivory-300/50 rounded-xl shadow-opera":
            {},
        },
        ".card-interactive": {
          "@apply card transition-all duration-300 hover:shadow-opera-lg hover:-translate-y-1 cursor-pointer":
            {},
        },
        ".card-premium": {
          "@apply card bg-gradient-to-br from-warm-ivory-50 to-warm-ivory-100 shadow-gold":
            {},
        },
        ".card-heritage": {
          "@apply card bg-gradient-to-br from-heritage-ivory to-warm-ivory-100 border-heritage-gold/20":
            {},
        },

        // Layout helpers
        ".layout-container": {
          "@apply container mx-auto px-4 sm:px-6 lg:px-8": {},
        },
        ".section-padding": {
          "@apply py-16 sm:py-20 lg:py-24": {},
        },
        ".section-light": {
          "@apply section-padding bg-background": {},
        },
        ".section-dark": {
          "@apply section-padding bg-heritage-blue text-heritage-ivory": {},
        },
        ".section-accent": {
          "@apply section-padding bg-heritage-gold text-heritage-blue": {},
        },

        // Heritage Opera specific components
        ".heritage-heading": {
          "@apply font-heading text-heritage-blue font-semibold": {},
        },
        ".heritage-text": {
          "@apply text-heritage-mahogany": {},
        },
        ".heritage-accent": {
          "@apply text-heritage-gold": {},
        },
      });

      // Utility layer - Heritage Opera specific utilities
      addUtilities({
        // Text utilities
        ".text-gradient-heritage": {
          background: `linear-gradient(135deg, ${theme("colors.heritage-blue")} 0%, ${theme("colors.heritage-gold")} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },
        ".text-gradient-opera": {
          background: `linear-gradient(135deg, ${theme("colors.opera-blue.900")} 0%, ${theme("colors.champagne-gold.400")} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },

        // Background utilities
        ".bg-gradient-heritage": {
          background: `linear-gradient(135deg, ${theme("colors.heritage-blue")} 0%, ${theme("colors.heritage-gold")} 100%)`,
        },
        ".bg-gradient-opera": {
          background: `linear-gradient(135deg, ${theme("colors.opera-blue.900")} 0%, ${theme("colors.champagne-gold.400")} 100%)`,
        },
        ".bg-gradient-elegant": {
          background: `linear-gradient(135deg, ${theme("colors.heritage-ivory")} 0%, ${theme("colors.warm-ivory.100")} 100%)`,
        },

        // Animation utilities
        ".animate-on-scroll": {
          "@apply opacity-0 translate-y-4 transition-all duration-700 ease-out":
            {},
        },
        ".animate-on-scroll.is-visible": {
          "@apply opacity-100 translate-y-0": {},
        },

        // Heritage Opera specific utilities
        ".heritage-shadow": {
          boxShadow: `0 10px 30px rgba(27, 54, 93, 0.1), 0 0 0 1px rgba(247, 231, 180, 0.1)`,
        },
        ".opera-glow": {
          boxShadow: `0 0 30px rgba(247, 231, 180, 0.3)`,
        },
      });
    },
  ],
};
