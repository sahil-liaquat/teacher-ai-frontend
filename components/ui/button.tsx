import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger";
  /**
   * `md` and `icon` are 44px — the touch minimum. `sm` is 36px and is for
   * secondary actions only; never put a primary action on it.
   */
  size?: "sm" | "md" | "icon";
  /** Shows a spinner, disables the button and sets `aria-busy`. */
  loading?: boolean;
};

export function Button({
  className,
  variant = "default",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-control font-bold transition-all duration-200 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-micro",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "h-11 w-11",
        variant === "default" && "bg-brand text-white shadow-e1 hover:bg-blue-600 hover:shadow-e2",
        variant === "secondary" && "border border-teachpad-cardBorder bg-teachpad-green text-teachpad-ink shadow-e1 hover:shadow-e2",
        variant === "outline" && "border border-teachpad-cardBorder bg-white text-teachpad-ink shadow-e1 hover:border-blue-200 hover:text-brand-text hover:shadow-e2",
        variant === "ghost" && "text-teachpad-muted hover:bg-teachpad-tag hover:text-teachpad-ink",
        variant === "danger" && "bg-rose-600 text-white shadow-e1 hover:bg-rose-700 hover:shadow-e2",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          aria-hidden="true"
          className={cn("shrink-0 animate-spin", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}
        />
      ) : null}
      {children}
    </button>
  );
}
