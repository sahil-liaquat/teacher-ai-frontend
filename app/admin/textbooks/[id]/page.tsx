"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBookDetailPage() {
  const params = useParams<{ id: string }>();
  const book = useQuery({ queryKey: ["admin-book", params.id], queryFn: () => apiFetch<any>(`/admin/books/${params.id}`) });
  const data = book.data;
  return (
    <div>
      <PageHeader title={data?.title || "Book detail"} description="Metadata, chapters, chunks, indexing status, errors, and usage." />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm"><p>Board: {data?.board}</p><p>Class: {data?.class_name}</p><p>Subject: {data?.subject}</p><p>Status: <Badge>{data?.status}</Badge></p><p>Chunks: {data?.chunks_count}</p><p>Usage: {data?.usage_count}</p><p>Errors: {data?.error_message || "None"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Chapters</CardTitle></CardHeader><CardContent className="grid gap-2">{data?.chapters?.map((chapter: any) => <div key={chapter.id} className="flex justify-between rounded-lg border border-border p-3 text-sm"><span>{chapter.chapter_number}. {chapter.title}</span><span className="text-muted-foreground">Page {chapter.page_start || "-"}</span></div>)}</CardContent></Card>
      </div>
    </div>
  );
}
