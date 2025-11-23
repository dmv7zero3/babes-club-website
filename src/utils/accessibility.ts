/**
 * Accessibility utilities for The Babes Club Dashboard
 * Provides helpers for focus management, ARIA announcements, and keyboard navigation
 */

import { useRef } from "react";

/**
 * Trap focus within a container (for modals, drawers)
 */
export const createFocusTrap = (container: HTMLElement | null) => {
  if (!container) return { activate: () => {}, deactivate: () => {} };

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        event.preventDefault();
      }
    }
  };

  return {
    activate: () => {
      container.addEventListener("keydown", handleTabKey);
      firstElement?.focus();
    },
    deactivate: () => {
      container.removeEventListener("keydown", handleTabKey);
    },
  };
};

/**
 * Announce messages to screen readers
 */
export const announce = (
  message: string,
  priority: "polite" | "assertive" = "polite"
) => {
  const announcer = document.createElement("div");
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", priority);
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  announcer.textContent = message;

  document.body.appendChild(announcer);

  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export const generateId = (prefix: string = "babes-dashboard"): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * Custom hook for managing focus return
 */
export const useFocusReturn = () => {
  const previousFocus = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocus.current = document.activeElement as HTMLElement;
  };

  const returnFocus = () => {
    previousFocus.current?.focus();
  };

  return { saveFocus, returnFocus };
};
