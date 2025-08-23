// src/pages/Homepage/components/FoodShowcase/index.tsx

import React, { useEffect, useRef } from "react";
import SectionHeader from "./components/SectionHeader";
import FoodGrid from "./components/FoodGrid";
import { foodItems } from "./data/foodItems";

const FoodShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animateElements =
              entry.target.querySelectorAll(".animate-on-scroll");
            animateElements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add("is-visible");
              }, index * 100);
            });
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-warm-ivory-100"
    >
      {/* Background Accent */}
      {/* <div className="absolute inset-0 opacity-50 bg-gradient-to-br from-warm-ivory-50 to-warm-ivory-200" /> */}

      <div className="relative z-10 w-11/12 mx-auto max-w-7xl py-22 lg:py-24">
        <SectionHeader title="delightful" subtitle="EXPERIENCE" />

        <FoodGrid items={foodItems} />
      </div>
    </section>
  );
};

export default FoodShowcase;
