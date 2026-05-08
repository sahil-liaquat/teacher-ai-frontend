"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBookDetailPage() {
  const params = useParams<{ id: string }>();
  const detail = useQuery({ queryKey: ["book-detail", params.id], queryFn: () => backendApi.book(params.id) });
  const chapters = useQuery({ queryKey: ["book-chapters", params.id], queryFn: () => backendApi.chaptersByBook(params.id) });
  const data = detail.data;
  return (
    <div>
      <PageHeader title={data?.title || "Book detail"} description="Metadata and chapters from the live backend." />
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm"><p>Book ID: {params.id}</p><p>Class ID: {data?.class_id}</p><p>Subject: {data?.subject}</p><p>Active: <Badge>{data?.is_active ? "active" : "inactive"}</Badge></p><p>Ingested: <Badge>{data?.is_ingested ? "ingested" : "not ingested"}</Badge></p><p>Pinecone index: {data?.pinecone_index || "-"}</p>{detail.error ? <p className="text-red-700">{detail.error instanceof Error ? detail.error.message : "Could not load book"}</p> : null}</CardContent></Card>
        <Card><CardHeader><CardTitle>Chapters</CardTitle></CardHeader><CardContent className="grid gap-2">{chapters.data?.map((chapter: any) => <div key={chapter.id} className="flex justify-between rounded-lg border border-border p-3 text-sm"><span>{chapter.chapter_number}. {chapter.chapter_title}</span><span className="text-muted-foreground">Chapter</span></div>)}{!chapters.isLoading && !chapters.data?.length ? <p className="text-sm text-muted-foreground">No chapters found for this book.</p> : null}</CardContent></Card>
      </div>
    </div>
  );
}
