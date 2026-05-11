import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-2xl border border-white/70 bg-white/80 px-4 text-base font-semibold text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 shadow-md hover:border-slate-200 sm:text-sm 2xl:h-12",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";