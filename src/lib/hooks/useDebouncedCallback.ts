// src/lib/hooks/useDebouncedCallback.ts
//
// useDebouncedCallback
// --------------------
// Returns a stable debounced version of a callback. Useful for input handlers,
// resize/scroll handlers, or any high-frequency events.
//
// Example:
//   const onSearch = useDebouncedCallback((q: string) => fetch(q), 300);
//   <input onChange={(e) => onSearch(e.target.value)} />
//
// Notes:
// - Cleans up pending timers on unmount to avoid setState on unmounted component.
// - Recreates the debounced function only when deps change.

import { useEffect, useMemo } from "react";
import { debounce, type DebouncedFunction } from "@/utils/timing";

export type UseDebouncedCallbackOptions = {
  leading?: boolean; // call at the beginning of the wait period
  trailing?: boolean; // call at the end of the wait period (default: true)
  deps?: any[]; // extra deps to control when the debounced fn is recreated
};

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: UseDebouncedCallbackOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, deps = [] } = options;

  const debounced = useMemo(
    () => debounce(callback, delay, { leading, trailing }),
    // Recreate when callback, delay, options or extra deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callback, delay, leading, trailing, ...deps]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => debounced.cancel();
  }, [debounced]);

  return debounced;
}
