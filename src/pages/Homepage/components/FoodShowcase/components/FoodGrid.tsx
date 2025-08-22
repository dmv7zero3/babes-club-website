// src/pages/Homepage/components/FoodShowcase/components/FoodGrid.tsx

import React from "react";
import { FoodGridProps } from "../types";
import FoodCard from "./FoodCard";

const FoodGrid: React.FC<FoodGridProps> = ({ items }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-on-scroll"
          style={{
            animationDelay: `${index * 150}ms`,
          }}
        >
          <FoodCard item={item} index={index} />
        </div>
      ))}
    </div>
  );
};

export default FoodGrid;
