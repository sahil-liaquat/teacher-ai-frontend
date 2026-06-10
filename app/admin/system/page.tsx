"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Clock3, Cpu, Database, RefreshCw, Server, ShieldAlert } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, HealthIndicator, MetricCard, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

export default function AdminSystemPage() {
  const status = useQuery({ queryKey: ["system-status"], queryFn: () => backendApi.health() });
  const healthy = status.data?.status === "ok";

  return (
    <>
      <AdminPageHeader
        eyebrow="Platform health"
        title="System Status"
        description="Monitor backend API health and system status."
        meta={<HealthIndicator status={status.data?.status} />}
        actions={
          <Button variant="outline" onClick={() => status.refetch()} disabled={status.isFetching}>
            <RefreshCw className={cn(status.isFetching ? "animate-spin" : "")} />
            {status.isFetching ? "Checking..." : "Refresh"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard 
          label="Backend API" 
          value={status.data?.status || "checking"} 
          detail="Health endpoint" 
          tone={healthy ? "green" : "amber"} 
          icon={<Server className="h-5 w-5" />} 
        />
        <MetricCard 
          label="Version" 
          value={status.data?.version || "-"} 
          detail="API version" 
          tone="blue" 
          icon={<Cpu className="h-5 w-5" />} 
        />
        <MetricCard 
          label="Last Checked" 
          value={formatDateTime(new Date().toISOString()).split(",").pop()?.trim() || "now"} 
          detail="Current session" 
          tone="slate" 
          icon={<Clock3 className="h-5 w-5" />} 
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HealthTile 
          title="Backend API" 
          detail="HTTP health route" 
          status={status.data?.status || "checking"} 
          icon={<Activity className="h-5 w-5" />} 
          healthy={healthy} 
        />
        <HealthTile 
          title="Database" 
          detail="Not exposed by API" 
          status="not exposed" 
          icon={<Database className="h-5 w-5" />} 
          healthy={undefined} 
        />
        <HealthTile 
          title="AI Provider" 
          detail="Not exposed by API" 
          status="not exposed" 
          icon={<Cpu className="h-5 w-5" />} 
          healthy={undefined} 
        />
        <HealthTile 
          title="Storage" 
          detail="Not exposed by API" 
          status="not exposed" 
          icon={<Server className="h-5 w-5" />} 
          healthy={undefined} 
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Backend Details</h2>
          <p className="mt-0.5 text-sm text-gray-500">Raw values from the health endpoint.</p>
        </div>
        <div className="p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Status" value={status.data?.status || "-"} />
            <Detail label="Version" value={status.data?.version || "-"} />
            <Detail label="Request State" value={status.isFetching ? "fetching" : "idle"} />
            <Detail label="Error" value={status.error ? getErrorMessage(status.error, "Unavailable") : "-"} danger={Boolean(status.error)} />
          </dl>
        </div>
      </div>
    </>
  );
}

function HealthTile({ title, detail, status, icon, healthy }: { title: string; detail: string; status: string; icon: React.ReactNode; healthy?: boolean }) {
  const tone = healthy === undefined ? "neutral" : healthy ? "success" : "danger";
  const toneClasses = {
    success: "border-emerald-200 bg-emerald-50",
    danger: "border-rose-200 bg-rose-50",
    neutral: "border-gray-200 bg-gray-50"
  };
  const iconBg = {
    success: "bg-emerald-100 text-emerald-600",
    danger: "bg-rose-100 text-rose-600",
    neutral: "bg-gray-100 text-gray-600"
  };

  return (
    <div className={cn("rounded-xl border p-5", toneClasses[tone])}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg[tone])}>{icon}</span>
        <StatusPill status={tone === "success" ? "success" : tone === "danger" ? "danger" : "neutral"}>{status}</StatusPill>
      </div>
      <p className="mt-4 font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{detail}</p>
      <div className="mt-4">
        {healthy === true ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Operational
          </span>
        ) : healthy === false ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-rose-700">
            <ShieldAlert className="h-4 w-4" /> Issue detected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
            <Clock3 className="h-4 w-4" /> Unknown
          </span>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className={cn("mt-2 break-words text-sm font-semibold", danger ? "text-rose-700" : "text-gray-900")}>{value}</dd>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}