"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  HandCoins,
  BadgeIndianRupee,
  Users,
  UserPlus,
  Gift,
  BadgeCheck,
  UserX
} from "lucide-react";
import { backendApi, type FunnelStage } from "@/lib/api";
import { AdminPageHeader, AdminPanel, MetricCard, EmptyState, LoadingState, StatusPill, formatDateTime, formatInr } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettlePayout } from "@/components/admin/settle-payout";

const PAGE = 25;
type Tab = "users" | "codes" | "commissions" | "payouts";
const STAGE_LABEL: Record<FunnelStage, string> = { paying: "Paying", churned: "Churned", on_free_access: "On free access" };
const STAGE_TONE: Record<FunnelStage, "success" | "warning" | "neutral"> = { paying: "success", churned: "warning", on_free_access: "neutral" };

export default function InfluencerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("users");

  const detail = useQuery({ queryKey: ["admin-influencer", id], queryFn: () => backendApi.adminInfluencerDetail(id) });
  const d = detail.data;

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/influencers" className="text-sm text-gray-500 hover:text-gray-900">← All influencers</Link>
      </div>
      <AdminPageHeader
        eyebrow="Influencer"
        title={d?.name ?? "Influencer"}
        description={d ? `${d.email}${d.phone ? ` · ${d.phone}` : ""} · joined ${formatDateTime(d.created_at ?? undefined)}` : "Loading…"}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Lifetime earned" value={d ? formatInr(d.money.lifetime_earned_inr) : "—"} tone="blue" icon={<Wallet className="h-5 w-5" />} />
        <MetricCard label="Pending owed" value={d ? formatInr(d.money.pending_owed_inr) : "—"} tone="amber" icon={<HandCoins className="h-5 w-5" />} />
        <MetricCard label="Paid out" value={d ? formatInr(d.money.paid_out_inr) : "—"} tone="green" icon={<BadgeIndianRupee className="h-5 w-5" />} />
        <MetricCard label="Paying / Signups" value={d ? `${d.funnel.paying} / ${d.funnel.signups}` : "—"} tone="slate" icon={<Users className="h-5 w-5" />} />
      </div>
      {d ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <MetricCard label="Signups" value={String(d.funnel.signups)} tone="slate" icon={<UserPlus className="h-5 w-5" />} />
          <MetricCard label="On free access" value={String(d.funnel.on_free_access)} tone="slate" icon={<Gift className="h-5 w-5" />} />
          <MetricCard label="Paying" value={String(d.funnel.paying)} tone="green" icon={<BadgeCheck className="h-5 w-5" />} />
          <MetricCard label="Churned" value={String(d.funnel.churned)} tone="rose" icon={<UserX className="h-5 w-5" />} />
        </div>
      ) : null}

      <div className="my-6 flex flex-wrap gap-2 border-b border-gray-100">
        {(["users", "codes", "commissions", "payouts"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
            {t === "users" ? "Referred users" : t}
          </button>
        ))}
      </div>

      {tab === "users" ? <ReferredUsersTab id={id} /> : null}
      {tab === "codes" ? <CodesTab id={id} /> : null}
      {tab === "commissions" ? <CommissionsTab id={id} /> : null}
      {tab === "payouts" ? <PayoutsTab id={id} /> : null}

      {tab === "commissions" || tab === "payouts" ? (
        <div className="mt-8">
          <AdminPageHeader eyebrow="Action" title="Settle payout" description="Clear pending commissions and record the reference." />
          <SettlePayout influencerId={id} />
        </div>
      ) : null}
    </>
  );
}

function Pager({ skip, total, setSkip }: { skip: number; total: number; setSkip: (n: number) => void }) {
  if (total <= PAGE) return null;
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
      <span>Showing {skip + 1}–{Math.min(skip + PAGE, total)} of {total}</span>
      <div className="flex gap-2">
        <Button variant="secondary" className="h-8" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE))}>Previous</Button>
        <Button variant="secondary" className="h-8" disabled={skip + PAGE >= total} onClick={() => setSkip(skip + PAGE)}>Next</Button>
      </div>
    </div>
  );
}

function ReferredUsersTab({ id }: { id: string }) {
  const [stage, setStage] = useState<"all" | FunnelStage>("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const users = useQuery({
    queryKey: ["influencer-referred", id, { stage, search, skip }],
    queryFn: () => backendApi.adminInfluencerReferredUsers(id, { stage: stage === "all" ? undefined : stage, q: search || undefined, skip, limit: PAGE }),
  });
  const data = users.data;
  return (
    <AdminPanel title="Referred teachers" contentClassName="p-0"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "on_free_access", "paying", "churned"] as const).map((s) => (
            <button key={s} onClick={() => { setStage(s); setSkip(0); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${stage === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : STAGE_LABEL[s]}
            </button>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); setSearch(q); setSkip(0); }}>
            <Input value={q} placeholder="Search" className="h-8 w-40" onChange={(e) => setQ(e.target.value)} />
          </form>
        </div>
      }
    >
      {users.isLoading ? <div className="p-6"><LoadingState label="Loading referred teachers" /></div> : null}
      {!users.isLoading && !data?.items.length ? <div className="p-6"><EmptyState title="No referred teachers in this view" /></div> : null}
      {data?.items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>{["Teacher", "Stage", "Code", "Plan", "Signed up", "Earned"].map((h) => <th key={h} className="px-4 py-4 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((u) => (
                <tr key={u.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{u.name || "Unnamed"}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <Link href={`/admin/activity?user_id=${u.user_id}`} className="text-xs text-blue-600 hover:underline">activity ↗</Link>
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusPill status={STAGE_TONE[u.stage]}>{STAGE_LABEL[u.stage]}</StatusPill></td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-600">{u.code_used || "-"}</td>
                  <td className="px-4 py-4 text-gray-600">{u.plan_code || "-"}</td>
                  <td className="px-4 py-4 text-gray-600">{formatDateTime(u.signed_up_at ?? undefined)}</td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{formatInr(u.earned_from_inr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Pager skip={skip} total={data?.total ?? 0} setSkip={setSkip} />
    </AdminPanel>
  );
}

function CodesTab({ id }: { id: string }) {
  const codes = useQuery({ queryKey: ["influencer-codes", id], queryFn: () => backendApi.adminPromoCodes({ influencer_id: id, limit: 100 }) });
  const [openCode, setOpenCode] = useState<string | null>(null);
  return (
    <AdminPanel title="Referral codes" description="Codes linked to this influencer." contentClassName="p-0"
      actions={<Link href="/admin/billing" className="text-sm text-blue-600 hover:underline">Create code ↗</Link>}>
      {codes.isLoading ? <div className="p-6"><LoadingState label="Loading codes" /></div> : null}
      {!codes.isLoading && !codes.data?.length ? <div className="p-6"><EmptyState title="No codes linked" description="Link one from Billing → Coupons & grants." /></div> : null}
      {codes.data?.length ? (
        <div className="divide-y divide-gray-100">
          {codes.data.map((c) => (
            <div key={c.id} className="p-4">
              <button onClick={() => setOpenCode(openCode === c.id ? null : c.id)} className="flex w-full items-center justify-between text-left">
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-900">{c.code}</p>
                  <p className="text-xs text-gray-500">{c.kind}{c.duration_days ? ` · ${c.duration_days}d` : ""} · used {c.times_redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}</p>
                </div>
                <StatusPill status={c.is_active ? "success" : "neutral"}>{c.is_active ? "active" : "inactive"}</StatusPill>
              </button>
              {openCode === c.id ? <CodeRedemptions codeId={c.id} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </AdminPanel>
  );
}

function CodeRedemptions({ codeId }: { codeId: string }) {
  const reds = useQuery({ queryKey: ["promo-redemptions", codeId], queryFn: () => backendApi.adminPromoRedemptions(codeId) });
  if (reds.isLoading) return <div className="mt-3"><LoadingState label="Loading redemptions" /></div>;
  if (!reds.data?.length) return <p className="mt-3 text-xs text-gray-500">No redemptions yet.</p>;
  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
      {reds.data.map((r) => (
        <div key={r.user_id} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-700">{r.user_id}</span>
            <Link href={`/admin/activity?user_id=${r.user_id}`} className="text-blue-600 hover:underline">activity ↗</Link>
          </div>
          <span className="text-gray-500">{formatDateTime(r.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

function CommissionsTab({ id }: { id: string }) {
  const [status, setStatus] = useState<"" | "pending" | "paid">("");
  const [skip, setSkip] = useState(0);
  const commissions = useQuery({
    queryKey: ["influencer-commissions", id, { status, skip }],
    queryFn: () => backendApi.adminInfluencerCommissions(id, { status: status || undefined, skip, limit: PAGE }),
  });
  const data = commissions.data;
  return (
    <AdminPanel title="Commission ledger" description="Every recurring commission — one per charge." contentClassName="p-0"
      actions={
        <div className="flex gap-2">
          {(["", "pending", "paid"] as const).map((s) => (
            <button key={s || "all"} onClick={() => { setStatus(s); setSkip(0); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${status === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "" ? "All" : s}
            </button>
          ))}
        </div>
      }>
      {commissions.isLoading ? <div className="p-6"><LoadingState label="Loading commissions" /></div> : null}
      {!commissions.isLoading && !data?.items.length ? <div className="p-6"><EmptyState title="No commissions" /></div> : null}
      {data?.items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>{["Date", "Referred teacher", "Plan", "Amount", "Status", "Payout ref"].map((h) => <th key={h} className="px-4 py-4 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-gray-600">{formatDateTime(c.created_at)}</td>
                  <td className="px-4 py-4"><p className="font-semibold text-gray-900">{c.referred_user_name || "Unnamed"}</p><p className="text-xs text-gray-500">{c.referred_user_email || "-"}</p></td>
                  <td className="px-4 py-4 text-gray-600">{c.plan_code || "-"}</td>
                  <td className="px-4 py-4 font-semibold text-gray-900">{formatInr(c.amount_inr)}</td>
                  <td className="px-4 py-4"><StatusPill status={c.payment_status === "paid" ? "success" : "warning"}>{c.payment_status}</StatusPill></td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-500">{c.payout_reference || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Pager skip={skip} total={data?.total ?? 0} setSkip={setSkip} />
    </AdminPanel>
  );
}

function PayoutsTab({ id }: { id: string }) {
  const [skip, setSkip] = useState(0);
  const [openPayout, setOpenPayout] = useState<string | null>(null);
  const payouts = useQuery({
    queryKey: ["influencer-payouts", id, { skip }],
    queryFn: () => backendApi.adminInfluencerPayouts(id, { skip, limit: PAGE }),
  });
  const data = payouts.data;
  return (
    <AdminPanel title="Payout history" contentClassName="p-0">
      {payouts.isLoading ? <div className="p-6"><LoadingState label="Loading payouts" /></div> : null}
      {!payouts.isLoading && !data?.items.length ? <div className="p-6"><EmptyState title="No payouts yet" /></div> : null}
      {data?.items.length ? (
        <div className="divide-y divide-gray-100">
          {data.items.map((p) => (
            <div key={p.id} className="p-4">
              <button onClick={() => setOpenPayout(openPayout === p.id ? null : p.id)} className="flex w-full items-center justify-between text-left">
                <div>
                  <p className="font-mono text-sm font-semibold text-gray-900">{p.payout_reference}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(p.created_at)}</p>
                </div>
                <p className="font-bold text-gray-900">{formatInr(p.amount_inr)}</p>
              </button>
              {openPayout === p.id ? <PayoutCommissions payoutId={p.id} /> : null}
            </div>
          ))}
        </div>
      ) : null}
      <Pager skip={skip} total={data?.total ?? 0} setSkip={setSkip} />
    </AdminPanel>
  );
}

function PayoutCommissions({ payoutId }: { payoutId: string }) {
  const comms = useQuery({ queryKey: ["payout-commissions", payoutId], queryFn: () => backendApi.adminPayoutCommissions(payoutId) });
  if (comms.isLoading) return <div className="mt-3"><LoadingState label="Loading" /></div>;
  if (!comms.data?.length) return <p className="mt-3 text-xs text-gray-500">No commissions linked.</p>;
  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
      {comms.data.map((c) => (
        <div key={c.id} className="flex items-center justify-between py-1">
          <span className="text-gray-700">{c.referred_user_name || c.referred_user_email || "Unnamed"}</span>
          <span className="font-semibold text-gray-900">{formatInr(c.amount_inr)}</span>
        </div>
      ))}
    </div>
  );
}
