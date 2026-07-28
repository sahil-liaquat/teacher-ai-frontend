"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminUsageDaily } from "@/lib/api";
import { cn } from "@/lib/utils";

type Metric = "generations" | "total_tokens" | "cost_inr";

const METRICS: { key: Metric; label: string }[] = [
  { key: "generations", label: "Generations" },
  { key: "total_tokens", label: "Tokens" },
  { key: "cost_inr", label: "Cost (₹)" },
];

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN");
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const averageNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

function shortDay(day: string) {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatValue(metric: Metric, value: number) {
  return metric === "cost_inr" ? inr.format(value) : num.format(value);
}

function formatAxis(metric: Metric, value: number) {
  return metric === "cost_inr" ? `₹${compact.format(value)}` : compact.format(value);
}

function formatBarLabel(metric: Metric, value: number) {
  if (!value) return "";
  return metric === "cost_inr" ? `₹${compact.format(value)}` : compact.format(value);
}

function formatAverage(metric: Metric, value: number) {
  return metric === "cost_inr" ? inr.format(value) : averageNumber.format(value);
}

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return 0;
  return Math.max(0, Math.round((endTime - startTime) / 86_400_000));
}

export function UsageDailyChart({ data, start, end }: { data: AdminUsageDaily[]; start?: string; end?: string }) {
  const [metric, setMetric] = useState<Metric>("generations");
  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? "";
  const dayCount = daysBetween(start, end) || data.length;
  const dailyAverage = dayCount
    ? data.reduce((total, day) => total + Number(day[metric]), 0) / dayCount
    : 0;

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500">
        No usage in this range yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              metric === m.key
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 28, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
            <XAxis
              dataKey="day"
              tickFormatter={(value) => shortDay(String(value))}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(value) => formatAxis(metric, Number(value))}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "rgba(1,101,253,0.06)" }}
              labelFormatter={(label) => shortDay(String(label))}
              formatter={(value) => [
                formatValue(metric, Number(value)),
                `${metricLabel} · avg ${formatAverage(metric, dailyAverage)}/day`,
              ]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Bar dataKey={metric} fill="#0165fd" radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey={metric}
                position="top"
                formatter={(value: number) => formatBarLabel(metric, Number(value))}
                fill="#475569"
                fontSize={10}
                fontWeight={700}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
