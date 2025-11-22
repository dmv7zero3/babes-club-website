import React from "react";
import { createPortal } from "react-dom";

// SSR-safe portal that mounts under document.body when available
const Portal: React.FC<React.PropsWithChildren<{ containerId?: string }>> = ({
  children,
  containerId,
}) => {
  const [el, setEl] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let container: HTMLElement | null = null;

    if (containerId) {
      container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        document.body.appendChild(container);
      }
    } else {
      container = document.body;
    }

    setEl(container);
  }, [containerId]);

  if (!el) return null;
  return createPortal(children, el);
};

export default Portal;
