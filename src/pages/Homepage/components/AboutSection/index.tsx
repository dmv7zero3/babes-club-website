// src/pages/Homepage/components/AboutSection/index.tsx

import React, { useRef } from "react";
import { useScroll } from "framer-motion";
import ImageContainer from "./components/ImageContainer";
import ContentContainer from "./components/ContentContainer";

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center min-h-screen overflow-hidden bg-warm-ivory"
    >
      <div className="container px-4 py-16 mx-auto sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <ImageContainer scrollYProgress={scrollYProgress} />
          <ContentContainer />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
