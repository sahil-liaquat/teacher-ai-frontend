"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Lightbulb,
  Presentation,
  Sparkles,
  StickyNote
} from "lucide-react";
import { backendApi } from "@/lib/api";
import { listWorksheetGenerations, WORKSHEET_STORAGE_EVENT } from "@/lib/worksheet-storage";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type GenerationType = "lesson plan" | "worksheet" | "notes" | "activity" | "presentation";

interface GenerationItem {
  id: string;
  title: string;
  type: GenerationType;
  createdAt: string;
  href: string;
  subject?: string;
  className?: string;
  chapterName?: string;
}

const typeMeta: Record<GenerationType, { label: string; icon: typeof BookOpen }> = {
  "lesson plan": { label: "Lesson Plan", icon: FileText },
  worksheet: { label: "Worksheet", icon: ClipboardCheck },
  notes: { label: "Notes", icon: StickyNote },
  activity: { label: "Activity", icon: Lightbulb },
  presentation: { label: "Presentation", icon: Presentation },
};

const typeColors: Record<GenerationType, string> = {
  "lesson plan": "bg-blue-50 text-blue-600 ring-blue-200",
  worksheet: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  notes: "bg-pink-50 text-pink-600 ring-pink-200",
  activity: "bg-cyan-50 text-cyan-600 ring-cyan-200",
  presentation: "bg-rose-50 text-rose-600 ring-rose-200",
};

function normalizeClassName(raw: string | undefined): string {
  if (!raw) return "";
  const match = raw.toLowerCase().match(/\b(?:class|grade)?\s*(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (match) {
    const grade = Number(match[1]);
    if (grade >= 1 && grade <= 12) return `Class ${grade}`;
  }
  return raw;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function RecentGenerationsPage() {
  const lessonPlans = useQuery({ queryKey: ["recent-lesson-plans"], queryFn: () => backendApi.lessonPlans(0, 30), staleTime: 0, refetchOnMount: "always" });
  const worksheets = useQuery({ queryKey: ["recent-worksheets"], queryFn: () => backendApi.worksheets(0, 30), staleTime: 0, refetchOnMount: "always" });
  const notes = useQuery({ queryKey: ["recent-notes"], queryFn: () => backendApi.notesGenerations(0, 30), staleTime: 0, refetchOnMount: "always" });
  const activities = useQuery({ queryKey: ["recent-activities"], queryFn: () => backendApi.activities(0, 30), staleTime: 0, refetchOnMount: "always" });
  const presentations = useQuery({ queryKey: ["recent-presentations"], queryFn: () => backendApi.presentations(0, 30), staleTime: 0, refetchOnMount: "always" });

  const [localWorksheets, setLocalWorksheets] = useState<any[]>([]);

  useEffect(() => {
    function sync() { setLocalWorksheets(listWorksheetGenerations()); }
    sync();
    window.addEventListener(WORKSHEET_STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WORKSHEET_STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const allGenerations: GenerationItem[] = useMemo(() => {
    const items: GenerationItem[] = [];

    (lessonPlans.data?.items || []).forEach((item: any) => {
      items.push({
        id: `lp-${item.id}`,
        title: item.topic || item.chapter_name || "Generated Lesson Plan",
        type: "lesson plan",
        createdAt: item.created_at || item.updated_at || "",
        href: `/dashboard/lesson-plans/${item.id}`,
        subject: item.subject,
        className: normalizeClassName(item.class_name),
        chapterName: item.chapter_name,
      });
    });

    // Merge backend worksheets with local-only worksheets, deduplicating by id
    const backendWorksheetItems = worksheets.data?.items || [];
    const seenWorksheetIds = new Set<string>();

    backendWorksheetItems.forEach((item: any) => {
      seenWorksheetIds.add(String(item.id));
      const meta = item.output_json?.metadata || {};
      items.push({
        id: `ws-${item.id}`,
        title: meta.title || item.output_json?.title || meta.topic || "Generated Worksheet",
        type: "worksheet",
        createdAt: item.created_at || item.updated_at || "",
        href: `/dashboard/worksheets/${item.id}`,
        subject: meta.subject,
        className: meta.grade ? `Class ${meta.grade}` : undefined,
        chapterName: meta.chapter,
      });
    });

    localWorksheets.forEach((item: any) => {
      if (seenWorksheetIds.has(String(item.id))) return;
      const meta = item.output_json?.metadata || {};
      items.push({
        id: `ws-${item.id}`,
        title: meta.title || item.output_json?.title || meta.topic || "Generated Worksheet",
        type: "worksheet",
        createdAt: item.created_at || item.updated_at || "",
        href: `/dashboard/worksheets/${item.id}`,
        subject: meta.subject,
        className: meta.grade ? `Class ${meta.grade}` : undefined,
        chapterName: meta.chapter,
      });
    });

    (notes.data?.items || []).forEach((item: any) => {
      const meta = item.output_json?.metadata || {};
      items.push({
        id: `notes-${item.id}`,
        title: meta.title || item.topic || "Generated Notes",
        type: "notes",
        createdAt: item.created_at || item.updated_at || "",
        href: `/dashboard/notes-generator?id=${item.id}`,
        subject: meta.subject || item.subject,
        className: normalizeClassName(meta.class || item.class_name),
        chapterName: meta.chapter || item.chapter_name,
      });
    });

    (activities.data?.items || []).forEach((item: any) => {
      const meta = item.output_json?.metadata || {};
      items.push({
        id: `activity-${item.id}`,
        title: meta.title || item.topic || "Generated Activity",
        type: "activity",
        createdAt: item.created_at || item.updated_at || "",
        href: `/dashboard/activity-generator?id=${item.id}`,
        subject: meta.subject || item.subject,
        className: normalizeClassName(meta.class || item.class_name),
        chapterName: meta.chapter || item.chapter_name,
      });
    });

    (presentations.data?.items || []).forEach((item: any) => {
      items.push({
        id: `pres-${item.id}`,
        title: item.topic || "Generated Presentation",
        type: "presentation",
        createdAt: item.created_at || item.updated_at || "",
        href: `/dashboard/presentation-generator/output?id=${item.id}`,
        subject: undefined,
        className: item.audience,
        chapterName: undefined,
      });
    });

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [lessonPlans.data, worksheets.data, notes.data, activities.data, presentations.data, localWorksheets]);

  const isLoading = lessonPlans.isLoading || worksheets.isLoading || notes.isLoading || activities.isLoading || presentations.isLoading;
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(allGenerations.length / PER_PAGE));
  const paginated = allGenerations.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  useEffect(() => { setPage(0); }, [allGenerations.length]);

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <DashboardBannerHeader
        titleTop="Your"
        titleHighlight="Recent Generations"
        titleSuffix=""
        imageSrc="/ai-tools/classroom-tools-header-illustration.png"
      />

      {isLoading ? (
        <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
          <div className="mb-5 flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-[20px]" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <p className="mb-4 text-sm font-bold text-teachpad-muted">Loading your generations...</p>
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        </div>
      ) : allGenerations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#d8f1e5] bg-white/60 py-16">
          <Clock3 className="h-12 w-12 text-[#9CA0AA]" />
          <h3 className="text-lg font-bold text-[#25262b]">No generations yet</h3>
          <p className="max-w-sm text-center text-sm text-[#55516e]">Create your first lesson plan or worksheet to see it here.</p>
          <Link
            href="/dashboard/classroom-tools"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1fbc79] to-[#069462] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            AI Tools
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {paginated.map((gen) => {
              const meta = typeMeta[gen.type];
              const Icon = meta.icon;
              return (
                <Link
                  key={gen.id}
                  href={gen.href}
                  className="group flex items-center gap-4 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)]"
                >
                  <span className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                    typeColors[gen.type]
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-slate-900">{gen.title}</span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{meta.label}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      {gen.className && <span>{gen.className}</span>}
                      {gen.subject && <span>{gen.subject}</span>}
                      {gen.chapterName && <span className="truncate">{gen.chapterName}</span>}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <span className="text-xs font-medium text-slate-400">{formatDate(gen.createdAt)}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
              <span className="text-sm text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/70 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-white/70 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
