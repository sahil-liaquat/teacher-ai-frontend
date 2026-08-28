"use client";

import type { ComponentType, ReactNode } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StepOption = {
  value: string;
  label: string;
  hint?: string;
  Icon?: ComponentType<{ className?: string }>;
};

export function StepShell({
  stepIndex,
  totalSteps,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  loading = false,
  error = "",
  onRetry,
  emptyMessage = "Nothing to choose here yet.",
  onBack,
  footer
}: {
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  options: StepOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  onBack?: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-4 sm:pt-8">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back one step"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-teachpad-cardBorder bg-white/85 text-teachpad-muted transition-colors hover:text-teachpad-ink"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-11 w-11 shrink-0" aria-hidden />
        )}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teachpad-muted">
          Step {stepIndex + 1} of {totalSteps}
        </p>
      </div>

      <div className="mt-3 flex gap-1.5" role="presentation">
        {Array.from({ length: totalSteps }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index <= stepIndex ? "bg-teachpad-blue" : "bg-slate-200"
            )}
          />
        ))}
      </div>

      <h1 className="mt-6 text-2xl font-black leading-tight text-teachpad-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-teachpad-muted">{subtitle}</p> : null}

      <div className="mt-6">
        {loading ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <span className="sr-only">Loading options</span>
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className="h-14 w-full animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-teachpad-cardBorder bg-white/85 p-4">
            <p className="text-sm text-teachpad-ink">{error}</p>
            {onRetry ? (
              <Button type="button" variant="outline" className="mt-3" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : options.length === 0 ? (
          <p className="rounded-2xl border border-teachpad-cardBorder bg-white/85 p-4 text-sm text-teachpad-muted">
            {emptyMessage}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(option.value)}
                  className={cn(
                    "flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                    selected
                      ? "border-teachpad-blue bg-blue-50 text-teachpad-ink"
                      : "border-teachpad-cardBorder bg-white/85 text-teachpad-ink hover:border-blue-200"
                  )}
                >
                  {option.Icon ? <option.Icon className="h-5 w-5 shrink-0 text-teachpad-blue" /> : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold leading-snug">{option.label}</span>
                    {option.hint ? (
                      <span className="mt-0.5 block text-xs text-teachpad-muted">{option.hint}</span>
                    ) : null}
                  </span>
                  {selected ? <Check className="h-5 w-5 shrink-0 text-teachpad-blue" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}

export function StepShellFallback() {
  return (
    <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-24 text-teachpad-muted">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
