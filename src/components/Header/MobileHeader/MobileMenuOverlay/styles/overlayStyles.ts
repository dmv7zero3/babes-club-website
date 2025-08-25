// src/components/Header/MobileHeader/MobileMenuOverlay/styles/overlayStyles.ts

export const overlayStyles = `
  .menu-overlay-fixed {
    position: fixed;
    inset: 0;
    z-index: 99999;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    background: #F7E7B4; /* champagne-gold */
    transform: translateZ(0);
    will-change: opacity, visibility;
    backface-visibility: hidden;
    contain: layout style paint;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  .menu-overlay-fixed.is-animating {
    visibility: visible;
    pointer-events: auto;
  }
  
  .menu-overlay-fixed.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
  
  .menu-content-wrapper {
    opacity: 0;
    transform: translateY(60px) translateZ(0);
    will-change: opacity, transform;
    background: rgba(250, 247, 240, 0.02);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }
  
  .menu-nav-item {
    opacity: 0;
    transform: translateY(40px) translateZ(0);
    will-change: opacity, transform;
  }
  
  /* Performance: Remove will-change after animations */
  .menu-overlay-fixed:not(.is-animating) .menu-content-wrapper,
  .menu-overlay-fixed:not(.is-animating) .menu-nav-item {
    will-change: auto;
  }

  /* Custom scrollbar for Asian theme */
  .menu-content-wrapper::-webkit-scrollbar {
    width: 6px;
  }

  .menu-content-wrapper::-webkit-scrollbar-track {
    background: rgba(247, 231, 180, 0.1);
    border-radius: 3px;
  }

  .menu-content-wrapper::-webkit-scrollbar-thumb {
    background: rgba(247, 231, 180, 0.3);
    border-radius: 3px;
  }

  .menu-content-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(247, 231, 180, 0.5);
  }
`;

// Singleton style injection to prevent duplicates
let stylesInjected = false;

export const injectStyles = (): void => {
  if (stylesInjected || typeof window === "undefined") return;

  const existingStyle = document.getElementById(
    "cafe-opera-mobile-menu-styles"
  );
  if (!existingStyle) {
    const styleEl = document.createElement("style");
    styleEl.id = "cafe-opera-mobile-menu-styles";
    styleEl.textContent = overlayStyles;
    document.head.appendChild(styleEl);
    stylesInjected = true;
  }
};
