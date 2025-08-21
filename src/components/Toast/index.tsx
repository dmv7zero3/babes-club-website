import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-1/2 inset-x-0 font-semibold tracking-wide mx-auto p-4 rounded shadow-lg max-w-xs text-center z-50 ${
        type === "success"
          ? "gradient-success text-white"
          : "gradient-error text-white"
      } `}
      style={{ transition: "transform 0.3s ease, opacity 0.3s ease" }}
    >
      {message}
    </div>
  );
};

export default Toast;
