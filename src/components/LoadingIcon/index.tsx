export { default as ChronicLeafIcon, type ChronicLeafIconProps } from "./ChronicLeafIcon";
export { default as LoadingOverlay, type LoadingOverlayProps } from "./LoadingOverlay";

import React from "react";

export type InlineSpinnerProps = {
  size?: number;
  color?: string;
  trackColor?: string;
  thickness?: number;
  className?: string;
  label?: string;
};

// Inject spinner keyframes globally once
if (typeof window !== "undefined" && !document.getElementById("inline-spinner-keyframes")) {
  const style = document.createElement("style");
  style.id = "inline-spinner-keyframes";
  style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  size = 24,
  color = "#fe3ba1",
  trackColor = "rgba(254, 59, 161, 0.2)",
  thickness = 3,
  className = "",
  label = "Loading",
}) => {
  return (
    <span
      className={`inline-block ${className}`}
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 50 50"
        style={{ animation: "spin 0.8s linear infinite", width: "100%", height: "100%" }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
};
