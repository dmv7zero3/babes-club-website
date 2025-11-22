import React from "react";

type Props = {
  imageUrl?: string | null;
  name?: string; // kept for alt text compatibility
  colorName?: string; // deprecated: placeholder no longer varies by color
  className?: string;
  alt?: string;
};

// Fixed brand placeholder background (keeps all placeholders identical)
const BRAND_PLACEHOLDER_BG =
  "linear-gradient(135deg, hsl(330 85% 45%) 0%, hsl(270 85% 45%) 100%)"; // pink -> purple

const ProductImage: React.FC<Props> = ({ imageUrl, name, className, alt }) => {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-white/15 ${className ?? ""}`}
    >
      {/* 3:2 aspect ratio */}
      <div style={{ paddingTop: "66%" }} />
      <div className="absolute inset-0 transition-transform duration-300 will-change-transform group-hover:scale-[1.015]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={alt ?? name ?? "Product image"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{ background: BRAND_PLACEHOLDER_BG }}
            aria-label={alt ?? name ?? "Product image placeholder"}
            role="img"
          >
            {/* Minimal inline SVG icon to standardize appearance */}
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="opacity-90"
              aria-hidden="true"
              focusable="false"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
                ry="2"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M7 13l3-3 5 6"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="9" cy="9" r="1.25" fill="white" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImage;
