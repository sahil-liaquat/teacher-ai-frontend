"use client";

import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthField({
  label,
  icon,
  action,
  error,
  inputProps
}: {
  label: string;
  icon?: ReactNode;
  action?: ReactNode;
  error?: string;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <label htmlFor={id} className="grid gap-2">
      <span className="text-sm font-black text-slate-900">{label}</span>
      <span className={cn(
        "flex h-[52px] min-h-[52px] items-center gap-3 rounded-lg border bg-slate-50 px-4 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition",
        error ? "border-red-200 ring-4 ring-red-50" : "border-slate-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100/70"
      )}>
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <input
          {...inputProps}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="auth-form-input min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
        />
        {action}
      </span>
      {error ? <span id={errorId} className="text-sm font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

export function AuthSubmit({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "flex h-[52px] min-h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 text-base font-black text-white shadow-[0_16px_34px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_20px_42px_rgba(37,99,235,0.32)] disabled:pointer-events-none disabled:opacity-60",
        props.className
      )}
    >
      {children}
    </button>
  );
}
