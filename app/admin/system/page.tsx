"use client";

import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSystemPage() {
  const status = useQuery({ queryKey: ["system-status"], queryFn: () => backendApi.health() });
  const checks = ["backend_api"];
  return (
    <div>
      <PageHeader title="System status" description="Shows backend API health from the current health endpoint. Database, vector store, file storage, AI provider, and logs are not exposed here yet." />
      <div className="grid gap-3 md:grid-cols-3">
        {checks.map((key) => <Card key={key}><CardContent className="pt-5"><p className="text-sm capitalize text-muted-foreground">{key.replaceAll("_", " ")}</p><Badge className="mt-3 bg-[#eef8f1] text-[#166534]">{status.data?.status || "checking"}</Badge></CardContent></Card>)}
      </div>
      <Card className="mt-4"><CardHeader><CardTitle>Backend details</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm"><p>Version: {status.data?.version || "-"}</p>{status.error ? <p className="text-red-700">{status.error instanceof Error ? status.error.message : "Health check failed"}</p> : null}</CardContent></Card>
    </div>
  );
}
