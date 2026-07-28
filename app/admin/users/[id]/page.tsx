"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Coins,
  ExternalLink,
  FileText,
  GraduationCap,
  Hash,
  Mail,
  MessageSquareText,
  Phone,
  School,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { backendApi } from "@/lib/api";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  LoadingState,
  MetricCard,
  StatusPill,
  compactNumber,
  formatDateTime,
  formatInr,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

const GENERATION_LABELS: Record<string, string> = {
  lesson_plans: "Lesson plans",
  worksheets: "Worksheets",
  notes: "Notes",
  activities: "Activities",
  presentations: "Presentations",
  writing_documents: "Writing documents",
  workspaces: "Teaching workspaces",
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const detail = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => backendApi.adminUserDetail(userId),
    enabled: Boolean(userId),
  });
  const activity = useQuery({
    queryKey: ["admin-user-recent-activity", userId],
    queryFn: () => backendApi.adminActivity({ user_id: userId, skip: 0, limit: 10 }),
    enabled: Boolean(userId),
  });

  if (detail.isLoading) return <LoadingState label="Loading user record" />;
  if (detail.isError || !detail.data) {
    return <EmptyState title="Could not load user" description={getErrorMessage(detail.error, "The user may no longer exist.")} />;
  }

  const data = detail.data;
  const account = data.account;
  const generatedTotal = Object.entries(data.generation_counts)
    .filter(([key]) => key !== "workspaces")
    .reduce((sum, [, value]) => sum + value, 0);

  return (
    <>
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      <AdminPageHeader
        eyebrow="Complete user record"
        title={account.full_name}
        description={account.email}
        meta={
          <>
            <StatusPill status={account.is_active ? "success" : "danger"}>{account.is_active ? "Active" : "Disabled"}</StatusPill>
            <StatusPill status={data.auth.confirmed ? "success" : "warning"}>{data.auth.confirmed ? "Email confirmed" : "Unconfirmed"}</StatusPill>
            <StatusPill status="info">{account.role}</StatusPill>
            {data.subscription ? <StatusPill status={subscriptionTone(data.subscription.status)}>{data.subscription.status}</StatusPill> : <StatusPill>No subscription</StatusPill>}
          </>
        }
        actions={
          <Link href={`/admin/activity?user_id=${account.id}`}>
            <Button variant="outline">View all activity <ExternalLink className="h-4 w-4" /></Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Generated content" value={compactNumber(generatedTotal)} detail={`${data.generation_counts.workspaces} workspaces`} tone="blue" icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="Tracked AI calls" value={compactNumber(data.usage.calls)} detail={`${data.usage.failures} failed`} tone="green" icon={<Hash className="h-5 w-5" />} />
        <MetricCard label="Tokens" value={compactNumber(data.usage.total_tokens)} detail={`${compactNumber(data.usage.prompt_tokens)} in · ${compactNumber(data.usage.completion_tokens)} out`} tone="amber" icon={<BookOpen className="h-5 w-5" />} />
        <MetricCard label="AI cost" value={formatInr(data.usage.cost_inr)} detail={`Last call ${formatDateTime(data.usage.last_generation_at ?? undefined)}`} tone="rose" icon={<Coins className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Account & authentication" description="Core profile and login lifecycle.">
          <DetailGrid>
            <Detail label="User ID" value={account.id} mono />
            <Detail label="Role" value={account.role} />
            <Detail label="Email" value={account.email} icon={<Mail className="h-4 w-4" />} />
            <Detail label="Phone" value={account.phone} icon={<Phone className="h-4 w-4" />} />
            <Detail label="Email confirmed" value={formatDateTime(data.auth.email_confirmed_at ?? undefined)} />
            <Detail label="Last sign in" value={formatDateTime(data.auth.last_sign_in_at ?? undefined)} />
            <Detail label="Account created" value={formatDateTime(account.created_at)} />
            <Detail label="Profile updated" value={formatDateTime(account.updated_at)} />
            <Detail label="Avatar" value={account.avatar_key} />
          </DetailGrid>
        </AdminPanel>

        <AdminPanel title="Onboarding & school" description="Everything captured during profile completion and onboarding.">
          <DetailGrid>
            <Detail label="Onboarding" value={data.onboarding.completed_at ? `Completed ${formatDateTime(data.onboarding.completed_at)}` : "Not completed"} icon={<GraduationCap className="h-4 w-4" />} />
            <Detail label="Role in school" value={data.onboarding.role_in_school} />
            <Detail label="Board preference" value={data.onboarding.board_preference} />
            <Detail label="School" value={data.school?.name ?? data.onboarding.pending_school_name} icon={<School className="h-4 w-4" />} />
            <Detail label="School board" value={data.school?.board_name} />
            <Detail label="Location" value={schoolLocation(data.school)} />
            <Detail label="Phone prompt" value={data.onboarding.phone_prompt_exempt ? "Exempt" : account.phone ? "Completed" : "Pending"} />
            <Detail label="Signed in before" value={data.auth.logged_in ? "Yes" : "No"} />
          </DetailGrid>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Subscription & billing" description="Current access, mandate, and billing details.">
          {data.subscription ? (
            <DetailGrid>
              <Detail label="Plan" value={formatLabel(data.subscription.plan_code)} icon={<ShieldCheck className="h-4 w-4" />} />
              <Detail label="Status / source" value={`${formatLabel(data.subscription.status)} · ${formatLabel(data.subscription.source)}`} />
              <Detail label="Price" value={data.subscription.price_inr != null ? formatInr(data.subscription.price_inr) : null} />
              <Detail label="Access until" value={formatDateTime(data.subscription.access_until ?? undefined)} />
              <Detail label="Trial started" value={formatDateTime(data.subscription.trial_started_at ?? undefined)} />
              <Detail label="Paid starts" value={formatDateTime(data.subscription.paid_starts_at ?? undefined)} />
              <Detail label="Current period" value={period(data.subscription.current_period_start, data.subscription.current_period_end)} />
              <Detail label="Cancellation" value={data.subscription.cancel_at_period_end ? "Cancels at period end" : "Not scheduled"} />
              <Detail label="Launch gift" value={yesNo(data.subscription.is_launch_gift)} />
              <Detail label="Influencer comp" value={yesNo(data.subscription.comp_from_influencer)} />
              <Detail label="Billing phone" value={data.subscription.billing_phone} />
              <Detail label="Razorpay subscription" value={data.subscription.razorpay_subscription_id} mono />
              <Detail label="Razorpay customer" value={data.subscription.razorpay_customer_id} mono />
            </DetailGrid>
          ) : <EmptyState title="No subscription record" description="This account has no trial, complimentary, or paid subscription row." />}
        </AdminPanel>

        <AdminPanel title="Referral & promo history" description="How this user was referred and access codes they redeemed.">
          {data.referrer ? (
            <Link href={`/admin/users/${data.referrer.id}`} className="mb-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 hover:bg-blue-50">
              <UserRound className="h-5 w-5 text-blue-600" />
              <span className="min-w-0 flex-1"><span className="block font-semibold text-gray-900">Referred by {data.referrer.name}</span><span className="block truncate text-xs text-gray-500">{data.referrer.email}</span></span>
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </Link>
          ) : <p className="mb-4 text-sm text-gray-500">No referrer recorded.</p>}
          {data.promo_redemptions.length ? (
            <div className="space-y-3">
              {data.promo_redemptions.map((promo) => (
                <div key={promo.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                  <Ticket className="mt-0.5 h-5 w-5 text-violet-600" />
                  <div className="min-w-0 flex-1"><p className="font-semibold text-gray-900">{promo.code}</p><p className="text-xs text-gray-500">{formatLabel(promo.kind)}{promo.duration_days ? ` · ${promo.duration_days} days` : ""} · {formatDateTime(promo.redeemed_at)}</p></div>
                  <span className="text-xs text-gray-500">Until {formatDateTime(promo.resulting_access_until ?? undefined)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No promo redemptions" />}
        </AdminPanel>
      </div>

      <AdminPanel title="Generation history" description="Persisted output counts plus the ten most recent generation records." actions={<Link href={`/admin/activity?user_id=${account.id}`} className="text-sm font-semibold text-blue-600 hover:underline">Open full activity ↗</Link>}>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.generation_counts).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{GENERATION_LABELS[key] ?? formatLabel(key)}</p><p className="mt-2 text-2xl font-black text-gray-900">{value}</p></div>
          ))}
        </div>
        {activity.isLoading ? <LoadingState label="Loading recent activity" /> : activity.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500"><tr><th className="py-3 pr-4">When</th><th className="py-3 pr-4">Tool</th><th className="py-3 pr-4">Topic</th><th className="py-3 pr-4">Book</th><th className="py-3">Cost</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{activity.data.items.map((row) => <tr key={`${row.kind}-${row.generation_id}`}><td className="py-3 pr-4 whitespace-nowrap text-gray-500">{formatDateTime(row.created_at)}</td><td className="py-3 pr-4 font-medium">{formatLabel(row.kind)}</td><td className="max-w-xs truncate py-3 pr-4">{row.topic || "—"}</td><td className="max-w-xs truncate py-3 pr-4 text-gray-600">{row.book_title || "—"}</td><td className="py-3 text-gray-600">{row.cost_inr != null ? formatInr(row.cost_inr) : "—"}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No generation activity" />}
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title={`Feedback (${data.feedback.length})`} description="Generator ratings, comments, and skipped prompts.">
          {data.feedback.length ? <div className="space-y-3">{data.feedback.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-blue-600" /><span className="font-semibold">{formatLabel(item.tool)}</span>{item.rating != null ? <span className="text-sm font-semibold text-amber-600">{item.rating}/5</span> : null}</div><StatusPill status={item.dismissed ? "neutral" : "success"}>{item.dismissed ? "Skipped" : "Submitted"}</StatusPill></div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{item.comment || "No comment"}</p><p className="mt-2 text-xs text-gray-400">{formatDateTime(item.created_at)}</p>
            </div>
          ))}</div> : <EmptyState title="No feedback" />}
        </AdminPanel>

        <AdminPanel title={`Workshops (${data.workshops.length})`} description="Registration, attendance, certification, and session feedback.">
          {data.workshops.length ? <div className="space-y-3">{data.workshops.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-gray-900">{item.title}</p><p className="mt-1 text-xs text-gray-500">{formatDateTime(item.scheduled_at)}</p></div><div className="flex gap-1.5"><StatusPill status={item.attended ? "success" : "neutral"}>{item.attended ? "Attended" : "Registered"}</StatusPill>{item.certificate_issued ? <StatusPill status="info">Certificate</StatusPill> : null}</div></div>{item.feedback_rating ? <p className="mt-2 text-sm font-semibold text-amber-600">{item.feedback_rating}/5</p> : null}{item.feedback_text ? <p className="mt-1 text-sm text-gray-600">{item.feedback_text}</p> : null}</div>
          ))}</div> : <EmptyState title="No workshop registrations" />}
        </AdminPanel>
      </div>
    </>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

function Detail({ label, value, mono, icon }: { label: string; value?: string | null; mono?: boolean; icon?: React.ReactNode }) {
  return <div className="min-w-0"><dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">{icon}{label}</dt><dd className={`mt-1 break-words text-sm font-semibold text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</dd></div>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function schoolLocation(school: { city: string | null; district: string | null; state: string | null } | null) {
  return school ? [school.city, school.district, school.state].filter(Boolean).join(", ") || null : null;
}

function period(start: string | null, end: string | null) {
  if (!start && !end) return null;
  return `${formatDateTime(start ?? undefined)} → ${formatDateTime(end ?? undefined)}`;
}

function yesNo(value: boolean) { return value ? "Yes" : "No"; }

function subscriptionTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (["active", "comped"].includes(status)) return "success";
  if (status === "trialing") return "info";
  if (status === "past_due") return "warning";
  if (status === "canceled") return "danger";
  return "neutral";
}
