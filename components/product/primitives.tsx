import type { ReactNode } from "react";
import { Info } from "lucide-react";

import {
  PageError,
  PageHeading,
  SchoolAdminPage,
  SectionHeading,
} from "@/components/school-admin/shared/page-primitives";
import { cn } from "@/lib/utils";

/**
 * Shared primitives for the new product modules.
 *
 * ⚠ THE ACADEMIC DESIGN SYSTEM IS THE PRODUCT DESIGN SYSTEM. The page shell,
 * heading and error state below are **re-exports**, not reimplementations. A
 * user moving from Academic → Curriculum to School Excellence → Findings has to
 * stay inside one application, and the cheapest way to guarantee that is for
 * both to render the same components rather than two that merely look alike
 * today. `/school-admin/curriculum/overview` remains the benchmark.
 *
 * ⚠ New primitives are added here only when a new module genuinely needs a
 * shape Academic does not have — a metric with an unavailable state, an honest
 * "no data yet" panel. They are built from the same tokens: `rounded-3xl`
 * sections, `rounded-2xl` cards, slate borders, blue accent, emerald/amber for
 * resolved/attention, status never carried by colour alone.
 */

export {
  /** The 1320px page shell every Academic screen uses. */
  SchoolAdminPage as ProductPage,
  PageHeading,
  SectionHeading,
  PageError,
};

/**
 * One derived metric.
 *
 * ⚠ `value` IS ALLOWED TO BE NULL, AND THAT IS THE WHOLE POINT. A school whose
 * teachers have not opened their planners has not scored 0% — it has produced
 * no data. The execution layer already models this (`delivered_pct` is
 * nullable) and every metric in the Insights module inherits the same rule.
 * Rendering `0%` for "unknown" is how a leadership dashboard tells a principal
 * their school is failing for administrative reasons.
 */
export function MetricCard({
  label,
  value,
  unit = "%",
  caption,
  detail,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | null;
  unit?: string;
  /** What the number means. Shown whether or not there is a value. */
  caption: string;
  /** Why it is unavailable. Shown only when `value` is null. */
  detail?: string;
  tone?: "neutral" | "good" | "warn" | "risk";
  href?: string;
}) {
  const unavailable = value === null;
  const toneClass = unavailable
    ? "text-slate-400"
    : tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "risk"
          ? "text-rose-700"
          : "text-slate-950";

  const body = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</span>
      </span>
      <span className={cn("mt-2 block text-2xl font-semibold tabular-nums", toneClass)}>
        {unavailable ? "Not enough data" : `${value}${unit}`}
      </span>
      <span className="mt-1 block text-xs leading-5 text-slate-500">
        {unavailable ? (detail ?? caption) : caption}
      </span>
    </>
  );

  const className =
    "block rounded-2xl border border-slate-200 bg-white p-4 transition";

  if (!href) return <div className={className}>{body}</div>;
  return (
    <a href={href} className={cn(className, "group hover:border-blue-200 hover:shadow-sm")}>
      {body}
    </a>
  );
}

/**
 * The honest empty state for a surface whose data does not exist yet.
 *
 * ⚠ Deliberately not a dashboard full of plausible zeros. The Academic module
 * already established this convention on `/school-admin/assessments`: a screen
 * that states what it is beats a screen of empty widgets that reads as a broken
 * product. It also prevents the failure the brief names explicitly — shipping
 * the prototype's numbers (61/100, 76%, 5 days behind) as if they were real.
 */
export function FoundationNotice({
  title = "Foundation only",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">{title}</h2>
      <div className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/80">{children}</div>
    </section>
  );
}

/** A short explanation of how a number is derived, shown next to it. */
export function DerivationNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
