"use client";

import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, formatDateTime } from "@/components/admin/admin-ui";

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function PayoutsClient() {
  const payouts = useQuery({ queryKey: ["influencer-payouts"], queryFn: () => backendApi.influencerPayouts() });

  return (
    <>
      <AdminPageHeader eyebrow="Influencer portal" title="Payout Ledger" description="View payout clearances received from TeachPad." />
      <AdminPanel title="Payout history" contentClassName="p-0">
        {payouts.isLoading ? <div className="p-6"><LoadingState label="Loading payouts" /></div> : null}
        {!payouts.isLoading && !payouts.data?.length ? <div className="p-6"><EmptyState title="No payouts yet" description="Cleared payout transfers will appear here." /></div> : null}
        {payouts.data?.length ? (
          <div className="grid gap-3 p-4">
            {payouts.data.map((payout) => (
              <article key={payout.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <ReceiptText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900">{payout.payout_reference}</p>
                    <p className="mt-1 text-sm text-gray-500">{formatDateTime(payout.created_at)}</p>
                    {payout.note ? <p className="mt-2 text-sm text-gray-600">{payout.note}</p> : null}
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatInr(payout.amount_inr)}</p>
              </article>
            ))}
          </div>
        ) : null}
      </AdminPanel>
    </>
  );
}
