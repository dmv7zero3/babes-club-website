import React from "react";
import { motion, useTransform } from "framer-motion";
import { ImageContainerProps } from "../types";

const ImageContainer: React.FC<ImageContainerProps> = ({ scrollYProgress }) => {
  // Parallax effect - image moves slower than scroll
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  return (
    <motion.div
      style={{
        y,
        backgroundImage: "url('/images/banner/about-us.jpg')",
      }}
      className="min-h-[320px] lg:h-full rounded-2xl overflow-hidden shadow-2xl bg-cover bg-center bg-no-repeat"
    />
  );
};

export default ImageContainer;
