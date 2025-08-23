// src/pages/Homepage/components/FoodShowcase/components/FoodCard.tsx

import React from "react";
import { FoodCardProps } from "../types";

const FoodCard: React.FC<FoodCardProps> = ({ item, index }) => {
  return (
    <div
      className="overflow-hidden transition-all duration-500 group bg-warm-ivory-50 rounded-xl shadow-opera hover:shadow-opera-lg hover:-translate-y-2"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={item.imagePath}
          alt={item.imageAlt}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-t from-heritage-blue/20 to-transparent group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="p-8 lg:p-8">
        <h2 className="mb-6 text-5xl font-semibold transition-colors duration-300 md:text-3xl lg:mb-3 font-heading lg:text-2xl text-heritage-blue ">
          {item.name}
        </h2>
        <p className="text-4xl md:text-3xl text-rich-mahogany-700 lg:text-lg">
          {item.description}
        </p>
      </div>
    </div>
  );
};

export default FoodCard;
