"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSystemPage() {
  const status = useQuery({ queryKey: ["system-status"], queryFn: () => apiFetch<any>("/admin/system/status") });
  const checks = ["backend_api", "database", "vector_database", "file_storage", "ai_provider"];
  return (
    <div>
      <PageHeader title="System status" description="Backend, database, vector store, file storage, AI provider, and latest logs." />
      <div className="grid gap-3 md:grid-cols-5">
        {checks.map((key) => <Card key={key}><CardContent className="pt-5"><p className="text-sm capitalize text-muted-foreground">{key.replaceAll("_", " ")}</p><Badge className="mt-3 bg-[#eef8f1] text-[#166534]">{status.data?.[key] || "ok"}</Badge></CardContent></Card>)}
      </div>
      <Card className="mt-4"><CardHeader><CardTitle>Latest logs</CardTitle></CardHeader><CardContent className="grid gap-2">{status.data?.latest_logs?.map((log: any) => <div key={log.id} className="flex justify-between rounded-lg border border-border p-3 text-sm"><span>{log.module}: {log.action}</span><span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span></div>)}</CardContent></Card>
    </div>
  );
}
