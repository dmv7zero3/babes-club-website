//tailwind.config.js
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssForms from "@tailwindcss/forms";
import tailwindcssTypography from "@tailwindcss/typography";
import colors from "tailwindcss/colors";

// Life Missions International design tokens
const designTokens = {
  colors: {
    primary: {
      50: "#F0F4F8",
      100: "#D9E2EC",
      200: "#BCCCDC",
      300: "#9FB3C8",
      400: "#829AB1",
      500: "#627D98",
      600: "#486581",
      700: "#334E68",
      800: "#243B53",
      900: "#102A43",
      DEFAULT: "#334E68",
    },
    secondary: {
      100: "#E3F6F5",
      300: "#A6E3E9",
      500: "#62BEC9",
      600: "#2C7A7B",
      700: "#1F5F61",
      DEFAULT: "#2C7A7B",
    },
    highlight: {
      100: "#FFF5DC",
      300: "#F4D999",
      500: "#D9B24C",
      DEFAULT: "#D9B24C",
    },
    neutral: {
      900: "#0B1D2E",
      700: "#2E3A47",
      500: "#667085",
      200: "#D0D5DD",
    },
    surface: "#FFFFFF",
    background: "#F4F6F8",
  },
  typography: {
    fontFamily: {
      heading: ["Poppins", "Inter", "system-ui", "sans-serif"],
      body: ["Inter", "system-ui", "sans-serif"],
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
      // Centralized Life Missions design tokens
      colors: {
        ...designTokens.colors,

        // Status colors (Tailwind defaults)
        success: designTokens.colors.secondary.DEFAULT,
        warning: designTokens.colors.highlight.DEFAULT,
        error: colors.red[600],
        info: designTokens.colors.primary.DEFAULT,
      },

      // Typography system
      fontFamily: {
        // Expose tokenized font families as Tailwind utilities
        ...designTokens.typography.fontFamily,
      },

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

    // Lightweight component utilities for Life Missions International
    function ({ addBase, addComponents, addUtilities, theme }) {
      // Base layer - foundational styles
      addBase({});

      // Component layer
      addComponents({
        // Container utility
        ".container": {
          "@apply w-11/12 py-16 mx-auto lg:py-20 max-w-[1350px]": {},
        },
        // Button system
        ".btn": {
          // Responsive: larger tap targets on mobile
          "@apply inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-base sm:px-6 sm:py-3 sm:text-base":
            {},
        },
        ".btn-sm": {
          "@apply btn px-4 py-2 text-sm rounded-lg": {},
        },
        ".btn-md": {
          "@apply btn px-5 py-3 text-base rounded-lg": {},
        },
        ".btn-lg": {
          "@apply btn px-6 py-4 text-lg rounded-xl": {},
        },
        ".btn-primary": {
          "@apply btn-md bg-primary-700 text-white hover:bg-primary-600 focus:ring-primary-400/40":
            {},
        },
        ".btn-secondary": {
          "@apply btn-md bg-secondary-600 text-white hover:bg-secondary-500 focus:ring-secondary-400/40":
            {},
        },
        ".btn-outline": {
          "@apply btn-md bg-transparent text-primary-700 border border-primary-600 hover:border-primary-500 hover:bg-primary-50 focus:ring-primary-300/40":
            {},
        },
      });

      // Utility layer
      addUtilities({
        ".text-gradient-primary": {
          background: `linear-gradient(135deg, ${theme("colors.primary.700")} 0%, ${theme("colors.highlight.500")} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },
        ".bg-gradient-primary": {
          background: `linear-gradient(135deg, ${theme("colors.primary.700")} 0%, ${theme("colors.primary.500")} 100%)`,
        },

        // Animation utilities
        ".animate-on-scroll": {
          "@apply opacity-0 translate-y-4 transition-all duration-700 ease-out":
            {},
        },
        ".animate-on-scroll.is-visible": {
          "@apply opacity-100 translate-y-0": {},
        },
      });
    },
  ],
};
