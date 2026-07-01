"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { backendApi, type CommissionOut } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Input } from "@/components/ui/input";

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function InfluencerCommissionsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [search, setSearch] = useState("");
  const commissions = useQuery({ queryKey: ["influencer-commissions"], queryFn: () => backendApi.influencerCommissions() });
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
    <>
      <AdminPageHeader eyebrow="Influencer portal" title="Commission Ledger" description="Review commission earned from referred paid subscribers." />
      <AdminPanel
        title="Commissions"
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <Input className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0" placeholder="Search ledger" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
        }
        contentClassName="p-0"
      >
        {commissions.isLoading ? <div className="p-6"><LoadingState label="Loading commissions" /></div> : null}
        {!commissions.isLoading && !rows.length ? <div className="p-6"><EmptyState title="No commissions found" description="Try changing the filter or search term." /></div> : null}
        {rows.length ? <CommissionTable rows={rows} /> : null}
      </AdminPanel>
    </>
  );
}

function CommissionTable({ rows }: { rows: CommissionOut[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
          <tr>{["Referred User", "Amount", "Status", "Created", "Notes"].map((heading) => <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <p className="font-semibold text-gray-900">{row.referred_user_name || "Unnamed user"}</p>
                <p className="mt-0.5 text-xs text-gray-500">{row.referred_user_email || "-"}</p>
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">{formatInr(row.amount_inr)}</td>
              <td className="px-6 py-4"><StatusPill status={row.payment_status === "paid" ? "success" : "warning"}>{row.payment_status}</StatusPill></td>
              <td className="px-6 py-4 text-gray-600">{formatDateTime(row.created_at)}</td>
              <td className="max-w-md px-6 py-4 text-gray-600">{row.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
