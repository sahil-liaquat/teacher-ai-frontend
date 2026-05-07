import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[14px] border border-[#e5e1f1] bg-white px-4 text-sm font-semibold text-[#101039] outline-none transition duration-200 placeholder:text-[#9a95ad] focus:border-[#b998f6] focus:ring-4 focus:ring-[#8d57f6]/10 shadow-[0_8px_20px_rgba(39,30,91,0.04)] hover:border-[#d8ccf4] 2xl:h-12",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
