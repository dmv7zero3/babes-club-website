import React from "react";

export type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  description?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "light";
};

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  required,
  description,
  error,
  children,
  className,
  variant = "dark",
}) => {
  const variantStyles = {
    dark: {
      label: "text-white/70",
      badge: "border-white/20 text-white/80",
      description: "text-white/60",
      error: "text-rose-300",
    },
    light: {
      label: "text-babe-pink-600",
      badge: "border-babe-pink-200 bg-babe-pink-50 text-babe-pink-600",
      description: "text-slate-600",
      error: "text-rose-500",
    },
  } as const;

  const styles = variantStyles[variant];

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className={`flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] ${styles.label}`}
      >
        <span>{label}</span>
        {required ? (
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] ${styles.badge}`}
          >
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p className={`text-xs ${styles.description}`}>{description}</p>
      ) : null}
      {children}
      {error ? (
        <p className={`text-xs font-medium ${styles.error}`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
