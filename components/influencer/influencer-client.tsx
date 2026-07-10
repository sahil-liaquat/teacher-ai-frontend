"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, HandCoins, IndianRupee, ReceiptText, Settings, TrendingUp, Users } from "lucide-react";
import { LoadingState } from "@/components/admin/admin-ui";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { ReferralCodeCard } from "@/components/influencer/referral-code-card";
import { backendApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function InfluencerPortalClient() {
  const dashboard = useQuery({ queryKey: ["influencer-dashboard"], queryFn: () => backendApi.influencerDashboard() });

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Referrals and"
        titleHighlight="payouts"
        imageSrc="/assets/illustrations/influencer-header.png"
        imageClassName="object-center scale-110"
      />

      <section className="rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:p-5">
        {dashboard.isLoading ? <LoadingState label="Loading influencer metrics" /> : null}
        {dashboard.data ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:gap-4">
            <DashboardMetric label="Total Signups" value={dashboard.data.total_referred_signups} detail="Referred accounts" tone="blue" icon={<Users className="h-5 w-5" />} />
            <DashboardMetric label="Active Paid Subscribers" value={dashboard.data.total_active_subscribers} detail="Converted referrals" tone="green" icon={<TrendingUp className="h-5 w-5" />} />
            <DashboardMetric label="Total Earnings" value={formatInr(dashboard.data.total_earned_commission_inr)} detail="Lifetime commission" tone="orange" icon={<IndianRupee className="h-5 w-5" />} />
            <DashboardMetric label="Cleared Payouts" value={formatInr(dashboard.data.payouts_received_inr)} detail="Already paid" tone="purple" icon={<ReceiptText className="h-5 w-5" />} />
            <DashboardMetric label="Outstanding" value={formatInr(dashboard.data.pending_payout_amount_inr)} detail="Pending payout" tone="red" icon={<HandCoins className="h-5 w-5" />} />
          </div>
        ) : null}
      </section>

      <ReferralCodeCard variant="hero" />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Manage your influencer account</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Open a section to view details and manage your account.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
          <InfluencerOption
            href="/influencer/commissions"
            title="Commissions"
            description="View referral earnings, payment status and subscriber details"
            icon={<IndianRupee className="h-7 w-7 stroke-[2.3]" />}
            tone="blue"
          />
          <InfluencerOption
            href="/influencer/payouts"
            title="Payouts"
            description="Review completed transfers, references and payout history"
            icon={<ReceiptText className="h-7 w-7 stroke-[2.3]" />}
            tone="cyan"
          />
          <InfluencerOption
            href="/influencer/settings"
            title="Account settings"
            description="Update your profile, security and workspace preferences"
            icon={<Settings className="h-7 w-7 stroke-[2.3]" />}
            tone="amber"
          />
        </div>
      </section>
    </div>
  );
}

function InfluencerOption({
  href,
  title,
  description,
  icon,
  tone
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: "blue" | "cyan" | "amber";
}) {
  const styles = {
    blue: {
      card: "from-[#eff6ff] via-[#eff6ff] to-white",
      glow: "bg-[#bfdbfe]/30",
      icon: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100 shadow-[0_14px_30px_rgba(59,130,246,0.22)]"
    },
    cyan: {
      card: "from-[#f0fdff] via-cyan-50/70 to-white",
      glow: "bg-cyan-200/30",
      icon: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb] shadow-[0_14px_30px_rgba(22,169,182,0.18)]"
    },
    amber: {
      card: "from-[#fffaf0] via-amber-50/80 to-white",
      glow: "bg-amber-200/30",
      icon: "bg-[#fff6df] text-[#f0a22f] ring-amber-100 shadow-[0_14px_30px_rgba(240,162,47,0.20)]"
    }
  }[tone];

  return (
    <Link
      href={href}
      className={cn(
        "group/card relative flex min-h-[126px] items-center gap-4 overflow-hidden rounded-[18px] border border-white/70 bg-gradient-to-br p-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        styles.card
      )}
    >
      <div className={cn("absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl", styles.glow)} />
      <span className={cn("relative grid h-16 w-16 shrink-0 place-items-center rounded-[22px] ring-1 transition-transform duration-300 group-hover/card:scale-105", styles.icon)}>
        {icon}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-base font-extrabold text-slate-900 transition-colors group-hover/card:text-blue-600">{title}</span>
        <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-500">{description}</span>
      </span>
      <ChevronRight className="relative h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover/card:translate-x-1" />
    </Link>
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
    <article className="relative min-h-[116px] overflow-hidden rounded-[18px] border border-white/70 bg-gradient-to-br from-slate-50 to-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:min-h-[126px] sm:p-5">
      <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-blue-200/20 blur-2xl" />
      <div className="flex h-full items-center gap-3 sm:gap-4">
        <span className={cn("relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-[18px] ring-1 shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:h-14 sm:w-14", metricTone(tone))}>
          {icon}
        </span>
        <div className="relative z-10 min-w-0 flex-1">
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
    blue: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100",
    green: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100",
    orange: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
    purple: "bg-[#f6f1ff] text-[#8b5cf6] ring-[#e9e1ff]",
    red: "bg-[#fff7f8] text-[#eb3b5a] ring-[#ffd9de]"
  }[tone];
}
