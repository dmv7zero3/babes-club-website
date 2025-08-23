// src/pages/AboutPage/index.tsx

import React, { useEffect, useRef } from "react";
import InnerPageHero from "../../components/Hero/InnerPageHero";

const AboutPage: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <>
      <InnerPageHero
        backgroundImage="/images/banner/appetizer-layout.jpg"
        text="About"
      />
    </>
  );
};

export default AboutPage;
