// src/core/utils/index.ts
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
