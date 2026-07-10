"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, ClipboardCheck, Download, Lightbulb, Presentation, Sparkles, StickyNote, Trash2, X } from "lucide-react";
import { backendApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
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
  "lesson plan": { label: "Lesson Plan", icon: BookOpen, colors: { bg: "bg-blue-50/80", text: "text-teachpad-blue", border: "border-blue-100" } },
  worksheet: { label: "Worksheet", icon: ClipboardCheck, colors: { bg: "bg-emerald-50/80", text: "text-emerald-600", border: "border-emerald-100" } },
  notes: { label: "Notes", icon: StickyNote, colors: { bg: "bg-pink-50/80", text: "text-pink-600", border: "border-pink-100" } },
  activity: { label: "Activity", icon: Lightbulb, colors: { bg: "bg-cyan-50/80", text: "text-cyan-600", border: "border-cyan-100" } },
  presentation: { label: "Presentation", icon: Presentation, colors: { bg: "bg-rose-50/80", text: "text-rose-600", border: "border-rose-100" } },
};

const typeMapping: Record<string, ResourceType> = {
  lesson_plan: "lesson plan",
  worksheet: "worksheet",
  presentation: "presentation",
  notes: "notes",
  activity: "activity"
};

function getResourceHref(type: string, id: string): string {
  switch (type) {
    case "lesson_plan": return `/dashboard/lesson-plans/${id}`;
    case "worksheet": return `/dashboard/worksheets/${id}`;
    case "presentation": return `/dashboard/presentation-generator/output?id=${id}`;
    case "notes": return `/dashboard/notes-generator?id=${id}`;
    case "activity": return `/dashboard/activity-generator?id=${id}`;
    default: return "#";
  }
}

function normalizeClassName(raw: string | undefined): string {
  if (!raw) return "Unknown Class";
  const match = raw.toLowerCase().match(/\b(?:class|grade)?\s*(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (match) {
    const grade = Number(match[1]);
    if (grade >= 1 && grade <= 12) return `Class ${grade}`;
  }
  return raw || "Unknown Class";
}

export default function ResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [resourceToDelete, setResourceToDelete] = useState<ResourceItem | null>(null);
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<string[]>([]);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Background query to build classes and subjects filters (pulls up to 1000 items metadata)
  const allSavedForFilters = useQuery({
    queryKey: ["library-filters"],
    queryFn: () => backendApi.getLibrary({ skip: 0, limit: 1000 }),
    staleTime: 60000,
  });

  const allClasses = useMemo(() => {
    const items = allSavedForFilters.data?.items || [];
    return items.reduce<string[]>((acc, r) => {
      const cls = normalizeClassName(r.class_name);
      return acc.includes(cls) ? acc : [...acc, cls];
    }, []);
  }, [allSavedForFilters.data]);

  const allSubjects = useMemo(() => {
    const items = allSavedForFilters.data?.items || [];
    return items.reduce<string[]>((acc, r) => {
      const subj = r.subject || "Unknown Subject";
      return acc.includes(subj) ? acc : [...acc, subj];
    }, []);
  }, [allSavedForFilters.data]);

  // Main infinite query
  const {
    data: libraryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["library", searchQuery, typeFilter, classFilter, subjectFilter],
    queryFn: ({ pageParam = 0 }) =>
      backendApi.getLibrary({
        skip: pageParam,
        limit: 20,
        q: searchQuery,
        type: typeFilter,
        class: classFilter,
        subject: subjectFilter
      }),
    getNextPageParam: (lastPage, allPages) => {
      const currentCount = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return currentCount < lastPage.total ? currentCount : undefined;
    },
    initialPageParam: 0,
    staleTime: 0,
    refetchOnMount: "always"
  });

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const current = observerRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredResources: ResourceItem[] = useMemo(() => {
    const pages = libraryData?.pages || [];
    const items = pages.flatMap((page) => page.items);
    return items
      .map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        className: normalizeClassName(item.class_name),
        chapterName: item.chapter_name || "",
        detail: [normalizeClassName(item.class_name), item.chapter_name].filter(Boolean).join(" • "),
        href: getResourceHref(item.type, item.id),
        type: typeMapping[item.type] || (item.type as any),
        createdAt: item.created_at,
        raw: item
      }))
      .filter((item) => !optimisticDeletedIds.includes(item.id));
  }, [libraryData, optimisticDeletedIds]);

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

  const activeFilterCount = [typeFilter !== "all", !!classFilter, !!subjectFilter, !!searchQuery].filter(Boolean).length;
  const clearFilters = () => { setSearchQuery(""); setTypeFilter("all"); setClassFilter(""); setSubjectFilter(""); };

  const handleDelete = useCallback(async (resource: ResourceItem) => {
    // Add to optimistic deletes immediately so it vanishes from UI instantly
    setOptimisticDeletedIds((prev) => [...prev, resource.id]);

    try {
      const backendType = Object.keys(typeMapping).find(key => typeMapping[key] === resource.type) || resource.type;
      await backendApi.updateResourceSavedState(backendType, resource.raw.id || resource.id, false);
      
      // Trigger query invalidation in parallel and wait for them to finish
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["library"] }),
        queryClient.invalidateQueries({ queryKey: ["library-filters"] })
      ]);
      
      // Clear the ID from optimistic delete tracker once DB is in sync
      setOptimisticDeletedIds((prev) => prev.filter((id) => id !== resource.id));
      
      toast({ title: "Removed from Library", description: "Resource has been removed from your saved list." });
    } catch {
      // Rollback optimistic delete if API fails
      setOptimisticDeletedIds((prev) => prev.filter((id) => id !== resource.id));
      toast({ title: "Failed to remove resource", variant: "error" });
    }
  }, [queryClient, toast]);

  const handleDownload = useCallback(async (resource: ResourceItem) => {
    try {
      toast({ title: "Downloading...", description: "Fetching full content..." });
      
      if (resource.type === "lesson plan") {
        const fullData = await backendApi.lessonPlan(resource.id);
        const { normalizeLessonPlanForOutput } = await import("@/lib/api");
        const output = normalizeLessonPlanForOutput(fullData);
        const { downloadLessonPlanPdf } = await import("@/lib/lesson-plan-export");
        await downloadLessonPlanPdf(output);
        toast({ title: "PDF downloaded" });
      } else if (resource.type === "worksheet") {
        const fullData = await backendApi.worksheet(resource.id);
        const { downloadWorksheetPdf } = await import("@/lib/worksheet-export");
        await downloadWorksheetPdf(fullData.output_json);
        toast({ title: "PDF downloaded" });
      } else if (resource.type === "presentation") {
        const fullData = await backendApi.presentation(resource.id);
        // Always regenerate via downloadPptx so images are embedded via proxy
        const { presentationGenerationToDeck } = await import("@/lib/presentation-generator");
        const deck = presentationGenerationToDeck(fullData);
        const { downloadPptx } = await import("@/lib/presentation-export");
        await downloadPptx(deck);
        toast({ title: "PPT downloaded", description: "Exported as a proper .pptx deck." });
      } else {
        window.open(resource.href, "_blank");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Download failed",
        description: getErrorMessage(err, "Could not export resource."),
        variant: "error"
      });
    }
  }, [toast]);

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5 px-4 sm:px-6 lg:px-8">
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
            <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); }} placeholder="Search by class, subject, chapter, topic..." className="pl-9 pr-9 w-full" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-teachpad-muted hover:text-teachpad-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); }} className="w-full min-[400px]:flex-1 sm:w-[140px]">
              <option value="all">All Types</option>
              {Object.entries(typeMeta).map(([key, m]) => <option key={key} value={key}>{m.label}s</option>)}
            </Select>
            {allClasses.length > 0 && (
              <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); }} className="w-full min-[400px]:flex-1 sm:w-[130px]">
                <option value="">All Classes</option>
                {allClasses.sort().map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            )}
            {allSubjects.length > 0 && (
              <Select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); }} className="w-[130px] w-full min-[400px]:flex-1 sm:w-[130px]">
                <option value="">All Subjects</option>
                {allSubjects.sort().map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            )}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full min-[400px]:w-auto justify-center gap-1 text-xs shrink-0">
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[48px] w-full rounded-xl bg-slate-100" />
          <Skeleton className="h-[120px] w-full rounded-2xl bg-slate-100" />
          <Skeleton className="h-[120px] w-full rounded-2xl bg-slate-100" />
          <Skeleton className="h-[120px] w-full rounded-2xl bg-slate-100" />
        </div>
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
                        <div className="hidden sm:flex flex-col items-center shrink-0 self-stretch">
                          <CalendarDateBadge dateString={resource.createdAt} />
                          <div className="w-0.5 bg-slate-200/70 flex-1 my-2 group-last:hidden" />
                        </div>
                        
                        {/* Resource Card */}
                        <div className="flex-1 min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:border-slate-200/80 transition-all duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                    <span className="sm:hidden">{new Date(resource.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • </span>
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
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start mt-2 sm:mt-0 shrink-0">
                              <Link href={resource.href} className="flex-1 sm:flex-initial">
                                <Button size="sm" className="w-full h-9 px-4 text-xs font-bold rounded-xl">
                                  View
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" onClick={() => handleDownload(resource)} className="flex-1 sm:flex-initial h-9 px-3 gap-1.5 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-800 border-slate-200">
                                <Download className="h-3.5 w-3.5" /> {resource.type === "presentation" ? "PPT" : "PDF"}
                              </Button>
                              {canDelete && (
                                <Button variant="ghost" size="sm" onClick={() => setResourceToDelete(resource)} className="h-9 w-9 p-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0">
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

          {/* Sentinel observer element */}
          <div ref={observerRef} className="h-16 flex items-center justify-center border-t border-slate-50/50 pt-4">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm animate-pulse">
                <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading more resources...
              </div>
            ) : hasNextPage ? (
              <span className="text-xs text-slate-400 font-medium">Scroll down to load more</span>
            ) : (
              <span className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full">All resources loaded</span>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {mounted && resourceToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">Remove from Saved Resources?</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
              Are you sure you want to remove <span className="font-semibold text-slate-700">"{resourceToDelete.title}"</span> from your saved library?
              The generation will still be accessible from your history.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button
                variant="ghost"
                onClick={() => setResourceToDelete(null)}
                className="h-10 px-4 text-sm font-bold rounded-xl text-slate-500 border border-slate-200 bg-white hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  void handleDelete(resourceToDelete);
                  setResourceToDelete(null);
                }}
                className="h-10 px-4 text-sm font-bold rounded-xl text-white"
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </div>,
        document.body
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
