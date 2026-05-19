import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-xl border border-white/70 bg-white/80 px-3.5 py-2.5 text-base font-semibold text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 shadow-sm sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
