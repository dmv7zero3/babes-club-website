import { Navigate, RouteObject } from "react-router-dom";
import DashboardRouteGuard from "@/components/Dashboard/DashboardRouteGuard";

import NotFoundPage from "@/error/NotFoundPage";
import DashboardLoginPage from "@/pages/Dashboard/DashboardLoginPage";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import EarringsPage from "@/pages/Products/EarringsPage";
import NecklacesPage from "@/pages/Products/NecklacesPage";
import CheckoutSuccessPage from "@/pages/Checkout/Success";
import CheckoutCancelPage from "@/pages/Checkout/Cancel";
import PrivacyPolicyPage from "@/pages/policies/PrivacyPolicy";
import TermsOfServicePage from "@/pages/policies/TermsOfService";
import ShippingPolicyPage from "@/pages/policies/ShippingPolicy";
import ReturnPolicyPage from "@/pages/policies/ReturnPolicy";
import AboutPage from "@/pages/AboutPage";
import GalleryPage from "@/pages/GalleryPage";
import ContactPage from "@/pages/ContactPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import {
  AuthPage,
  LoginPage,
  SignupPage,
  ProtectedRoute,
  PublicOnlyRoute,
} from "@/components";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/shop",
    element: <ShopPage />,
  },
  {
    path: "/products",
    element: <Navigate to="/shop" replace />,
  },
  {
    path: "/products/earrings",
    element: <EarringsPage />,
  },
  {
    path: "/products/necklaces",
    element: <NecklacesPage />,
  },
  {
    path: "/gallery",
    element: <GalleryPage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/login",
    element: <DashboardLoginPage />,
  },
  {
    path: "/signup",
    element: (
      <PublicOnlyRoute>
        <SignupPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/checkout/success",
    element: <CheckoutSuccessPage />,
  },
  {
    path: "/checkout/cancel",
    element: <CheckoutCancelPage />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicyPage />,
  },
  {
    path: "/terms-of-service",
    element: <TermsOfServicePage />,
  },
  {
    path: "/shipping-policy",
    element: <ShippingPolicyPage />,
  },
  {
    path: "/return-policy",
    element: <ReturnPolicyPage />,
  },
  // Catch-all 404 route (should be last)
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default routes;
