import React from "react";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

/**
 * OutlineGlowButton
 * Reusable anchor-styled outline button with a soft white glow.
 * - Matches original outline styles (transparent bg, white text/border).
 * - Accepts standard anchor props (href, target, rel, etc.).
 * - Extend/override via `className` when needed.
 */
const OutlineGlowButton: React.FC<AnchorProps> = ({
  href,
  children,
  className = "",
  target,
  rel,
  ...rest
}) => {
  const baseStyles = [
    // layout/shape
    "inline-flex items-center px-4 py-2 rounded-full font-semibold",
    // colors (outline variant)
    "text-white bg-transparent",
    // border and hover state to match provided example
    "border border-white/70 hover:bg-white/10",
    // slight shadow
    "shadow-sm",
    // focus rings
    "focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-pink-500",
    // positioning for glow
    "relative isolate",
    // small default glow fallback via drop-shadow
    "[filter:drop-shadow(0_0_10px_rgba(255,255,255,0.25))]",
    // subtle transition
    "transition-colors duration-200 ease-out",
  ].join(" ");

  const glowBefore = [
    "before:absolute before:inset-0 before:-z-10 before:content-['']",
    // white radial halo
    "before:bg-[radial-gradient(120%_120%_at_50%_50%,rgba(255,255,255,0.35),rgba(255,255,255,0)_60%)]",
    // softness
    "before:blur-md before:opacity-60 hover:before:opacity-80",
    "before:transition-opacity before:duration-200",
  ].join(" ");

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={[baseStyles, glowBefore, className].join(" ")}
      {...rest}
    >
      {children}
    </a>
  );
};

export default OutlineGlowButton;
