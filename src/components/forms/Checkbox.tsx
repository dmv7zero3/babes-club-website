import React from "react";
import { twMerge } from "tailwind-merge";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  variant?: "dark" | "light";
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, variant = "dark", ...rest }, ref) => {
    const labelClasses =
      variant === "light"
        ? "group flex cursor-pointer items-start gap-3 text-sm text-slate-700"
        : "group flex cursor-pointer items-start gap-3 text-sm text-white/80";

    const inputClasses =
      variant === "light"
        ? "peer h-5 w-5 cursor-pointer appearance-none rounded border border-babe-pink-200 bg-white transition focus:outline-none focus:ring-2 focus:ring-babe-pink/40 focus:ring-offset-2 focus:ring-offset-white"
        : "peer h-5 w-5 cursor-pointer appearance-none rounded border border-white/50 bg-white/5 transition focus:outline-none focus:ring-2 focus:ring-babe-pink/50";

    return (
      <label className={labelClasses}>
        <span className="relative grid h-5 w-5 place-items-center">
          <input
            {...rest}
            ref={ref}
            type="checkbox"
            className={twMerge(inputClasses, className)}
          />
          <span className="pointer-events-none absolute inset-0 h-5 w-5 scale-0 rounded bg-babe-pink transition-transform peer-checked:scale-100" />
          <svg
            className="pointer-events-none absolute h-3 w-3 scale-0 text-white transition-transform peer-checked:scale-100"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 8.00006L6.66667 10.6667L12 5.3334"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
