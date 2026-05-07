import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#f1edff] px-2.5 py-1 text-xs font-bold text-[#6d38f2] shadow-sm",
        className
      )}
      {...props}
    />
  );
}
