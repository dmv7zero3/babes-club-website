# Animation Strategy Guide: Framer Motion vs GSAP

## Overview

This guide explains when and how to use Framer Motion vs GSAP in React applications, based on their strengths and optimal use cases. The recommended approach is to use both libraries strategically rather than choosing just one.

## Library Comparison

### Framer Motion
- **Type**: React-specific animation library
- **Paradigm**: Declarative, component-based
- **Integration**: Native React components and hooks
- **Learning Curve**: Gentle, React-friendly API
- **Bundle Size**: ~60KB gzipped

### GSAP (GreenSock Animation Platform)
- **Type**: Universal JavaScript animation library
- **Paradigm**: Imperative, timeline-based
- **Integration**: Works with any framework or vanilla JS
- **Learning Curve**: Steeper but more powerful
- **Bundle Size**: ~45KB gzipped (core) + plugins

## When to Use Each

### Use Framer Motion For:

#### 1. React Component Lifecycle Animations
```tsx
// Component mount/unmount animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content here
</motion.div>
```

#### 2. Layout Animations
```tsx
// Automatic layout transitions when items reorder
<motion.div layout>
  {items.map(item => (
    <motion.div key={item.id} layout>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### 3. Gesture-Based Interactions
```tsx
// Hover, tap, drag interactions
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag="x"
  dragConstraints={{ left: -100, right: 100 }}
>
  Interactive Button
</motion.button>
```

#### 4. Page Transitions
```tsx
// Route-based animations with React Router
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 300 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -300 }}
  >
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  </motion.div>
</AnimatePresence>
```

#### 5. State-Driven Animations
```tsx
// Animations based on React state
const [isOpen, setIsOpen] = useState(false);

<motion.div
  animate={isOpen ? "open" : "closed"}
  variants={{
    open: { height: "auto", opacity: 1 },
    closed: { height: 0, opacity: 0 }
  }}
>
  Collapsible content
</motion.div>
```

### Use GSAP For:

#### 1. Complex Timeline Animations
```tsx
useEffect(() => {
  const tl = gsap.timeline();
  
  tl.to(".hero-title", { y: 0, opacity: 1, duration: 0.8 })
    .to(".hero-subtitle", { y: 0, opacity: 1, duration: 0.6 }, "-=0.4")
    .to(".hero-cta", { scale: 1, duration: 0.4 }, "-=0.2")
    .to(".background", { scale: 1.1, duration: 2 }, 0);
    
  return () => tl.kill();
}, []);
```

#### 2. SVG Morphing and Complex SVG Animations
```tsx
// Requires GSAP MorphSVGPlugin
const morphIcon = (fromSelector, toSelector) => {
  return gsap.to(fromSelector, {
    duration: 1,
    morphSVG: toSelector,
    ease: "power2.inOut"
  });
};

// Usage
useEffect(() => {
  morphIcon("#hamburger", "#close-icon");
}, [isMenuOpen]);
```

#### 3. Text Animations
```tsx
// Requires GSAP TextPlugin
useEffect(() => {
  gsap.to(".animated-text", {
    duration: 2,
    text: "New text content",
    ease: "none"
  });
}, [textContent]);
```

#### 4. Performance-Critical Animations
```tsx
// For 60fps+ animations or complex sequences
useEffect(() => {
  // GSAP is optimized for performance
  gsap.to(".particles", {
    x: "random(-500, 500)",
    y: "random(-300, 300)",
    rotation: "random(0, 360)",
    duration: "random(1, 3)",
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    stagger: 0.1
  });
}, []);
```

#### 5. Canvas and WebGL Integration
```tsx
// For Three.js, Canvas, or complex graphics
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  gsap.ticker.add(() => {
    // Animation loop with GSAP's optimized ticker
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Drawing logic here
  });
}, []);
```

#### 6. Advanced Easing and Physics
```tsx
// Complex easing curves and physics-based motion
gsap.to(".element", {
  x: 300,
  duration: 2,
  ease: "elastic.out(1, 0.3)" // Advanced easing
});

// Or custom physics
gsap.to(".ball", {
  y: 400,
  duration: 1,
  ease: "bounce.out"
});
```

## Hybrid Approach Examples

### Example 1: Modal with Combined Animations

```tsx
const Modal = ({ isOpen, onClose }) => {
  const contentRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // GSAP for complex entrance animation
      const tl = gsap.timeline();
      tl.from(".modal-title", { y: 30, opacity: 0, duration: 0.4 })
        .from(".modal-content", { y: 20, opacity: 0, duration: 0.3 }, "-=0.2")
        .from(".modal-buttons", { scale: 0.8, opacity: 0, duration: 0.3 }, "-=0.1");
    }
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Framer Motion for overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
          />
          
          {/* Framer Motion for modal container */}
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="modal-content"
          >
            <h2 className="modal-title">Modal Title</h2>
            <div className="modal-content">Content here</div>
            <div className="modal-buttons">
              <button onClick={onClose}>Close</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

### Example 2: Icon with Morphing and Interaction

```tsx
const AnimatedIcon = ({ iconType, onClick }) => {
  const iconRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    // GSAP for morphing between icon types
    if (iconRef.current) {
      gsap.to(iconRef.current, {
        morphSVG: getIconPath(iconType),
        duration: 0.6,
        ease: "power2.inOut"
      });
    }
  }, [iconType]);
  
  return (
    <motion.div
      // Framer Motion for hover interactions
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="icon-container"
    >
      <svg className="icon">
        <path ref={iconRef} d={getIconPath(iconType)} />
      </svg>
    </motion.div>
  );
};
```

## Decision Framework

Use this flowchart to decide which library to use:

```
Does it involve React component lifecycle?
├─ Yes: Consider Framer Motion
└─ No: Consider GSAP

Is it a simple interaction (hover, tap, drag)?
├─ Yes: Framer Motion
└─ No: Continue evaluation

Do you need complex timelines or sequencing?
├─ Yes: GSAP
└─ No: Continue evaluation

Is it SVG morphing or complex text animation?
├─ Yes: GSAP (with plugins)
└─ No: Continue evaluation

Performance critical (60fps+) or Canvas/WebGL?
├─ Yes: GSAP
└─ No: Framer Motion is probably fine
```

## Best Practices

### 1. Component Organization
```tsx
// Keep animation logic close to components
const useSlideAnimation = (isVisible) => {
  return {
    initial: { x: -100, opacity: 0 },
    animate: isVisible ? { x: 0, opacity: 1 } : { x: -100, opacity: 0 },
    transition: { duration: 0.3 }
  };
};

const SlideComponent = ({ isVisible }) => {
  const animation = useSlideAnimation(isVisible);
  
  return (
    <motion.div {...animation}>
      Content
    </motion.div>
  );
};
```

### 2. Performance Optimization
```tsx
// Use transform properties for better performance
const OptimizedAnimation = () => (
  <motion.div
    animate={{ 
      x: 100,           // ✅ Transform property
      scale: 1.2,       // ✅ Transform property
      // width: 200     // ❌ Causes reflow
    }}
    transition={{ 
      type: "spring",
      stiffness: 400,
      damping: 17
    }}
  />
);
```

### 3. Memory Management
```tsx
// Always clean up GSAP animations
useEffect(() => {
  const animation = gsap.to(".element", {
    rotation: 360,
    duration: 2,
    repeat: -1
  });
  
  return () => animation.kill(); // Cleanup
}, []);
```

### 4. Shared Animation Constants
```tsx
// Create reusable animation configurations
export const ANIMATION_CONFIG = {
  duration: {
    fast: 0.2,
    normal: 0.3,
    slow: 0.5
  },
  easing: {
    smooth: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55]
  }
};

// Usage
<motion.div
  animate={{ opacity: 1 }}
  transition={{ 
    duration: ANIMATION_CONFIG.duration.normal,
    ease: ANIMATION_CONFIG.easing.smooth
  }}
/>
```

## Common Pitfalls

### 1. Overusing Animations
```tsx
// ❌ Too many competing animations
<motion.div
  animate={{ scale: 1.1, rotate: 45, x: 100, y: 50 }}
  whileHover={{ scale: 1.2, rotate: 90 }}
  whileTap={{ scale: 0.9 }}
/>

// ✅ Focused, purposeful animation
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

### 2. Accessibility Concerns
```tsx
// ✅ Respect user preferences
const Animation = () => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={prefersReducedMotion ? {} : { x: 100 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
    />
  );
};
```

### 3. Bundle Size Management
```tsx
// ❌ Importing entire GSAP library
import gsap from "gsap";

// ✅ Import only what you need
import { gsap } from "gsap/gsap-core";
import { TextPlugin } from "gsap/TextPlugin";
gsap.registerPlugin(TextPlugin);
```

## Integration Checklist

- [ ] Install both libraries: `npm install framer-motion gsap`
- [ ] Set up GSAP plugins in your main entry file
- [ ] Create animation utility functions for common patterns
- [ ] Establish animation constants for consistency
- [ ] Implement reduced motion preferences
- [ ] Set up proper cleanup for GSAP animations
- [ ] Document animation patterns for your team

## Conclusion

The best animation strategy uses both Framer Motion and GSAP strategically:

- **Framer Motion** for React-centric animations that integrate naturally with component lifecycle and state
- **GSAP** for complex, performance-critical animations that need precise control or specialized features

This hybrid approach gives you maximum flexibility while playing to each library's strengths, resulting in better performance, maintainability, and user experience.