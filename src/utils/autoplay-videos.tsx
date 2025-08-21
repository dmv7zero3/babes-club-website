import React, { RefObject, useEffect } from "react";

/**
 * Utility to handle video autoplay on scroll
 * - Only plays videos when they're visible in the viewport
 * - Pauses when they scroll out of view
 * - Handles mobile & iOS limitations
 */
export function autoplayVideos(): () => void {
  // Create options for IntersectionObserver
  const options: IntersectionObserverInit = {
    root: null, // Use viewport as root
    rootMargin: "0px", // No margin
    threshold: 0.25, // Trigger when at least 25% of the video is visible
  };

  // Store observers to clean up later if needed
  const observers: Array<{ element: Element; observer: IntersectionObserver }> =
    [];

  // Function to setup observers for each video
  function setupVideoObservers(): void {
    const videoElements = document.querySelectorAll(".autoplay-video");

    videoElements.forEach((video) => {
      // Create observer for this specific video
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // If video is visible in viewport
          if (entry.isIntersecting) {
            // Ensure video is muted (required for autoplay in most browsers)
            if (video instanceof HTMLVideoElement) {
              video.muted = true;

              // Try to play the video
              if (video.paused) {
                video.play().catch((error) => {
                  console.log("Autoplay prevented:", error);
                  // When it can't autoplay (common on mobile), we'll add a visible play button or poster
                });
              }
            }
          } else {
            // Pause when out of view to save resources
            if (video instanceof HTMLVideoElement && !video.paused) {
              video.pause();
            }
          }
        });
      }, options);

      // Start observing this video
      observer.observe(video);

      // Store observer for possible cleanup
      observers.push({ element: video, observer });
    });
  }

  // Set up video observers when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupVideoObservers);
  } else {
    // DOM is already ready
    setupVideoObservers();
  }

  // Return cleanup function for React components to use in useEffect
  return function cleanup(): void {
    observers.forEach(({ element, observer }) => {
      observer.unobserve(element);
    });
  };
}

/**
 * Custom React hook for using viewport-based video autoplay
 * @example
 * // In your component:
 * const videoRef = useRef<HTMLVideoElement>(null);
 * useVideoAutoplay(videoRef);
 */
export function useVideoAutoplay(videoRef: RefObject<HTMLVideoElement>): void {
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const options: IntersectionObserverInit = {
      threshold: 0.25, // Play when 25% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, options);

    observer.observe(video);

    // Cleanup function
    return () => {
      observer.unobserve(video);
    };
  }, [videoRef]);
}
