import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-[14px] border border-[#e5e1f1] bg-white px-4 py-3 text-base font-semibold text-[#101039] outline-none transition duration-300 placeholder:text-[#9a95ad] focus:border-[#b998f6] focus:ring-4 focus:ring-[#8d57f6]/10 sm:text-sm",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
