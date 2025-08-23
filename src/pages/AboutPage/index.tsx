// src/pages/AboutPage/index.tsx

import React from "react";
import InnerPageHero from "../../components/Hero/InnerPageHero";
import AboutContent from "./components/AboutContent";
import FeaturedArticle from "./components/FeaturedArticle";

const AboutPage: React.FC = () => {
  return (
    <>
      <InnerPageHero
        backgroundImage="/images/banner/appetizer-layout.jpg"
        text="About"
      />
      <AboutContent />
      <FeaturedArticle />
    </>
  );
};

export default AboutPage;
