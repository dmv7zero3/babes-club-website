import React from "react";
import { motion, useTransform } from "framer-motion";
import { ImageContainerProps } from "../types";

const ImageContainer: React.FC<ImageContainerProps> = ({ scrollYProgress }) => {
  // Create parallax effect - image moves slower than scroll
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  return (
    <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
      <motion.div
        style={{
          y,
          backgroundImage: "url('/images/banner/about-us.jpg')",
        }}
        className="absolute inset-0 w-full h-[120%] bg-cover bg-center bg-no-repeat"
      />
      {/* Subtle overlay for better text contrast on hover */}
      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-r from-opera-blue/10 to-transparent hover:opacity-100" />
    </div>
  );
};

export default ImageContainer;
