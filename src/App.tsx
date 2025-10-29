import React from "react";
import { useRoutes } from "react-router-dom";
import routes from "@/routes";
import "@/styles/reset.css";
import "@/styles/fonts.css";
import "@/styles/index.css";

import ScrollToTop from "@/utils/ScrollToTop";
import Footer from "@/components/Footer";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import Header from "@/components/Header";
import { DrawerProvider } from "@/lib/context/DrawerManagerContext";

const App = () => {
  const routing = useRoutes(routes);

  return (
    <DrawerProvider>
      <div className="relative flex flex-col min-h-screen font-inter bg-background text-neutral-900">
        <ScrollToTop />
        {/* Keep sticky header outside smoother so transforms don't break sticky positioning */}
        <Header />
        <SmoothScrollProvider>
          <main className="flex-grow">{routing}</main>
          <Footer />
        </SmoothScrollProvider>
      </div>
    </DrawerProvider>
  );
};

export default App;
