"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Coins,
  FileText,
  MessageSquareText,
  Users,
} from "lucide-react";
import {
  backendApi,
  type AdminActivityResponse,
  type AdminFeedbackResponse,
  type AdminSummary,
  type StreakAdminAnalytics,
  type AdminUsageResponse,
  type ApiUser,
} from "@/lib/api";
import {
  AdminPanel,
  EmptyState,
  LoadingState,
  MetricCard,
  StatusPill,
  compactNumber,
  formatDateTime,
  formatInr,
} from "@/components/admin/admin-ui";
import { UsageDailyChart } from "@/components/admin/usage-daily-chart";
import { SignupActivityChart } from "@/components/admin/signup-activity-chart";
import { getErrorMessage } from "@/lib/errors";

type DashboardInsights = {
  summary: AdminSummary;
  usage: AdminUsageResponse;
  activity: AdminActivityResponse;
  feedback: AdminFeedbackResponse;
  recentSignups: ApiUser[];
  streak: StreakAdminAnalytics;
};

const number = new Intl.NumberFormat("en-IN");

export default function AdminDashboard() {
  const dashboard = useQuery({
    queryKey: ["admin-dashboard-insights"],
    queryFn: loadDashboardInsights,
  });

  if (dashboard.isLoading) return <LoadingState label="Building dashboard insights" />;
  if (dashboard.isError || !dashboard.data) {
    return <EmptyState title="Could not load dashboard insights" description={getErrorMessage(dashboard.error, "Refresh to try again.")} />;
  }

  const data = dashboard.data;
  const usage = data.usage.totals;
  const feedback = data.feedback.summary;
  const successRate = usage.generations ? Math.round(((usage.generations - usage.failures) / usage.generations) * 100) : 0;
  const responseRate = feedback.total ? Math.round((feedback.submitted / feedback.total) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total users" value={compactNumber(data.summary.total_users)} detail={`+${data.summary.user_funnel.new_last_24_hours} in 24 hours`} tone="blue" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Active teachers" value={compactNumber(usage.active_users)} detail="Generated in 30 days" tone="green" icon={<Activity className="h-5 w-5" />} />
        <MetricCard label="Generations" value={compactNumber(usage.generations)} detail={`${successRate}% successful · ${number.format(usage.failures)} failed`} tone="blue" icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="AI cost" value={formatInr(usage.cost_inr)} detail={`${compactNumber(usage.total_tokens)} tokens`} tone="rose" icon={<Coins className="h-5 w-5" />} />
        <MetricCard label="Feedback score" value={feedback.average_rating != null ? `${feedback.average_rating}/5` : "—"} detail={`${responseRate}% response rate`} tone="amber" icon={<MessageSquareText className="h-5 w-5" />} />
      </div>

      <AdminPanel
        title="30-day product activity"
        description="Switch between generation volume, token consumption, and AI cost."
        actions={<Link href="/admin/usage" className="text-sm font-semibold text-blue-600 hover:underline">Detailed usage ↗</Link>}
      >
        <UsageDailyChart data={data.usage.daily} start={data.usage.start} end={data.usage.end} />
      </AdminPanel>

      <AdminPanel
        title="30-day signup activity"
        description="Daily signup cohorts and the share that reached their first successful generation."
        actions={<Link href="/admin/users" className="text-sm font-semibold text-blue-600 hover:underline">All users ↗</Link>}
      >
        <SignupActivityChart />
      </AdminPanel>

      <AdminPanel
        title="Teaching streak impact"
        description="Meaningful multi-day use, milestone progress, retention, conversion and reward adoption."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StreakMetric label="Activated users starting" value={`${data.streak.activated_users_starting_streak_pct}%`} detail={`${number.format(data.streak.streak_starters)} streak starters`} />
          <StreakMetric label="Reached 3 days" value={`${data.streak.reached_3_pct}%`} detail="of streak starters" />
          <StreakMetric label="Reached 7 days" value={`${data.streak.reached_7_pct}%`} detail="of streak starters" />
          <StreakMetric label="Reached 14 days" value={`${data.streak.reached_14_pct}%`} detail="of streak starters" />
          <StreakMetric label="Reached 30 days" value={`${data.streak.reached_30_pct}%`} detail="of streak starters" />
          <StreakMetric label="D7 · started streak" value={`${data.streak.d7_retention_started_pct}%`} detail="day-seven retention" />
          <StreakMetric label="D7 · no streak" value={`${data.streak.d7_retention_not_started_pct}%`} detail="comparison cohort" />
          <StreakMetric label="Avg teaching days" value={String(data.streak.average_teaching_days_per_active_teacher)} detail="per active teacher · 30d" />
          <StreakMetric label="Certificate claim rate" value={`${data.streak.reward_claim_rate_pct}%`} detail="unlocked certificates opened" />
          <StreakMetric
            label="Paid conversion · 3/7/14/30d"
            value={[3, 7, 14, 30].map((day) => `${data.streak.paid_conversion_by_milestone[String(day)] ?? 0}%`).join(" · ")}
            detail="by streak milestone"
          />
        </div>
      </AdminPanel>

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

  const [summary, usage, activity, feedback, recentUsers, streak] = await Promise.all([
    backendApi.adminSummary(),
    backendApi.adminUsage({ start: date(start), end: date(end), sort: "cost_inr", limit: 20 }),
    backendApi.adminActivity({ skip: 0, limit: 8 }),
    backendApi.adminFeedback({ skip: 0, limit: 1 }),
    backendApi.users(0, 10),
    backendApi.adminStreakAnalytics(),
  ]);
  return { summary, usage, activity, feedback, recentSignups: recentUsers.items, streak };
}

function StreakMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-medium text-slate-500">{detail}</p></div>;
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
