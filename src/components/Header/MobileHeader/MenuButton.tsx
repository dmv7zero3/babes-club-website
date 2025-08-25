// src/components/Header/MobileHeader/MenuButton.tsx
import React from "react";
import { Menu } from "lucide-react";
interface MenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 w-14 h-14 focus:outline-none"
      aria-label="Open menu"
    >
      <div className="flex flex-col justify-center gap-2 w-14 h-14">
        <Menu className="w-14 h-14 text-heritage-blue" />
      </div>
    </button>
  );
};

export default MenuButton;
