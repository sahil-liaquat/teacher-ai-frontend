import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "block h-10 w-full min-w-0 max-w-full rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3.5 text-base font-semibold text-teachpad-ink shadow-sm outline-none transition-colors duration-200 placeholder:text-[var(--teachpad-placeholderText)] hover:border-blue-200 focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
