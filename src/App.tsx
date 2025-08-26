import React from "react";
import { useRoutes } from "react-router-dom";
import routes from "@/routes";
import "@/styles/reset.css";
import "@/styles/fonts.css";
import "@/styles/index.css";

import ScrollToTop from "@/utils/ScrollToTop";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const App = () => {
  const routing = useRoutes(routes);

  return (
    <div className="relative flex flex-col min-h-screen bg-black">
      <Header />
      <ScrollToTop />
      <main className="flex-grow">{routing}</main>
      <Footer />
    </div>
  );
};

export default App;
