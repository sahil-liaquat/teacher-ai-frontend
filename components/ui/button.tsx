import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "clickable-pop relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-[13px] font-bold transition duration-200 disabled:pointer-events-none disabled:opacity-50 2xl:rounded-[14px]",
        size === "sm" && "h-[34px] px-3 text-xs 2xl:h-9 2xl:text-sm",
        size === "md" && "h-10 px-4 text-sm 2xl:h-12 2xl:px-5",
        size === "icon" && "h-9 w-9 2xl:h-10 2xl:w-10",
        variant === "default" && "bg-gradient-to-r from-[#8a4df7] to-[#4e35dd] text-white shadow-[0_16px_34px_rgba(93,58,221,0.24)] [--premium-hover-shadow:0_20px_42px_rgba(93,58,221,0.30)]",
        variant === "secondary" && "bg-[#e9fff4] text-[#0f9f68] shadow-sm hover:bg-[#d8fbe9]",
        variant === "outline" && "border border-[#e5e1f1] bg-white text-[#4a4865] shadow-[0_10px_24px_rgba(39,30,91,0.06)] hover:border-[#d8ccf4] hover:bg-[#fbf9ff]",
        variant === "ghost" && "text-[#55516e] hover:bg-[#f5f1ff] hover:text-[#6f3ee9] transition-colors",
        variant === "danger" && "bg-red-100 text-red-700 shadow-sm hover:bg-red-200 active:bg-red-300",
        className
      )}
      {...props}
    />
  );
}
