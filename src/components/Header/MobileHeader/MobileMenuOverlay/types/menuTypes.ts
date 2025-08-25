// src/components/Header/MobileHeader/MobileMenuOverlay/types/menuTypes.ts

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

// Additional types for Cafe Opera specific components
export interface MenuLogoProps {
  className?: string;
}

export interface MenuSocialProps {
  className?: string;
}

export interface MenuContactInfoProps {
  className?: string;
}

export interface MenuBackgroundProps {
  className?: string;
}

// Business data types
export interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface SocialMediaLinks {
  instagram?: string;
  facebook?: string;
  google_maps?: string;
}

// Animation configuration types
export interface AnimationConfig {
  duration: number;
  ease: string;
  stagger?: number;
}

export interface MenuAnimationTimeline {
  opening: AnimationConfig;
  closing: AnimationConfig;
  stagger: AnimationConfig;
}
