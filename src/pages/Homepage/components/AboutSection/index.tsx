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
      className="relative flex items-center overflow-hidden bg-warm-ivory"
    >
      <div className="container">
        <div className="grid items-center grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-16">
          <ImageContainer scrollYProgress={scrollYProgress} />
          <ContentContainer />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
