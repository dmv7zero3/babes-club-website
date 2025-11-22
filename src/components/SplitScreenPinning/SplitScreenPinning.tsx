import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitScreenItems as items } from "./data";

gsap.registerPlugin(ScrollTrigger);

const SplitScreenPinning: React.FC = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<HTMLDivElement | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const handleImageError = (key: string) => {
    setImageErrors((prev) => new Set(prev).add(key));
  };

  const handleImageLoad = (key: string) => {
    setLoaded((prev) => new Set(prev).add(key));
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!rootRef.current || !imagesRef.current || !contentRef.current) return;

      const mm = gsap.matchMedia();

      // Desktop: Split-screen pinning
      mm.add("(min-width: 768px)", () => {
        const sections =
          contentRef.current?.querySelectorAll(".content-section");
        const images = imagesRef.current?.querySelectorAll(".image-item");

        if (!sections || !images) return;

        // Initialize: hide all images except first
        gsap.set(Array.from(images).slice(1), { autoAlpha: 0 });

        // Pin the images container
        ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: imagesRef.current,
          pinSpacing: false,
        });

        // Animate images as sections come into view
        sections.forEach((section, index) => {
          if (index === 0) return; // Skip first section

          ScrollTrigger.create({
            trigger: section,
            start: "top 80%",
            end: "top 20%",
            onEnter: () => {
              gsap.to(images[index], { autoAlpha: 1, duration: 0.6 });
              if (images[index - 1]) {
                gsap.to(images[index - 1], { autoAlpha: 0, duration: 0.6 });
              }
            },
            onLeaveBack: () => {
              gsap.to(images[index], { autoAlpha: 0, duration: 0.6 });
              if (images[index - 1]) {
                gsap.to(images[index - 1], { autoAlpha: 1, duration: 0.6 });
              }
            },
          });
        });

        return () => {
          // Cleanup handled by context
        };
      });

      // Mobile: Scroll-triggered reveals
      mm.add("(max-width: 767px)", () => {
        const mobileItems = rootRef.current?.querySelectorAll(".mobile-item");

        if (!mobileItems) return;

        mobileItems.forEach((item) => {
          const image = item.querySelector(".mobile-image");
          const content = item.querySelector(".mobile-content");

          if (!image || !content) return;

          // Initial state
          gsap.set([image, content], { y: 30, autoAlpha: 0 });

          // Animate in on scroll
          ScrollTrigger.create({
            trigger: item,
            start: "top 85%",
            end: "top 15%",
            onEnter: () => {
              gsap.to([image, content], {
                y: 0,
                autoAlpha: 1,
                duration: 0.8,
                stagger: 0.2,
                ease: "power2.out",
              });
            },
          });
        });

        return () => {
          // Mobile cleanup
        };
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (loaded.size > 0) {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }
  }, [loaded]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      {/* Desktop Layout */}
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
        }}
        className="desktop-layout"
      >
        {/* Content Column */}
        <div
          ref={contentRef}
          style={{
            width: "50%",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
          }}
          className="content-column"
        >
          {items.map((item, index) => (
            <div
              key={item.key}
              className="content-section"
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "2rem 0",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(2rem, 5vw, 4rem)",
                  fontWeight: "600",
                  color: "#111",
                  marginBottom: "1rem",
                }}
              >
                {item.title}
              </h2>
              <p
                style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
                  lineHeight: "1.6",
                  color: "#374151",
                }}
              >
                {item.blurb}
              </p>
            </div>
          ))}
        </div>

        {/* Images Column - Desktop */}
        <div
          ref={imagesRef}
          style={{
            width: "50%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
          className="images-column"
        >
          <div
            style={{
              width: "60%",
              aspectRatio: "1",
              borderRadius: "20px",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {items.map((item, index) => (
              <div
                key={`image-${item.key}`}
                className="image-item"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: index === 0 ? 1 : 0,
                }}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: imageErrors.has(item.key) ? "none" : "block",
                  }}
                  onLoad={() => handleImageLoad(item.key)}
                  onError={() => handleImageError(item.key)}
                />
                {imageErrors.has(item.key) && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f3f4f6",
                      color: "#6b7280",
                    }}
                  >
                    Image not available
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Overlaid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          background: "white",
          padding: "2rem 1rem",
        }}
        className="mobile-layout"
      >
        {items.map((item, index) => (
          <div
            key={`mobile-${item.key}`}
            className="mobile-item"
            style={{
              marginBottom: "4rem",
              maxWidth: "400px",
              margin: "0 auto 4rem auto",
            }}
          >
            <div
              className="mobile-image"
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "1.5rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={item.img}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: imageErrors.has(item.key) ? "none" : "block",
                }}
                onLoad={() => handleImageLoad(item.key)}
                onError={() => handleImageError(item.key)}
              />
              {imageErrors.has(item.key) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280",
                  }}
                >
                  Image not available
                </div>
              )}
            </div>
            <div className="mobile-content" style={{ textAlign: "center" }}>
              <h3
                style={{
                  fontSize: "clamp(1.5rem, 6vw, 2rem)",
                  fontWeight: "600",
                  color: "#111",
                  marginBottom: "1rem",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "clamp(1rem, 4vw, 1.2rem)",
                  lineHeight: "1.6",
                  color: "#374151",
                }}
              >
                {item.blurb}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CSS Media Queries */}
      <style>{`
        @media (min-width: 768px) {
          .mobile-layout { display: none; }
          .desktop-layout { display: flex; }
        }
        @media (max-width: 767px) {
          .mobile-layout { display: block; }
          .desktop-layout { display: none; }
        }
      `}</style>
    </div>
  );
};

export default SplitScreenPinning;
