import { RouteObject } from "react-router-dom";

import NotFoundPage from "@/error/NotFoundPage";
import HomePage from "@/pages/HomePage";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  // Catch-all 404 route (should be last)
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default routes;
