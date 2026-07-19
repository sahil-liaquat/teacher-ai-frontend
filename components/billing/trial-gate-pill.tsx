"use client";

import { useBilling } from "@/lib/use-billing";

const TOOL_LABELS: Record<string, string> = {
  lesson_plan: "lesson plan",
  worksheet: "worksheet",
  presentation: "presentation",
  notes: "notes",
  activity: "activity",
};

/** Plural form per tool kind — naive "+s" is wrong for "activity" (→
 * "activities") and "notes" (already plural/uncountable; must not become
 * "notess"). Only matters once `TRIAL_GATE_FREE_PER_TOOL` exceeds 1. */
const TOOL_LABELS_PLURAL: Record<string, string> = {
  lesson_plan: "lesson plans",
  worksheet: "worksheets",
  presentation: "presentations",
  notes: "notes",
  activity: "activities",
};

/** Shows "N free <tool> left on your trial" while the trial gate applies to this
 * user; renders nothing for comped/paid users or when the gate is off. */
export function TrialGatePill({ kind }: { kind: string }) {
  const { data: billing } = useBilling();
  const gate = billing?.trial_gate;
  if (!gate) return null;

  const remaining = gate.remaining?.[kind] ?? gate.free_per_tool;
  const label = TOOL_LABELS[kind] ?? "generation";
  const pluralLabel = TOOL_LABELS_PLURAL[kind] ?? `${label}s`;

  if (remaining > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-teachpad-blue">
        {remaining} free {remaining === 1 ? label : pluralLabel} left on your trial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
      Free {label} used — add a payment method to make more
    </span>
  );
}
