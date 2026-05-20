import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-xl border border-teachpad-cardBorder bg-teachpad-input px-3.5 py-2.5 text-base font-semibold text-teachpad-ink shadow-sm outline-none transition-all duration-300 placeholder:text-[var(--teachpad-placeholderText)] focus:border-teachpad-blue focus:bg-white focus:ring-4 focus:ring-blue-100/60 sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
