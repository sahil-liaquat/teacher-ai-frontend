"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock3, Cpu, Database, Server, ShieldAlert } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, HealthIndicator, MetricCard, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";

export default function AdminSystemPage() {
  const status = useQuery({ queryKey: ["system-status"], queryFn: () => backendApi.health() });
  const healthy = status.data?.status === "ok";

  return (
    <>
      <AdminPageHeader
        eyebrow="Platform health"
        title="System"
        description="Live operational status exposed by the current backend health endpoint."
        meta={<HealthIndicator status={status.data?.status} />}
        actions={<Button variant="outline" onClick={() => status.refetch()} disabled={status.isFetching}>{status.isFetching ? "Checking" : "Refresh"}</Button>}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Backend API" value={status.data?.status || "checking"} detail="Health endpoint" tone={healthy ? "green" : "amber"} icon={<Server className="h-5 w-5" />} />
        <MetricCard label="Version" value={status.data?.version || "-"} detail="Reported by API" tone="blue" icon={<Cpu className="h-5 w-5" />} />
        <MetricCard label="Last checked" value={formatDateTime(new Date().toISOString()).split(",").slice(-1)[0]?.trim() || "now"} detail="Current browser session" tone="slate" icon={<Clock3 className="h-5 w-5" />} />
      </div>

      <AdminPanel title="Service checks" description="Only checks exposed by the existing backend are shown.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CheckTile title="Backend API" detail="HTTP health route" status={status.data?.status || "checking"} icon={<Activity className="h-5 w-5" />} healthy={healthy} />
          <CheckTile title="Database" detail="Not exposed by current API" status="not exposed" icon={<Database className="h-5 w-5" />} healthy={undefined} />
          <CheckTile title="AI provider" detail="Not exposed by current API" status="not exposed" icon={<Cpu className="h-5 w-5" />} healthy={undefined} />
          <CheckTile title="Storage" detail="Not exposed by current API" status="not exposed" icon={<Server className="h-5 w-5" />} healthy={undefined} />
        </div>
      </AdminPanel>

      <AdminPanel title="Backend details" description="Raw values returned by the health endpoint.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Status" value={status.data?.status || "-"} />
          <Detail label="Version" value={status.data?.version || "-"} />
          <Detail label="Request state" value={status.isFetching ? "fetching" : "idle"} />
          <Detail label="Error" value={status.error instanceof Error ? status.error.message : "-"} danger={Boolean(status.error)} />
        </dl>
      </AdminPanel>
    </>
  );
}

function CheckTile({ title, detail, status, icon, healthy }: { title: string; detail: string; status: string; icon: React.ReactNode; healthy?: boolean }) {
  const tone = healthy === undefined ? "neutral" : healthy ? "success" : "danger";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">{icon}</span>
        <StatusPill status={tone}>{status}</StatusPill>
      </div>
      <p className="mt-4 font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
      <div className="mt-4 text-slate-500">
        {healthy ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : healthy === false ? <ShieldAlert className="h-5 w-5 text-rose-600" /> : <Clock3 className="h-5 w-5" />}
      </div>
    </div>
  );
}

function Detail({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className={`mt-2 break-words text-sm font-bold ${danger ? "text-rose-700" : "text-slate-950"}`}>{value}</dd>
    </div>
  );
}
