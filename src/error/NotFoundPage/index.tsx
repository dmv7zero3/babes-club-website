//src/core/components/error/NotFoundPage/index.tsx

import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-foreground">Page Not Found</p>
      <Link to="/" className="mt-6 text-primary hover:underline">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
