import React from "react";
import { twMerge } from "tailwind-merge";

import { inputBaseClasses, lightInputClasses } from "./Input";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  variant?: "dark" | "light";
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, children, variant = "dark", ...rest }, ref) => {
    const arrowClass =
      variant === "light"
        ? "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 12'%3E%3Cpath stroke='%23FE3BA1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m1.666 1.75 8.333 8.5 8.334-8.5'/%3E%3C/svg%3E\")]"
        : "bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 12\'%3E%3Cpath stroke=\'white\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m1.666 1.75 8.333 8.5 8.334-8.5\'/%3E%3C/svg%3E')]";

    return (
      <select
        {...rest}
        ref={ref}
        className={twMerge(
          variant === "light" ? lightInputClasses : inputBaseClasses,
          arrowClass,
          "appearance-none bg-[length:20px_12px] bg-[position:calc(100%-1rem)_center] bg-no-repeat pr-10",
          hasError
            ? variant === "light"
              ? "border-rose-400 focus:border-rose-400 focus:ring-rose-300/30"
              : "border-rose-400/60"
            : "",
          className
        )}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
