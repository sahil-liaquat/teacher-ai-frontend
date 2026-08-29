import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "block h-11 w-full min-w-0 max-w-full rounded-control border border-teachpad-cardBorder bg-teachpad-input px-3.5 text-base font-semibold text-teachpad-ink shadow-e1 outline-none transition-colors duration-200 placeholder:text-[var(--teachpad-placeholderText)] hover:border-blue-200 focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 aria-[invalid=true]:border-rose-500 sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
