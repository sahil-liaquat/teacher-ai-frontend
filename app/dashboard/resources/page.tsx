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
  ExternalLink,
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { backendApi } from "@/lib/api";
import {
  deleteWorksheetGeneration,
  listWorksheetGenerations,
  saveWorksheetGeneration,
  WORKSHEET_STORAGE_EVENT,
} from "@/lib/worksheet-storage";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { PastelIconTile } from "@/components/pastel-icon-tile";

type ResourceType = "lesson plan" | "worksheet";

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

interface GroupedData {
  [className: string]: {
    [subject: string]: {
      lessonPlans: ResourceItem[];
      worksheets: ResourceItem[];
    };
  };
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

function sortClasses(classes: string[]): string[] {
  const order: Record<string, number> = {};
  for (let i = 1; i <= 12; i++) order[`Class ${i}`] = i;
  return [...classes].sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));
}

export default function ResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [detailView, setDetailView] = useState<{ className: string; subject: string } | null>(null);

  const lessonPlansQuery = useQuery({
    queryKey: ["resources-lesson-plans"],
    queryFn: () => backendApi.lessonPlans(0, 200),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const [localWorksheets, setLocalWorksheets] = useState<any[]>([]);

  useEffect(() => {
    function syncWorksheets() {
      setLocalWorksheets(listWorksheetGenerations());
    }
    syncWorksheets();
    window.addEventListener(WORKSHEET_STORAGE_EVENT, syncWorksheets);
    window.addEventListener("storage", syncWorksheets);
    return () => {
      window.removeEventListener(WORKSHEET_STORAGE_EVENT, syncWorksheets);
      window.removeEventListener("storage", syncWorksheets);
    };
  }, []);

  const allResources: ResourceItem[] = useMemo(() => {
    const lessonPlanItems: ResourceItem[] = (lessonPlansQuery.data?.items || []).map((item: any) => ({
      id: item.id,
      title: item.topic || item.chapter_name || "Generated Lesson Plan",
      subject: item.subject || "Unknown Subject",
      className: normalizeClassName(item.class_name),
      chapterName: item.chapter_name || "",
      detail: [item.class_name, item.chapter_name, `${item.duration_minutes} min`].filter(Boolean).join(" • "),
      href: `/dashboard/lesson-plans/${item.id}`,
      type: "lesson plan" as ResourceType,
      createdAt: item.created_at || item.updated_at || "",
      raw: item,
    }));

    const worksheetItems: ResourceItem[] = localWorksheets.map((item: any) => {
      const output = item.output_json || {};
      const metadata = output.metadata || {};
      const gradeRaw = metadata.grade ? String(metadata.grade) : metadata.class;
      return {
        id: item.id,
        title: output.title || metadata.topic || "Generated Worksheet",
        subject: metadata.subject || "Unknown Subject",
        className: normalizeClassName(gradeRaw),
        chapterName: metadata.chapter || metadata.topic || "",
        detail: [metadata.grade ? `Grade ${metadata.grade}` : metadata.class, metadata.question_count ? `${metadata.question_count} questions` : ""].filter(Boolean).join(" • "),
        href: `/dashboard/worksheets/${item.id}`,
        type: "worksheet" as ResourceType,
        createdAt: item.created_at || "",
        raw: item,
      };
    });

    return [...lessonPlanItems, ...worksheetItems].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [lessonPlansQuery.data?.items, localWorksheets]);

  const grouped: GroupedData = useMemo(() => {
    const result: GroupedData = {};
    for (const r of allResources) {
      if (!result[r.className]) result[r.className] = {};
      if (!result[r.className][r.subject]) result[r.className][r.subject] = { lessonPlans: [], worksheets: [] };
      if (r.type === "lesson plan") result[r.className][r.subject].lessonPlans.push(r);
      else result[r.className][r.subject].worksheets.push(r);
    }
    return result;
  }, [allResources]);

  const filteredGrouped: GroupedData = useMemo(() => {
    const filterText = searchQuery.toLowerCase().trim();
    let result: GroupedData = { ...grouped };

    if (typeFilter !== "all") {
      const next: GroupedData = {};
      for (const [cn, subjects] of Object.entries(result)) {
        const filteredSubjects: typeof subjects = {};
        for (const [sn, data] of Object.entries(subjects)) {
          const lp = typeFilter === "lesson plan" ? data.lessonPlans : [];
          const ws = typeFilter === "worksheet" ? data.worksheets : [];
          if (lp.length > 0 || ws.length > 0) filteredSubjects[sn] = { lessonPlans: lp, worksheets: ws };
        }
        const entries = Object.entries(filteredSubjects);
        if (entries.length > 0) next[cn] = Object.fromEntries(entries);
      }
      result = next;
    }

    if (filterText) {
      const next: GroupedData = {};
      for (const [cn, subjects] of Object.entries(result)) {
        const matchesClass = cn.toLowerCase().includes(filterText);
        const filteredSubjects: typeof subjects = {};
        for (const [sn, data] of Object.entries(subjects)) {
          const matchesSubject = sn.toLowerCase().includes(filterText);
          const lp = data.lessonPlans.filter(
            (r) => matchesClass || matchesSubject || r.title.toLowerCase().includes(filterText) || r.chapterName.toLowerCase().includes(filterText)
          );
          const ws = data.worksheets.filter(
            (r) => matchesClass || matchesSubject || r.title.toLowerCase().includes(filterText) || r.chapterName.toLowerCase().includes(filterText)
          );
          if (lp.length > 0 || ws.length > 0) filteredSubjects[sn] = { lessonPlans: lp, worksheets: ws };
        }
        const entries = Object.entries(filteredSubjects);
        if (entries.length > 0) next[cn] = Object.fromEntries(entries);
      }
      result = next;
    }

    return result;
  }, [grouped, typeFilter, searchQuery]);

  const allClasses = useMemo(() => Object.keys(grouped), [grouped]);
  const allSubjects = useMemo(() => {
    if (classFilter && filteredGrouped[classFilter]) {
      return Object.keys(filteredGrouped[classFilter]);
    }
    const subjects = new Set<string>();
    Object.values(grouped).forEach((s) => Object.keys(s).forEach((subj) => subjects.add(subj)));
    return Array.from(subjects).sort();
  }, [grouped, filteredGrouped, classFilter]);

  const activeFilterCount = [typeFilter !== "all", !!classFilter, !!subjectFilter, !!searchQuery].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setClassFilter("");
    setSubjectFilter("");
  };

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

  const isLoading = lessonPlansQuery.isLoading;
  const sortedClasses = sortClasses(Object.keys(filteredGrouped));

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <DashboardBannerHeader
        titleTop="Saved"
        titleHighlight="Resources"
        imageSrc="/assets/illustrations/saved-resources-header.png"
      />

      <div className="rounded-[22px] border border-teachpad-cardBorder bg-white/86 p-3 shadow-[0_14px_35px_var(--teachpad-shadowCard)] backdrop-blur-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teachpad-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by class, subject, chapter, topic..."
                className="pl-9 pr-9 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-teachpad-muted hover:text-teachpad-ink">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-[140px]">
                <option value="all">All Types</option>
                <option value="lesson plan">Lesson Plans</option>
                <option value="worksheet">Worksheets</option>
              </Select>

              {allClasses.length > 0 && (
                <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSubjectFilter(""); }} className="w-[130px]">
                  <option value="">All Classes</option>
                  {sortClasses(allClasses).map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              )}

              {allSubjects.length > 0 && (
                <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="w-[130px]">
                  <option value="">All Subjects</option>
                  {allSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {isLoading ? (
        <div className="grid gap-5">
          {[1, 2, 3].map((i) => <ClassSectionSkeleton key={i} />)}
        </div>
      ) : sortedClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-teachpad-cardBorder bg-white/70 p-8 text-center shadow-[0_14px_35px_var(--teachpad-shadowCard)] backdrop-blur-sm">
            <PastelIconTile name="search" className="mb-4 h-16 w-16" />
            <h3 className="text-lg font-bold text-teachpad-ink">
              {activeFilterCount > 0 ? "No resources match your filters" : "No saved resources yet"}
            </h3>
            <p className="mt-2 max-w-sm text-center text-sm text-teachpad-muted">
              {activeFilterCount > 0 ? "Try adjusting your search or filters." : "Generate a lesson plan or worksheet to start building your library."}
            </p>
            {activeFilterCount > 0 ? (
              <Button variant="secondary" onClick={clearFilters} className="mt-4">Clear all filters</Button>
            ) : (
              <div className="mt-5 flex gap-3">
                <Link href="/dashboard/lesson-plans/new">
                  <Button><PastelIconTile name="bookOpen" className="h-5 w-5 rounded-md" /> Create Lesson Plan</Button>
                </Link>
                <Link href="/dashboard/worksheets/new">
                  <Button variant="secondary"><PastelIconTile name="clipboardList" className="h-5 w-5 rounded-md" /> Create Worksheet</Button>
                </Link>
              </div>
            )}
          </div>
      ) : (
        <div className="grid gap-5">
          {sortedClasses.map((className) => {
            const subjects = filteredGrouped[className];
            if (!subjects) return null;
            const sortedSubjects = Object.keys(subjects).sort();
            const classTotal = sortedSubjects.reduce(
              (acc, s) => acc + subjects[s].lessonPlans.length + subjects[s].worksheets.length, 0
            );
            return (
              <ClassSection
                key={className}
                className={className}
                subjects={subjects}
                sortedSubjects={sortedSubjects}
                onViewResources={(subject) => setDetailView({ className, subject })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClassSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-[24px] border border-teachpad-cardBorder bg-white/82 p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)] backdrop-blur-sm">
      <div className="mb-5 h-6 w-32 rounded-lg bg-teachpad-tag" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-[20px] border border-teachpad-cardBorder bg-gradient-to-br from-teachpad-tag to-white" />
        ))}
      </div>
    </div>
  );
}

function ClassSection({
  className,
  subjects,
  sortedSubjects,
  onViewResources,
}: {
  className: string;
  subjects: GroupedData[string];
  sortedSubjects: string[];
  onViewResources: (subject: string) => void;
}) {
  const totalPlans = sortedSubjects.reduce((s, sub) => s + subjects[sub].lessonPlans.length, 0);
  const totalWorksheets = sortedSubjects.reduce((s, sub) => s + subjects[sub].worksheets.length, 0);
  const latestDate = sortedSubjects
    .flatMap((sub) => [...subjects[sub].lessonPlans, ...subjects[sub].worksheets])
    .map((r) => new Date(r.createdAt || 0).getTime())
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  return (
    <div className="rounded-[24px] border border-teachpad-cardBorder bg-white/84 p-5 shadow-[0_18px_45px_var(--teachpad-shadowCard)] backdrop-blur-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <PastelIconTile name="graduationCap" className="h-14 w-14" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-teachpad-ink">{className}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-teachpad-muted">
              <span className="flex items-center gap-1.5">
                <PastelIconTile name="bookOpen" className="h-5 w-5 rounded-md" />
                {totalPlans} {totalPlans === 1 ? "Lesson Plan" : "Lesson Plans"}
              </span>
              <span className="flex items-center gap-1.5">
                <PastelIconTile name="clipboardList" className="h-5 w-5 rounded-md" />
                {totalWorksheets} {totalWorksheets === 1 ? "Worksheet" : "Worksheets"}
              </span>
              {latestDate ? (
                <span className="text-teachpad-muted">
                  Last saved {new Date(latestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              ) : null}
            </div>
        </div>
      </div>
      </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedSubjects.map((subject) => {
            const { lessonPlans, worksheets } = subjects[subject];
            const total = lessonPlans.length + worksheets.length;
            const subjectLatest = [...lessonPlans, ...worksheets]
              .map((r) => new Date(r.createdAt || 0).getTime())
              .filter(Boolean)
              .sort((a, b) => b - a)[0];
            return (
              <button
                key={subject}
                onClick={() => onViewResources(subject)}
                className="clickable-card premium-hover group rounded-[20px] border border-teachpad-cardBorder bg-gradient-to-br from-white to-teachpad-panel p-4 text-left shadow-[0_12px_26px_var(--teachpad-shadowToolCard)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg [--clickable-card-hover-bg:linear-gradient(135deg,#cff7fb_0%,#ffffff_74%)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <PastelIconTile name={worksheets.length > lessonPlans.length ? "clipboardList" : "bookOpen"} className="h-11 w-11" />
                    <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-teachpad-ink">{subject}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-teachpad-blue">
                        Plans {lessonPlans.length}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-teachpad-green px-2 py-0.5 text-xs font-semibold text-[#5c8f19]">
                        Sheets {worksheets.length}
                      </span>
                    </div>
                    {subjectLatest ? (
                      <p className="mt-2 text-xs text-teachpad-muted">
                        {new Date(subjectLatest).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    ) : null}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-teachpad-muted transition-all group-hover:translate-x-0.5 group-hover:text-teachpad-blue" />
                </div>
                <div className="mt-3 border-t border-teachpad-cardBorder pt-3">
                  <span className="text-xs font-semibold text-teachpad-blue group-hover:text-blue-700">
                    View {total} resource{total !== 1 ? "s" : ""} →
                  </span>
                </div>
              </button>
            );
          })}
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
  const [tab, setTab] = useState<"all" | "lesson plan" | "worksheet">("all");

  const subjectResources = useMemo(() => {
    return resources.filter(
      (r) => r.className === className && r.subject === subject
    );
  }, [resources, className, subject]);

  const filtered = useMemo(() => {
    if (tab === "all") return subjectResources;
    return subjectResources.filter((r) => r.type === tab);
  }, [subjectResources, tab]);

  const handleDelete = useCallback(async (resource: ResourceItem) => {
    try {
      if (resource.type === "worksheet") {
        deleteWorksheetGeneration(resource.id);
        toast({ title: "Deleted", description: "Worksheet removed." });
      } else {
        await backendApi.deleteLessonPlan(resource.id);
        queryClient.invalidateQueries({ queryKey: ["resources-lesson-plans"] });
        toast({ title: "Deleted", description: "Lesson plan removed." });
      }
    } catch {
      toast({ title: "Delete failed", description: "Could not delete. Please try again." });
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
      } else {
        const { downloadWorksheetPdf } = await import("@/lib/worksheet-export");
        await downloadWorksheetPdf(resource.raw.output_json);
        toast({ title: "PDF downloaded" });
      }
    } catch {
      window.print();
    }
  }, [toast]);

  const lessonPlanCount = subjectResources.filter((r) => r.type === "lesson plan").length;
  const worksheetCount = subjectResources.filter((r) => r.type === "worksheet").length;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-teachpad-cardBorder" />
        <PastelIconTile name="folderOpen" className="h-12 w-12" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold text-teachpad-ink">{className} · {subject}</h1>
          <p className="text-xs text-teachpad-muted sm:text-sm">
            {lessonPlanCount} Lesson Plan{lessonPlanCount !== 1 ? "s" : ""} · {worksheetCount} Worksheet{worksheetCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="inline-flex rounded-[16px] border border-teachpad-cardBorder bg-white/70 p-1 shadow-[0_8px_24px_var(--teachpad-shadowCard)] backdrop-blur-sm">
        {(["all", "lesson plan", "worksheet"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2 text-xs sm:text-sm font-semibold transition-all rounded-xl ${
              tab === t
                ? "bg-white text-teachpad-ink shadow-sm"
                : "text-teachpad-muted hover:text-teachpad-ink"
            }`}
          >
            {t === "all" ? "All" : t === "lesson plan" ? "Lesson Plans" : "Worksheets"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-teachpad-cardBorder bg-white/70 p-8 text-center shadow-[0_14px_35px_var(--teachpad-shadowCard)] backdrop-blur-sm">
          <PastelIconTile name="fileText" className="mb-4 h-16 w-16" />
          <h3 className="text-lg font-bold text-teachpad-ink">No saved resources yet for this class and subject.</h3>
          <p className="mt-2 text-center text-sm text-teachpad-muted">Be the first to create something for {className} {subject}.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/dashboard/lesson-plans/new">
              <Button><PastelIconTile name="bookOpen" className="h-5 w-5 rounded-md" /> Create Lesson Plan</Button>
            </Link>
            <Link href="/dashboard/worksheets/new">
              <Button variant="secondary"><PastelIconTile name="clipboardList" className="h-5 w-5 rounded-md" /> Create Worksheet</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource, i) => (
            <ResourceCard
              key={`${resource.type}-${resource.id}`}
              resource={resource}
              index={i}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({
  resource,
  index,
  onDelete,
  onDownload,
}: {
  resource: ResourceItem;
  index: number;
  onDelete: (r: ResourceItem) => void;
  onDownload: (r: ResourceItem) => void;
}) {
  const isWorksheet = resource.type === "worksheet";

  return (
    <div
      className="reveal-card overflow-hidden rounded-[20px] border border-teachpad-cardBorder bg-white/84 shadow-[0_12px_30px_var(--teachpad-shadowCard)] backdrop-blur-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <PastelIconTile name={isWorksheet ? "clipboardList" : "bookOpen"} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold leading-tight text-teachpad-ink">{resource.title}</h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-teachpad-muted">
              {resource.chapterName || "No chapter"}
            </p>
          </div>
          <Badge className={`shrink-0 text-[10px] ${isWorksheet ? "border-teachpad-green bg-teachpad-green text-[#5c8f19]" : "border-blue-100 bg-blue-50 text-teachpad-blue"}`}>
            {isWorksheet ? "Worksheet" : "Lesson Plan"}
          </Badge>
        </div>

        <div className="mb-3 flex items-center gap-3 text-xs text-teachpad-muted">
          {resource.type === "lesson plan" && resource.raw?.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" /> {resource.raw.duration_minutes} min
            </span>
          )}
          {resource.type === "worksheet" && resource.raw?.output_json?.metadata?.question_count && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" /> {resource.raw.output_json.metadata.question_count} Qs
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {new Date(resource.createdAt || 0).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        <div className="flex gap-2">
          <Link href={resource.href} target="_blank" className="flex-1">
            <Button variant="default" size="sm" className="w-full gap-1.5 text-xs">
              <PastelIconTile name="arrowRight" className="h-4 w-4 rounded" /> View
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => onDownload(resource)} className="flex-1 gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(resource)} className="px-2 text-red-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
