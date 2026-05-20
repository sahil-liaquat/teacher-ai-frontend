import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  illustration,
  size = "default"
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  illustration?: React.ReactNode;
  size?: "default" | "hero";
}) {
  const isHero = size === "hero";

  return (
    <div
      className={cn(
        "reveal-card relative mb-4 flex flex-col gap-3 overflow-hidden border border-teachpad-cardBorder bg-white/88 shadow-[0_12px_28px_var(--teachpad-shadowCard)] backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between",
        isHero ? "rounded-[24px] px-5 py-5 sm:px-6 lg:min-h-[180px]" : "rounded-xl px-4 py-3.5"
      )}
    >
      {illustration ? <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] lg:block">{illustration}</div> : null}
      <div className={cn("relative z-10 min-w-0 flex-1", illustration ? "lg:max-w-[64%]" : "")}>
        <h1 className={cn("font-black tracking-tight text-teachpad-ink", isHero ? "max-w-3xl text-[clamp(1.9rem,4vw,3.35rem)] leading-[1.02]" : "text-xl")}>{title}</h1>
        {description ? (
          <p className={cn("max-w-2xl text-teachpad-muted", isHero ? "mt-3 text-sm font-semibold leading-6 sm:text-base" : "mt-1.5 text-sm font-medium leading-5")}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="relative z-10 flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
