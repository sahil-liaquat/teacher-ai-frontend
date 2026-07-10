"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
import { backendApi, type CommissionOut } from "@/lib/api";
import { EmptyState, LoadingState, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Input } from "@/components/ui/input";

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

export default function CommissionsClient() {
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
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Commission"
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
      <section className="overflow-hidden rounded-[18px] border border-white/70 bg-gradient-to-br from-white via-emerald-50/35 to-white shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        <div className="flex flex-col gap-3 border-b border-white/70 bg-gradient-to-br from-emerald-50/70 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-teachpad-ink">Commissions</h2>
            <p className="mt-1 text-sm font-medium text-teachpad-muted">Review commission earned from referred paid subscribers.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="h-10 rounded-xl border border-teachpad-cardBorder bg-white/90 px-3 text-sm font-semibold text-teachpad-ink shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-teachpad-cardBorder bg-white/90 px-3 shadow-sm backdrop-blur-sm transition-all hover:border-blue-200 hover:bg-white">
              <Search className="h-4 w-4 text-teachpad-muted" />
              <Input className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0" placeholder="Search ledger" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
        </div>
        {commissions.isLoading ? <div className="p-6"><LoadingState label="Loading commissions" /></div> : null}
        {!commissions.isLoading && !rows.length ? <div className="p-6"><EmptyState title="No commissions found" description="Try changing the filter or search term." /></div> : null}
        {rows.length ? <CommissionTable rows={rows} /> : null}
      </section>
    </div>
  );
}

function CommissionTable({ rows }: { rows: CommissionOut[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/70 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500">
          <tr>{["Referred User", "Amount", "Status", "Created", "Notes"].map((heading) => <th key={heading} className="px-6 py-4 font-semibold">{heading}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-slate-50/70">
              <td className="px-6 py-4">
                <p className="font-semibold text-slate-900">{row.referred_user_name || "Unnamed user"}</p>
                <p className="mt-0.5 text-xs text-slate-500">{row.referred_user_email || "-"}</p>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-900">{formatInr(row.amount_inr)}</td>
              <td className="px-6 py-4"><StatusPill status={row.payment_status === "paid" ? "success" : "warning"}>{row.payment_status}</StatusPill></td>
              <td className="px-6 py-4 text-slate-600">{formatDateTime(row.created_at)}</td>
              <td className="max-w-md px-6 py-4 text-slate-600">{row.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
