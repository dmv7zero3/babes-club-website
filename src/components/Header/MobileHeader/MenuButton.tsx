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
      <div className="flex flex-col justify-center gap-2 w-9 h-9">
        <Menu className="w-9 h-9 text-opera-blue-900" />
      </div>
    </button>
  );
};

export default MenuButton;
