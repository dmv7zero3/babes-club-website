import React from "react";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

/**
 * PrimaryGlowButton
 * Reusable anchor-styled button with a soft white glow.
 * - Defaults mirror the original styles provided.
 * - Accepts standard anchor props (href, target, rel, etc.).
 * - Use `className` to extend/override styles when needed.
 */
const PrimaryGlowButton: React.FC<AnchorProps> = ({
  href,
  children,
  className = "",
  target,
  rel,
  ...rest
}) => {
  // Base styles from original, with glow enhancements.
  const baseStyles = [
    // layout/shape
    "inline-flex items-center px-4 py-2 rounded-full font-semibold",
    // colors
    "text-pink-700 bg-white/95 hover:bg-white",
    // borders/shadows
    "shadow-sm",
    // focus ring
    "focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-pink-500",
    // custom glow: soft outer white glow that intensifies on hover
    // Uses relative + before pseudo for a blurred halo
    "relative isolate",
    // small default glow via drop-shadow for browsers without before rendering
    "[filter:drop-shadow(0_0_10px_rgba(255,255,255,0.25))]",
    // subtle transition
    "transition-shadow duration-200 ease-out",
  ].join(" ");

  const glowBefore = [
    "before:absolute before:inset-0 before:-z-10 before:content-['']",
    // white gradient halo
    "before:bg-[radial-gradient(120%_120%_at_50%_50%,rgba(255,255,255,0.45),rgba(255,255,255,0)_60%)]",
    // blur and scale for softness
    "before:blur-md before:opacity-70 hover:before:opacity-90",
    // animate subtly on hover
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

export default PrimaryGlowButton;
