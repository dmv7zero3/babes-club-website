import { RouteObject } from "react-router-dom";

import NotFoundPage from "@/error/NotFoundPage";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import MenuPage from "./pages/MenuPage";
import ContactPage from "./pages/ContactPage";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/menu",
    element: <MenuPage />,
  },

  {
    path: "/contact",
    element: <ContactPage />,
  },

  // Catch-all 404 route (should be last)
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default routes;
