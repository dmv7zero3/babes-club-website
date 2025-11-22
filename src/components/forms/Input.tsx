import React from "react";
import { twMerge } from "tailwind-merge";

type BaseProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  variant?: "dark" | "light";
};

export const inputBaseClasses =
  "w-full rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 transition focus:border-babe-pink focus:outline-none focus:ring-2 focus:ring-babe-pink/40 disabled:cursor-not-allowed disabled:opacity-60";

export const lightInputClasses =
  "w-full rounded-lg border border-babe-pink-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_10px_25px_rgba(254,59,161,0.12)] transition focus:border-babe-pink-400 focus:outline-none focus:ring-2 focus:ring-babe-pink/30 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, BaseProps>(
  ({ className, hasError, type = "text", variant = "dark", ...rest }, ref) => (
    <input
      {...rest}
      ref={ref}
      type={type}
      className={twMerge(
        variant === "light" ? lightInputClasses : inputBaseClasses,
        hasError
          ? variant === "light"
            ? "border-rose-400 focus:border-rose-400 focus:ring-rose-300/30"
            : "border-rose-400/60"
          : "",
        className
      )}
    />
  )
);

Input.displayName = "Input";
