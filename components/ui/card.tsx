import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Border or shadow, never both. A resting card is defined by its border; a
 * raised or hovered one spends `shadow-e2` and drops the border. Nesting is on
 * the radius ladder: `rounded-card` (12px) outside, `rounded-control` (8px)
 * for the inputs and buttons inside it.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-teachpad-cardBorder bg-white", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 border-b border-teachpad-cardBorder p-4 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-h3 font-bold text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-2", className)} {...props} />;
}
