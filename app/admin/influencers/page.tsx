"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Users, BadgeIndianRupee, HandCoins } from "lucide-react";
import { backendApi, type InfluencerOverviewRow } from "@/lib/api";
import { AdminPageHeader, AdminPanel, MetricCard, EmptyState, LoadingState, formatInr } from "@/components/admin/admin-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAGE = 25;
type Sort = "pending_owed" | "lifetime_earned" | "paid_out" | "signups" | "paying" | "churned" | "name";

const COLUMNS: { key: Sort | "on_free_access"; label: string; sortable: boolean; numeric: boolean }[] = [
  { key: "name", label: "Influencer", sortable: true, numeric: false },
  { key: "signups", label: "Signups", sortable: true, numeric: true },
  { key: "on_free_access", label: "On free", sortable: false, numeric: true },
  { key: "paying", label: "Paying", sortable: true, numeric: true },
  { key: "churned", label: "Churned", sortable: true, numeric: true },
  { key: "lifetime_earned", label: "Earned", sortable: true, numeric: true },
  { key: "pending_owed", label: "Pending", sortable: true, numeric: true },
  { key: "paid_out", label: "Paid out", sortable: true, numeric: true },
];

export default function AdminInfluencersPage() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("pending_owed");
  const [skip, setSkip] = useState(0);

  const overview = useQuery({
    queryKey: ["admin-influencer-overview", { search, sort, skip }],
    queryFn: () => backendApi.adminInfluencerOverview({ q: search || undefined, sort, order: "desc", skip, limit: PAGE }),
  });
  const data = overview.data;
  const totals = data?.totals;

  const onSort = (key: Sort) => { setSort(key); setSkip(0); };

  return (
    <>
      <AdminPageHeader
        eyebrow="Growth"
        title="Influencers"
        description="Who brought how many teachers, and how much commission they've earned."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Influencers" value={totals ? String(totals.influencers) : "—"} tone="blue" icon={<Megaphone className="h-5 w-5" />} />
        <MetricCard label="Teachers referred" value={totals ? String(totals.referred) : "—"} tone="slate" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Paying now" value={totals ? String(totals.paying) : "—"} tone="green" icon={<BadgeIndianRupee className="h-5 w-5" />} />
        <MetricCard label="Pending owed" value={totals ? formatInr(totals.pending_owed_inr) : "—"} tone="amber" icon={<HandCoins className="h-5 w-5" />} />
      </div>

      <AdminPanel
        title="All influencers"
        description="Click a row to drill into their referred teachers, codes, commissions and payouts."
        contentClassName="p-0"
        actions={
          <form onSubmit={(e) => { e.preventDefault(); setSearch(q); setSkip(0); }} className="flex gap-2">
            <Input value={q} placeholder="Search name or email" onChange={(e) => setQ(e.target.value)} className="h-9 w-56" />
            <Button type="submit" variant="secondary" className="h-9">Search</Button>
          </form>
        }
      >
        {overview.isLoading ? <div className="p-6"><LoadingState label="Loading influencers" /></div> : null}
        {!overview.isLoading && !data?.items.length ? <div className="p-6"><EmptyState title="No influencers" description="Promote a user to influencer from the Users page, then link them a code in Billing." /></div> : null}
        {data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className={`px-4 py-4 font-semibold ${c.numeric ? "text-right" : ""}`}>
                      {c.sortable ? (
                        <button onClick={() => onSort(c.key as Sort)} className={`hover:text-gray-900 ${sort === c.key ? "text-gray-900 underline" : ""}`}>{c.label}</button>
                      ) : c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((row: InfluencerOverviewRow) => (
                  <tr key={row.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <Link href={`/admin/influencers/${row.id}`} className="block">
                        <p className="font-semibold text-gray-900">{row.name}</p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900">{row.signups}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{row.on_free_access}</td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-700">{row.paying}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{row.churned}</td>
                    <td className="px-4 py-4 text-right text-gray-900">{formatInr(row.lifetime_earned_inr)}</td>
                    <td className="px-4 py-4 text-right font-semibold text-amber-700">{formatInr(row.pending_owed_inr)}</td>
                    <td className="px-4 py-4 text-right text-gray-600">{formatInr(row.paid_out_inr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {data && data.total > PAGE ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <span>Showing {skip + 1}–{Math.min(skip + PAGE, data.total)} of {data.total}</span>
            <div className="flex gap-2">
              <Button variant="secondary" className="h-8" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE))}>Previous</Button>
              <Button variant="secondary" className="h-8" disabled={skip + PAGE >= data.total} onClick={() => setSkip(skip + PAGE)}>Next</Button>
            </div>
          </div>
        ) : null}
      </AdminPanel>
    </>
  );
}
