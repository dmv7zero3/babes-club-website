# hooks/

This folder contains custom React hooks for reusable logic across your application.

## How to use

- Add new files for each custom hook (e.g., `useDebounce.ts`, `useLocalStorage.ts`).
- Import and use these hooks in your components to share logic without duplicating code.

## Example

```tsx
// src/lib/hooks/useDebounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
```
