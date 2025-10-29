// src/utils/timing.ts
//
// Lightweight timing utilities (debounce, sleep).
// Prefer this over importing entire utility libraries for smaller bundles.

export type DebouncedFunction<T extends (...args: any[]) => any> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
};

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait = 0,
  opts: { leading?: boolean; trailing?: boolean } = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = opts;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;
  let result: ReturnType<T> | undefined;
  let leadingInvoked = false;

  const invoke = () => {
    if (lastArgs) {
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (leading && !timer && !leadingInvoked) {
      invoke();
      leadingInvoked = true;
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (trailing !== false) {
        invoke();
      }
      timer = null;
      leadingInvoked = false;
    }, wait);
  } as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    leadingInvoked = false;
  };

  debounced.flush = () => {
    if (timer) {
      if (lastArgs && opts.trailing !== false) invoke();
      clearTimeout(timer);
      timer = null;
      leadingInvoked = false;
    }
    return result;
  };

  debounced.pending = () => !!timer;

  return debounced;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
