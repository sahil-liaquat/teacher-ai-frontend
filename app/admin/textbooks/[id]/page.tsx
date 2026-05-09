"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Hash, LibraryBig } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill } from "@/components/admin/admin-ui";

export default function AdminBookDetailPage() {
  const params = useParams<{ id: string }>();
  const detail = useQuery({ queryKey: ["book-detail", params.id], queryFn: () => backendApi.book(params.id) });
  const chapters = useQuery({ queryKey: ["book-chapters", params.id], queryFn: () => backendApi.chaptersByBook(params.id) });
  const data = detail.data;

  if (detail.isLoading) return <LoadingState label="Loading book" />;

  if (detail.error || !data) {
    return (
      <AdminPanel>
        <EmptyState title="Could not load book" description={detail.error instanceof Error ? detail.error.message : "The backend did not return this textbook."} />
      </AdminPanel>
    );
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Textbook detail"
        title={data.title || "Book detail"}
        description="Metadata, indexing status, and chapters from the live backend."
        meta={
          <>
            <StatusPill status={data.is_active ? "success" : "danger"}>{data.is_active ? "active" : "inactive"}</StatusPill>
            <StatusPill status={data.is_ingested ? "info" : "warning"}>{data.is_ingested ? "ingested" : "pending ingestion"}</StatusPill>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Subject" value={data.subject || "-"} detail="Book discipline" tone="blue" icon={<BookOpen className="h-5 w-5" />} />
        <MetricCard label="Chapters" value={chapters.data?.length || 0} detail="Detected records" tone="green" icon={<LibraryBig className="h-5 w-5" />} />
        <MetricCard label="Class ID" value={data.class_id ? "linked" : "-"} detail={data.class_id || "No class id"} tone="slate" icon={<Hash className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <AdminPanel title="Metadata" description="Core fields returned by the book endpoint.">
          <dl className="grid gap-3">
            <Detail label="Book ID" value={params.id} />
            <Detail label="Class ID" value={data.class_id || "-"} />
            <Detail label="Subject" value={data.subject || "-"} />
            <Detail label="Pinecone index" value={data.pinecone_index || "-"} />
          </dl>
        </AdminPanel>

        <AdminPanel title="Chapters" description="Chapter records available for this textbook.">
          {chapters.isLoading ? <LoadingState label="Loading chapters" /> : null}
          {!chapters.isLoading && !chapters.data?.length ? <EmptyState title="No chapters found" /> : null}
          {chapters.data?.length ? (
            <div className="space-y-3">
              {chapters.data.map((chapter: any) => (
                <div key={chapter.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{chapter.chapter_title || chapter.title || "Untitled chapter"}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Chapter {chapter.chapter_number || "-"}</p>
                  </div>
                  <StatusPill status="neutral">Chapter</StatusPill>
                </div>
              ))}
            </div>
          ) : null}
        </AdminPanel>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-slate-950">{value}</dd>
    </div>
  );
}
