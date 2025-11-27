// ============================================================================
// Usage Examples for Babes Club Loading Components
// ============================================================================

/\*\*

- 1.  CHRONIC LEAF ICON (Standalone animated icon)
- ***
- Use for inline loading states, section loaders, or as part of custom layouts.
  \*/

import { ChronicLeafIcon } from "@/components/Shared";

// Basic usage
<ChronicLeafIcon />

// Customized
<ChronicLeafIcon
size={48}
label="Fetching products..."
colors={["#fe3ba1", "#f5dcee", "#A7F3D0"]}
showLabel={true}
enableRotation={true}
enableGlow={true}
/>

// Minimal (no label, no rotation)
<ChronicLeafIcon
  size={32}
  showLabel={false}
  enableRotation={false}
  enableGlow={false}
/>

/\*\*

- 2.  LOADING OVERLAY (Full-page loading screen)
- ***
- Use for route transitions, initial app load, or heavy data fetches.
  \*/

import { LoadingOverlay } from "@/components/Shared";
import { useState } from "react";

function MyPage() {
const [isLoading, setIsLoading] = useState(true);

return (
<>
<LoadingOverlay
isLoading={isLoading}
message="Loading your dashboard..."
subMessage="Please wait while we fetch your data"
iconSize={80}
backdropBlur={8}
animateExit={true}
onExitComplete={() => console.log("Loading complete!")}
/>

      {/* Your page content */}
    </>

);
}

/\*\*

- 3.  INLINE SPINNER (Lightweight button/card spinner)
- ***
- Use for buttons, cards, and small inline loading states.
- Uses CSS animation for minimal overhead.
  \*/

import { InlineSpinner } from "@/components/Shared";

// In a button
<button disabled={isSubmitting}>
{isSubmitting ? (
<>
<InlineSpinner size={18} className="mr-2" />
Saving...
</>
) : (
"Save Changes"
)}
</button>

// Standalone
<InlineSpinner size={24} color="#fe3ba1" />

/\*\*

- 4.  INTEGRATION WITH PROTECTED ROUTE
- ***
- Replace the default loading spinner in ProtectedRoute.
  \*/

import { ProtectedRoute } from "@/components";
import { ChronicLeafIcon } from "@/components/Shared";

// Custom loading component for auth checks
const AuthLoadingScreen = () => (

  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0d0d0d]">
    <ChronicLeafIcon
      size={64}
      label="Checking authentication..."
      enableGlow={true}
    />
  </div>
);

// Usage in routes
<Route
path="/dashboard"
element={
<ProtectedRoute
loadingComponent={<AuthLoadingScreen />} >
<DashboardPage />
</ProtectedRoute>
}
/>

/\*\*

- 5.  INTEGRATION WITH APP-LEVEL SUSPENSE
- ***
- Use with React Suspense for lazy-loaded routes.
  \*/

import { Suspense, lazy } from "react";
import { LoadingOverlay } from "@/components/Shared";

const LazyDashboard = lazy(() => import("@/pages/Dashboard"));

function App() {
return (
<Suspense fallback={<LoadingOverlay message="Loading page..." />}>
<LazyDashboard />
</Suspense>
);
}

/\*\*

- 6.  DATA FETCHING EXAMPLE
- ***
- Use with async data fetching.
  \*/

import { useState, useEffect } from "react";
import { ChronicLeafIcon, LoadingOverlay } from "@/components/Shared";

function ProductsPage() {
const [products, setProducts] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
async function fetchProducts() {
try {
setIsLoading(true);
const response = await fetch("/api/products");
const data = await response.json();
setProducts(data);
} catch (err) {
setError(err);
} finally {
setIsLoading(false);
}
}
fetchProducts();
}, []);

if (isLoading) {
return (
<div className="min-h-[400px] flex items-center justify-center">
<ChronicLeafIcon
          size={56}
          label="Loading products..."
        />
</div>
);
}

if (error) {
return <div>Error loading products</div>;
}

return (
<div className="grid grid-cols-3 gap-4">
{products.map(product => (
<ProductCard key={product.id} product={product} />
))}
</div>
);
}

/\*\*

- FILE STRUCTURE
- ***
- Place these files in your project:
-
- src/components/Shared/
- ├── index.ts (exports all components)
- ├── ChronicLeafIcon.tsx (animated leaf icon)
- └── LoadingOverlay.tsx (full-page overlay)
  \*/
