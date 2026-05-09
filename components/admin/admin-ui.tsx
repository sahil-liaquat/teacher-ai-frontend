import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-bold uppercase text-slate-500">{eyebrow}</p> : null}
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
          {meta ? <div className="mt-3 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-black text-slate-950">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "blue"
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon: ReactNode;
  tone?: "blue" | "green" | "amber" | "rose" | "slate" | "violet";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-100"
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1", toneClass)}>{icon}</span>
      </div>
      {detail ? <p className="mt-3 truncate text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}

export function StatusPill({
  children,
  status = "neutral"
}: {
  children: ReactNode;
  status?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const className = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-slate-200 bg-slate-100 text-slate-700"
  }[status];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold", className)}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function HealthIndicator({ status }: { status?: string }) {
  const healthy = status === "ok";
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold", healthy ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
      {healthy ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
      {status || "checking"}
    </span>
  );
}

export function formatDate(value?: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, options ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function compactNumber(value: number | undefined) {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value ?? 0);
}
