"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { PastelIconTile } from "@/components/pastel-icon-tile";
import { cn } from "@/lib/utils";
import { isResourceSaved, initializeSavedResourceIds } from "@/lib/saved-resources";

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
  "lesson plan": { label: "Lesson Plan", icon: BookOpen, colors: { bg: "bg-blue-50/80", text: "text-teachpad-blue", border: "border-blue-100" } },
  worksheet: { label: "Worksheet", icon: ClipboardCheck, colors: { bg: "bg-emerald-50/80", text: "text-emerald-600", border: "border-emerald-100" } },
  notes: { label: "Notes", icon: StickyNote, colors: { bg: "bg-pink-50/80", text: "text-pink-600", border: "border-pink-100" } },
  activity: { label: "Activity", icon: Lightbulb, colors: { bg: "bg-cyan-50/80", text: "text-cyan-600", border: "border-cyan-100" } },
  presentation: { label: "Presentation", icon: Presentation, colors: { bg: "bg-rose-50/80", text: "text-rose-600", border: "border-rose-100" } },
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

export default function ResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

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

  const filteredResources = useMemo(() => {
    const filterText = searchQuery.toLowerCase().trim();
    return allResources.filter((r) => {
      if (!isResourceSaved(r.id)) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (classFilter && r.className !== classFilter) return false;
      if (subjectFilter && r.subject !== subjectFilter) return false;
      if (filterText) {
        const matches = (s: string) => (s || "").toLowerCase().includes(filterText);
        if (
          !matches(r.title) &&
          !matches(r.subject) &&
          !matches(r.className) &&
          !matches(r.chapterName)
        ) return false;
      }
      return true;
    });
  }, [allResources, typeFilter, classFilter, subjectFilter, searchQuery]);

  const resourcesByMonth = useMemo(() => {
    const groups: { monthYear: string; label: string; items: ResourceItem[] }[] = [];
    
    filteredResources.forEach((item) => {
      const date = new Date(item.createdAt || 0);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthName = isNaN(monthIndex) ? "Earlier" : date.toLocaleString("default", { month: "long" });
      const monthYear = isNaN(year) ? "Earlier" : `${monthName} ${year}`;
      
      let group = groups.find((g) => g.monthYear === monthYear);
      if (!group) {
        group = { monthYear, label: monthYear, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    
    return groups.sort((a, b) => {
      const dateA = new Date(a.items[0]?.createdAt || 0).getTime();
      const dateB = new Date(b.items[0]?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredResources]);

  const allClasses = useMemo(() => allResources.reduce<string[]>((acc, r) => acc.includes(r.className) ? acc : [...acc, r.className], []), [allResources]);
  const allSubjects = useMemo(() => allResources.reduce<string[]>((acc, r) => acc.includes(r.subject) ? acc : [...acc, r.subject], []), [allResources]);

  const activeFilterCount = [typeFilter !== "all", !!classFilter, !!subjectFilter, !!searchQuery].filter(Boolean).length;
  const clearFilters = () => { setSearchQuery(""); setTypeFilter("all"); setClassFilter(""); setSubjectFilter(""); };

  const isLoading = lessonPlans.isLoading || notes.isLoading || activities.isLoading || presentations.isLoading;

  useEffect(() => {
    if (!isLoading && allResources.length > 0) {
      const allIds = allResources.map((r) => r.id);
      initializeSavedResourceIds(allIds);
    }
  }, [isLoading, allResources]);

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
      } else if (resource.type === "notes") {
        await backendApi.deleteNotes(resource.raw.id);
        queryClient.invalidateQueries({ queryKey: ["resources-notes"] });
        toast({ title: "Deleted" });
      } else if (resource.type === "activity") {
        await backendApi.deleteActivity(resource.raw.id);
        queryClient.invalidateQueries({ queryKey: ["resources-activities"] });
        toast({ title: "Deleted" });
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
              <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); }} className="w-[130px]">
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
        <TimelineSkeleton />
      ) : resourcesByMonth.length === 0 ? (
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
        <div className="space-y-8">
          {resourcesByMonth.map((group) => (
            <div key={group.monthYear} className="space-y-4">
              <h2 className="text-lg font-extrabold text-slate-800 px-1 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <span>{group.label}</span>
                <span className="text-xs font-semibold text-slate-400">({group.items.length} item{group.items.length !== 1 ? "s" : ""})</span>
              </h2>
              <div className="space-y-3">
                {group.items.map((resource) => {
                  const meta = typeMeta[resource.type];
                  const Icon = meta.icon;
                  const canDelete = true;
                  return (
                    <div key={`${resource.type}-${resource.id}`} className="flex gap-4 items-start relative group">
                      {/* Timeline connector and badge */}
                      <div className="flex flex-col items-center shrink-0 self-stretch">
                        <CalendarDateBadge dateString={resource.createdAt} />
                        <div className="w-0.5 bg-slate-200/70 flex-1 my-2 group-last:hidden" />
                      </div>
                      
                      {/* Resource Card */}
                      <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:border-slate-200/80 transition-all duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.colors.bg, meta.colors.text)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={cn("inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold border", meta.colors.border, meta.colors.bg, meta.colors.text)}>
                                  {meta.label}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {new Date(resource.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </span>
                              </div>
                              <h3 className="mt-1.5 text-base font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                                {resource.title}
                              </h3>
                              <p className="mt-1 text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-1">
                                <span>{resource.className}</span>
                                <span className="text-slate-300">•</span>
                                <span>{resource.subject}</span>
                                {resource.chapterName && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate max-w-[200px]" title={resource.chapterName}>{resource.chapterName}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                            <Link href={resource.href} target="_blank">
                              <Button variant="default" size="sm" className="h-9 px-3 gap-1.5 text-xs font-bold rounded-xl">
                                View
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(resource)} className="h-9 px-3 gap-1.5 text-xs font-bold rounded-xl text-slate-655 hover:text-slate-800 border-slate-200">
                              <Download className="h-3.5 w-3.5" /> PDF
                            </Button>
                            {canDelete && (
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(resource)} className="h-9 w-9 p-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-650">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarDateBadge({ dateString }: { dateString: string }) {
  const date = useMemo(() => new Date(dateString), [dateString]);
  const isValid = !isNaN(date.getTime());
  const month = isValid ? date.toLocaleString("default", { month: "short" }).toUpperCase() : "---";
  const day = isValid ? date.getDate().toString().padStart(2, "0") : "--";
  
  return (
    <div className="flex flex-col items-center justify-center shrink-0 w-11 h-[48px] rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm select-none">
      <div className="w-full text-center text-[9px] font-black tracking-wider text-white bg-blue-500 py-0.5 px-1 leading-none uppercase">
        {month}
      </div>
      <div className="w-full text-center text-base font-extrabold text-slate-800 bg-slate-50 py-1 leading-none">
        {day}
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex gap-4 items-start">
                <Skeleton className="h-12 w-11 rounded-lg shrink-0" />
                <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16 rounded-xl" />
                    <Skeleton className="h-9 w-16 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
