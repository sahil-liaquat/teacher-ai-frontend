"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  Presentation,
  Sparkles,
  StickyNote,
  Trash2,
  X
} from "lucide-react";
import { backendApi } from "@/lib/api";
import {
  deleteWorksheetGeneration,
  listWorksheetGenerations,
  WORKSHEET_STORAGE_EVENT,
} from "@/lib/worksheet-storage";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PastelIconTile } from "@/components/pastel-icon-tile";
import { cn } from "@/lib/utils";

type ResourceType = "lesson plan" | "worksheet" | "notes" | "activity" | "presentation";

interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  className: string;
  chapterName: string;
  detail: string;
  href: string;
  type: ResourceType;
  createdAt: string;
  raw: any;
}

const typeMeta: Record<ResourceType, { label: string; icon: typeof BookOpen; colors: { bg: string; text: string; border: string } }> = {
  "lesson plan": { label: "Lesson Plan", icon: BookOpen, colors: { bg: "bg-blue-50", text: "text-teachpad-blue", border: "border-blue-200" } },
  worksheet: { label: "Worksheet", icon: ClipboardCheck, colors: { bg: "bg-[#ecfff7]", text: "text-[#159565]", border: "border-[#bdebd7]" } },
  notes: { label: "Notes", icon: StickyNote, colors: { bg: "bg-[#fff1f7]", text: "text-[#d9467d]", border: "border-[#f9a8d4]" } },
  activity: { label: "Activity", icon: Lightbulb, colors: { bg: "bg-[#f0fdff]", text: "text-[#16a9b6]", border: "border-[#8eecf5]" } },
  presentation: { label: "Presentation", icon: Presentation, colors: { bg: "bg-[#fff1f2]", text: "text-[#eb3b5a]", border: "border-[#fda4af]" } },
};

function normalizeClassName(raw: string | undefined): string {
  if (!raw) return "Unknown Class";
  const match = raw.toLowerCase().match(/\b(?:class|grade)?\s*(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (match) {
    const grade = Number(match[1]);
    if (grade >= 1 && grade <= 12) return `Class ${grade}`;
  }
  return raw || "Unknown Class";
}

function extractSubject(raw: any): string {
  return raw?.subject || raw?.output_json?.metadata?.subject || raw?.output_json?.subject || "Unknown Subject";
}

function extractClass(raw: any): string {
  const classVal = raw?.class_name || raw?.output_json?.metadata?.class || raw?.output_json?.metadata?.grade || raw?.audience || raw?.output_json?.class;
  return normalizeClassName(classVal ? String(classVal) : undefined);
}

function extractChapter(raw: any): string {
  return raw?.chapter_name || raw?.output_json?.metadata?.chapter || raw?.output_json?.metadata?.topic || "";
}

function extractTopic(raw: any): string {
  return raw?.topic || raw?.output_json?.metadata?.topic || raw?.output_json?.title || "";
}

export default function ResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [detailView, setDetailView] = useState<{ className: string; subject: string } | null>(null);

  const lessonPlans = useQuery({ queryKey: ["resources-lesson-plans"], queryFn: () => backendApi.lessonPlans(0, 50), staleTime: 0, refetchOnMount: "always" });
  const notes = useQuery({ queryKey: ["resources-notes"], queryFn: () => backendApi.notesGenerations(0, 50), staleTime: 0, refetchOnMount: "always" });
  const activities = useQuery({ queryKey: ["resources-activities"], queryFn: () => backendApi.activities(0, 50), staleTime: 0, refetchOnMount: "always" });
  const presentations = useQuery({ queryKey: ["resources-presentations"], queryFn: () => backendApi.presentations(0, 50), staleTime: 0, refetchOnMount: "always" });

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

  const allResources: ResourceItem[] = useMemo(() => {
    const items: ResourceItem[] = [];

    (lessonPlans.data?.items || []).forEach((item: any) => {
      items.push({
        id: `lp-${item.id}`,
        title: item.topic || item.chapter_name || "Generated Lesson Plan",
        subject: item.subject || "Unknown Subject",
        className: normalizeClassName(item.class_name),
        chapterName: item.chapter_name || "",
        detail: [item.class_name, item.chapter_name, `${item.duration_minutes} min`].filter(Boolean).join(" • "),
        href: `/dashboard/lesson-plans/${item.id}`,
        type: "lesson plan",
        createdAt: item.created_at || item.updated_at || "",
        raw: item,
      });
    });

    localWorksheets.forEach((item: any) => {
      const o = item.output_json || {};
      const m = o.metadata || {};
      items.push({
        id: `ws-${item.id}`,
        title: o.title || m.topic || "Generated Worksheet",
        subject: extractSubject(m),
        className: extractClass(m),
        chapterName: m.chapter || m.topic || "",
        detail: [m.grade ? `Grade ${m.grade}` : m.class, m.question_count ? `${m.question_count} questions` : ""].filter(Boolean).join(" • "),
        href: `/dashboard/worksheets/${item.id}`,
        type: "worksheet",
        createdAt: item.created_at || "",
        raw: item,
      });
    });

    (notes.data?.items || []).forEach((item: any) => {
      const o = item.output_json || {};
      const m = o.metadata || {};
      items.push({
        id: `notes-${item.id}`,
        title: o.title || m.topic || "Generated Notes",
        subject: extractSubject(m),
        className: extractClass(m),
        chapterName: m.chapter || m.topic || "",
        detail: [m.class, m.chapter].filter(Boolean).join(" • "),
        href: `/dashboard/notes-generator?id=${item.id}`,
        type: "notes",
        createdAt: item.created_at || "",
        raw: item,
      });
    });

    (activities.data?.items || []).forEach((item: any) => {
      const o = item.output_json || {};
      const m = o.metadata || {};
      items.push({
        id: `activity-${item.id}`,
        title: o.title || m.topic || "Generated Activity",
        subject: extractSubject(m),
        className: extractClass(m),
        chapterName: m.chapter || m.topic || "",
        detail: [m.activity_type, m.duration ? `${m.duration} min` : ""].filter(Boolean).join(" • "),
        href: `/dashboard/activity-generator?id=${item.id}`,
        type: "activity",
        createdAt: item.created_at || "",
        raw: item,
      });
    });

    (presentations.data?.items || []).forEach((item: any) => {
      const o = item.output_json || {};
      items.push({
        id: `pres-${item.id}`,
        title: item.topic || o.title || "Generated Presentation",
        subject: extractSubject(o),
        className: extractClass(item),
        chapterName: o.metadata?.chapter || "",
        detail: [item.audience, `${item.slide_count} slides`].filter(Boolean).join(" • "),
        href: `/dashboard/presentation-generator/output?id=${item.id}`,
        type: "presentation",
        createdAt: item.created_at || "",
        raw: item,
      });
    });

    return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [lessonPlans.data, notes.data, activities.data, presentations.data, localWorksheets]);

  const recentResources = useMemo(() => allResources.slice(0, 8), [allResources]);

  const groupedBySubject = useMemo(() => {
    const map = new Map<string, { className: string; subject: string; resources: ResourceItem[] }>();
    for (const r of allResources) {
      const key = `${r.className}||${r.subject}`;
      if (!map.has(key)) map.set(key, { className: r.className, subject: r.subject, resources: [] });
      map.get(key)!.resources.push(r);
    }
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject));
  }, [allResources]);

  const filteredGroups = useMemo(() => {
    const filterText = searchQuery.toLowerCase().trim();
    return groupedBySubject.filter((group) => {
      if (typeFilter !== "all" && !group.resources.some((r) => r.type === typeFilter)) return false;
      if (classFilter && group.className !== classFilter) return false;
      if (subjectFilter && group.subject !== subjectFilter) return false;
      if (filterText) {
        const matches = (s: string) => s.toLowerCase().includes(filterText);
        if (!matches(group.className) && !matches(group.subject) && !group.resources.some((r) => matches(r.title) || matches(r.chapterName))) return false;
      }
      return true;
    });
  }, [groupedBySubject, typeFilter, classFilter, subjectFilter, searchQuery]);

  const allClasses = useMemo(() => groupedBySubject.reduce<string[]>((acc, g) => acc.includes(g.className) ? acc : [...acc, g.className], []), [groupedBySubject]);
  const allSubjects = useMemo(() => groupedBySubject.reduce<string[]>((acc, g) => acc.includes(g.subject) ? acc : [...acc, g.subject], []), [groupedBySubject]);

  const activeFilterCount = [typeFilter !== "all", !!classFilter, !!subjectFilter, !!searchQuery].filter(Boolean).length;
  const clearFilters = () => { setSearchQuery(""); setTypeFilter("all"); setClassFilter(""); setSubjectFilter(""); };

  const isLoading = lessonPlans.isLoading || notes.isLoading || activities.isLoading || presentations.isLoading;

  if (detailView) {
    return (
      <SubjectDetailView
        className={detailView.className}
        subject={detailView.subject}
        resources={allResources}
        onBack={() => setDetailView(null)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <DashboardBannerHeader
        titleTop="Saved"
        titleHighlight="Resources"
        imageSrc="/assets/illustrations/saved-resources-header.png"
      />

      {/* Filter bar */}
      <div className="rounded-[22px] border border-teachpad-cardBorder bg-white/86 p-3 shadow-[0_14px_35px_var(--teachpad-shadowCard)] backdrop-blur-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teachpad-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by class, subject, chapter, topic..." className="pl-9 pr-9 w-full" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-teachpad-muted hover:text-teachpad-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-[140px]">
              <option value="all">All Types</option>
              {Object.entries(typeMeta).map(([key, m]) => <option key={key} value={key}>{m.label}s</option>)}
            </Select>
            {allClasses.length > 0 && (
              <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSubjectFilter(""); }} className="w-[130px]">
                <option value="">All Classes</option>
                {allClasses.sort().map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
            {allSubjects.length > 0 && (
              <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-[130px]">
                <option value="">All Subjects</option>
                {allSubjects.sort().map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-5">
          {[1, 2, 3].map((i) => <ClassSectionSkeleton key={i} />)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-teachpad-cardBorder bg-white/70 p-8 text-center shadow-[0_14px_35px_var(--teachpad-shadowCard)] backdrop-blur-sm">
          <PastelIconTile name="search" className="mb-4 h-16 w-16" />
          <h3 className="text-lg font-bold text-teachpad-ink">
            {activeFilterCount > 0 ? "No resources match your filters" : "No saved resources yet"}
          </h3>
          <p className="mt-2 max-w-sm text-center text-sm text-teachpad-muted">
            {activeFilterCount > 0 ? "Try adjusting your search or filters." : "Generate a lesson plan, worksheet, notes, activity, or presentation to start building your library."}
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="secondary" onClick={clearFilters} className="mt-4">Clear all filters</Button>
          ) : (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/lesson-plans/new"><Button size="sm"><Sparkles className="h-4 w-4" /> Lesson Plan</Button></Link>
              <Link href="/dashboard/worksheets/new"><Button size="sm" variant="secondary"><ClipboardCheck className="h-4 w-4" /> Worksheet</Button></Link>
              <Link href="/dashboard/notes-generator"><Button size="sm" variant="secondary"><StickyNote className="h-4 w-4" /> Notes</Button></Link>
              <Link href="/dashboard/activity-generator"><Button size="sm" variant="secondary"><Lightbulb className="h-4 w-4" /> Activity</Button></Link>
              <Link href="/dashboard/presentation-generator"><Button size="sm" variant="secondary"><Presentation className="h-4 w-4" /> Presentation</Button></Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGroups.map((group) => {
            const typeCounts = new Map<ResourceType, number>();
            group.resources.forEach((r) => typeCounts.set(r.type, (typeCounts.get(r.type) || 0) + 1));
            const total = group.resources.length;
            const latest = group.resources.reduce((latest, r) => {
              const d = new Date(r.createdAt || 0).getTime();
              return d > latest ? d : latest;
            }, 0);

            return (
              <button
                key={`${group.className}||${group.subject}`}
                onClick={() => setDetailView({ className: group.className, subject: group.subject })}
                className="clickable-card group rounded-2xl border border-teachpad-cardBorder bg-white p-4 text-left shadow-[0_12px_26px_var(--teachpad-shadowToolCard)] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-teachpad-muted">{group.className}</h3>
                    <h2 className="truncate text-lg font-extrabold text-teachpad-ink">{group.subject}</h2>
                  </div>
                  <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-teachpad-muted transition group-hover:translate-x-0.5 group-hover:text-teachpad-blue" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Array.from(typeCounts.entries()).map(([type, count]) => {
                    const meta = typeMeta[type];
                    return (
                      <span key={type} className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${meta.colors.bg} ${meta.colors.text}`}>
                        <meta.icon className="h-3 w-3" /> {count}
                      </span>
                    );
                  })}
                </div>
                {latest > 0 && (
                  <p className="mt-2 text-xs text-teachpad-muted">
                    Last saved {new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClassSectionSkeleton() {
  return (
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-white p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)]">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-[20px]" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <p className="mb-4 text-sm font-bold text-teachpad-muted">Loading resources...</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

function SubjectDetailView({
  className,
  subject,
  resources,
  onBack,
}: {
  className: string;
  subject: string;
  resources: ResourceItem[];
  onBack: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ResourceType | "all">("all");

  const subjectResources = useMemo(() => resources.filter((r) => r.className === className && r.subject === subject), [resources, className, subject]);
  const filtered = useMemo(() => tab === "all" ? subjectResources : subjectResources.filter((r) => r.type === tab), [subjectResources, tab]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    subjectResources.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  }, [subjectResources]);

  const handleDelete = useCallback(async (resource: ResourceItem) => {
    try {
      if (resource.type === "worksheet") {
        deleteWorksheetGeneration(resource.raw.id || resource.raw.output_json?.id);
        toast({ title: "Deleted" });
      } else if (resource.type === "lesson plan") {
        await backendApi.deleteLessonPlan(resource.raw.id);
        queryClient.invalidateQueries({ queryKey: ["resources-lesson-plans"] });
        toast({ title: "Deleted" });
      } else if (resource.type === "presentation") {
        await backendApi.deletePresentation(resource.raw.id);
        queryClient.invalidateQueries({ queryKey: ["resources-presentations"] });
        toast({ title: "Deleted" });
      } else {
        toast({ title: "Delete not available" });
      }
    } catch {
      toast({ title: "Delete failed" });
    }
  }, [queryClient, toast]);

  const handleDownload = useCallback(async (resource: ResourceItem) => {
    try {
      if (resource.type === "lesson plan") {
        const { normalizeLessonPlanForOutput } = await import("@/lib/api");
        const output = normalizeLessonPlanForOutput(resource.raw);
        const { downloadLessonPlanPdf } = await import("@/lib/lesson-plan-export");
        await downloadLessonPlanPdf(output);
        toast({ title: "PDF downloaded" });
      } else if (resource.type === "worksheet") {
        const { downloadWorksheetPdf } = await import("@/lib/worksheet-export");
        await downloadWorksheetPdf(resource.raw.output_json);
        toast({ title: "PDF downloaded" });
      } else {
        window.open(resource.href, "_blank");
      }
    } catch {
      window.print();
    }
  }, [toast]);

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-teachpad-cardBorder" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold text-teachpad-ink">{className} · {subject}</h1>
          <p className="text-xs text-teachpad-muted sm:text-sm">
            {Object.entries(typeCounts).map(([type, count]) => (
              <span key={type} className="mr-3">{typeMeta[type as ResourceType].label}{count !== 1 ? "s" : ""}: {count}</span>
            ))}
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-[16px] border border-teachpad-cardBorder bg-white/70 p-1 shadow-[0_8px_24px_var(--teachpad-shadowCard)] backdrop-blur-sm">
        {(["all", "lesson plan", "worksheet", "notes", "activity", "presentation"] as const).map((t) => {
          if (t !== "all" && !typeCounts[t]) return null;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "relative px-4 py-2 text-xs sm:text-sm font-semibold transition-all rounded-xl",
                tab === t ? "bg-white text-teachpad-ink shadow-sm" : "text-teachpad-muted hover:text-teachpad-ink"
              )}
            >
              {t === "all" ? "All" : typeMeta[t].label + "s"}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-teachpad-cardBorder bg-white/70 p-8 text-center shadow-[0_14px_35px_var(--teachpad-shadowCard)] backdrop-blur-sm">
          <PastelIconTile name="fileText" className="mb-4 h-16 w-16" />
          <h3 className="text-lg font-bold text-teachpad-ink">No resources found</h3>
          <p className="mt-2 text-center text-sm text-teachpad-muted">Be the first to create something for {className} {subject}.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource, i) => {
            const meta = typeMeta[resource.type];
            const Icon = meta.icon;
            const canDelete = resource.type === "lesson plan" || resource.type === "worksheet" || resource.type === "presentation";
            return (
              <div key={`${resource.type}-${resource.id}`} className="overflow-hidden rounded-[20px] border border-teachpad-cardBorder bg-white/84 shadow-[0_12px_30px_var(--teachpad-shadowCard)] backdrop-blur-sm"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.colors.bg} ${meta.colors.text}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold leading-tight text-teachpad-ink">{resource.title}</h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-teachpad-muted">{resource.chapterName || "No chapter"}</p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${meta.colors.border} ${meta.colors.bg} ${meta.colors.text}`}>
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mb-3 flex items-center gap-3 text-xs text-teachpad-muted">
                    {resource.type === "lesson plan" && resource.raw?.duration_minutes && (
                      <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {resource.raw.duration_minutes} min</span>
                    )}
                    {resource.type === "worksheet" && resource.raw?.output_json?.metadata?.question_count && (
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {resource.raw.output_json.metadata.question_count} Qs</span>
                    )}
                    <span className="ml-auto flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(resource.createdAt || 0).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={resource.href} target="_blank" className="flex-1">
                      <Button variant="default" size="sm" className="w-full gap-1.5 text-xs">
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(resource)} className="flex-1 gap-1.5 text-xs">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(resource)} className="px-2 text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
