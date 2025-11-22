import React from "react";
import { twMerge } from "tailwind-merge";

import { inputBaseClasses, lightInputClasses } from "./Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
  variant?: "dark" | "light";
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, variant = "dark", ...rest }, ref) => (
    <textarea
      {...rest}
      ref={ref}
      className={twMerge(
        variant === "light" ? lightInputClasses : inputBaseClasses,
        "min-h-[160px] resize-y",
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

Textarea.displayName = "Textarea";
