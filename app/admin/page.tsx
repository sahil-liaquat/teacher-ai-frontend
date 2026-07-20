"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Coins,
  Download,
  FileText,
  MessageSquareText,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  backendApi,
  type AdminActivityResponse,
  type AdminFeedbackResponse,
  type AdminSummary,
  type AdminUsageResponse,
  type ApiUser,
} from "@/lib/api";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  HealthIndicator,
  LoadingState,
  MetricCard,
  StatusPill,
  compactNumber,
  formatDateTime,
  formatInr,
} from "@/components/admin/admin-ui";
import { UsageDailyChart } from "@/components/admin/usage-daily-chart";
import { ToolUsageChart, UserFunnelChart } from "@/components/admin/overview-charts";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

type DashboardInsights = {
  summary: AdminSummary;
  usage: AdminUsageResponse;
  activity: AdminActivityResponse;
  feedback: AdminFeedbackResponse;
  recentSignups: ApiUser[];
};

const number = new Intl.NumberFormat("en-IN");

export default function AdminDashboard() {
  const [exporting, setExporting] = useState(false);
  const dashboard = useQuery({
    queryKey: ["admin-dashboard-insights"],
    queryFn: loadDashboardInsights,
  });

  async function exportUsersCsv() {
    setExporting(true);
    try {
      const firstPage = await backendApi.users(0, 100);
      const users = firstPage.total > firstPage.items.length
        ? (await backendApi.users(0, firstPage.total)).items
        : firstPage.items;
      const csv = toCsv(
        ["Name", "Email", "Phone", "Role", "Active", "Confirmed", "Logged in", "Subscription", "Joined"],
        users.map((user) => [
          user.full_name || user.name || "",
          user.email || "",
          user.phone || "",
          user.role || "",
          user.is_active ? "Yes" : "No",
          user.confirmed ? "Yes" : "No",
          user.logged_in ? "Yes" : "No",
          user.has_subscription ? "Yes" : "No",
          user.created_at || "",
        ])
      );
      downloadCsv(csv, `teachpad-users-${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(false);
    }
  }

  if (dashboard.isLoading) return <LoadingState label="Building dashboard insights" />;
  if (dashboard.isError || !dashboard.data) {
    return <EmptyState title="Could not load dashboard insights" description={getErrorMessage(dashboard.error, "Refresh to try again.")} />;
  }

  const data = dashboard.data;
  const usage = data.usage.totals;
  const feedback = data.feedback.summary;
  const successRate = usage.generations ? Math.round(((usage.generations - usage.failures) / usage.generations) * 100) : 0;
  const responseRate = feedback.total ? Math.round((feedback.submitted / feedback.total) * 100) : 0;
  const subscriptionRate = data.summary.user_funnel.total
    ? Math.round((data.summary.user_funnel.subscribed / data.summary.user_funnel.total) * 100)
    : 0;
  const generationsPerTeacher = usage.active_users ? usage.generations / usage.active_users : 0;

  return (
    <>
      <AdminPageHeader
        eyebrow="Decision dashboard"
        title="TeachPad at a glance"
        description="The signals that matter: acquisition, activation, product adoption, AI spend, and teacher sentiment. Usage metrics cover the last 30 days."
        meta={<HealthIndicator status={data.summary.system_status.backend_api} />}
        actions={
          <>
            <Button variant="outline" onClick={exportUsersCsv} disabled={exporting}>
              <Download className="h-4 w-4" /> {exporting ? "Exporting…" : "Export users"}
            </Button>
            <Link href="/admin/usage"><Button>Explore usage <ArrowRight className="h-4 w-4" /></Button></Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total users" value={compactNumber(data.summary.total_users)} detail={`+${data.summary.user_funnel.new_last_24_hours} in 24 hours`} tone="blue" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active teachers" value={compactNumber(usage.active_users)} detail="Generated in 30 days" tone="green" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Generations" value={compactNumber(usage.generations)} detail={`${successRate}% successful · ${number.format(usage.failures)} failed`} tone="blue" icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="AI cost" value={formatInr(usage.cost_inr)} detail={`${compactNumber(usage.total_tokens)} tokens`} tone="rose" icon={<Coins className="h-5 w-5" />} />
        <MetricCard label="Feedback score" value={feedback.average_rating != null ? `${feedback.average_rating}/5` : "—"} detail={`${responseRate}% response rate`} tone="amber" icon={<MessageSquareText className="h-5 w-5" />} />
      </div>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Key insights">
        <InsightCard
          label="Activation"
          value={`${subscriptionRate}%`}
          description={`${number.format(data.summary.user_funnel.subscribed)} of ${number.format(data.summary.user_funnel.total)} accounts have a subscription record.`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="blue"
        />
        <InsightCard
          label="Product depth"
          value={generationsPerTeacher.toFixed(1)}
          description="Average generations per active teacher in the last 30 days."
          icon={<Sparkles className="h-5 w-5" />}
          tone="violet"
        />
        <InsightCard
          label="Teacher voice"
          value={`${feedback.with_comments}`}
          description={`Written comments collected; ${feedback.dismissed} prompts were skipped.`}
          icon={<MessageSquareText className="h-5 w-5" />}
          tone="amber"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <AdminPanel
          title="30-day product activity"
          description="Switch between generation volume, token consumption, and AI cost."
          actions={<Link href="/admin/usage" className="text-sm font-semibold text-blue-600 hover:underline">Detailed usage ↗</Link>}
        >
          <UsageDailyChart data={data.usage.daily} />
        </AdminPanel>
        <AdminPanel title="Account activation" description="Independent lifecycle milestones across all users.">
          <UserFunnelChart data={data.summary.user_funnel} />
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Tool adoption" description="Which generators teachers used in the last 30 days.">
          <ToolUsageChart data={data.usage.by_kind} />
        </AdminPanel>
        <AdminPanel
          title="Most active teachers"
          description="Top users by tracked AI cost in the last 30 days."
          contentClassName="p-0"
          actions={<Link href="/admin/usage" className="text-sm font-semibold text-blue-600 hover:underline">View all ↗</Link>}
        >
          {data.usage.by_user.length ? (
            <div className="divide-y divide-gray-100">
              {data.usage.by_user.slice(0, 7).map((user, index) => (
                <Link key={user.user_id} href={`/admin/users/${user.user_id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-600">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-gray-900">{user.name || user.email || "Unnamed teacher"}</span><span className="block truncate text-xs text-gray-500">{user.email || "No email"} · {user.tier}</span></span>
                  <span className="text-right"><span className="block text-sm font-bold text-gray-900">{number.format(user.generations)}</span><span className="block text-xs text-gray-500">generations</span></span>
                  <span className="w-20 text-right text-sm font-semibold text-rose-600">{formatInr(user.cost_inr)}</span>
                </Link>
              ))}
            </div>
          ) : <div className="p-6"><EmptyState title="No active teachers in this period" /></div>}
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <AdminPanel
          title="Latest generation activity"
          description="Recent product usage across teachers and tools."
          contentClassName="p-0"
          actions={<Link href="/admin/activity" className="text-sm font-semibold text-blue-600 hover:underline">Full activity ↗</Link>}
        >
          {data.activity.items.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Tool</th><th className="px-5 py-3">Topic</th><th className="px-5 py-3">When</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {data.activity.items.map((row) => (
                    <tr key={`${row.kind}-${row.generation_id}`} className="hover:bg-gray-50">
                      <td className="px-5 py-3"><Link href={`/admin/users/${row.user_id}`} className="font-semibold text-blue-600 hover:underline">{row.user_name || row.user_email || "Unknown user"}</Link></td>
                      <td className="px-5 py-3"><StatusPill status="info">{formatLabel(row.kind)}</StatusPill></td>
                      <td className="max-w-xs truncate px-5 py-3 text-gray-700">{row.topic || row.book_title || "—"}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{formatDateTime(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="p-6"><EmptyState title="No recent activity" /></div>}
        </AdminPanel>

        <AdminPanel
          title="Feedback health"
          description="All-time first-use generator feedback."
          actions={<Link href="/admin/feedback" className="text-sm font-semibold text-blue-600 hover:underline">Read feedback ↗</Link>}
        >
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-center">
            <p className="text-4xl font-black text-amber-600">{feedback.average_rating != null ? feedback.average_rating.toFixed(1) : "—"}</p>
            <p className="mt-1 text-sm font-semibold text-amber-800">average out of 5</p>
          </div>
          <div className="mt-5 space-y-4">
            <ProgressRow label="Submitted" value={feedback.submitted} total={feedback.total} color="bg-emerald-500" />
            <ProgressRow label="Skipped" value={feedback.dismissed} total={feedback.total} color="bg-slate-400" />
            <ProgressRow label="With comments" value={feedback.with_comments} total={feedback.total} color="bg-blue-500" />
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">
        <AdminPanel
          title="10 most recent signups"
          description="Newest accounts and their progress through the first activation steps."
          contentClassName="p-0"
          actions={<Link href="/admin/users" className="text-sm font-semibold text-blue-600 hover:underline">All users ↗</Link>}
        >
          {data.recentSignups.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Activation</th><th className="px-5 py-3">Profile signal</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.recentSignups.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/users/${user.id}`} className="group block">
                          <span className="block font-semibold text-blue-600 group-hover:underline">{user.full_name || user.name || user.email || "Unnamed user"}</span>
                          <span className="block text-xs text-gray-500">{user.email || "No email"} · {user.role || "teacher"}</span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{formatDateTimeAmPm(user.created_at)}</td>
                      <td className="px-5 py-3"><SignupProgress user={user} /></td>
                      <td className="px-5 py-3 text-xs text-gray-600">{[user.role_in_school, user.board_preference].filter(Boolean).join(" · ") || "Not provided"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="p-6"><EmptyState title="No recent signups" /></div>}
        </AdminPanel>

        <AdminPanel title="Activation opportunities" description="Teacher segments where targeted follow-up can have the highest impact.">
          <div className="space-y-3">
            <OpportunityCard
              value={data.summary.user_funnel.confirmed_never_logged_in}
              title="Confirmed, never signed in"
              description="Help these teachers reach their first TeachPad session."
              href="/admin/users"
              tone="amber"
            />
            <OpportunityCard
              value={data.summary.user_funnel.logged_in_without_subscription}
              title="Signed in, no subscription"
              description="The clearest conversion opportunity."
              href="/admin/users"
              tone="blue"
            />
            <OpportunityCard
              value={data.summary.user_funnel.subscribed_inactive_30d}
              title="Subscribed, inactive 30d"
              description="Prioritize these teachers for retention outreach."
              href="/admin/usage"
              tone="rose"
            />
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Content & platform readiness" description="Reference-library coverage available to teachers.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReadinessCard label="Books" value={data.summary.system_status.books} href="/admin/textbooks" />
          <ReadinessCard label="Boards" value={data.summary.system_status.boards} href="/admin/curriculum" />
          <ReadinessCard label="Classes" value={data.summary.system_status.classes} href="/admin/curriculum" />
          <ReadinessCard label="API health" value={data.summary.system_status.backend_api === "ok" ? "Healthy" : data.summary.system_status.backend_api} href="/admin/system" />
        </div>
      </AdminPanel>
    </>
  );
}

async function loadDashboardInsights(): Promise<DashboardInsights> {
  const now = new Date();
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 1);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 29);
  const date = (value: Date) => value.toISOString().slice(0, 10);

  const [summary, usage, activity, feedback, recentUsers] = await Promise.all([
    backendApi.adminSummary(),
    backendApi.adminUsage({ start: date(start), end: date(end), sort: "cost_inr", limit: 20 }),
    backendApi.adminActivity({ skip: 0, limit: 8 }),
    backendApi.adminFeedback({ skip: 0, limit: 1 }),
    backendApi.users(0, 10),
  ]);
  return { summary, usage, activity, feedback, recentSignups: recentUsers.items };
}

function InsightCard({ label, value, description, icon, tone }: { label: string; value: string; description: string; icon: React.ReactNode; tone: "blue" | "violet" | "amber" }) {
  const colors = {
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-600",
    violet: "border-violet-100 bg-gradient-to-br from-violet-50 to-white text-violet-600",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50 to-white text-amber-600",
  };
  return <div className={`rounded-2xl border p-5 ${colors[tone]}`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p><p className="mt-1 text-3xl font-black text-slate-900">{value}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 shadow-sm">{icon}</span></div><p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{description}</p></div>;
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return <div><div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold text-slate-600">{label}</span><span className="font-bold text-slate-900">{value} <span className="font-medium text-slate-400">({percentage}%)</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div></div>;
}

function ReadinessCard({ label, value, href }: { label: string; value: number | string; href: string }) {
  return <Link href={href} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 hover:border-blue-200 hover:bg-blue-50"><span><span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span><span className="mt-1 block text-xl font-black text-slate-900">{value}</span></span><ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" /></Link>;
}

function SignupProgress({ user }: { user: ApiUser }) {
  const steps = [
    { label: "C", on: Boolean(user.confirmed), title: "Email confirmed" },
    { label: "L", on: Boolean(user.logged_in), title: "Has signed in" },
    { label: "S", on: Boolean(user.has_subscription), title: "Has subscription" },
  ];
  return <div className="flex gap-1.5">{steps.map((step) => <span key={step.label} title={step.title} className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ring-1 ${step.on ? "bg-emerald-50 text-emerald-600 ring-emerald-200" : "bg-slate-50 text-slate-400 ring-slate-200"}`}>{step.label}</span>)}</div>;
}

function OpportunityCard({ value, title, description, href, tone }: { value: number; title: string; description: string; href: string; tone: "amber" | "blue" | "rose" }) {
  const colors = {
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
  };
  return <Link href={href} className={`group block rounded-xl border p-4 ${colors[tone]}`}><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-3"><p className="font-bold text-slate-900">{title}</p><span className="text-2xl font-black">{number.format(value)}</span></div><p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{description}</p></div><ArrowRight className="mt-1 h-4 w-4 shrink-0 opacity-50 group-hover:translate-x-0.5" /></div></Link>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTimeAmPm(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toCsv(headers: string[], rows: Array<Array<string | number | boolean>>) {
  return [headers, ...rows].map((row) => row.map((value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
  }).join(",")).join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
