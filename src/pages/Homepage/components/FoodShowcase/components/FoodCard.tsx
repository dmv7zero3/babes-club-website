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
        <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-t from-opera-blue-900/20 to-transparent group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="p-8 lg:p-8">
        <h1 className="mb-5 leading-normal heading-2-sub text-opera-blue-900 ">
          {item.name}
        </h1>
        <p className=" text-rich-mahogany-700 paragraph">{item.description}</p>
      </div>
    </div>
  );
};

export default FoodCard;
