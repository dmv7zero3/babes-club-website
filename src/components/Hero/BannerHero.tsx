import React from "react";

type BannerHeroProps = {
  imageSrc: string; // mandatory file image path
  title?: string; // optional title overlay
  alt?: string;
  overlayOpacity?: number; // 0-100
  className?: string;
  titleClassName?: string;
};

// Reusable fixed-viewport banner hero (responsive height)
const BannerHero: React.FC<BannerHeroProps> = ({
  imageSrc,
  title,
  alt = "",
  overlayOpacity = 35,
  className = "",
  titleClassName = "",
}) => {
  const clampedOpacity = Math.min(Math.max(overlayOpacity, 0), 100) / 100;

  return (
    <section
      className={`relative w-full text-white overflow-hidden ${className}`}
    >
      <div className="relative w-full overflow-hidden aspect-[2/1] lg:aspect-auto lg:h-[42vh]">
        <img
          src={imageSrc}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 object-cover w-full h-full select-none"
          draggable={false}
        />
        {/* Contrast overlay */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: clampedOpacity }}
          aria-hidden="true"
        />
        {title ? (
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center pb-3">
            <h1
              className={`px-4 text-4xl md:text-5xl font-heading header--pink drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] ${titleClassName}`}
            >
              {title}
            </h1>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default BannerHero;
