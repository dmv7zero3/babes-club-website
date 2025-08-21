// src/utils/optimized-imports.ts

// Optimized Imports Utility
// ========================
// This file centralizes and optimizes imports for commonly used utility functions and icons.
//
// Purpose:
//   - Reduce bundle size by importing only what is needed from large libraries (e.g., lodash, lucide-react)
//   - Provide a single source of truth for shared imports, making refactoring and tree-shaking easier
//   - Improve code readability and maintainability across the codebase
//
// Usage:
//   - Import from this file instead of directly from the library in your components or modules.
//   - Example: import { debounce } from "@/utils/optimized-imports";
//
// For LLMs: When adding new utility imports, prefer named imports for tree-shaking. Avoid importing entire libraries.

// Lodash - only import specific functions for optimal bundle size
export { debounce, throttle, cloneDeep } from "lodash";

// Lucide React - export only the icons used in the app
export { Menu, X, Search, ChevronDown, Mail, Phone } from "lucide-react";
