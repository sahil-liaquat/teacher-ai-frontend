"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Coins, FileText, Hash, Users } from "lucide-react";
import {
  backendApi,
  type AdminUsageByUser,
  type AdminUsageResponse,
} from "@/lib/api";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  LoadingState,
  MetricCard,
  StatusPill,
  compactNumber,
  formatDateTime,
} from "@/components/admin/admin-ui";
import { UsageDailyChart } from "@/components/admin/usage-daily-chart";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

const USER_LIMIT = 200;

type UserSort = "cost_inr" | "generations" | "total_tokens" | "last_generation";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN");

const SORT_LABELS: Record<UserSort, string> = {
  cost_inr: "cost",
  generations: "generations",
  total_tokens: "tokens",
  last_generation: "last active",
};

const USER_COLUMNS: { key: UserSort; label: string }[] = [
  { key: "generations", label: "Generations" },
  { key: "total_tokens", label: "Tokens" },
  { key: "cost_inr", label: "Cost" },
  { key: "last_generation", label: "Last active" },
];

const TIER_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  trial: "info",
  paid: "success",
  comp: "success",
  past_due: "warning",
  free: "neutral",
  none: "danger",
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// The backend treats `end` as an EXCLUSIVE upper bound (created_at < end), so to
// include the user's selected end day we query with end + 1 day.
function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function prettyKind(kind: string) {
  return kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminUsagePage() {
  const [start, setStart] = useState(() => isoDate(new Date(Date.now() - 30 * 86_400_000)));
  const [end, setEnd] = useState(() => isoDate(new Date()));
  const [sort, setSort] = useState<UserSort>("cost_inr");

  const usage = useQuery({
    queryKey: ["admin-usage", start, end, sort],
    queryFn: () => backendApi.adminUsage({ start, end: addDaysIso(end, 1), sort, limit: USER_LIMIT }),
    placeholderData: (previous) => previous,
  });

  const data = usage.data;

  return (
    <>
      <AdminPageHeader
        eyebrow="Spend & usage"
        title="Usage & Cost"
        description="Per-user Gemini token usage and ₹ cost since tracking began, for the selected date range."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">From</span>
              <Input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} className="h-9 w-40" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">To</span>
              <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="h-9 w-40" />
            </label>
          </div>
        }
      />

      {usage.isError && !data ? (
        <EmptyState
          title="Could not load usage"
          description={getErrorMessage(usage.error, "Try again in a moment.")}
        />
      ) : data ? (
        <UsageContent data={data} sort={sort} onSort={setSort} fetching={usage.isFetching} />
      ) : (
        <LoadingState label="Loading usage" />
      )}
    </>
  );
}

function UsageContent({
  data,
  sort,
  onSort,
  fetching,
}: {
  data: AdminUsageResponse;
  sort: UserSort;
  onSort: (sort: UserSort) => void;
  fetching: boolean;
}) {
  const totals = data.totals;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Generations" value={compactNumber(totals.generations)} detail={`${num.format(totals.failures)} failed`} tone="blue" icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="Total Tokens" value={compactNumber(totals.total_tokens)} detail={`${compactNumber(totals.prompt_tokens)} in · ${compactNumber(totals.completion_tokens)} out`} tone="amber" icon={<Hash className="h-5 w-5" />} />
        <MetricCard label="Total Cost" value={inr.format(totals.cost_inr)} detail="Snapshot at call time" tone="rose" icon={<Coins className="h-5 w-5" />} />
        <MetricCard label="Active Users" value={compactNumber(totals.active_users)} detail="Generated in range" tone="green" icon={<Users className="h-5 w-5" />} />
      </div>

      <AdminPanel title="Daily usage" description="Generations, tokens, or ₹ cost per day in the selected range.">
        <UsageDailyChart data={data.daily} />
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="By tool" description="Usage split across generation kinds." contentClassName="p-0">
          {data.by_kind.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>{["Tool", "Generations", "Tokens", "Cost"].map((h) => <th key={h} className="px-6 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.by_kind.map((row) => (
                    <tr key={row.kind} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{prettyKind(row.kind)}</td>
                      <td className="px-6 py-3 text-gray-600">{num.format(row.generations)}</td>
                      <td className="px-6 py-3 text-gray-600">{num.format(row.total_tokens)}</td>
                      <td className="px-6 py-3 text-gray-600">{inr.format(row.cost_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6"><EmptyState title="No usage yet" /></div>
          )}
        </AdminPanel>

        <AdminPanel title="By tier" description="Usage grouped by subscription tier." contentClassName="p-0">
          {data.by_tier.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>{["Tier", "Users", "Generations", "Tokens", "Cost"].map((h) => <th key={h} className="px-6 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.by_tier.map((row) => (
                    <tr key={row.tier} className="hover:bg-gray-50">
                      <td className="px-6 py-3"><StatusPill status={TIER_TONE[row.tier] ?? "neutral"}>{row.tier}</StatusPill></td>
                      <td className="px-6 py-3 text-gray-600">{num.format(row.users)}</td>
                      <td className="px-6 py-3 text-gray-600">{num.format(row.generations)}</td>
                      <td className="px-6 py-3 text-gray-600">{num.format(row.total_tokens)}</td>
                      <td className="px-6 py-3 text-gray-600">{inr.format(row.cost_inr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6"><EmptyState title="No usage yet" /></div>
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        title="Per-user usage"
        description={`Top ${USER_LIMIT} users by ${SORT_LABELS[sort]}. Click a metric column to re-sort (always highest first).`}
        contentClassName="p-0"
        actions={fetching ? <StatusPill status="info">Updating…</StatusPill> : undefined}
      >
        {data.by_user.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Tier</th>
                  <th className="px-6 py-3 font-semibold">Funnel</th>
                  {USER_COLUMNS.map((col) => (
                    <th key={col.key} className="px-6 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={cn("inline-flex items-center gap-1 uppercase tracking-wider", sort === col.key ? "text-blue-600" : "hover:text-gray-700")}
                      >
                        {col.label}
                        {sort === col.key && <ChevronDown className="h-3 w-3" />}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.by_user.map((row) => (
                  <tr key={row.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/admin/users/${row.user_id}`} className="group block">
                        <p className="font-semibold text-blue-600 group-hover:underline">{row.name || row.email || "Unnamed"}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{row.email || "-"}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-3"><StatusPill status={TIER_TONE[row.tier] ?? "neutral"}>{row.tier}</StatusPill></td>
                    <td className="px-6 py-3"><FunnelFlags row={row} /></td>
                    <td className="px-6 py-3 text-gray-600">{num.format(row.generations)}</td>
                    <td className="px-6 py-3 text-gray-600">{num.format(row.total_tokens)}</td>
                    <td className="px-6 py-3 text-gray-600">{inr.format(row.cost_inr)}</td>
                    <td className="px-6 py-3 text-gray-600">{formatDateTime(row.last_generation ?? undefined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="No users to show" description="No generations in this range." /></div>
        )}
      </AdminPanel>
    </>
  );
}

function FunnelFlags({ row }: { row: AdminUsageByUser }) {
  return (
    <div className="flex items-center gap-1.5">
      <Flag on={row.confirmed} labelOn="Email confirmed" labelOff="Not confirmed">C</Flag>
      <Flag on={row.logged_in} labelOn="Has signed in" labelOff="Never signed in">L</Flag>
      <Flag on={row.has_subscription} labelOn="Has subscription" labelOff="No subscription">S</Flag>
    </div>
  );
}

function Flag({ on, labelOn, labelOff, children }: { on: boolean; labelOn: string; labelOff: string; children: ReactNode }) {
  return (
    <span
      title={on ? labelOn : labelOff}
      className={cn(
        "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
        on ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-500 ring-1 ring-rose-200"
      )}
    >
      {children}
    </span>
  );
}
