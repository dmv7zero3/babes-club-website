// src/core/Components/Header/MobileHeader/MobileMenuOverlay/types/menuTypes.ts

import { RefObject } from "react";

export interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MenuAnimationRefs {
  overlayRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
  navContainerRef: RefObject<HTMLDivElement>;
}

export interface MenuAnimationState {
  isAnimating: boolean;
  shouldRender: boolean;
}

export interface MenuNavLink {
  readonly path: string;
  readonly label: string;
}

export interface UseMenuAnimationReturn {
  refs: MenuAnimationRefs;
  state: MenuAnimationState;
}

export interface MenuNavigationProps {
  navRef: RefObject<HTMLDivElement>;
  onNavClick: () => void;
  links: readonly MenuNavLink[];
}

export interface MenuCloseButtonProps {
  onClose: () => void;
  isAnimating: boolean;
}
