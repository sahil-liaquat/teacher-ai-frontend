"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, HandCoins } from "lucide-react";
import { backendApi, type AdminCommissionRow } from "@/lib/api";
import { AdminPanel, EmptyState, LoadingState, StatusPill, formatDateTime, formatInr } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";

export function SettlePayout({ influencerId, onSettled }: { influencerId: string; onSettled?: () => void }) {
  const client = useQueryClient();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [payoutReference, setPayoutReference] = useState("");
  const [note, setNote] = useState("");

  // Guard against cross-influencer state leak: if the caller switches
  // influencerId without unmounting (e.g. a dropdown, or Task 9's tab
  // switching), reset any in-flight selection/reference/note so a stale
  // commission id from the previous influencer can never ride along into
  // this influencer's payout-settlement call.
  useEffect(() => {
    setSelectedIds([]);
    setPayoutReference("");
    setNote("");
  }, [influencerId]);

  const pending = useQuery({
    queryKey: ["influencer-pending", influencerId],
    queryFn: () => backendApi.adminInfluencerCommissions(influencerId, { status: "pending", limit: 200 }),
  });
  const rows = pending.data?.items ?? [];
  const selectedTotal = useMemo(() => {
    const chosen = selectedIds.length ? rows.filter((r) => selectedIds.includes(r.id)) : rows;
    return chosen.reduce((sum, r) => sum + r.amount_inr, 0);
  }, [rows, selectedIds]);

  const settle = useMutation({
    mutationFn: () => backendApi.adminCreateInfluencerPayout(influencerId, {
      commission_ids: selectedIds.length ? selectedIds : null,
      payout_reference: payoutReference.trim(),
      note: note.trim() || null,
    }),
    onSuccess: (res) => {
      toast({ title: "Payout settled", description: `${formatInr(res.total_amount_cleared ?? res.amount_inr)} cleared.`, variant: "success" });
      setSelectedIds([]); setPayoutReference(""); setNote("");
      client.invalidateQueries({ queryKey: ["influencer-pending", influencerId] });
      client.invalidateQueries({ queryKey: ["admin-influencer", influencerId] });
      client.invalidateQueries({ queryKey: ["influencer-commissions", influencerId] });
      client.invalidateQueries({ queryKey: ["influencer-payouts", influencerId] });
      client.invalidateQueries({ queryKey: ["admin-influencer-overview"] });
      onSettled?.();
    },
    onError: (e) => toast({ title: "Could not settle payout", description: getErrorMessage(e, "Try again."), variant: "error" }),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
      <AdminPanel title="Pending commissions" description="Leave rows unselected to settle all pending." contentClassName="p-0">
        {pending.isLoading ? <div className="p-6"><LoadingState label="Loading pending commissions" /></div> : null}
        {!pending.isLoading && !rows.length ? <div className="p-6"><EmptyState title="No pending commissions" /></div> : null}
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>{["", "Referred user", "Amount", "Status", "Created"].map((h) => <th key={h} className="px-6 py-4 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row: AdminCommissionRow) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => setSelectedIds((c) => c.includes(row.id) ? c.filter((i) => i !== row.id) : [...c, row.id])}
                        aria-label={`Select commission ${row.id}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><HandCoins className="h-4 w-4" /></span>
                        <div>
                          <p className="font-semibold text-gray-900">{row.referred_user_name || "Unnamed user"}</p>
                          <p className="text-xs text-gray-500">{row.referred_user_email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatInr(row.amount_inr)}</td>
                    <td className="px-6 py-4"><StatusPill status="warning">{row.payment_status}</StatusPill></td>
                    <td className="px-6 py-4 text-gray-600">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminPanel>

      <AdminPanel title="Settle payout" description="Record the bank/UPI reference for this clearance.">
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Amount to clear</p>
            <p className="mt-1 text-3xl font-bold text-emerald-950">{formatInr(selectedTotal)}</p>
            <p className="mt-1 text-sm text-emerald-700">{selectedIds.length ? `${selectedIds.length} selected` : "All pending commissions"}</p>
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payout reference</span>
            <Input value={payoutReference} placeholder="BANK_TRF_102931" onChange={(e) => setPayoutReference(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Note (optional)</span>
            <Input value={note} placeholder="June commissions via bank transfer" onChange={(e) => setNote(e.target.value)} />
          </label>
          <Button className="w-full" disabled={settle.isPending || !payoutReference.trim() || !selectedTotal} onClick={() => settle.mutate()}>
            <CheckCircle2 className="h-4 w-4" />
            {settle.isPending ? "Settling..." : selectedIds.length ? "Settle selected" : "Settle all pending"}
          </Button>
        </div>
      </AdminPanel>
    </div>
  );
}
