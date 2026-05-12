"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
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
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

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
  const lower = raw.toLowerCase();
  if (lower.includes("class 1") || lower === "1") return "Class 1";
  if (lower.includes("class 2") || lower === "2") return "Class 2";
  if (lower.includes("class 3") || lower === "3") return "Class 3";
  if (lower.includes("class 4") || lower === "4") return "Class 4";
  if (lower.includes("class 5") || lower === "5") return "Class 5";
  if (lower.includes("class 6") || lower === "6") return "Class 6";
  if (lower.includes("class 7") || lower === "7") return "Class 7";
  if (lower.includes("class 8") || lower === "8") return "Class 8";
  if (lower.includes("class 9") || lower === "9") return "Class 9";
  if (lower.includes("class 10") || lower === "10") return "Class 10";
  if (lower.includes("class 11") || lower === "11") return "Class 11";
  if (lower.includes("class 12") || lower === "12") return "Class 12";
  if (lower.match(/grade\s*1/i) || lower === "grade 1") return "Class 1";
  if (lower.match(/grade\s*2/i) || lower === "grade 2") return "Class 2";
  if (lower.match(/grade\s*3/i) || lower === "grade 3") return "Class 3";
  if (lower.match(/grade\s*4/i) || lower === "grade 4") return "Class 4";
  if (lower.match(/grade\s*5/i) || lower === "grade 5") return "Class 5";
  if (lower.match(/grade\s*6/i) || lower === "grade 6") return "Class 6";
  if (lower.match(/grade\s*7/i) || lower === "grade 7") return "Class 7";
  if (lower.match(/grade\s*8/i) || lower === "grade 8") return "Class 8";
  if (lower.match(/grade\s*9/i) || lower === "grade 9") return "Class 9";
  if (lower.match(/grade\s*10/i) || lower === "grade 10") return "Class 10";
  if (lower.match(/grade\s*11/i) || lower === "grade 11") return "Class 11";
  if (lower.match(/grade\s*12/i) || lower === "grade 12") return "Class 12";
  const match = raw.match(/^(Class|Grade)\s*(\d+)/i);
  if (match) return `Class ${match[2]}`;
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
    <div className="space-y-5">
      <PageHeader
        title="Saved Resources"
        description="Find your saved lesson plans and worksheets by class and subject."
        actions={
          <Link href="/dashboard/lesson-plans/new">
            <Button><Sparkles className="h-4 w-4" /> New Plan</Button>
          </Link>
        }
      />

      <div className="rounded-[20px] border border-white/70 bg-white/80 p-3 sm:p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by class, subject, chapter, topic..."
                className="pl-9 pr-9 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
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
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 text-slate-500">
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
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-white shadow-md">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {activeFilterCount > 0 ? "No resources match your filters" : "No saved resources yet"}
            </h3>
            <p className="mt-2 text-sm text-slate-600 text-center max-w-sm">
              {activeFilterCount > 0 ? "Try adjusting your search or filters." : "Generate a lesson plan or worksheet to start building your library."}
            </p>
            {activeFilterCount > 0 ? (
              <Button variant="secondary" onClick={clearFilters} className="mt-4">Clear all filters</Button>
            ) : (
              <div className="mt-5 flex gap-3">
                <Link href="/dashboard/lesson-plans/new">
                  <Button><BookOpen className="h-4 w-4" /> Create Lesson Plan</Button>
                </Link>
                <Link href="/dashboard/worksheets/new">
                  <Button variant="secondary"><ClipboardCheck className="h-4 w-4" /> Create Worksheet</Button>
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
    <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-slate-200 mb-5" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-[20px] bg-gradient-to-br from-slate-50 to-white border border-white/70" />
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
    <div className="premium-hover rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">{className}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                {totalPlans} {totalPlans === 1 ? "Lesson Plan" : "Lesson Plans"}
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                {totalWorksheets} {totalWorksheets === 1 ? "Worksheet" : "Worksheets"}
              </span>
              {latestDate ? (
                <span className="text-slate-400">
                  Last saved {new Date(latestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              ) : null}
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
                className="premium-hover group text-left rounded-[20px] border border-white/70 bg-white/50 p-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{subject}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        <BookOpen className="h-3 w-3" /> {lessonPlans.length}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        <ClipboardCheck className="h-3 w-3" /> {worksheets.length}
                      </span>
                    </div>
                    {subjectLatest ? (
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(subjectLatest).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">
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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="h-5 w-px bg-slate-200" />
        <div>
          <h1 className="text-lg font-extrabold text-slate-950">{className} · {subject}</h1>
          <p className="text-sm text-slate-500">
            {lessonPlanCount} Lesson Plan{lessonPlanCount !== 1 ? "s" : ""} · {worksheetCount} Worksheet{worksheetCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        {(["all", "lesson plan", "worksheet"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "all" ? "All" : t === "lesson plan" ? "Lesson Plans" : "Worksheets"}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-8 shadow-[0_14px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-white shadow-md">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No saved resources yet for this class and subject.</h3>
          <p className="mt-2 text-sm text-slate-600 text-center">Be the first to create something for {className} {subject}.</p>
          <div className="mt-5 flex gap-3">
            <Link href="/dashboard/lesson-plans/new">
              <Button><BookOpen className="h-4 w-4" /> Create Lesson Plan</Button>
            </Link>
            <Link href="/dashboard/worksheets/new">
              <Button variant="secondary"><ClipboardCheck className="h-4 w-4" /> Create Worksheet</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((resource, i) => (
            <ResourceListItem
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

function ResourceListItem({
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
  const [showActions, setShowActions] = useState(false);
  const Icon = isWorksheet ? ClipboardCheck : BookOpen;

  return (
    <div
      className="premium-hover reveal-card rounded-[20px] border border-white/70 bg-white/80 p-3 sm:p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-200"
      style={{ animationDelay: `${index * 40}ms` }}
    >
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isWorksheet ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold text-slate-900 text-sm">{resource.title}</h3>
            <Badge
              className={`text-xs ${isWorksheet ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
            >
              {isWorksheet ? "Worksheet" : "Lesson Plan"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {resource.chapterName ? `${resource.chapterName}` : ""}
            {resource.type === "lesson plan" && resource.raw?.duration_minutes ? ` · ${resource.raw.duration_minutes} min` : ""}
            {resource.type === "worksheet" && resource.raw?.output_json?.metadata?.question_count ? ` · ${resource.raw.output_json.metadata.question_count} Qs` : ""}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 shrink-0">
          {new Date(resource.createdAt || 0).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <div className="relative shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
            onClick={() => setShowActions(!showActions)}
          >
            <span className="text-xs font-bold">•••</span>
          </Button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-2xl border border-slate-200 bg-white p-1 shadow-xl">
                <button
                  onClick={() => { window.open(resource.href, "_blank"); setShowActions(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" /> Open
                </button>
                <button
                  onClick={() => { onDownload(resource); setShowActions(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  onClick={() => { onDelete(resource); setShowActions(false); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }