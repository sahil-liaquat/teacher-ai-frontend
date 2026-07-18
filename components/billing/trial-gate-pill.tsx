"use client";

import { useBilling } from "@/lib/use-billing";

const TOOL_LABELS: Record<string, string> = {
  lesson_plan: "lesson plan",
  worksheet: "worksheet",
  presentation: "presentation",
  notes: "notes",
  activity: "activity",
};

/** Shows "N free <tool> left on your trial" while the trial gate applies to this
 * user; renders nothing for comped/paid users or when the gate is off. */
export function TrialGatePill({ kind }: { kind: string }) {
  const { data: billing } = useBilling();
  const gate = billing?.trial_gate;
  if (!gate) return null;

  const remaining = gate.remaining?.[kind] ?? gate.free_per_tool;
  const label = TOOL_LABELS[kind] ?? "generation";

  if (remaining > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-teachpad-blue">
        {remaining} free {label}
        {remaining === 1 ? "" : "s"} left on your trial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
      Free {label} used — add a payment method to make more
    </span>
  );
}
