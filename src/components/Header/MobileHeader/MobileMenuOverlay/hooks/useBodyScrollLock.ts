// src/core/Components/Header/MobileHeader/MobileMenuOverlay/hooks/useBodyScrollLock.ts

import { useEffect } from "react";

/**
 * Custom hook to lock body scroll when menu is open
 * Prevents background scrolling and handles scrollbar compensation
 */
export const useBodyScrollLock = (isOpen: boolean): void => {
  useEffect(() => {
    if (!isOpen) return;

    // Store original styles to restore later
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    // Apply scroll lock
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
};
