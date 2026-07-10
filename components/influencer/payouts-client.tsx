"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { backendApi } from "@/lib/api";
import { EmptyState, LoadingState, formatDateTime } from "@/components/admin/admin-ui";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function PayoutsClient() {
  const payouts = useQuery({ queryKey: ["influencer-payouts"], queryFn: () => backendApi.influencerPayouts() });

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Payout"
        titleHighlight="ledger"
        imageSrc="/assets/illustrations/influencer-header.png"
        imageClassName="object-center scale-110"
      />
      <Link
        href="/influencer"
        className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Influencer
      </Link>
      <section className="overflow-hidden rounded-[18px] border border-white/70 bg-gradient-to-br from-white via-cyan-50/35 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        <div className="border-b border-white/70 bg-gradient-to-br from-cyan-50/70 to-white px-4 py-4 sm:px-5">
          <h2 className="text-base font-bold text-teachpad-ink">Payout history</h2>
          <p className="mt-1 text-sm font-medium text-teachpad-muted">View payout clearances received from TeachPad.</p>
        </div>
        {payouts.isLoading ? <div className="p-6"><LoadingState label="Loading payouts" /></div> : null}
        {!payouts.isLoading && !payouts.data?.length ? <div className="p-6"><EmptyState title="No payouts yet" description="Cleared payout transfers will appear here." /></div> : null}
        {payouts.data?.length ? (
          <div className="grid gap-3 p-4">
            {payouts.data.map((payout) => (
              <article key={payout.id} className="flex flex-col gap-3 rounded-[16px] border border-white/70 bg-gradient-to-br from-[#f0fdff] via-cyan-50/65 to-white p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-100 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <ReceiptText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-sm font-semibold text-teachpad-ink">{payout.payout_reference}</p>
                    <p className="mt-1 text-sm font-medium text-teachpad-muted">{formatDateTime(payout.created_at)}</p>
                    {payout.note ? <p className="mt-2 text-sm text-slate-600">{payout.note}</p> : null}
                  </div>
                </div>
                <p className="text-xl font-bold text-teachpad-ink">{formatInr(payout.amount_inr)}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
