import { AlertCircle, Check, Circle, Clock3 } from "lucide-react";
import type { SchoolDayStatus } from "@/lib/school-admin-curriculum";
import { cn } from "@/lib/utils";

const STATUS = {
  not_started: { label: "Not started", icon: Circle, className: "bg-slate-100 text-slate-600" },
  draft: { label: "Draft", icon: Clock3, className: "bg-amber-50 text-amber-800" },
  needs_attention: { label: "Needs attention", icon: AlertCircle, className: "bg-rose-50 text-rose-700" },
  ready: { label: "Ready", icon: Check, className: "bg-blue-50 text-blue-700" },
  published: { label: "Published", icon: Check, className: "bg-emerald-50 text-emerald-700" },
} as const;

export function StatusBadge({ status, compact = false }: { status: SchoolDayStatus; compact?: boolean }) {
  const item = STATUS[status];
  const Icon = item.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-bold", compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs", item.className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {item.label}
    </span>
  );
}
