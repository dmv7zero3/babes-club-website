import React from "react";
import { AuthProvider } from "@/lib/auth";
import { useRoutes } from "react-router-dom";
import routes from "@/routes";
import "@/styles/reset.css";
import "@/styles/fonts.css";
import "@/styles/index.css";

import ScrollToTop from "@/utils/ScrollToTop";
import Footer from "@/components/Footer";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { CartProvider } from "@/lib/context/CartContext";
import Header from "@/components/Header";
import { DrawerProvider } from "@/lib/context/DrawerManagerContext";

const App = () => {
  const routing = useRoutes(routes);

  return (
    <AuthProvider>
      <CartProvider>
        <DrawerProvider>
          <div className="relative flex flex-col min-h-screen font-inter bg-babe-pink">
            <ScrollToTop />
            {/* Keep sticky header outside smoother so transforms don't break sticky positioning */}
            <Header />
            <SmoothScrollProvider>
              <main className="flex-grow">{routing}</main>
              <Footer />
            </SmoothScrollProvider>
          </div>
        </DrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
