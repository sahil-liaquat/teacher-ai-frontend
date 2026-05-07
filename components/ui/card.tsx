import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("premium-hover rounded-[20px] border border-[#ebe7f4] bg-white/92 shadow-[0_16px_42px_rgba(39,30,91,0.07)] backdrop-blur 2xl:rounded-[24px] 2xl:shadow-[0_18px_50px_rgba(39,30,91,0.08)]", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 p-4 pb-2.5 2xl:gap-4 2xl:p-5 2xl:pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-bold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-[#77728e]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-2 2xl:p-5 2xl:pt-2", className)} {...props} />;
}
