// src/core/Components/Header/MobileHeader/MobileMenuOverlay/styles/overlayStyles.ts

export const overlayStyles = `
  .menu-overlay-fixed {
    position: fixed;
    inset: 0;
    z-index: 99999;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    background: radial-gradient(circle at 20% 20%, rgba(0,191,255,0.1) 0%, transparent 40%),
                radial-gradient(circle at 80% 80%, rgba(138,43,226,0.1) 0%, transparent 40%),
                #000;
    transform: translateZ(0);
    will-change: opacity, visibility;
    backface-visibility: hidden;
    contain: layout style paint;
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
    transform: translateY(40px) translateZ(0);
    will-change: opacity, transform;
  }
  
  .menu-nav-item {
    opacity: 0;
    transform: translateY(32px) translateZ(0);
    will-change: opacity, transform;
  }
  
  /* Performance: Remove will-change after animations */
  .menu-overlay-fixed:not(.is-animating) .menu-content-wrapper,
  .menu-overlay-fixed:not(.is-animating) .menu-nav-item {
    will-change: auto;
  }
`;

// Singleton style injection to prevent duplicates
let stylesInjected = false;

export const injectStyles = (): void => {
  if (stylesInjected || typeof window === "undefined") return;

  const existingStyle = document.getElementById("mobile-menu-styles");
  if (!existingStyle) {
    const styleEl = document.createElement("style");
    styleEl.id = "mobile-menu-styles";
    styleEl.textContent = overlayStyles;
    document.head.appendChild(styleEl);
    stylesInjected = true;
  }
};
