//tailwind.config.js
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssForms from "@tailwindcss/forms";
import tailwindcssTypography from "@tailwindcss/typography";
import colors from "tailwindcss/colors";

// Cafe Opera Heritage Opera Design Tokens
const designTokens = {
  colors: {
    // Project brand color
    "babe-pink": {
      50: "#fff1f8",
      100: "#ffe4f1",
      200: "#ffc6e3",
      300: "#ffa1cf",
      400: "#ff75bb",
      500: "#fe3ba1",
      600: "#e02684",
      700: "#bb1b6c",
      800: "#991758",
      900: "#7d1449",
      DEFAULT: "#fe3ba1",
    },
  },
  typography: {
    fontFamily: {},
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

        // Status colors (Tailwind defaults)
        success: colors.green[600],
        warning: colors.yellow[600],
        error: colors.red[800],
        info: colors.blue[700],

        // brand-pink is provided via designTokens.colors
      },

      // Typography system
      fontFamily: {
        "grand-hotel": ["Grand Hotel", "cursive"], // use class: font-grand-hotel
      },

      // Enhanced shadow system for Heritage Opera
      boxShadow: {},

      // Performance-optimized animations
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        // Softer, more refined luxury glow (minimal flicker)
        "glow-pulse-soft": "glowPulseSoft 6s ease-in-out infinite",
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
        // Realistic neon style glow with subtle, irregular flicker and breathing.
        // Percent stops chosen to avoid a mechanical rhythm.
        glowPulse: {
          // Stable bright start
          "0%": {
            textShadow:
              "0 0 2px currentColor, 0 0 6px currentColor, 0 0 12px currentColor, 0 0 24px currentColor",
            filter: "brightness(1)",
            opacity: "0.96",
          },
          // Quick micro flicker
          "3%": { opacity: "0.75", filter: "brightness(.85)" },
          "4%": { opacity: "0.95", filter: "brightness(1)" },
          // Slight dip
          "6%": { opacity: "0.88", filter: "brightness(.92)" },
          // Return
          "8%": { opacity: "0.97" },
          // Breathing expansion (peak glow)
          "25%": {
            textShadow:
              "0 0 4px currentColor, 0 0 10px currentColor, 0 0 20px currentColor, 0 0 38px currentColor, 0 0 55px currentColor",
            opacity: "1",
            filter: "brightness(1.05)",
          },
          // Random tiny flicker mid-way
          "27%": { opacity: "0.8", filter: "brightness(.9)" },
          "28%": { opacity: "1", filter: "brightness(1.05)" },
          // Ease down from peak
          "40%": {
            textShadow:
              "0 0 3px currentColor, 0 0 8px currentColor, 0 0 16px currentColor, 0 0 30px currentColor",
            opacity: "0.93",
            filter: "brightness(.97)",
          },
          // Another small irregular flicker cluster
          "43%": { opacity: "0.7", filter: "brightness(.85)" },
          "44%": { opacity: "0.9", filter: "brightness(1)" },
          "46%": { opacity: "0.78", filter: "brightness(.9)" },
          "47%": { opacity: "0.95" },
          // Second breathing peak (not quite as bright)
          "60%": {
            textShadow:
              "0 0 4px currentColor, 0 0 10px currentColor, 0 0 22px currentColor, 0 0 42px currentColor, 0 0 60px currentColor",
            opacity: "1",
            filter: "brightness(1.04)",
          },
          // Slow settle
          "78%": {
            textShadow:
              "0 0 2px currentColor, 0 0 6px currentColor, 0 0 14px currentColor, 0 0 28px currentColor",
            opacity: "0.94",
            filter: "brightness(.98)",
          },
          // Gentle pre-loop swell
          "90%": {
            textShadow:
              "0 0 3px currentColor, 0 0 8px currentColor, 0 0 18px currentColor, 0 0 34px currentColor, 0 0 50px currentColor",
            opacity: "0.99",
            filter: "brightness(1.03)",
          },
          // End matches initial for seamless loop
          "100%": {
            textShadow:
              "0 0 2px currentColor, 0 0 6px currentColor, 0 0 12px currentColor, 0 0 24px currentColor",
            opacity: "0.96",
            filter: "brightness(1)",
          },
        },
        // Simplified luxury glow: a smooth breathing radiance without pronounced flicker.
        glowPulseSoft: {
          "0%": {
            textShadow:
              "0 0 2px currentColor, 0 0 5px currentColor, 0 0 12px currentColor, 0 0 22px currentColor",
            opacity: "0.94",
            filter: "brightness(.98)",
          },
          "25%": {
            textShadow:
              "0 0 3px currentColor, 0 0 7px currentColor, 0 0 16px currentColor, 0 0 30px currentColor",
            opacity: "0.97",
            filter: "brightness(1)",
          },
          "50%": {
            textShadow:
              "0 0 4px currentColor, 0 0 10px currentColor, 0 0 22px currentColor, 0 0 40px currentColor",
            opacity: "1",
            filter: "brightness(1.04)",
          },
          "75%": {
            textShadow:
              "0 0 3px currentColor, 0 0 8px currentColor, 0 0 18px currentColor, 0 0 32px currentColor",
            opacity: "0.97",
            filter: "brightness(1.01)",
          },
          "100%": {
            textShadow:
              "0 0 2px currentColor, 0 0 5px currentColor, 0 0 12px currentColor, 0 0 22px currentColor",
            opacity: "0.94",
            filter: "brightness(.98)",
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
      addBase({});

      // Component layer - Heritage Opera specific components
      addComponents({
        // Container utility
        ".container": {
          "@apply w-11/12 py-16 mx-auto lg:py-20 max-w-[1350px]": {},
        },
        // Button system
        ".btn": {
          // Responsive: larger tap targets on mobile
          "@apply inline-flex items-center justify-center font-heading font-semibold tracking-wide transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-base sm:px-6 sm:py-3 sm:text-base":
            {},
        },
        ".btn-sm": {
          "@apply btn px-4 py-2 text-sm rounded-lg": {},
        },
        ".btn-md": {
          // Responsive: larger on mobile
          "@apply btn px-12 py-6 text-xl rounded-lg lg:px-6 lg:py-3 lg:text-base":
            {},
        },
        ".btn-lg": {
          "@apply btn px-12 py-10 text-base text-3xl rounded-xl": {},
        },
        ".btn-primary": {
          // Responsive: inherit btn-md changes
          "@apply btn-lg bg-blue-900 text-zinc-200 hover:bg-blue-800 focus:ring-blue-900/50 shadow-md hover:shadow-lg hover:-translate-y-0.5":
            {},
        },
        ".btn-secondary": {
          "@apply btn-lg bg-amber-400 text-blue-900 hover:bg-amber-500 focus:ring-amber-400/50 shadow-sm hover:shadow-md hover:-translate-y-0.5":
            {},
        },
        ".btn-outline": {
          // Responsive: inherit btn-md changes
          "@apply btn-md bg-transparent text-blue-900 border-2 border-blue-900 hover:bg-blue-900 hover:text-zinc-200 focus:ring-blue-900/50":
            {},
        },
        ".btn-ghost": {
          "@apply btn-md bg-transparent text-slate-900 hover:bg-black/5 focus:ring-black/20":
            {},
        },
      });

      // Utility layer - Heritage Opera specific utilities
      addUtilities({
        // Text utilities
        ".text-gradient-heritage": {
          background: `linear-gradient(135deg, ${theme("colors.blue.900")} 0%, ${theme("colors.amber.400")} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },
        ".text-gradient-opera": {
          background: `linear-gradient(135deg, ${theme("colors.blue.900")} 0%, ${theme("colors.amber.400")} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },

        // Background utilities
        ".bg-gradient-heritage": {
          background: `linear-gradient(135deg, ${theme("colors.blue.900")} 0%, ${theme("colors.amber.400")} 100%)`,
        },
        ".bg-gradient-opera": {
          background: `linear-gradient(135deg, ${theme("colors.blue.900")} 0%, ${theme("colors.amber.400")} 100%)`,
        },
        ".bg-gradient-elegant": {
          background: `linear-gradient(135deg, ${theme("colors.zinc.100")} 0%, ${theme("colors.zinc.50")} 100%)`,
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
