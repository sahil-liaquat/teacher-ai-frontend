"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HandCoins, IndianRupee, ReceiptText, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { EmptyState, LoadingState, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Input } from "@/components/ui/input";
import { backendApi, type CommissionOut, type PayoutOut } from "@/lib/api";
import { cn } from "@/lib/utils";

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function InfluencerPortalPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [search, setSearch] = useState("");
  const dashboard = useQuery({ queryKey: ["influencer-dashboard"], queryFn: () => backendApi.influencerDashboard() });
  const commissions = useQuery({ queryKey: ["influencer-commissions"], queryFn: () => backendApi.influencerCommissions() });
  const payouts = useQuery({ queryKey: ["influencer-payouts"], queryFn: () => backendApi.influencerPayouts() });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (commissions.data || []).filter((row) => {
      const statusMatches = filter === "all" || row.payment_status === filter;
      const searchMatches = !term || [row.referred_user_name, row.referred_user_email, row.notes, row.payment_status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      return statusMatches && searchMatches;
    });
  }, [commissions.data, filter, search]);

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-4">
      <div className="overflow-visible rounded-[18px] border border-[#ffd9de] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
        <header className="relative min-h-[132px] overflow-hidden rounded-t-[18px] border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] via-white to-[#fff1f7] px-4 py-4 sm:min-h-[154px] sm:px-6 sm:py-5">
          <div className="relative z-10 max-w-[620px]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ffd9de] bg-white/80 px-3 py-1.5 text-xs font-black text-red-500 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Influencer portal
            </div>
            <h1 className="text-[28px] font-black tracking-tight text-teachpad-ink sm:text-[34px]">Referrals and payouts</h1>
            <p className="mt-2.5 max-w-[540px] text-sm font-medium leading-6 text-teachpad-muted">
              Track referred signups, earned commissions, pending payouts, and payout history from one place.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden lg:block">
            <div className="absolute bottom-5 right-8 grid h-28 w-28 place-items-center rounded-[28px] border border-white/70 bg-white/80 text-red-500 shadow-[0_22px_45px_rgba(235,59,90,0.16)] backdrop-blur-sm xl:right-16 xl:h-32 xl:w-32">
              <HandCoins className="h-14 w-14 stroke-[2.2] xl:h-16 xl:w-16" />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-5">
          {dashboard.isLoading ? <LoadingState label="Loading influencer metrics" /> : null}
          {dashboard.data ? (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:gap-4">
              <DashboardMetric label="Total Signups" value={dashboard.data.total_referred_signups} detail="Referred accounts" tone="blue" icon={<Users className="h-5 w-5" />} />
              <DashboardMetric label="Active Paid Subscribers" value={dashboard.data.total_active_subscribers} detail="Converted referrals" tone="green" icon={<TrendingUp className="h-5 w-5" />} />
              <DashboardMetric label="Total Earnings" value={formatInr(dashboard.data.total_earned_commission_inr)} detail="Lifetime commission" tone="orange" icon={<IndianRupee className="h-5 w-5" />} />
              <DashboardMetric label="Cleared Payouts" value={formatInr(dashboard.data.payouts_received_inr)} detail="Already paid" tone="purple" icon={<ReceiptText className="h-5 w-5" />} />
              <DashboardMetric label="Outstanding" value={formatInr(dashboard.data.pending_payout_amount_inr)} detail="Pending payout" tone="red" icon={<HandCoins className="h-5 w-5" />} />
            </section>
          ) : null}
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
        <section className="h-full min-w-0 overflow-hidden rounded-[18px] border border-[#ffd9de] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-[#ffd9de] bg-gradient-to-br from-[#fff7f8] to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-teachpad-ink">Commission ledger</h2>
              <p className="mt-1 text-sm font-medium text-teachpad-muted">Referral commissions from paid subscribers.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className="h-10 rounded-xl border border-teachpad-cardBorder bg-white/90 px-3 text-sm font-semibold text-teachpad-ink shadow-sm backdrop-blur-sm transition-all hover:border-[#ffd9de] hover:bg-white" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-teachpad-cardBorder bg-white/90 px-3 shadow-sm backdrop-blur-sm transition-all hover:border-[#ffd9de] hover:bg-white">
                <Search className="h-4 w-4 text-teachpad-muted" />
                <Input className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0" placeholder="Search ledger" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
            </div>
          </div>
          {commissions.isLoading ? <div className="p-6"><LoadingState label="Loading commissions" /></div> : null}
          {!commissions.isLoading && !rows.length ? <div className="p-6"><EmptyState title="No commissions found" description="Try changing the filter or search term." /></div> : null}
          {rows.length ? <CommissionTable rows={rows} /> : null}
        </section>

        <section className="h-full min-w-0 overflow-hidden rounded-[18px] border border-[#e9e1ff] bg-white/86 shadow-[0_14px_34px_rgba(39,30,91,0.07)] backdrop-blur-sm">
          <div className="border-b border-[#e9e1ff] bg-gradient-to-br from-[#f6f1ff] to-white px-4 py-4 sm:px-5">
            <h2 className="text-base font-bold text-teachpad-ink">Payout ledger</h2>
            <p className="mt-1 text-sm font-medium text-teachpad-muted">Cleared payout transfers.</p>
          </div>
          {payouts.isLoading ? <div className="p-6"><LoadingState label="Loading payouts" /></div> : null}
          {!payouts.isLoading && !payouts.data?.length ? <div className="p-6"><EmptyState title="No payouts yet" description="Cleared payout transfers will appear here." /></div> : null}
          {payouts.data?.length ? <PayoutList payouts={payouts.data} /> : null}
        </section>
      </section>
    </div>
  );
}

function DashboardMetric({
  label,
  value,
  detail,
  icon,
  tone
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "orange" | "purple" | "red";
}) {
  return (
    <article className="min-h-[116px] rounded-[18px] border border-white/70 bg-gradient-to-br from-slate-50 to-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:min-h-[126px] sm:p-5">
      <div className="flex h-full items-center gap-3 sm:gap-4">
        <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl sm:h-14 sm:w-14", metricTone(tone))}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 sm:text-sm">{label}</p>
          <p className="mt-1 truncate text-2xl font-extrabold text-slate-900 sm:text-3xl">{value}</p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400 sm:text-xs">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function metricTone(tone: "blue" | "green" | "orange" | "purple" | "red") {
  return {
    blue: "bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] text-[#2563eb]",
    green: "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600",
    orange: "bg-gradient-to-br from-orange-100 to-amber-50 text-orange-600",
    purple: "bg-gradient-to-br from-violet-100 to-purple-50 text-violet-600",
    red: "bg-gradient-to-br from-rose-100 to-pink-50 text-red-500"
  }[tone];
}

function CommissionTable({ rows }: { rows: CommissionOut[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/70 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
          <tr>{["Referred User", "Amount", "Status", "Created", "Notes"].map((heading) => <th key={heading} className="px-6 py-4 font-bold">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-slate-50/70">
              <td className="px-6 py-4">
                <p className="font-semibold text-slate-900">{row.referred_user_name || "Unnamed user"}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{row.referred_user_email || "-"}</p>
              </td>
              <td className="px-6 py-4 font-bold text-slate-900">{formatInr(row.amount_inr)}</td>
              <td className="px-6 py-4"><StatusPill status={row.payment_status === "paid" ? "success" : "warning"}>{row.payment_status}</StatusPill></td>
              <td className="px-6 py-4 font-medium text-slate-500">{formatDateTime(row.created_at)}</td>
              <td className="max-w-md px-6 py-4 font-medium text-slate-500">{row.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayoutList({ payouts }: { payouts: PayoutOut[] }) {
  return (
    <div className="grid gap-3 p-4">
      {payouts.map((payout) => (
        <article key={payout.id} className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-50 text-violet-600">
                <ReceiptText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-slate-900">{payout.payout_reference}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{formatDateTime(payout.created_at)}</p>
                {payout.note ? <p className="mt-2 text-sm font-medium text-slate-500">{payout.note}</p> : null}
              </div>
            </div>
            <p className="shrink-0 text-lg font-extrabold text-slate-900">{formatInr(payout.amount_inr)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
