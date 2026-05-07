"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminGenerationDetailPage() {
  const params = useParams<{ id: string }>();
  const generation = useQuery({ queryKey: ["admin-generation", params.id], queryFn: () => apiFetch<any>(`/admin/generations/${params.id}`) });
  const data = generation.data;
  return (
    <div>
      <PageHeader title={`Generation #${params.id}`} description="Debug input, retrieval, prompt summary, output, model, usage, latency, and status." />
      <div className="grid gap-4 lg:grid-cols-2">
        <JsonCard title="User input" value={data?.input_json} />
        <Card><CardHeader><CardTitle>Selected book/chapter</CardTitle></CardHeader><CardContent className="text-sm"><p>Book ID: {data?.book_id}</p><p>Chapter ID: {data?.chapter_id}</p><p>Status: {data?.status}</p><p>Latency: {data?.latency_ms} ms</p><p>Model: {data?.model_used}</p><p>Token usage: placeholder</p></CardContent></Card>
        <JsonCard title="Retrieved textbook chunks" value={data?.retrieved_chunks_json} />
        <JsonCard title="AI prompt summary" value={{ grounding: "Use only selected textbook chunks", provider: data?.model_used, insufficient_rule: "Return insufficient content sentence" }} />
        <JsonCard title="Generated output" value={data?.output_json} />
      </div>
    </div>
  );
}

function JsonCard({ title, value }: { title: string; value: any }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-[#fafcff] p-3 text-xs">{JSON.stringify(value || {}, null, 2)}</pre></CardContent></Card>;
}
