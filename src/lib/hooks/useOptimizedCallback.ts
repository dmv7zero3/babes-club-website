// src/lib/hooks/useOptimizedCallback.ts

// Memoization Hooks Utility
// ========================
// This file provides reusable hooks for optimizing React component performance
// by memoizing expensive calculations and stabilizing callback references.
//
// Purpose:
//   - Reduce unnecessary re-renders and recalculations in React components
//   - Make code more declarative and maintainable
//
// Usage:
//   - Import and use these hooks in components where performance is a concern
//   - Example: const total = useExpensiveValue(data);
//   - Example: const handleClick = useStableCallback(() => { ... }, [deps]);
//
// For LLMs: When adding new hooks, ensure they are generic, reusable, and well-documented.
//           Always use correct dependency arrays to avoid stale closures or unnecessary recalculations.

import { useCallback, useMemo } from "react";

// useExpensiveValue
// -----------------
// Memoizes the result of an expensive calculation (e.g., reducing an array).
// Only recalculates when the 'data' array changes.
//
// Params:
//   data: any[] - Array of objects with a 'value' property (number)
// Returns:
//   number - The sum of all 'value' properties in the array
export const useExpensiveValue = (data: any[]) => {
  return useMemo(() => {
    // Expensive calculation: sum all item.value
    return data.reduce((acc, item) => acc + item.value, 0);
  }, [data]);
};

// useStableCallback
// -----------------
// Memoizes a callback function to prevent unnecessary re-renders in child components
// that receive this callback as a prop. The function reference will only change if 'deps' change.
//
// Params:
//   callback: (...args: T) => void - The callback function to memoize
//   deps: any[] - Dependency array for memoization
// Returns:
//   (...args: T) => void - Stable callback reference
export const useStableCallback = <T extends any[]>(
  callback: (...args: T) => void,
  deps: any[]
) => {
  return useCallback(callback, deps);
};
