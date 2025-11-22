// src/components/MorphIcon/index.tsx
import React, { useRef, useEffect, useState, useMemo } from "react";
import { gsap } from "gsap";
import {
  BLOB_SHAPES,
  BlobName,
  blobNames as allBlobNames,
} from "../Icons/Blobs";

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
  from?: BlobName;
  to?: BlobName;
  duration?: number;
  size?: number;
  color?: string;
  autoMorph?: boolean;
  autoMorphInterval?: number;
  cycleAll?: boolean; // cycle through all blob shapes
  imageSrc?: string; // if provided, render masked image instead of colored path
  imageAlt?: string;
  fit?: "cover" | "contain";
};

export const MorphIcon: React.FC<MorphIconProps> = ({
  from = "BlobA",
  to = "BlobB",
  duration = 1.2,
  size = 48,
  color = "#ffffff",
  autoMorph = false,
  autoMorphInterval = 2500,
  cycleAll = false,
  imageSrc,
  imageAlt = "",
  fit = "cover",
}) => {
  const [morphed, setMorphed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maskId = useMemo(
    () => `morphicon-mask-${Math.random().toString(36).slice(2)}`,
    []
  );

  // All available icons for cycling
  const allIcons: BlobName[] = allBlobNames;
  const fromShape = cycleAll
    ? BLOB_SHAPES[allIcons[currentIconIndex]]
    : BLOB_SHAPES[from];
  const toShape = cycleAll
    ? BLOB_SHAPES[allIcons[(currentIconIndex + 1) % allIcons.length]]
    : BLOB_SHAPES[to];
  const fromPath = fromShape?.d;
  const toPath = toShape?.d;
  const viewBox = fromShape?.viewBox ?? "0 0 18 18";

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
        const currentPath = BLOB_SHAPES[allIcons[currentIconIndex]].d;
        const nextIndex = (currentIconIndex + 1) % allIcons.length;
        const targetPath = BLOB_SHAPES[allIcons[nextIndex]].d;

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

  const handlePointerEnter = () => {
    if (!autoMorph) {
      setMorphed(false);
      if (pathRef.current && (window as any).MorphSVGPlugin) {
        gsap.to(pathRef.current, {
          duration,
          morphSVG: toPath,
          ease: "power2.inOut",
        });
      } else if (pathRef.current && toPath) {
        pathRef.current.setAttribute("d", toPath);
      }
    }
  };

  const handlePointerLeave = () => {
    if (!autoMorph) {
      if (pathRef.current && (window as any).MorphSVGPlugin) {
        gsap.to(pathRef.current, {
          duration,
          morphSVG: fromPath,
          ease: "power2.inOut",
        });
      } else if (pathRef.current && fromPath) {
        pathRef.current.setAttribute("d", fromPath);
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={{ cursor: autoMorph ? "default" : "pointer", display: "block" }}
      onClick={autoMorph ? undefined : handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      aria-label={
        cycleAll
          ? "Cycling through blob shapes"
          : imageSrc
            ? `Morph blob mask from ${from} to ${to}`
            : `Morph from ${from} to ${to}`
      }
    >
      {imageSrc ? (
        <>
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width="100%" height="100%" fill="black" />
              <path ref={pathRef} d={fromPath} fill="white" />
            </mask>
          </defs>
          <image
            href={imageSrc}
            width="100%"
            height="100%"
            preserveAspectRatio={
              fit === "cover" ? "xMidYMid slice" : "xMidYMid meet"
            }
            mask={`url(#${maskId})`}
            aria-label={imageAlt}
          />
        </>
      ) : (
        <path ref={pathRef} d={fromPath} fill={color} />
      )}
    </svg>
  );
};

export default MorphIcon;
