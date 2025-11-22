import React from "react";

export type FormStatusProps = {
  tone: "success" | "error" | "info";
  title: string;
  message?: string;
  action?: React.ReactNode;
};

const toneStyles: Record<FormStatusProps["tone"], string> = {
  success:
    "border-emerald-400/60 bg-emerald-50 text-emerald-700 shadow-[0_0_20px_rgba(16,185,129,0.18)]",
  error:
    "border-rose-400/60 bg-rose-50 text-rose-700 shadow-[0_0_20px_rgba(244,63,94,0.18)]",
  info: "border-babe-pink-300/70 bg-babe-pink-50 text-babe-pink-700 shadow-[0_0_20px_rgba(254,59,161,0.18)]",
};

export const FormStatus: React.FC<FormStatusProps> = ({
  tone,
  title,
  message,
  action,
}) => (
  <div
    className={`space-y-2 rounded-2xl border px-5 py-4 text-sm transition ${toneStyles[tone]}`}
  >
    <p className="text-base font-semibold uppercase tracking-[0.3em]">
      {title}
    </p>
    {message ? <p className="text-sm leading-relaxed">{message}</p> : null}
    {action}
  </div>
);
