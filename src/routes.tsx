import { RouteObject } from "react-router-dom";

import NotFoundPage from "@/error/NotFoundPage";
import HomePage from "@/pages/Homepage";
import AboutPage from "@/pages/AboutPage";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  // Catch-all 404 route (should be last)
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default routes;
