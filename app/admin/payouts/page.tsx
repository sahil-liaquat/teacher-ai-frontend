"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, HandCoins, ReceiptText } from "lucide-react";
import { backendApi, type CommissionOut } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function AdminPayoutsPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [payoutReference, setPayoutReference] = useState("");
  const [note, setNote] = useState("");

  const influencers = useQuery({ queryKey: ["admin-influencers"], queryFn: () => backendApi.adminInfluencers() });
  const pending = useQuery({
    queryKey: ["admin-commissions", selectedInfluencerId, "pending"],
    queryFn: () => backendApi.adminCommissions({ influencer_id: selectedInfluencerId, payment_status: "pending" }),
    enabled: Boolean(selectedInfluencerId)
  });
  const payouts = useQuery({
    queryKey: ["admin-payouts", selectedInfluencerId || "all"],
    queryFn: () => backendApi.adminPayouts(selectedInfluencerId || undefined)
  });
  const selectedTotal = useMemo(() => {
    const rows = pending.data || [];
    const selected = selectedCommissionIds.length ? rows.filter((row) => selectedCommissionIds.includes(row.id)) : rows;
    return selected.reduce((sum, row) => sum + row.amount_inr, 0);
  }, [pending.data, selectedCommissionIds]);

  const settle = useMutation({
    mutationFn: () => backendApi.adminCreateInfluencerPayout(selectedInfluencerId, {
      commission_ids: selectedCommissionIds.length ? selectedCommissionIds : null,
      payout_reference: payoutReference.trim(),
      note: note.trim() || null
    }),
    onSuccess: (res) => {
      toast({ title: "Payout settled", description: `${formatInr(res.total_amount_cleared ?? res.amount_inr)} cleared.`, variant: "success" });
      setSelectedCommissionIds([]);
      setPayoutReference("");
      setNote("");
      client.invalidateQueries({ queryKey: ["admin-commissions"] });
      client.invalidateQueries({ queryKey: ["admin-payouts"] });
      client.invalidateQueries({ queryKey: ["influencer-dashboard"] });
    },
    onError: (e) => toast({ title: "Could not settle payout", description: getErrorMessage(e, "Try again."), variant: "error" })
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
            setSelectedCommissionIds([]);
          }}
        >
          <option value="">Select influencer</option>
          {(influencers.data || []).map((influencer) => (
            <option key={influencer.id} value={influencer.id}>{influencer.name}</option>
          ))}
        </select>
      </AdminPanel>

      {selectedInfluencerId ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <AdminPanel title="Pending commissions" description="Leave rows unselected to settle all pending commissions." contentClassName="p-0">
            {pending.isLoading ? <div className="p-6"><LoadingState label="Loading pending commissions" /></div> : null}
            {!pending.isLoading && !pending.data?.length ? <div className="p-6"><EmptyState title="No pending commissions" description="This influencer has no unpaid commission rows." /></div> : null}
            {pending.data?.length ? (
              <PendingCommissionTable
                rows={pending.data}
                selectedIds={selectedCommissionIds}
                onToggle={(id) => setSelectedCommissionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
              />
            ) : null}
          </AdminPanel>

          <div className="space-y-6">
            <AdminPanel title="Settle payout" description="Record the bank/UPI/reference ID used for this clearance.">
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Amount to clear</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-950">{formatInr(selectedTotal)}</p>
                  <p className="mt-1 text-sm text-emerald-700">{selectedCommissionIds.length ? `${selectedCommissionIds.length} selected commissions` : "All pending commissions"}</p>
                </div>
                <Field label="Payout reference">
                  <Input value={payoutReference} placeholder="BANK_TRF_102931" onChange={(event) => setPayoutReference(event.target.value)} />
                </Field>
                <Field label="Note (optional)">
                  <Input value={note} placeholder="June commissions paid via bank transfer" onChange={(event) => setNote(event.target.value)} />
                </Field>
                <Button className="w-full" disabled={settle.isPending || !payoutReference.trim() || !selectedTotal} onClick={() => settle.mutate()}>
                  <CheckCircle2 className="h-4 w-4" />
                  {settle.isPending ? "Settling..." : selectedCommissionIds.length ? "Settle selected" : "Settle all pending"}
                </Button>
              </div>
            </AdminPanel>

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
        </div>
      ) : (
        <AdminPanel>
          <EmptyState title="Select an influencer" description="Pending commissions and payout history will load after selection." />
        </AdminPanel>
      )}
    </>
  );
}

function PendingCommissionTable({ rows, selectedIds, onToggle }: { rows: CommissionOut[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
          <tr>{["", "Referred User", "Amount", "Status", "Created", "Notes"].map((heading) => <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600" checked={selectedIds.includes(row.id)} onChange={() => onToggle(row.id)} aria-label={`Select commission ${row.id}`} />
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
              <td className="max-w-md px-6 py-4 text-gray-600">{row.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  );
}
