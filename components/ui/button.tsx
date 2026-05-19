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
        variant === "default" && "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]",
        variant === "secondary" && "bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 shadow-sm hover:-translate-y-0.5 hover:bg-emerald-100",
        variant === "outline" && "border border-white/70 bg-white/80 text-slate-700 shadow-md hover:-translate-y-0.5 hover:bg-white hover:shadow-lg backdrop-blur-sm",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors",
        variant === "danger" && "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:-translate-y-0.5 hover:shadow-xl",
        className
      )}
      {...props}
    />
  );
}
