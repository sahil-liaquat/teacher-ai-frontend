"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from "recharts";
import { backendApi, type AdminSignupActivity } from "@/lib/api";

const number = new Intl.NumberFormat("en-IN");
const averageNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });
type SignupBucket = AdminSignupActivity["buckets"][number];

function shortDay(day: string) {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SignupActivityChart() {
  const signups = useQuery({
    queryKey: ["admin-signup-activity", "30-days"],
    queryFn: () => backendApi.adminSignupActivity(),
  });

  if (signups.isPending) {
    return <ChartMessage>Loading signup activity…</ChartMessage>;
  }
  if (signups.isError) {
    return (
      <ChartMessage>
        Could not load signup activity.{" "}
        <button type="button" onClick={() => void signups.refetch()} className="font-bold text-blue-600 hover:underline">
          Try again
        </button>
      </ChartMessage>
    );
  }
  if (!signups.data.total) {
    return <ChartMessage>No signups in the last 30 days.</ChartMessage>;
  }

  const dailyAverage = signups.data.total / signups.data.buckets.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-600">
        <p>
          <span className="font-black text-slate-900">{number.format(signups.data.total)}</span>{" "}
          signup{signups.data.total === 1 ? "" : "s"} in the last 30 days
        </p>
        <p className="text-xs text-slate-500">Top label: signup → first-generation activation · Bottom label: signups</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={signups.data.buckets} margin={{ top: 48, right: 8, bottom: 0, left: 0 }}>
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
              allowDecimals={false}
              tickFormatter={(value) => number.format(Number(value))}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "rgba(1,101,253,0.06)" }}
              content={(props) => <SignupTooltip active={props.active} payload={props.payload} dailyAverage={dailyAverage} />}
            />
            <Bar dataKey="signups" fill="#0165fd" radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey="signups"
                position="top"
                content={(props) => <SignupBarLabel {...props} buckets={signups.data.buckets} />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SignupTooltip({
  active,
  payload,
  dailyAverage,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SignupBucket }>;
  dailyAverage: number;
}) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload;
  if (!bucket) return null;
  const activationColor = bucket.activation_rate < 55 ? "text-red-600" : "text-green-600";

  return (
    <div className="min-w-52 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
      <p className="mb-2 font-black text-slate-900">{shortDay(bucket.day)}</p>
      <div className="space-y-1.5 font-semibold text-slate-600">
        <p className="flex items-center justify-between gap-6"><span>Total signups</span><span className="font-black text-slate-900">{number.format(bucket.signups)}</span></p>
        <p className="flex items-center justify-between gap-6"><span>Total generations</span><span className="font-black text-slate-900">{number.format(bucket.generations)}</span></p>
        <p className="flex items-center justify-between gap-6"><span>Activation rate</span><span className={`font-black ${activationColor}`}>{bucket.activation_rate}%</span></p>
        <p className="flex items-center justify-between gap-6"><span>Activated users</span><span className="font-black text-slate-900">{number.format(bucket.activated)}</span></p>
        <p className="flex items-center justify-between gap-6 border-t border-slate-100 pt-1.5"><span>Average signups/day</span><span className="font-black text-slate-900">{averageNumber.format(dailyAverage)}</span></p>
      </div>
    </div>
  );
}

function SignupBarLabel({
  viewBox,
  value,
  index,
  buckets,
}: LabelProps & { buckets: SignupBucket[] }) {
  const box = viewBox as { x?: number; y?: number; width?: number } | undefined;
  const bucket = index != null ? buckets[index] : undefined;
  const signups = Number(value);
  if (!box || box.x == null || box.y == null || box.width == null || !bucket || !signups) return null;

  const centerX = box.x + box.width / 2;
  const activationColor = bucket.activation_rate < 55 ? "#dc2626" : "#16a34a";

  return (
    <g>
      <text x={centerX} y={box.y - 20} textAnchor="middle" fill={activationColor} fontSize={10} fontWeight={800}>
        {bucket.activation_rate}%
      </text>
      <text x={centerX} y={box.y - 6} textAnchor="middle" fill="#475569" fontSize={10} fontWeight={700}>
        {number.format(signups)}
      </text>
    </g>
  );
}

function ChartMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500">
      <span>{children}</span>
    </div>
  );
}
