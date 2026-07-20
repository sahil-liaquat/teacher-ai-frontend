"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminSummary, AdminUsageByKind } from "@/lib/api";

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("en-IN");

export function ToolUsageChart({ data }: { data: AdminUsageByKind[] }) {
  const chartData = [...data]
    .sort((a, b) => b.generations - a.generations)
    .map((row) => ({ ...row, label: formatLabel(row.kind) }));

  if (!chartData.length) return <ChartEmpty label="No tracked tool usage in the last 30 days." />;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 22, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
          <XAxis type="number" tickFormatter={(value) => compact.format(Number(value))} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(1,101,253,0.05)" }}
            formatter={(value) => [number.format(Number(value)), "Generations"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
          />
          <Bar dataKey="generations" fill="#0165fd" radius={[0, 6, 6, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserFunnelChart({ data }: { data: AdminSummary["user_funnel"] }) {
  const stages = [
    { key: "total", label: "Accounts", value: data.total, color: "bg-slate-500" },
    { key: "confirmed", label: "Email confirmed", value: data.confirmed, color: "bg-blue-500" },
    { key: "logged_in", label: "Signed in", value: data.logged_in, color: "bg-indigo-500" },
    { key: "onboarded", label: "Onboarding complete", value: data.onboarded, color: "bg-violet-500" },
    { key: "subscribed", label: "Subscription record", value: data.subscribed, color: "bg-emerald-500" },
  ];
  const denominator = Math.max(1, data.total);

  return (
    <div className="space-y-4">
      {stages.map((stage) => {
        const percentage = Math.round((stage.value / denominator) * 100);
        return (
          <div key={stage.key}>
            <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-slate-700">{stage.label}</span>
              <span className="font-bold text-slate-900">{number.format(stage.value)} <span className="font-medium text-slate-400">({percentage}%)</span></span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${Math.min(100, percentage)}%` }} />
            </div>
          </div>
        );
      })}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
        {number.format(data.new_last_24_hours)} new account{data.new_last_24_hours === 1 ? "" : "s"} in the last 24 hours
      </div>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return <div className="flex h-72 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500">{label}</div>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
