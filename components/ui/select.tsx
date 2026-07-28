"use client";

import * as React from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
};

/**
 * A single native select keeps keyboard, screen-reader and form behavior in
 * one control. The earlier native-plus-Radix implementation exposed multiple
 * comboboxes for every visible field.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, disabled, isLoading = false, loadingLabel = "Loading...", ...props }, forwardedRef) => (
    <div className={cn("relative block w-full min-w-0 max-w-full self-stretch", className)}>
      <select
        ref={forwardedRef}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          "tat-select-trigger h-10 w-full min-w-0 max-w-full appearance-none truncate rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3.5 pr-10 text-base font-semibold text-teachpad-ink shadow-sm outline-none transition-colors duration-200 hover:border-blue-200 focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 disabled:cursor-not-allowed disabled:bg-teachpad-tag disabled:text-[var(--teachpad-placeholderText)] sm:text-sm",
          className
        )}
        {...props}
      >
        {isLoading ? <option value="">{loadingLabel}</option> : children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-teachpad-muted">
        {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin text-teachpad-blue" /> : <ChevronDown className="h-4 w-4" />}
      </span>
    </div>
  )
);

Select.displayName = "Select";
