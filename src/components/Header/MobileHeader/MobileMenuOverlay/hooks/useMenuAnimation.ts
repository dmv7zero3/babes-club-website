// src/components/Header/MobileHeader/MobileMenuOverlay/hooks/useMenuAnimation.ts
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { UseMenuAnimationReturn } from "../types/menuTypes";

/**
 * Custom hook to handle GSAP animations for the Cafe Opera mobile menu overlay
 * Manages opening/closing animations with proper cleanup and anti-flicker
 */
export const useMenuAnimation = (isOpen: boolean): UseMenuAnimationReturn => {
  // Refs for GSAP animations
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const navContainer = navContainerRef.current;

    if (!overlay || !content) return;

    // Kill any existing animation to prevent conflicts
    if (animationRef.current) {
      animationRef.current.kill();
      animationRef.current = null;
    }

    if (isOpen) {
      // OPENING ANIMATION - Cafe Opera Style
      setShouldRender(true);
      setIsAnimating(true);

      // Set up DOM state immediately - key anti-flicker fix
      overlay.classList.add("is-animating");

      // Get nav items safely
      const navItems = navContainer?.querySelectorAll(".menu-nav-item") || [];

      // Force initial state with GSAP - prevents flicker completely
      gsap.set(overlay, {
        opacity: 0,
        visibility: "visible",
        pointerEvents: "auto",
        force3D: true,
        clearProps: "transform",
      });

      gsap.set(content, {
        opacity: 0,
        y: 60,
        scale: 0.95,
        force3D: true,
      });

      gsap.set(navItems, {
        opacity: 0,
        y: 40,
        rotationX: -15,
        force3D: true,
      });

      // Create sophisticated opening timeline - Asian elegance
      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
          force3D: true,
        },
        onComplete: () => {
          overlay.classList.add("is-open");
          setIsAnimating(false);

          // Performance: Remove will-change after animation
          gsap.set([overlay, content, ...navItems], {
            clearProps: "will-change",
          });
        },
      });

      // Elegant staggered animation sequence
      tl.to(overlay, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      })
        .to(
          content,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "back.out(1.2)",
          },
          "-=0.2"
        )
        .to(
          navItems,
          {
            opacity: 1,
            y: 0,
            rotationX: 0,
            duration: 0.4,
            stagger: {
              amount: 0.3,
              from: "start",
              ease: "power2.out",
            },
          },
          "-=0.3"
        );

      animationRef.current = tl;
    } else {
      // CLOSING ANIMATION - Smooth and Quick
      if (!shouldRender) return; // Already closed

      setIsAnimating(true);
      overlay.classList.remove("is-open");

      const navItems = navContainer?.querySelectorAll(".menu-nav-item") || [];

      // Create elegant closing timeline
      const tl = gsap.timeline({
        defaults: {
          ease: "power2.in",
          force3D: true,
        },
        onComplete: () => {
          overlay.classList.remove("is-animating");
          gsap.set(overlay, {
            visibility: "hidden",
            pointerEvents: "none",
            clearProps: "will-change,transform",
          });
          setShouldRender(false);
          setIsAnimating(false);
        },
      });

      // Quick reverse staggered animation
      tl.to(navItems, {
        opacity: 0,
        y: -30,
        rotationX: 15,
        duration: 0.25,
        stagger: {
          amount: 0.15,
          from: "end",
          ease: "power2.in",
        },
      })
        .to(
          content,
          {
            opacity: 0,
            y: -40,
            scale: 0.9,
            duration: 0.3,
            ease: "power2.in",
          },
          "-=0.1"
        )
        .to(
          overlay,
          {
            opacity: 0,
            duration: 0.25,
          },
          "-=0.15"
        );

      animationRef.current = tl;
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, [isOpen, shouldRender]);

  return {
    refs: { overlayRef, contentRef, navContainerRef },
    state: { isAnimating, shouldRender },
  };
};
