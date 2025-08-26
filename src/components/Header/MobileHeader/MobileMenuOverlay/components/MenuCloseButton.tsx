import React from "react";
import type { MenuCloseButtonProps } from "../types/menuTypes";

const MenuCloseButton: React.FC<MenuCloseButtonProps> = ({
  onClose,
  isAnimating,
}) => (
  <button
    onClick={onClose}
    disabled={isAnimating}
    className="absolute z-20 p-4 transition-all duration-300 border-2 rounded-full cursor-pointer md:p-2 top-10 right-10 bg-opera-blue-100/30 backdrop-blur-sm border-opera-blue-100/30 disabled:opacity-50 disabled:cursor-not-allowed "
    aria-label="Close menu"
    type="button"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-opera-blue w-50 h-50 md:w-8 md:h-8"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  </button>
);

export default MenuCloseButton;
