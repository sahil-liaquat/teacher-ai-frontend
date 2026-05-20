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
        "clickable-pop relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-bold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-9 w-9",
        variant === "default" && "bg-gradient-to-r from-teachpad-blue to-blue-600 text-white shadow-[0_14px_28px_var(--teachpad-shadowBlue)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_var(--teachpad-shadowBlue)] active:scale-[0.98]",
        variant === "secondary" && "border border-teachpad-cardBorder bg-gradient-to-br from-teachpad-green to-white text-teachpad-ink shadow-sm hover:-translate-y-0.5 hover:bg-teachpad-green",
        variant === "outline" && "border border-teachpad-cardBorder bg-white/85 text-teachpad-ink shadow-[0_10px_24px_var(--teachpad-shadowToolCard)] backdrop-blur-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:text-teachpad-blue hover:shadow-[0_14px_30px_var(--teachpad-shadowCard)]",
        variant === "ghost" && "text-teachpad-muted transition-colors hover:bg-teachpad-tag hover:text-teachpad-ink",
        variant === "danger" && "bg-gradient-to-r from-[#eb3b5a] to-[#ff5c8a] text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl",
        className
      )}
      {...props}
    />
  );
}
