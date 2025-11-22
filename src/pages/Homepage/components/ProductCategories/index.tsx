import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import BlobMaskedImage, {
  type BlobMaskedImageHandle,
} from "@/components/BlobMaskedImage";
import items, { type ProductCategoryItem } from "./data";
import setupProductCategoriesAnimation from "./animation";
import { Link } from "react-router-dom";
import type { BlobName } from "@/components/Icons/Blobs";

// Responsive gallery: 3 blobs in a row on desktop, single column on mobile
// Uses hover (desktop) or tap (mobile) to morph between blobs

export const BlobGallery: React.FC<{ className?: string }> = ({
  className,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const blobRefs = useRef<Array<BlobMaskedImageHandle | null>>([]);
  // Track MorphSVGPlugin readiness so the first click waits for it (prevents jump)
  const morphReadyRef = useRef<{
    ready: boolean;
    promise: Promise<void> | null;
    resolve: (() => void) | null;
  }>({
    ready: false,
    promise: null,
    resolve: null,
  });
  // Silence debug logs
  const dbg = (..._args: any[]) => {};

  const activateCard = (e: React.SyntheticEvent<HTMLElement>) => {
    const card = e.currentTarget as HTMLElement;
    dbg("activateCard start", { role: card.getAttribute("role") });
    const media = card.querySelector<HTMLElement>(".blob-media");
    const title = card.querySelector<HTMLElement>(".blob-title");
    if (media || title) {
      // If not visible yet, reveal immediately so the first morph is visible
      const mediaCS = media ? window.getComputedStyle(media) : null;
      const titleCS = title ? window.getComputedStyle(title) : null;
      const mediaVisible = mediaCS ? mediaCS.opacity === "1" : true;
      const titleVisible = titleCS ? titleCS.opacity === "1" : true;
      dbg("visibility", {
        mediaVisible,
        titleVisible,
        mediaOpacity: mediaCS?.opacity,
        mediaTransform: mediaCS?.transform,
        titleOpacity: titleCS?.opacity,
        titleTransform: titleCS?.transform,
      });
      if (!mediaVisible || !titleVisible) {
        dbg("revealing elements immediately");
        gsap.set([media, title].filter(Boolean) as HTMLElement[], {
          autoAlpha: 1,
          y: 0,
          willChange: "auto",
          force3D: false,
        });
      }
    }
    dbg("activateCard end");
  };

  // Preload MorphSVGPlugin early and expose a readiness promise so first click animates
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize the readiness promise once
    if (!morphReadyRef.current.promise) {
      morphReadyRef.current.promise = new Promise<void>((resolve) => {
        morphReadyRef.current.resolve = resolve;
      });
    }

    const win = window as any;
    const markReady = () => {
      if (!morphReadyRef.current.ready) {
        morphReadyRef.current.ready = true;
        morphReadyRef.current.resolve?.();
      }
    };

    if (win.MorphSVGPlugin) {
      dbg("MorphSVGPlugin already present; registering");
      gsap.registerPlugin(win.MorphSVGPlugin);
      markReady();
      return;
    }

    const script = document.createElement("script");
    script.src = "/js/gsap/MorphSVGPlugin.min.js";
    script.async = true;
    script.onload = () => {
      if (win.MorphSVGPlugin) {
        dbg("MorphSVGPlugin loaded; registering");
        gsap.registerPlugin(win.MorphSVGPlugin);
        markReady();
      }
    };
    script.onerror = () => {
      dbg("ERROR loading MorphSVGPlugin script");
      // Resolve anyway after an error to avoid deadlock; will degrade to immediate swap
      markReady();
    };
    document.head.appendChild(script);

    return () => {
      // no cleanup needed for global plugin script
    };
  }, []);

  // Detect supported image format once on mount (client-only)
  const preferredFormat = useMemo<"avif" | "webp" | "original">(() => {
    if (typeof document === "undefined") return "original";
    try {
      const c = document.createElement("canvas");
      if (c && c.getContext && c.getContext("2d")) {
        try {
          if (c.toDataURL("image/avif").indexOf("image/avif") === 5)
            return "avif";
        } catch {}
        try {
          if (c.toDataURL("image/webp").indexOf("image/webp") === 5)
            return "webp";
        } catch {}
      }
    } catch {}
    return "original";
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const cleanup = setupProductCategoriesAnimation(section, {
      respectReducedMotion: true,
    });
    return cleanup;
  }, []);

  return (
    <section
      ref={sectionRef}
      className={["product-categories", className].filter(Boolean).join(" ")}
      aria-label="Featured blog images"
    >
      <div className="flex flex-col items-center justify-center w-full">
        <h1
          style={{ fontSize: "clamp(3.6rem, 5vw, 5rem)" }}
          className="w-11/12 mx-auto font-semibold leading-none tracking-wider text-center text-white font-grand-hotel"
          data-pc-heading
        >
          Shop Online
        </h1>
        <div className="grid mt-10 lg:mt-12 w-10/12 mx-auto max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-2 ">
          {items.map((item, idx) => (
            <ProductCategoryCard
              key={item.title ?? idx}
              item={item}
              index={idx}
              blobRefs={blobRefs}
              activateCard={activateCard}
              morphReadyRef={morphReadyRef}
              dbg={dbg}
              preferredFormat={preferredFormat}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

type PreferredFormat = "avif" | "webp" | "original";

const resolvedSourceCache = new Map<string, string>();

const buildCandidateList = (src: string, preferred: PreferredFormat) => {
  const dot = src.lastIndexOf(".");
  if (dot === -1) return [src];
  const base = src.slice(0, dot);
  const originalExt = src.slice(dot + 1);
  const candidates: string[] = [];
  if (preferred === "avif") {
    candidates.push("avif", "webp");
  } else if (preferred === "webp") {
    candidates.push("webp", "avif");
  }
  candidates.push(originalExt);
  const seen = new Set<string>();
  return candidates
    .map((ext) => (ext === "original" ? originalExt : ext))
    .filter((ext) => {
      if (seen.has(ext)) return false;
      seen.add(ext);
      return true;
    })
    .map((ext) => `${base}.${ext}`);
};

const useResolvedImageSource = (src: string, preferred: PreferredFormat) => {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(src);

    if (typeof window === "undefined") return;

    const cacheKey = `${src}|${preferred}`;
    if (resolvedSourceCache.has(cacheKey)) {
      setResolved(resolvedSourceCache.get(cacheKey)!);
      return;
    }

    const candidates = buildCandidateList(src, preferred);
    if (candidates.length <= 1) {
      resolvedSourceCache.set(cacheKey, src);
      return;
    }

    let cancelled = false;
    let activeImage: HTMLImageElement | null = null;

    const tryCandidate = (index: number) => {
      const candidate = candidates[index];
      if (!candidate) {
        resolvedSourceCache.set(cacheKey, src);
        if (!cancelled) {
          setResolved(src);
        }
        return;
      }

      if (candidate === src) {
        resolvedSourceCache.set(cacheKey, candidate);
        if (!cancelled) {
          setResolved(candidate);
        }
        return;
      }

      const img = new Image();
      activeImage = img;
      img.onload = () => {
        resolvedSourceCache.set(cacheKey, candidate);
        if (!cancelled) {
          setResolved(candidate);
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        tryCandidate(index + 1);
      };
      img.src = candidate;
    };

    tryCandidate(0);

    return () => {
      cancelled = true;
      if (activeImage) {
        activeImage.onload = null;
        activeImage.onerror = null;
      }
    };
  }, [src, preferred]);

  return resolved;
};

type ProductCategoryCardProps = {
  item: ProductCategoryItem;
  index: number;
  blobRefs: React.MutableRefObject<Array<BlobMaskedImageHandle | null>>;
  activateCard: (e: React.SyntheticEvent<HTMLElement>) => void;
  morphReadyRef: React.MutableRefObject<{
    ready: boolean;
    promise: Promise<void> | null;
    resolve: (() => void) | null;
  }>;
  dbg: (...args: any[]) => void;
  preferredFormat: PreferredFormat;
};

const ProductCategoryCard: React.FC<ProductCategoryCardProps> = ({
  item,
  index,
  blobRefs,
  activateCard,
  morphReadyRef,
  dbg,
  preferredFormat,
}) => {
  const resolvedSrc = useResolvedImageSource(item.src, preferredFormat);

  const morphToShape = async (
    event: React.SyntheticEvent<HTMLElement>,
    target: BlobName,
    context: string,
    reveal = false
  ) => {
    dbg(context, {
      idx: index,
      title: item.title,
      pluginReady: !!(window as any).MorphSVGPlugin,
      refReady: !!blobRefs.current[index],
      currentShape: blobRefs.current[index]?.getCurrent?.(),
      target,
    });

    if (reveal) {
      activateCard(event);
    }

    if (!morphReadyRef.current.ready && morphReadyRef.current.promise) {
      await morphReadyRef.current.promise;
    }

    const ref = blobRefs.current[index];
    if (!ref) {
      dbg("WARN: blob ref missing; cannot morph");
      return;
    }

    if (ref.getCurrent?.() === target) return;
    ref.morphTo(target as BlobName);
  };

  return (
    <Link
      to={item.href}
      className="w-full cursor-pointer select-none blob-card block focus:outline-none"
      onPointerEnter={(e) => {
        void morphToShape(e, item.to, "pointer-enter", true);
      }}
      onPointerDown={(e) => {
        void morphToShape(e, item.to, "pointer-down", true);
      }}
      onFocus={(e) => {
        void morphToShape(e, item.to, "focus", true);
      }}
      onPointerLeave={(e) => {
        void morphToShape(e, item.from, "pointer-leave");
      }}
      onBlur={(e) => {
        void morphToShape(e, item.from, "blur");
      }}
    >
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0 flex items-center justify-center translate-y-6 opacity-0 blob-media">
          <div className="w-10/12 h-full mx-auto">
            <BlobMaskedImage
              ref={(inst) => (blobRefs.current[index] = inst)}
              src={resolvedSrc}
              alt={item.alt}
              from={item.from}
              to={item.to}
              size="100%"
              duration={1.0}
              fit="cover"
              disableInternalClick
              className="glow-white-soft"
            />
          </div>
        </div>
      </div>
      <p
        style={{ fontSize: "clamp(1.42rem, 2.45vw, 1.65rem)" }}
        className="mt-2 tracking-widest text-center uppercase translate-y-6 opacity-0 lg:mt-4 text-glow-soft text-white/90 font-lato blob-title"
      >
        {item.title}
      </p>
    </Link>
  );
};

export default BlobGallery;
