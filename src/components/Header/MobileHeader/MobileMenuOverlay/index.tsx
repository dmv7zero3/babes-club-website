// src/components/Header/MobileHeader/MobileMenuOverlay/index.tsx
import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { useMenuAnimation } from "./hooks/useMenuAnimation";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useKeyboardHandler } from "./hooks/useKeyboardHandler";
import MenuLogo from "./components/MenuLogo";
import MenuNavigation from "./components/MenuNavigation";
import MenuSocial from "./components/MenuSocial";
import MenuContactInfo from "./components/MenuContactInfo";
import MenuCloseButton from "./components/MenuCloseButton";
import MenuBackground from "./components/MenuBackground";
import { injectStyles } from "./styles/overlayStyles";
import type {
  MobileMenuOverlayProps,
  MenuCloseButtonProps,
} from "./types/menuTypes";

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/menu", label: "Menu" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
] as const;

// ...existing code...

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
    setTimeout(handleClose, 150);
  }, [handleClose]);

  // Don't render if not needed
  if (!shouldRender && !isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="menu-overlay-fixed bg-opera-blue-900"
      onClick={handleBackdropClick}
    >
      {/* Removed MenuBackground for no gradient/floating elements */}
      <div
        ref={contentRef}
        className="relative flex flex-col items-center justify-center min-h-full overflow-y-auto h-fit menu-content-wrapper"
      >
        <MenuCloseButton onClose={handleClose} isAnimating={isAnimating} />
        <div className="flex flex-col items-center w-full max-w-lg ">
          <MenuLogo />
          <div className="mt-8">
            <MenuNavigation
              navRef={navContainerRef}
              onNavClick={handleNavClick}
              links={NAV_LINKS}
            />
          </div>
          <div className="mt-8">
            <MenuSocial />
          </div>
          <div className="mt-12">
            <MenuContactInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
