// src/core/Components/Header/MobileHeader/MobileMenuOverlay/hooks/useKeyboardHandler.ts

import { useEffect } from "react";

/**
 * Custom hook to handle keyboard interactions for the mobile menu
 * Primarily handles Escape key to close menu
 */
export const useKeyboardHandler = (
  isOpen: boolean,
  isAnimating: boolean,
  onClose: () => void
): void => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      // Only close if Escape is pressed and not currently animating
      if (e.key === "Escape" && !isAnimating) {
        onClose();
      }
    };

    // Add event listener when menu is open
    document.addEventListener("keydown", handleEscape);

    // Cleanup: remove event listener
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isAnimating, onClose]);
};
