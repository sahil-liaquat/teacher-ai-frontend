import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The platform-admin design system.
 *
 * Restyled to School Admin's visual language — flat white surfaces on a
 * #f7f8fa canvas, slate ink, `border-slate-200`, semibold rather than black
 * weights. Admin previously used a separate vocabulary (32px radii, layered
 * gradients, glassy `bg-white/86` panels, `#071b49` navy) which made the two
 * halves of one product read as different applications.
 *
 * ⚠ Restyling HERE rather than in the pages is deliberate: all 25 admin pages
 * compose these six primitives, so the look propagates without touching one of
 * them. `tests/workspace/admin-organizations.test.ts` pins that pages use these
 * components rather than bespoke chrome, which is what makes that possible.
 */

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
    <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
        {meta && <div className="mt-4 flex flex-wrap gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminPanel({
  id,
  title,
  description,
  actions,
  children,
  className,
  contentClassName
}: {
  id?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section id={id} className={cn("overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 sm:min-w-fit">
            {title && <h2 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-6", contentClassName)}>{children}</div>
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
  tone?: "blue" | "green" | "amber" | "rose" | "slate";
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600"
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-slate-950">{value}</p>
          {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
        </div>
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", toneClasses[tone])}>{icon}</span>
      </div>
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
    neutral: "border-slate-200 bg-slate-50 text-slate-600"
  }[status];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", className)}>
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
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <AlertCircle className="h-7 w-7 text-slate-400" />
      <div>
        <p className="text-base font-semibold text-slate-950">{title}</p>
        {description && <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function HealthIndicator({ status }: { status?: string }) {
  const healthy = status === "ok";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
      healthy ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
    )}>
      {healthy ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
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

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}
