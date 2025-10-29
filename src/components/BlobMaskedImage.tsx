import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { gsap } from "gsap";
import {
  BLOB_SHAPES,
  BlobName,
  blobNames as allBlobNames,
} from "./Icons/Blobs";

// Lazy-load MorphSVGPlugin from public assets
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
    script.onerror = () => reject(new Error("Failed to load MorphSVGPlugin"));
    document.head.appendChild(script);
  });
}

export type BlobMaskedImageProps = {
  src: string;
  alt: string;
  from?: BlobName;
  to?: BlobName;
  size?: number | string; // rendered width/height. number (px) or string (e.g., '100%')
  duration?: number; // morph duration in seconds
  fit?: "cover" | "contain"; // preserveAspectRatio strategy
  className?: string;
  /**
   * When true, the internal click handler is disabled so parents can control
   * interactions (useful when the whole card should toggle the morph).
   */
  disableInternalClick?: boolean;
};

export type BlobMaskedImageHandle = {
  /** Toggle between from <-> to */
  toggle: () => void;
  /** Imperatively morph to a specific blob shape */
  morphTo: (target: BlobName) => void;
  /** Get current blob name */
  getCurrent: () => BlobName;
};

const preserveForFit = (fit: "cover" | "contain") =>
  fit === "cover" ? "xMidYMid slice" : "xMidYMid meet";

export const BlobMaskedImage = forwardRef<
  BlobMaskedImageHandle,
  BlobMaskedImageProps
>(
  (
    {
      src,
      alt,
      from = "BlobA",
      to = "BlobB",
      size = "100%",
      duration = 0.45,
      fit = "cover",
      className,
      disableInternalClick = false,
    },
    ref
  ) => {
    // Only true once MorphSVGPlugin is fully loaded & registered
    const [pluginReady, setPluginReady] = useState(false);
    const [current, setCurrent] = useState<BlobName>(from);
    const pathRef = useRef<SVGPathElement>(null);
    // Prevent interruption: when a morph starts, let it finish before another begins.
    const morphingRef = useRef(false);
    const pendingTargetRef = useRef<BlobName | null>(null);
    const maskId = useMemo(
      () => `blob-mask-${Math.random().toString(36).slice(2)}`,
      []
    );
    // Silence debug logs in production/dev
    const dbg = (..._args: any[]) => {};

    const fromShape = BLOB_SHAPES[from];
    const toShape = BLOB_SHAPES[to];
    const viewBox = fromShape.viewBox; // base viewBox; shapes are similar scale

    useEffect(() => {
      let mounted = true;
      loadMorphSVGPlugin()
        .then(() => {
          if (mounted) {
            setPluginReady(true);
            dbg("plugin ready");
          }
        })
        .catch(() => {
          // Keep pluginReady as false so we don't mistakenly run fallback jumps
          if (mounted) {
            setPluginReady(false);
            dbg("ERROR: plugin load failed");
          }
        });
      return () => {
        mounted = false;
      };
    }, []);

    // Start a morph. If allowQueue is true, interactions during animation queue the latest target;
    // if false (used for clicks), inputs during animation are ignored.
    const startMorph = (
      target: BlobName,
      opts: { allowQueue?: boolean } = { allowQueue: true }
    ) => {
      const targetD = BLOB_SHAPES[target].d;
      if (!pathRef.current) return;
      dbg("startMorph request", {
        current,
        target,
        pluginReady,
        morphing: morphingRef.current,
        allowQueue: opts.allowQueue,
      });

      // If a morph is currently running, queue the latest desired target and exit.
      if (morphingRef.current) {
        if (opts.allowQueue) {
          pendingTargetRef.current = target;
          dbg("queued during active morph", { target });
        }
        return;
      }

      // If plugin isn't ready yet (not present globally), queue this morph and wait.
      // Proceed immediately if the global plugin is available, even if local state hasn't updated yet.
      if (!(window as any).MorphSVGPlugin) {
        pendingTargetRef.current = target;
        dbg("queued awaiting plugin", { target });
        return;
      }

      if ((window as any).MorphSVGPlugin) {
        // Lock immediately to debounce rapid presses before GSAP onStart fires
        morphingRef.current = true;
        gsap.to(pathRef.current, {
          duration,
          morphSVG: targetD,
          ease: "power2.inOut",
          overwrite: false, // don't kill an in-flight tween (extra safety)
          onStart: () => {
            // ensure locked
            morphingRef.current = true;
            dbg("morph start", { from: current, to: target, duration });
          },
          onComplete: () => {
            morphingRef.current = false;
            setCurrent(target);
            dbg("morph complete", { to: target });
            // If a new target was requested during the morph, start it now.
            const next = pendingTargetRef.current;
            pendingTargetRef.current = null;
            if (next && next !== target) {
              // Start next morph; this will respect the guard again.
              dbg("flushing queued morph", { next });
              startMorph(next);
            }
          },
        });
      }
    };

    // If a morph was requested before the plugin was ready, start it now.
    useEffect(() => {
      // Flush any pending morph once the plugin is available globally or when our local ready flag flips.
      const pending = pendingTargetRef.current;
      if (pending && pathRef.current && (window as any).MorphSVGPlugin) {
        // Clear pending before starting to avoid loops
        pendingTargetRef.current = null;
        dbg("plugin ready: running pending morph", { pending });
        startMorph(pending, { allowQueue: false });
      }
    }, [pluginReady]);

    // Click-only: ignore hover entirely
    const handlePointerEnter = () => {};
    const handlePointerLeave = () => {};
    const handleClick = () => {
      // Toggle on each click with debouncing
      if (morphingRef.current) return;
      const target = current === from ? to : from;
      startMorph(target, { allowQueue: false });
    };

    // Expose imperative API to parent components
    useImperativeHandle(
      ref,
      () => ({
        toggle: () => {
          if (morphingRef.current) return;
          const target = current === from ? to : from;
          startMorph(target, { allowQueue: false });
        },
        morphTo: (target: BlobName) => {
          if (morphingRef.current && current === target) return;
          startMorph(target, { allowQueue: false });
        },
        getCurrent: () => current,
      }),
      [current, from, to]
    );

    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        className={className}
        style={{ display: "block" }}
        aria-label={`Blob-masked image: ${alt}`}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={disableInternalClick ? undefined : handleClick}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            {/* White reveals, black conceals */}
            <rect x="0" y="0" width="100%" height="100%" fill="black" />
            <path ref={pathRef} d={fromShape.d} fill="white" />
          </mask>
        </defs>
        <image
          href={src}
          width="100%"
          height="100%"
          preserveAspectRatio={preserveForFit(fit)}
          mask={`url(#${maskId})`}
          aria-hidden="true"
        />
        {/* Optional: invisible rect to ensure full pointer area across different paths */}
        <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
      </svg>
    );
  }
);

export default BlobMaskedImage;
