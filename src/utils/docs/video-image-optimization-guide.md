# Video & Image Optimization Guide

## 📋 Overview

This guide explains the standardized approach for implementing optimized video components with modern image formats (AVIF, WebP, JPG) and reliable fixed dimensions for the Moon Lounge website.

---

## 🎯 Core Principles

### 1. **No Aspect Ratios for Videos**

- Use fixed dimensions instead of `aspect-[9/16]`
- Prevents container collapse issues
- Ensures consistent behavior across browsers

### 2. **Progressive Image Enhancement**

- AVIF → WebP → JPG format priority
- Modern formats for supported browsers
- Reliable fallbacks for older browsers

### 3. **Smooth Loading Experience**

- Poster images load first
- Video overlays when ready
- Smooth transitions between states

---

## 🏗 Standard Video Component Structure

### Basic Template

```tsx
const VideoComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoAutoplay(videoRef);

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-neon-blue bg-black"
      style={{
        width: "100%",
        maxWidth: "380px", // Standard width for vertical videos
        height: "600px", // Fixed height - no aspect calculations
        minHeight: "500px", // Fallback minimum
      }}
    >
      {/* Optimized Poster Image */}
      <picture className="absolute inset-0 z-0">
        <source type="image/avif" srcSet={COVER_AVIF} />
        <source type="image/webp" srcSet={COVER_WEBP} />
        <img
          src={COVER_JPG}
          alt="Descriptive alt text"
          className="object-cover w-full h-full rounded-2xl"
          draggable={false}
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </picture>

      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 z-10 object-cover w-full h-full rounded-2xl autoplay-video"
        poster={COVER_JPG}
        src={VIDEO_SRC}
        playsInline
        muted
        preload="metadata"
        tabIndex={-1}
        aria-label="Descriptive video label"
      />
    </div>
  );
};
```

---

## 📐 Standard Dimensions

### For Vertical Videos (9:16 ratio)

```css
width: 100%
maxWidth: 380px
height: 600px
minHeight: 500px
```

### For Square Videos (1:1 ratio)

```css
width: 100%
maxWidth: 400px
height: 400px
minHeight: 350px
```

### For Horizontal Videos (16:9 ratio)

```css
width: 100%
maxWidth: 600px
height: 338px
minHeight: 300px
```

---

## 🖼 Image Asset Requirements

### File Naming Convention

```
/images/video-covers/component-name-description.{avif,webp,jpg}

Examples:
- moon-lounge-hookah-cocktails-food-nightlife-sterling-va.avif
- moon-lounge-hookah-cocktails-food-nightlife-sterling-va.webp
- moon-lounge-hookah-cocktails-food-nightlife-sterling-va.jpg
- moon-lounge-nightlife-events.avif
- moon-lounge-nightlife-events.webp
- moon-lounge-nightlife-events.jpg
```

### Image Specifications

```yaml
Dimensions: 380px × 600px (for vertical videos)
Quality Settings:
  AVIF: 65-75 quality
  WebP: 80-85 quality
  JPG: 85-90 quality
```

### Generation Script

```bash
# Use ImageMagick or similar tool
magick input.jpg -resize 380x600^ -gravity center -extent 380x600 output.jpg
magick output.jpg -quality 75 output.avif
magick output.jpg -quality 85 output.webp
```

---

## 🔧 Implementation Patterns

### Pattern 1: Basic Implementation

```tsx
// Constants
const VIDEO_COVER_JPG = "/images/video-covers/component-name.jpg";
const VIDEO_COVER_WEBP = "/images/video-covers/component-name.webp";
const VIDEO_COVER_AVIF = "/images/video-covers/component-name.avif";
const VIDEO_SRC = "/videos/component-name.mp4";

// Component
const VideoSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoAutoplay(videoRef);

  return (
    <div style={{ width: "100%", maxWidth: "380px", height: "600px" }}>
      <picture>
        <source type="image/avif" srcSet={VIDEO_COVER_AVIF} />
        <source type="image/webp" srcSet={VIDEO_COVER_WEBP} />
        <img src={VIDEO_COVER_JPG} alt="..." />
      </picture>
      <video ref={videoRef} poster={VIDEO_COVER_JPG} src={VIDEO_SRC} ... />
    </div>
  );
};
```

### Pattern 2: Enhanced with Loading States

```tsx
const EnhancedVideoSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useVideoAutoplay(videoRef);

  return (
    <div style={{ width: "100%", maxWidth: "380px", height: "600px" }}>
      {/* Poster with fade transition */}
      <picture className={`transition-opacity ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}>
        <source type="image/avif" srcSet={VIDEO_COVER_AVIF} />
        <source type="image/webp" srcSet={VIDEO_COVER_WEBP} />
        <img
          src={VIDEO_COVER_JPG}
          onLoad={() => setImageLoaded(true)}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      </picture>

      {/* Video with fade in */}
      <video
        ref={videoRef}
        onLoadedData={() => setVideoLoaded(true)}
        style={{ opacity: videoLoaded ? 1 : 0 }}
        ...
      />

      {/* Loading indicator */}
      {!imageLoaded && !videoLoaded && <LoadingSpinner />}
    </div>
  );
};
```

---

## 📋 Checklist for New Video Components

### ✅ Before Implementation

- [ ] Create video poster images in all 3 formats (AVIF, WebP, JPG)
- [ ] Optimize images for target dimensions
- [ ] Choose appropriate fixed dimensions for video type
- [ ] Test video source URL in browser

### ✅ Code Implementation

- [ ] Use fixed dimensions (no aspect ratios)
- [ ] Implement picture element with proper source order
- [ ] Add video element with correct attributes
- [ ] Include proper alt text and aria labels
- [ ] Use consistent file naming convention

### ✅ Performance Optimization

- [ ] Add `loading="lazy"` to poster images
- [ ] Add `decoding="async"` to poster images
- [ ] Use `preload="metadata"` for videos
- [ ] Implement smooth transitions between poster and video

### ✅ Testing

- [ ] Test on desktop Chrome, Firefox, Safari
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Verify AVIF support detection
- [ ] Check WebP fallback functionality
- [ ] Confirm JPG final fallback works
- [ ] Test with slow network connections

---

## 🔍 Debugging Video Issues

### Common Problems & Solutions

#### Problem: Video Container Has Zero Height

```bash
# Check in browser console:
const videos = document.querySelectorAll('video');
videos.forEach(v => console.log(v.getBoundingClientRect()));

# If height is 0 or very small:
# Solution: Remove aspect ratio classes, use fixed dimensions
```

#### Problem: Images Not Loading

```javascript
// Check image sources in console:
document.querySelectorAll("picture source").forEach((source) => {
  console.log(source.srcSet, source.type);
});

// Test direct URLs:
fetch("/images/video-covers/component-name.avif").then((r) =>
  console.log(r.status)
);
```

#### Problem: Video Autoplay Fails

```javascript
// Check autoplay requirements:
const video = document.querySelector("video");
console.log("Muted:", video.muted);
console.log("PlaysInline:", video.playsInline);
console.log("Autoplay policy:", navigator.userActivation?.isActive);
```

### Debug Script

```javascript
// Run in browser console to diagnose issues
function debugVideoComponent() {
  const videos = document.querySelectorAll("video");
  const pictures = document.querySelectorAll("picture");

  console.log("=== VIDEO DEBUG ===");
  videos.forEach((video, i) => {
    const rect = video.getBoundingClientRect();
    console.log(`Video ${i + 1}:`);
    console.log(`  Dimensions: ${rect.width}×${rect.height}`);
    console.log(`  Source: ${video.src}`);
    console.log(`  Ready State: ${video.readyState}`);
    console.log(`  Can Play: ${video.readyState >= 3}`);
  });

  console.log("=== IMAGE DEBUG ===");
  pictures.forEach((picture, i) => {
    const img = picture.querySelector("img");
    const sources = picture.querySelectorAll("source");
    console.log(`Picture ${i + 1}:`);
    sources.forEach((source) => {
      console.log(`  ${source.type}: ${source.srcSet}`);
    });
    console.log(`  Fallback: ${img?.src}`);
  });
}

debugVideoComponent();
```

---

## 🚀 Performance Best Practices

### 1. Image Optimization

```bash
# Recommended compression settings
AVIF: 65-75 quality (smallest file size)
WebP: 80-85 quality (good compression)
JPG: 85-90 quality (maximum compatibility)
```

### 2. Loading Strategy

```tsx
// Lazy load poster images (not above fold)
loading = "lazy";

// Immediate load for hero videos
loading = "eager";

// Async decoding for better performance
decoding = "async";
```

### 3. Video Preload Settings

```tsx
// For hero/important videos
preload = "metadata";

// For below-fold videos
preload = "none";

// For critical autoplay videos
preload = "auto";
```

### 4. CDN Configuration

```bash
# Ensure proper MIME types
AVIF: image/avif
WebP: image/webp
JPG: image/jpeg
MP4: video/mp4

# Cache headers
Cache-Control: public, max-age=31536000, immutable
```

---

## 📖 Browser Support

### Modern Format Support

```yaml
AVIF:
  Chrome: 85+
  Firefox: 93+
  Safari: 16.1+

WebP:
  Chrome: 23+
  Firefox: 65+
  Safari: 14+

JPG: Universal support
```

### Feature Detection

```javascript
// Check AVIF support
const supportsAVIF = new Promise((resolve) => {
  const avif = new Image();
  avif.onload = avif.onerror = () => resolve(avif.height === 1);
  avif.src =
    "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=";
});

// Use in component
const [supportsModernFormats, setSupportsModernFormats] = useState(false);
useEffect(() => {
  supportsAVIF.then(setSupportsModernFormats);
}, []);
```

---

## 🔄 Migration Guide

### From Aspect Ratios to Fixed Dimensions

#### Step 1: Update Component Structure

```tsx
// Before (problematic)
<div className="aspect-[9/16] max-w-[420px]">
  <video ... />
</div>

// After (reliable)
<div style={{ width: "100%", maxWidth: "380px", height: "600px" }}>
  <video ... />
</div>
```

#### Step 2: Add Optimized Images

```tsx
// Add picture element before video
<picture className="absolute inset-0 z-0">
  <source type="image/avif" srcSet={COVER_AVIF} />
  <source type="image/webp" srcSet={COVER_WEBP} />
  <img src={COVER_JPG} ... />
</picture>
```

#### Step 3: Update CSS (Optional Cleanup)

```css
/* Remove aspect ratio fixes */
.aspect-\[9\/16\] {
  /* Delete this block */
}

/* Add consistent video styling */
.video-container {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background: black;
}
```

---

## 🎯 Examples

### Moon Lounge About Section

```tsx
// File: EnhancedAbout.tsx
const VIDEO_COVER_AVIF =
  "/images/video-covers/moon-lounge-hookah-cocktails-food-nightlife-sterling-va.avif";
const VIDEO_COVER_WEBP =
  "/images/video-covers/moon-lounge-hookah-cocktails-food-nightlife-sterling-va.webp";
const VIDEO_COVER_JPG =
  "/images/video-covers/moon-lounge-hookah-cocktails-food-nightlife-sterling-va.jpg";
const VIDEO_SRC =
  "/videos/moon-lounge-hookah-cocktails-food-nightlife-sterling-va.mp4";

// Implementation follows standard pattern with 380×600 dimensions
```

### Moon Lounge Events Section

```tsx
// File: EventsShowcase.tsx
const VIDEO_COVER_AVIF =
  "/images/video-covers/moon-lounge-nightlife-events.avif";
const VIDEO_COVER_WEBP =
  "/images/video-covers/moon-lounge-nightlife-events.webp";
const VIDEO_COVER_JPG = "/images/video-covers/moon-lounge-nightlife-events.jpg";
const VIDEO_SRC = "/videos/moon-lounge-nightlife-events.mp4";

// Same 380×600 dimensions for consistency
```

---

## 📚 Related Documentation

- [Modern Image Formats Guide](https://web.dev/serve-images-avif/)
- [Video Performance Best Practices](https://web.dev/video-performance/)
- [Picture Element Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
- [Video Element API](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)

---

_Last Updated: August 2025_  
_Maintainer: Development Team_  
_Version: 1.0_
