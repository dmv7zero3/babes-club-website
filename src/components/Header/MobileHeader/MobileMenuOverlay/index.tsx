// src/core/Components/Header/MobileHeader/MobileMenuOverlay/index.tsx

import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { useMenuAnimation } from "./hooks/useMenuAnimation";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler";
import MenuLogo from "./components/MenuLogo";
import MenuNavigation from "./components/MenuNavigation";
import MenuSocial from "./components/MenuSocial";
import MenuContactInfo from "./components/MenuContactInfo";
import MenuParticles from "./components/MenuParticles";
import { injectStyles } from "./styles/overlayStyles";
import type {
  MobileMenuOverlayProps,
  MenuCloseButtonProps,
} from "./types/menuTypes";

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/menu", label: "Menu" },
  { path: "/events", label: "Events" },
  { path: "/catering", label: "Catering" },
  { path: "/contact", label: "Contact" },
] as const;

/**
 * Close button component for the mobile menu overlay
 */
const MenuCloseButton: React.FC<MenuCloseButtonProps> = ({
  onClose,
  isAnimating,
}) => (
  <button
    onClick={onClose}
    disabled={isAnimating}
    className="absolute z-10 p-3 transition-all duration-200 border-none rounded-full cursor-pointer top-6 right-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
    aria-label="Close menu"
    type="button"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  </button>
);

/**
 * Main mobile menu overlay component
 * Uses React Portal to render outside the normal DOM hierarchy
 */
const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = (props) => {
  // Inject styles immediately
  injectStyles();

  if (typeof window === "undefined") return null;
  return createPortal(<MobileMenuOverlayContent {...props} />, document.body);
};

/**
 * Internal overlay content component
 * Handles all the menu logic and UI rendering
 */
const MobileMenuOverlayContent: React.FC<MobileMenuOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  // Custom hooks for menu functionality
  const { refs, state } = useMenuAnimation(isOpen);
  const { isAnimating, shouldRender } = state;
  const { overlayRef, contentRef, navContainerRef } = refs;

  useBodyScrollLock(isOpen);
  useKeyboardHandler(isOpen, isAnimating, onClose);

  // Memoized handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    if (!isAnimating) {
      onClose();
    }
  }, [onClose, isAnimating]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleNavClick = useCallback(() => {
    // Small delay to allow visual feedback before closing
    setTimeout(handleClose, 100);
  }, [handleClose]);

  // Don't render if not needed
  if (!shouldRender && !isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="menu-overlay-fixed"
      onClick={handleBackdropClick}
    >
      <MenuParticles />

      <div
        ref={contentRef}
        className="relative flex flex-col h-full p-6 overflow-y-auto menu-content-wrapper"
      >
        <MenuCloseButton onClose={handleClose} isAnimating={isAnimating} />
        <MenuLogo />
        <MenuNavigation
          navRef={navContainerRef}
          onNavClick={handleNavClick}
          links={NAV_LINKS}
        />
        <MenuSocial />
        <MenuContactInfo />
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
