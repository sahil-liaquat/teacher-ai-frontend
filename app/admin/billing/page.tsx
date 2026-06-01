"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { backendApi, type PromoCodeCreatePayload, type PromoCodeOut, type PromoKind } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, StatusPill, formatDate } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const KINDS: PromoKind[] = ["trial", "comp", "discount"];

export default function AdminBillingPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const codes = useQuery({ queryKey: ["admin-promo-codes"], queryFn: () => backendApi.adminPromoCodes() });

  const [form, setForm] = useState<PromoCodeCreatePayload>({ kind: "comp", duration_days: 30 });

  const create = useMutation({
    mutationFn: () => backendApi.adminCreatePromoCode(form),
    onSuccess: (created) => {
      toast({ title: "Code created", description: created.code });
      setForm({ kind: "comp", duration_days: 30 });
      client.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    },
    onError: (e) => toast({ title: "Could not create code", description: e instanceof Error ? e.message : "Try again." })
  });

  const toggle = useMutation({
    mutationFn: (c: PromoCodeOut) => backendApi.adminSetPromoActive(c.id, !c.is_active),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin-promo-codes"] })
  });

  const isDiscount = form.kind === "discount";

  return (
    <>
      <AdminPageHeader
        eyebrow="Billing"
        title="Coupons & grants"
        description="Create promo codes teachers can use at signup or redeem in-app, and see how often each is used."
      />

      <AdminPanel title="Create a code" description="Trial / comp codes give free days; discount codes lower a paid plan at checkout.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Kind">
            <select
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as PromoKind }))}
            >
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          {isDiscount ? (
            <Field label="Target plan code">
              <Input value={form.target_plan_code ?? ""} placeholder="pro_monthly"
                onChange={(e) => setForm((f) => ({ ...f, target_plan_code: e.target.value }))} />
            </Field>
          ) : (
            <Field label="Duration (days)">
              <Input type="number" min={1} value={form.duration_days ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, duration_days: Number(e.target.value) }))} />
            </Field>
          )}
          <Field label="Custom code (optional)">
            <Input value={form.code ?? ""} placeholder="auto-generated"
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value || null }))} />
          </Field>
          <Field label="Max redemptions (optional)">
            <Input type="number" min={1} value={form.max_redemptions ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, max_redemptions: e.target.value ? Number(e.target.value) : null }))} />
          </Field>
          <Field label="Expires at (optional)">
            <Input type="date"
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
          </Field>
          <Field label="Note (optional)">
            <Input value={form.note ?? ""} placeholder="Diwali campaign"
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-4">
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <Plus className="h-4 w-4" /> {create.isPending ? "Creating..." : "Create code"}
          </Button>
        </div>
      </AdminPanel>

      <AdminPanel title="Promo codes" contentClassName="p-0">
        {codes.isLoading ? <div className="p-6"><LoadingState label="Loading codes" /></div> : null}
        {!codes.isLoading && !codes.data?.length ? (
          <div className="p-6"><EmptyState title="No codes yet" description="Create your first coupon above." /></div>
        ) : null}
        {codes.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>{["Code", "Kind", "Value", "Used", "Expires", "Status", ""].map((h) => (
                  <th key={h} className="px-6 py-4 font-semibold">{h}</th>))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.data.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-semibold text-gray-900">{c.code}</td>
                    <td className="px-6 py-4">{c.kind}</td>
                    <td className="px-6 py-4 text-gray-600">{c.kind === "discount" ? (c.target_plan_code ?? "-") : `${c.duration_days ?? 0} days`}</td>
                    <td className="px-6 py-4 text-gray-600">{c.times_redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(c.expires_at ?? undefined)}</td>
                    <td className="px-6 py-4"><StatusPill status={c.is_active ? "success" : "neutral"}>{c.is_active ? "active" : "off"}</StatusPill></td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(c)}>
                        {c.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        {c.is_active ? "Disable" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminPanel>
    </>
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
