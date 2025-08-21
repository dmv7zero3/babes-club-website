// src/core/ui/MorphIcon/index.tsx
import React, { useRef, useEffect, useState } from "react";
import { icons, IconName } from "../Icons";
import { gsap } from "gsap";

// Hardcoded path data for your icons (white fill)
const ICON_PATHS: Record<IconName, string> = {
  Hookah:
    "M15,5.3c-.2,0-.4,0-.4.3-.2.7-.8,1.1-1.5,1s-1.2-.7-1.2-1.4h0v-.2c-.2-.6-.5-1-.9-1.3-.5-.3-1-.4-1.5-.4-.6.1-1.1.5-1.4,1-.3-.5-.8-.9-1.5-1v-1h1.4c.2,0,.4-.2.4-.4s-.2-.4-.4-.4h-1.5v-.8h.3c.2,0,.4-.2.4-.4,0,0-.2-.3-.4-.3h-1.3c-.2,0-.4.2-.4.4s.2.4.4.4h.3v.7h-1.4c-.2,0-.4.1-.4.3s.2.4.4.4h1.4v1c-.5,0-.9.3-1.2.6-.5.4-.7,1-.7,1.6,0,1.1.8,2,1.9,2.2v1.4c-1.1.1-1.9,1-1.9,2.1s.3,1.2.7,1.6c-1.1.6-1.9,1.7-1.9,3s.3,1.6.8,2.2c.1,0,.2,0,.4,0h4.6c.1,0,.2,0,.3-.1.5-.6.8-1.4.8-2.2,0-1.3-.7-2.4-1.9-3,.4-.4.7-1,.7-1.6,0-1.1-.8-2-1.9-2.2v-1.3c1-.2,1.7-.9,1.9-1.9,0,0,.1,0,0-.2,0-.7.5-1.3,1.2-1.4.7,0,1.3.4,1.5,1h0c-.1,1.1.7,2.1,1.8,2.2h.3c.4,0,.8,0,1.2-.4s.7-.7.9-1.2c0,0-.1-.3-.3-.4ZM6.9,13.2c1.1.3,1.9,1.3,1.9,2.5s-.2,1.1-.5,1.6h-4.3c-.3-.4-.5-1-.5-1.6,0-1.2.8-2.2,1.9-2.5h1.2q.2,0,.3,0ZM7.7,11.1c0,.6-.4,1.2-1,1.4q0,0-.2.1h-.7c-.6-.2-1.1-.7-1.1-1.4s.7-1.5,1.5-1.5c.8-.1,1.5.6,1.5,1.4ZM7.7,5.4c0,.8-.7,1.5-1.5,1.5s-1.5-.7-1.5-1.5.8-1.5,1.5-1.5h0c.7,0,1.3.5,1.4,1,0,.3,0,.4,0,.5h0Z",

  Flower:
    "M15.8,10.8c1.3,0,2.1-.7,2.2-1.9,0-.5-.1-1-.5-1.3-.3-.3-.9-.7-1.9-.7s-2.7.5-4.4,1.5c0,0-.1,0-.1.1,0-.3-.1-.5-.2-.7,3.1-1.2,4.7-2.2,5-3.4.2-.6,0-1.2-.5-1.7-.3-.5-.8-.7-1.3-.7s-1.3.2-2.1,1.2c-.7.8-1.3,2.1-1.8,3.8-.2-.2-.4-.3-.6-.3,1.4-2.9,1.7-4.8,1.1-5.8-.3-.6-.8-.8-1.6-.9h-.1c-.7,0-1.3.4-1.6,1-.4.7-.9,2.5,1.1,5.7-.3.1-.5.2-.7.4-.5-1.7-1.1-2.9-1.8-3.8-.8-.9-1.5-1.1-2-1.1s-1.1.2-1.4.6c-.5.6-.7,1.2-.5,1.8.3,1.2,1.9,2.2,5,3.2,0,.3-.2.5-.2.8,0,0,0-.1,0-.1-1.6-.9-3-1.4-4.2-1.4s-1.7.4-2.1.8c-.4.4-.5.9-.5,1.4.1,1.2.8,1.8,2,1.8h0c1.1,0,2.7-.5,4.9-1.6,0,.2.2.5.4.7,0,0-.2.1-.3.1-3.8,1.1-4.7,2.7-4.9,3.5-.1.7,0,1.4.6,1.8.4.3.9.5,1.3.5,1.4,0,2.6-1.7,3.9-5.4.2.1.5.2.7.3-.1.1-.1.2-.1.3-1.9,3.3-1.5,5.1-1.1,5.8.3.5.9.9,1.5.9h.2c.8-.1,1.3-.4,1.6-.9.6-1.1.2-3-1.3-6.1.3-.1.5-.2.7-.3,1.2,3.5,2.4,5.2,3.8,5.2s.9-.2,1.4-.6c.5-.5.7-1.1.6-1.9-.2-.8-1.1-2.4-4.9-3.3,0,0-.1,0-.2-.1.2-.2.3-.5.4-.7,2,1.1,3.5,1.5,4.6,1.5ZM15.6,7.6c.8,0,1.2.3,1.4.5.2.2.3.5.3.8-.1.9-.5,1.2-1.4,1.2s-2.3-.4-4-1.2c1.8-1,3-1.3,3.7-1.3ZM2,10.4h0c-.8,0-1.2-.3-1.3-1.2,0-.3.1-.6.3-.8.2-.2.7-.5,1.5-.5s2.2.4,3.6,1.2c-1.8.8-3.1,1.3-4.1,1.3ZM4,15.4c-.3,0-.5-.1-.8-.4-.3-.2-.4-.6-.3-1.1,0-.3.3-.9,1.1-1.5.7-.6,1.8-1,3.1-1.4-1.4,3.6-2.4,4.4-3.1,4.4ZM15.1,13.6c.1.4,0,.9-.3,1.1-.3.3-.6.4-.9.4-.6,0-1.7-.7-2.9-4.2,3.3.9,4,2.2,4.1,2.7ZM14.1,2.7c.3,0,.6,0,.8.3.3.4.4.7.3,1.1-.2.6-1,1.6-4.2,2.8.9-3.1,2.2-4.2,3.1-4.2ZM8,1.4c.2-.4.6-.7,1-.7h.1c.5,0,.8.2,1,.5.3.5.4,1.8-1.1,4.9-1.7-2.9-1.3-4.3-1-4.7ZM2.8,4.4c0-.4,0-.7.3-1.1.2-.2.5-.4.9-.4.9,0,2.2,1.1,3,4.1-3.2-1.1-4-2-4.2-2.6ZM10.1,16.7c-.2.3-.5.5-1,.6h-.1c-.4,0-.7-.2-.9-.6-.3-.5-.7-1.9,1-4.9,1.3,3,1.3,4.3,1,4.9ZM9,10.3c-.8,0-1.4-.6-1.4-1.4s.6-1.5,1.4-1.6h0c.8,0,1.4.6,1.4,1.4.1.9-.6,1.6-1.4,1.6Z",

  WineBottle:
    "M10.4,5.4v-2c.1,0,.1-.2.1-.3V.3c0-.2-.1-.3-.3-.3h-2.4c-.2,0-.3.1-.3.3v2.8c0,0,0,.2,0,.3v2c-1.1.5-1.8,1.6-1.8,2.9v8.6c0,.6.5,1.1,1.1,1.1h4.3c.6,0,1.1-.5,1.1-1.1v-8.6c-.1-1.3-.8-2.4-1.9-2.9ZM8.1.7h1.7v2.1h-1.7V.7ZM11.2,17.3h-4.4c-.2,0-.4-.2-.4-.4v-8.6c0-1.1.6-2,1.6-2.4.1,0,.2-.2.2-.3v-2.2h1.5v2.1c0,0,.1.3.2.3,1,.4,1.6,1.3,1.6,2.4v.9h-3.1c-.2,0-.4.2-.4.4v5.3c0,.2.1.3.3.3h3.2v1.8c.1.3-.1.4-.3.4ZM11.6,14.5h-2.9v-4.7h2.9v4.7Z",

  WineGlasses:
    "M16.5,13.5c0-.1-.2-.2-.3-.2l-1.3.3-.8-3.3c.7-.2,1.3-.7,1.7-1.3.4-.7.6-1.5.4-2.3-.1-.5-.2-1-.4-1.5-.1-.5-.2-1.1-.4-1.7,0,0-.2-.2-.3-.2l-5.4,1.3c-.1,0-.1,0-.2,0v.2c.1.2.1.4.2.7l-4.7-2.2h-.2c0,0,0,0,0,0-.3.5-.5,1-.8,1.5-.2.5-.4,1-.6,1.4-.4.8-.4,1.6,0,2.4.2.7.7,1.3,1.3,1.6l-1.4,3-1.2-.6c-.1-.1-.3,0-.3.1-.1.1,0,.3.1.3l2.9,1.4h0c0,0,.2-.1.2-.1,0-.1,0-.3,0-.3l-1.2-.6,1.4-3c.3.1.7.2,1.1.2s.7-.1,1-.2c.8-.3,1.4-.8,1.7-1.6.2-.4.4-.9.7-1.4.1-.3.3-.6.4-.9.1.5.2,1,.3,1.4.3,1.4,1.6,2.4,3,2.4h.4l.8,3.3-1.3.2c-.1,0-.2.2-.2.3s.1.2.2.2h.1l3.1-.7c.2-.1.2-.2.2-.3ZM5,3.9l4.6,2.2c0,0-.1,0-.1.2l-5.5-.3c0-.2.2-.5.4-.8.2-.4.4-.8.6-1.3ZM8.3,8.8c-.3.6-.8,1.1-1.4,1.3-.6.2-1.3.2-1.9-.1-.7-.3-1.1-.8-1.4-1.4-.2-.7-.2-1.4.1-2q0,0,0,0l5.5.3c-.1.2-.2.4-.3.6-.2.5-.5,1-.7,1.4ZM10.1,5l5-1.2c.1.5.2.9.3,1.4.1.4.2.8.3,1.3l-5.2.3c0,0-.1-.2-.1-.3-.1-.5-.2-1-.3-1.5ZM10.7,8c-.1-.2-.1-.4-.2-.7l5.2-.3c.1.6,0,1.2-.4,1.7-.4.6-.9,1-1.6,1.1-1.3.4-2.6-.5-3-1.8Z",

  WineBottleBucket:
    "M13.9,7.1h-3.3v-.3c-.4-1.1-1.3-1.9-2.4-2.1l-.5-1.8h0c0,0,0-.2,0-.2L7.1.2c0-.1-.3-.2-.4-.2l-2.1.6c-.2,0-.3.2-.3.4l.7,2.5c0,0,0,.2.2.2h0l.5,1.8c-.5.4-.8,1-.9,1.7h-.7c-.2,0-.3,0-.3.3v1.3c0,0,.1.2.3.2h0l1,8.7c0,.2.2.3.3.3h7.3c.2,0,.3-.1.3-.3l1-8.7h0c.2,0,.3-.1.3-.3v-1.3c0-.2-.2-.3-.4-.3ZM6.5.7l.5,1.8-1.4.5-.6-1.9,1.5-.4ZM6.3,5.8c0,0,0-.2,0-.3l-.6-1.9,1.3-.4.5,1.9c0,0,0,.2.3.2,1,0,1.7.8,2,1.7h0c0,0-4.5,0-4.5,0,0-.5.4-1,.9-1.3ZM4.4,7.7h9.2v.7H4.4v-.7ZM12.4,17.4h-6.8l-.9-8.4h8.6l-.9,8.4Z",

  Halal:
    "M5.9,0c-.2,0-.4.2-.5.3-.2.4-.4.9-.5,1.3.5,2.3,1.4,4.9.9,7.3s-1.8,3.1-3.8,2.3-1.2-2.3-1.1-3.5,0-.3,0-.4c-.1.2-.2.4-.3.6-.8,1.7-1.3,4.5,1.1,5.3,2.4.8,4.4-.7,5.1-2.6s0-2,0-3.2-.2-2.3,0-3.5,0-1.2.3-1.8c-.5-.7-1-1.3-1.1-2.1ZM14.7.7c-.6,0-1.1-.1-1.7-.4.2,4.6-.4,10.6-5.6,12.1s-1,.2-1.5.3-.3,0-.3,0c2.1.5,4.8.9,6.4-1s1.4-3.8,1.6-5.6h0v.7c0,1.5,0,4,1.5,4.9s3.1.3,4.3,0,2.7-1.3,4.2-1.2c.3-.7.7-1.2,1.3-1.7-1.2,0-2.4-.5-3.5-.9s-1.4-.7-2.1-1c-2.1-.8-3.2,1-3.4,2.8l.5-.5c1.4-1.2,2.6-.5,4,.2s0,0,0,0c0,.2-1.2.6-1.4.7-1.4.4-3.5.7-4.1-1s-.7-5.1-.5-7,.1-.9.2-1.3h0ZM11.5,8.8c.2-.8.3-1.7,0-2.5-.4-1.6-1.6-2.6-3.1-3.2s-.7-.3-1.1-.4c-.3.8-.4,1.8,0,2.7,0,0,.9.2,1,.2,1.4.3,2.6,1,3,2.5l.2.7h.1Z",

  MoonStars:
    "M9,16.3c-2,0-3.9-.8-5.3-2.2-1.4-1.5-2.2-3.3-2.2-5.3C1.5,5.6,3.5,2.7,6.6,1.7c0,0,.3,0,.3.1s.1.2,0,.3c-.6,1-.8,2.2-.8,3.3,0,3.8,3.1,6.9,6.9,6.9s1.5-.2,2.3-.3c.1,0,.3,0,.3.1.1.1.1.3,0,.3-1.3,2.4-3.8,3.9-6.6,3.9ZM6.1,2.5c-2.4,1.2-4,3.5-4,6.3s3.1,6.8,6.9,6.8s4.3-1.1,5.7-2.9c-.6.1-1.1.2-1.7.2-2,0-3.9-.8-5.3-2.2s-2.2-3.3-2.2-5.3.2-2,.6-2.9ZM8.8,7.9c-.1,0-.3,0-.3-.2l-.6-1.2-1.2-.7c0,0-.2-.2-.2-.3s0-.3.2-.3l1.3-.7.7-1.3c.1,0,.2-.2.3-.2h0c.1,0,.3,0,.3.2l.8,1.3,1.3.7c.1,0,.2.2.2.3s-.1.3-.2.3l-1.6.7-.7,1.2c0,.2-.1.2-.3.2ZM7.4,5.5l.8.5h.1l.4.8.5-.8h.1l.8-.4-.8-.5c-.1,0-.1,0-.1,0l-.5-.8-.4.8c0,0-.1,0-.1,0l-.8.4ZM14.2,9.9c-.1,0-.3-.1-.3-.2l-.8-1.3-1.3-.7c-.1,0-.2-.2-.2-.3s.1-.3.2-.3l1.3-.8.7-1.3c.1,0,.2-.2.3-.2s.3,0,.3.2l.6,1.5,1.3.7c.2,0,.3.2.3.3s-.1.3-.2.3l-1.3.7-.7,1.3c0,0,0,0-.2,0ZM12.8,7.5l.8.4c.1,0,.1,0,.1,0l.4.8.4-.8c0,0,.1,0,.1,0l.8-.4-.8-.5h-.1l-.4-.8-.4.8h0l-.8.5Z",

  Star: "M9,12.5c-.1,0-.3-.1-.3-.2l-1.1-1.9-1.9-1.1c0,0-.2-.2-.2-.3s0-.3.2-.3l1.9-1.1,1.1-1.9c0,0,.2-.2.3-.2s.3,0,.3.2l1.1,1.9,1.9,1.1c.1.1.2.2.2.3s-.1.3-.2.3l-1.9,1.1-1.1,1.9c0,0-.2.2-.3.2ZM6.6,9l1.4.8c.1,0,.1.1.1.1l.9,1.5.8-1.4c0-.1.1-.1.1-.1l1.5-.9-1.5-.8c-.1,0-.1-.1-.1-.1l-.8-1.5-.8,1.5c0,.1-.1.1-.1.1l-1.5.8ZM9.2,2.9V.4c0-.2-.2-.4-.4-.4s-.4.2-.4.4v2.6c0,.2.2.4.4.4.2-.1.4-.3.4-.5ZM9.2,17.6v-2.6c0-.2-.2-.4-.4-.4s-.4.2-.4.4v2.6c0,.2.2.4.4.4s.4-.2.4-.4ZM13.4,5l1.8-1.8c.1,0,.1-.4,0-.5s-.4,0-.5,0l-1.8,1.8c-.1,0-.1.4,0,.5,0,0,.1,0,.2,0s.2,0,.3,0ZM3,15.4l1.8-1.8c0-.1,0-.4,0-.5s-.4-.1-.5,0l-1.8,1.8c0,.1,0,.4,0,.5s.2.1.3.1c0,0,0-.1.2-.1ZM18,9c0-.2-.2-.4-.4-.4h-2.6c-.2,0-.4.2-.4.4s.2.4.4.4h2.6c.2,0,.4-.2.4-.4ZM3.3,9c0-.2-.2-.4-.4-.4H.4c-.2,0-.4.2-.4.4s.2.4.4.4h2.6c0,0,.3-.2.3-.4ZM15.2,15.4c.1-.1.1-.4,0-.5l-1.8-1.9c-.1-.1-.4-.1-.5,0s-.1.4,0,.5l1.8,1.8c.1.1.2.1.3.1,0,0,.1,0,.2,0ZM4.8,5c0,0,0-.4,0-.5l-1.8-1.9c0,0-.4,0-.5,0-.2.2-.2.4,0,.6l1.8,1.8s0,0,.2,0,.2,0,.3,0ZM6.2,7c-.6,0-1.1-.5-1.1-1.1s.5-1.1,1.1-1.1,1.1.5,1.1,1.1c0,.6-.4,1.1-1.1,1.1ZM6.2,5.5c-.2,0-.3.2-.3.4s.2.4.4.4.4-.2.4-.4c-.1-.2-.3-.4-.5-.4ZM12.1,7.7c-.6,0-1.1-.5-1.1-1.1s.5-1.1,1.1-1.1,1.1.5,1.1,1.1c0,.6-.5,1.1-1.1,1.1ZM12.1,6.2c-.2,0-.4.2-.4.4s.2.4.4.4.4-.2.4-.4-.2-.4-.4-.4ZM11.8,12.9c-.6,0-1.1-.5-1.1-1.1s.5-1.1,1.1-1.1,1.1.5,1.1,1.1c0,.6-.5,1.1-1.1,1.1ZM11.8,11.4c-.2,0-.4.2-.4.4s.2.4.4.4.4-.2.4-.4c0-.2-.2-.4-.4-.4ZM6.2,12.9c-.6,0-1.1-.5-1.1-1.1s.5-1.1,1.1-1.1,1.1.5,1.1,1.1c0,.6-.4,1.1-1.1,1.1ZM6.2,11.4c-.2,0-.4.2-.4.4s.2.4.4.4.4-.2.4-.4-.2-.4-.4-.4Z",
};

// Dynamically load MorphSVGPlugin from public/js/gsap/MorphSVGPlugin.js
function loadMorphSVGPlugin(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).MorphSVGPlugin) {
      gsap.registerPlugin((window as any).MorphSVGPlugin);
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "/js/gsap/MorphSVGPlugin.min.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).MorphSVGPlugin) {
        gsap.registerPlugin((window as any).MorphSVGPlugin);
        resolve();
      } else {
        reject(new Error("MorphSVGPlugin failed to load"));
      }
    };
    script.onerror = () =>
      reject(new Error("Failed to load MorphSVGPlugin script"));
    document.head.appendChild(script);
  });
}

type MorphIconProps = {
  from?: IconName;
  to?: IconName;
  duration?: number;
  size?: number;
  color?: string;
  autoMorph?: boolean;
  autoMorphInterval?: number;
  cycleAll?: boolean; // New prop to cycle through all icons
};

export const MorphIcon: React.FC<MorphIconProps> = ({
  from = "Flower",
  to = "Hookah",
  duration = 1.2,
  size = 48,
  color = "#ffffff",
  autoMorph = false,
  autoMorphInterval = 2500,
  cycleAll = false,
}) => {
  const [morphed, setMorphed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // All available icons for cycling
  const allIcons: IconName[] = [
    "WineBottleBucket",
    "Hookah",
    "WineBottle",
    "WineGlasses",
    "MoonStars",
    "Star",
  ];

  const fromPath = cycleAll
    ? ICON_PATHS[allIcons[currentIconIndex]]
    : ICON_PATHS[from];
  const toPath = cycleAll
    ? ICON_PATHS[allIcons[(currentIconIndex + 1) % allIcons.length]]
    : ICON_PATHS[to];

  useEffect(() => {
    if (!fromPath || !toPath) {
      console.error("Missing path data for icons:", { from, to });
      return;
    }
    loadMorphSVGPlugin()
      .then(() => {
        setIsReady(true);
        if (pathRef.current) {
          pathRef.current.setAttribute("d", fromPath);
        }
      })
      .catch((error) => {
        console.error("Failed to load MorphSVGPlugin:", error);
      });
  }, [fromPath, toPath]);

  // Update path when cycling through icons
  useEffect(() => {
    if (isReady && pathRef.current && cycleAll) {
      // Update the current path without animation when index changes
      pathRef.current.setAttribute("d", fromPath);
    }
  }, [currentIconIndex, fromPath, isReady, cycleAll]);

  // Auto-morph effect
  useEffect(() => {
    if (!isReady || !autoMorph) return;

    intervalRef.current = setInterval(() => {
      if (cycleAll) {
        // Get current paths before updating index
        const currentPath = ICON_PATHS[allIcons[currentIconIndex]];
        const nextIndex = (currentIconIndex + 1) % allIcons.length;
        const targetPath = ICON_PATHS[allIcons[nextIndex]];

        if (pathRef.current && (window as any).MorphSVGPlugin) {
          // Make sure we're starting from the correct current path
          pathRef.current.setAttribute("d", currentPath);

          gsap.to(pathRef.current, {
            duration,
            morphSVG: targetPath,
            ease: "power2.inOut",
            onComplete: () => {
              // Update index after animation completes
              setCurrentIconIndex(nextIndex);
            },
          });
        } else {
          // Fallback if GSAP isn't ready
          setCurrentIconIndex(nextIndex);
        }
      } else {
        // Original two-icon toggle
        setMorphed((currentMorphed) => {
          if (pathRef.current && (window as any).MorphSVGPlugin) {
            const targetPath = currentMorphed ? fromPath : toPath;

            gsap.to(pathRef.current, {
              duration,
              morphSVG: targetPath,
              ease: "power2.inOut",
            });
          }
          return !currentMorphed;
        });
      }
    }, autoMorphInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isReady,
    autoMorph,
    autoMorphInterval,
    fromPath,
    toPath,
    duration,
    cycleAll,
    allIcons,
    currentIconIndex,
  ]);

  const performMorph = () => {
    if (!isReady || !pathRef.current || !(window as any).MorphSVGPlugin) return;

    const targetPath = morphed ? fromPath : toPath;

    gsap.to(pathRef.current, {
      duration,
      morphSVG: targetPath,
      ease: "power2.inOut",
      onComplete: () => {
        setMorphed(!morphed);
      },
    });
  };

  const handleClick = () => {
    performMorph();
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{
        cursor: autoMorph ? "default" : "pointer",
        display: "block",
      }}
      onClick={autoMorph ? undefined : handleClick}
      aria-label={
        cycleAll ? "Cycling through all icons" : `Morph from ${from} to ${to}`
      }
    >
      <path ref={pathRef} d={fromPath} fill={color} />
    </svg>
  );
};

export default MorphIcon;
