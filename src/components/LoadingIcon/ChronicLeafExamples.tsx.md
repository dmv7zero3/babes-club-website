/**
 * ============================================================================
 * Usage Examples for Babes Club Loading Components
 * ============================================================================
 *
 * This file contains usage examples for all loading components.
 * Import from: @/components/LoadingIcon
 *
 * Components:
 * - ChronicLeafIcon: Animated SVG icon with GSAP color transitions
 * - LoadingOverlay: Full-page loading screen with backdrop blur
 * - InlineSpinner: Lightweight CSS-only spinner for buttons/cards
 */

// ============================================================================
// 1. CHRONIC LEAF ICON (Standalone animated icon)
// ============================================================================
// Use for inline loading states, section loaders, or as part of custom layouts.

import { ChronicLeafIcon } from "@/components/LoadingIcon";

// Basic usage (all defaults)
function BasicExample() {
  return <ChronicLeafIcon />;
}

// Fully customized
function CustomizedExample() {
  return (
    <ChronicLeafIcon
      size={48}
      label="Fetching products..."
      colors={["#fe3ba1", "#f5dcee", "#A7F3D0"]}
      showLabel={true}
      enableRotation={true}
      enableGlow={true}
      glowColor="#fe3ba1"
      colorDuration={0.6}
      className="my-custom-class"
    />
  );
}

// Minimal (no label, no effects)
function MinimalExample() {
  return (
    <ChronicLeafIcon
      size={32}
      showLabel={false}
      enableRotation={false}
      enableGlow={false}
    />
  );
}

// Props Reference:
// | Prop           | Type       | Default                           | Description                              |
// |----------------|------------|-----------------------------------|------------------------------------------|
// | size           | number     | 64                                | Icon size in pixels                      |
// | colors         | string[]   | [brand colors]                    | Colors to animate through                |
// | label          | string     | "Loading..."                      | Loading text                             |
// | showLabel      | boolean    | true                              | Show text label below icon               |
// | enableRotation | boolean    | true                              | Enable floating/rotation animation       |
// | enableGlow     | boolean    | true                              | Enable pulsing glow effect               |
// | glowColor      | string     | colors[0]                         | Custom glow color                        |
// | colorDuration  | number     | 0.6                               | Seconds per color transition             |
// | className      | string     | ""                                | Additional CSS classes                   |

// ============================================================================
// 2. LOADING OVERLAY (Full-page loading screen)
// ============================================================================
// Use for route transitions, initial app load, or heavy data fetches.

import { LoadingOverlay } from "@/components/LoadingIcon";
import { useState } from "react";

function LoadingOverlayExample() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <LoadingOverlay
        isLoading={isLoading}
        message="Loading your dashboard..."
        subMessage="Please wait while we fetch your data"
        iconSize={80}
        backdropBlur={8}
        zIndex={9999}
        animateExit={true}
        onExitComplete={() => console.log("Loading complete!")}
        className="my-overlay"
      />

      {/* Your page content */}
      <main>
        <button onClick={() => setIsLoading(false)}>Stop Loading</button>
      </main>
    </>
  );
}

// Props Reference:
// | Prop           | Type       | Default        | Description                              |
// |----------------|------------|----------------|------------------------------------------|
// | isLoading      | boolean    | true           | Whether overlay is visible               |
// | message        | string     | "Loading..."   | Primary loading message                  |
// | subMessage     | string     | undefined      | Secondary message (smaller)              |
// | iconSize       | number     | 80             | Size of the ChronicLeafIcon              |
// | zIndex         | number     | 9999           | CSS z-index                              |
// | backdropBlur   | number     | 8              | Backdrop blur in pixels                  |
// | animateExit    | boolean    | true           | Animate when hiding                      |
// | onExitComplete | () => void | undefined      | Callback after exit animation            |
// | className      | string     | ""             | Additional CSS classes                   |

// ============================================================================
// 3. INLINE SPINNER (Lightweight button/card spinner)
// ============================================================================
// Use for buttons, cards, and small inline loading states.
// Uses CSS animation for minimal overhead (no GSAP).

import { InlineSpinner } from "@/components/LoadingIcon";

// In a submit button
function ButtonSpinnerExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <button
      disabled={isSubmitting}
      onClick={() => setIsSubmitting(true)}
      className="flex items-center gap-2 px-4 py-2 bg-babe-pink text-white rounded-lg disabled:opacity-60"
    >
      {isSubmitting ? (
        <>
          <InlineSpinner size={18} color="#ffffff" />
          Saving...
        </>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

// Standalone spinner
function StandaloneSpinnerExample() {
  return <InlineSpinner size={24} color="#fe3ba1" />;
}

// Custom colors
function CustomSpinnerExample() {
  return (
    <InlineSpinner
      size={32}
      color="#fe3ba1"
      trackColor="rgba(254, 59, 161, 0.15)"
      thickness={4}
      label="Processing..."
    />
  );
}

// Props Reference:
// | Prop       | Type   | Default                      | Description                    |
// |------------|--------|------------------------------|--------------------------------|
// | size       | number | 24                           | Spinner size in pixels         |
// | color      | string | "#fe3ba1"                    | Primary spinner color          |
// | trackColor | string | "rgba(254, 59, 161, 0.2)"    | Background track color         |
// | thickness  | number | 3                            | Border thickness               |
// | className  | string | ""                           | Additional CSS classes         |
// | label      | string | "Loading"                    | Screen reader label            |

// ============================================================================
// 4. INTEGRATION WITH PROTECTED ROUTE
// ============================================================================
// Replace the default loading spinner in ProtectedRoute.

import { ProtectedRoute } from "@/components";
import { Route } from "react-router-dom";

// Custom loading component for auth checks
const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
    <ChronicLeafIcon
      size={64}
      label="Checking authentication..."
      enableGlow={true}
    />
  </div>
);

// Usage in routes
function ProtectedRouteExample() {
  return (
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute loadingComponent={<AuthLoadingScreen />}>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
  );
}

// ============================================================================
// 5. INTEGRATION WITH REACT SUSPENSE
// ============================================================================
// Use with React Suspense for lazy-loaded routes.

import { Suspense, lazy } from "react";

const LazyDashboard = lazy(() => import("@/pages/Dashboard"));

function SuspenseExample() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading page..." />}>
      <LazyDashboard />
    </Suspense>
  );
}

// ============================================================================
// 6. DATA FETCHING EXAMPLE
// ============================================================================
// Use with async data fetching.

import { useEffect } from "react";

interface Product {
  id: string;
  name: string;
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <ChronicLeafIcon size={56} label="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="p-4 border rounded-lg">
          {product.name}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 7. SKELETON LOADING PATTERN
// ============================================================================
// Combine with skeleton placeholders for better UX.

function SkeletonCardExample() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return (
      <div className="relative p-6 border rounded-xl bg-white/5">
        {/* Skeleton content */}
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-20 bg-white/10 rounded" />
        </div>

        {/* Centered spinner overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <InlineSpinner size={32} />
        </div>
      </div>
    );
  }

  return <div>Loaded content</div>;
}

// ============================================================================
// FILE STRUCTURE
// ============================================================================
//
// Place these files in your project:
//
// src/components/LoadingIcon/
// ├── index.tsx              (exports all components)
// ├── ChronicLeafIcon.tsx    (animated leaf icon)
// └── LoadingOverlay.tsx     (full-page overlay)
//
// Optional: Re-export from @/components/Shared for convenience:
//
// src/components/Shared/index.ts:
// export * from "../LoadingIcon";
//

// Placeholder components for examples
declare const DashboardPage: React.FC;
