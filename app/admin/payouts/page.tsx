"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, formatDateTime, formatInr } from "@/components/admin/admin-ui";
import { SettlePayout } from "@/components/admin/settle-payout";

export default function AdminPayoutsPage() {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");

  const influencers = useQuery({ queryKey: ["admin-influencers"], queryFn: () => backendApi.adminInfluencers() });
  const payouts = useQuery({
    queryKey: ["admin-payouts", selectedInfluencerId || "all"],
    queryFn: () => backendApi.adminPayouts(selectedInfluencerId || undefined)
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Payout clearance"
        title="Influencer payouts"
        description="Review pending commissions and record payout clearance references."
      />

      <AdminPanel title="Select influencer" description="Choose an influencer to review pending commissions and payout history.">
        <select
          className="h-10 w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 text-sm"
          value={selectedInfluencerId}
          onChange={(event) => {
            setSelectedInfluencerId(event.target.value);
          }}
        >
          <option value="">Select influencer</option>
          {(influencers.data || []).map((influencer) => (
            <option key={influencer.id} value={influencer.id}>{influencer.name}</option>
          ))}
        </select>
      </AdminPanel>

      {selectedInfluencerId ? (
        <div className="space-y-6">
          <SettlePayout influencerId={selectedInfluencerId} />

          <AdminPanel title="Payout history" contentClassName="p-0">
            {payouts.isLoading ? <div className="p-6"><LoadingState label="Loading payouts" /></div> : null}
            {!payouts.isLoading && !payouts.data?.length ? <div className="p-6"><EmptyState title="No payout history" /></div> : null}
            {payouts.data?.length ? (
              <div className="divide-y divide-gray-100">
                {payouts.data.map((payout) => (
                  <div key={payout.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-gray-900">{payout.payout_reference}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDateTime(payout.created_at)}</p>
                    </div>
                    <p className="shrink-0 font-bold text-gray-900">{formatInr(payout.amount_inr)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </AdminPanel>
        </div>
      ) : (
        <AdminPanel>
          <EmptyState title="Select an influencer" description="Pending commissions and payout history will load after selection." />
        </AdminPanel>
      )}
    </>
  );
}
