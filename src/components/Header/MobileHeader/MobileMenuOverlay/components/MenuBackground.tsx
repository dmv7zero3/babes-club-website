// src/components/Header/MobileHeader/MobileMenuOverlay/components/MenuBackground.tsx
import React from "react";

/**
 * Background component for the mobile menu overlay
 * Creates elegant floating elements themed for Asian cuisine
 */
const MenuBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      {/* Floating Elements - Asian-inspired */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className={`absolute transition-all duration-1000 ${
            i % 3 === 0
              ? "bg-heritage-gold"
              : i % 3 === 1
                ? "bg-jade-green-400"
                : "bg-opera-blue-400"
          } ${i % 4 === 0 ? "rounded-full" : "rounded-sm rotate-45"}`}
          style={{
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Decorative Circles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`circle-${i}`}
          className="absolute border rounded-full opacity-10"
          style={{
            width: `${60 + Math.random() * 120}px`,
            height: `${60 + Math.random() * 120}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            borderColor: i % 2 === 0 ? "#F7E7B4" : "#4A7C59",
            borderWidth: "1px",
            animation: `pulse ${4 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0%,
              100% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.2;
              }
              50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 0.4;
              }
            }

            @keyframes pulse {
              0%,
              100% {
                transform: scale(1);
                opacity: 0.1;
              }
              50% {
                transform: scale(1.1);
                opacity: 0.2;
              }
            }
          `,
        }}
      />
    </div>
  );
};

export default MenuBackground;
