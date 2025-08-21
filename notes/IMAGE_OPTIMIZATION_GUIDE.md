# Image Optimization Guide

## Generated Image Formats

This project automatically generates multiple image formats for optimal performance:

### Format Priority (Use in this order):
1. **AVIF** (.avif) - Best compression, ~50% smaller than JPEG
2. **WebP** (.webp) - Good compression, ~30% smaller than JPEG  
3. **Optimized Original** - Fallback for older browsers

## Browser Support (2024):
- **AVIF**: Chrome 85+, Firefox 93+, Safari 16.1+
- **WebP**: Chrome 23+, Firefox 65+, Safari 14+
- **JPEG/PNG**: Universal support

## Usage Examples:

### HTML Picture Element (Recommended):
```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

### React Component:
```jsx
const OptimizedImage = ({ src, alt, className }) => {
  const baseName = src.replace(/\.[^/.]+$/, "");
  return (
    <picture className={className}>
      <source srcSet={`${baseName}.avif`} type="image/avif" />
      <source srcSet={`${baseName}.webp`} type="image/webp" />
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </picture>
  );
};
```

### CSS Background Images:
```css
.hero-background {
  background-image: url('image.avif');
}

/* Fallback for browsers without AVIF support */
@supports not (background-image: url('image.avif')) {
  .hero-background {
    background-image: url('image.webp');
  }
}

/* Fallback for browsers without WebP support */
@supports not (background-image: url('image.webp')) {
  .hero-background {
    background-image: url('image.jpg');
  }
}
```

## Performance Benefits:
- **AVIF**: ~50-60% smaller file sizes than JPEG
- **WebP**: ~25-35% smaller file sizes than JPEG
- **Lazy Loading**: Images load only when needed
- **Progressive Enhancement**: Automatic fallback for older browsers

## File Size Comparison (Typical):
- Original JPEG (100KB) → AVIF (40KB) → WebP (65KB) → Optimized JPEG (85KB)

## Regeneration:
Run `npm run generate-images` to regenerate all optimized formats.
