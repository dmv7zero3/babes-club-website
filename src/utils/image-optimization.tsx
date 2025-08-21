// src/utils/image-optimization.ts
import React from "react";

interface ImageConfig {
  src: string;
  webp?: string;
  avif?: string;
  alt: string;
  loading?: 'lazy' | 'eager';
}

// Optimized image component
export const OptimizedImage: React.FC<ImageConfig> = ({ 
  src, webp, avif, alt, loading = 'lazy' 
}) => (
  <picture>
    {avif && <source srcSet={avif} type="image/avif" />}
    {webp && <source srcSet={webp} type="image/webp" />}
    <img src={src} alt={alt} loading={loading} />
  </picture>
);