// src/core/Components/Header/MenuButton.tsx
import React from "react";
import { MorphIcon } from "@/components/MorphIcon";

interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-2 text-white transition-colors duration-300 focus:outline-none hover:text-electric-blue group"
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {/* Icon Container */}
      <div className="mb-1 transition-transform duration-300 group-hover:scale-110">
        <MorphIcon
          size={36}
          color="#00bfff"
          duration={2}
          autoMorph={true}
          autoMorphInterval={2600}
          cycleAll={true}
        />
      </div>

      {/* Menu Label */}
      <span className="tracking-widest transition-colors duration-300 font-bebas text-electric-blue text-shadow-glow-blue group-hover:text-electric-blue">
        MENU
      </span>
    </button>
  );
};

export default MenuButton;
