"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ClipboardCheck, Download, ExternalLink, Search, Sparkles } from "lucide-react";
import { backendApi } from "@/lib/api";
import { listWorksheetGenerations, WORKSHEET_STORAGE_EVENT } from "@/lib/worksheet-storage";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function ResourcesPage() {
  const resources = useQuery({ queryKey: ["resources-lesson-plans"], queryFn: () => backendApi.lessonPlans(0, 50) });
  const [worksheets, setWorksheets] = useState<any[]>([]);
  const savedResources = useMemo(() => {
    const lessonPlans = (resources.data?.items || []).map((resource: any) => ({
      id: resource.id,
      title: resource.topic || resource.chapter_name || "Generated Lesson Plan",
      subject: resource.subject,
      className: resource.class_name,
      chapterName: resource.chapter_name,
      detail: [resource.class_name, resource.chapter_name, `${resource.duration_minutes} min`].filter(Boolean).join(" • "),
      href: `/dashboard/lesson-plans/${resource.id}`,
      type: "lesson plan",
      createdAt: resource.created_at || resource.updated_at || "",
    }));
    const worksheetItems = worksheets.map((resource: any) => {
      const output = resource.output_json || {};
      const metadata = output.metadata || {};
      const chapters = metadata.chapter || metadata.topic || "";
      return {
        id: resource.id,
        title: output.title || metadata.topic || "Generated Worksheet",
        subject: metadata.subject || "Worksheet",
        className: metadata.grade ? `Grade ${metadata.grade}` : metadata.class,
        chapterName: chapters,
        detail: [metadata.grade ? `Grade ${metadata.grade}` : metadata.class, chapters, metadata.question_count ? `${metadata.question_count} questions` : ""].filter(Boolean).join(" • "),
        href: `/dashboard/worksheets/${resource.id}`,
        type: "worksheet",
        createdAt: resource.created_at || "",
      };
    });
    return [...lessonPlans, ...worksheetItems].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [resources.data?.items, worksheets]);

  useEffect(() => {
    function syncWorksheets() {
      setWorksheets(listWorksheetGenerations());
    }
    syncWorksheets();
    window.addEventListener(WORKSHEET_STORAGE_EVENT, syncWorksheets);
    window.addEventListener("storage", syncWorksheets);
    return () => {
      window.removeEventListener(WORKSHEET_STORAGE_EVENT, syncWorksheets);
      window.removeEventListener("storage", syncWorksheets);
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Saved Resources" description="Your saved lesson plans and worksheets." actions={<Link href="/dashboard/lesson-plans/new"><Button><Sparkles className="h-4 w-4" /> New Plan</Button></Link>} />
      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9 w-full" placeholder="Search resources" /></div>
          <Select className="w-full"><option>All types</option><option>Lesson plan</option><option>Worksheet</option></Select>
          <Input placeholder="Class" className="w-full" />
          <Input placeholder="Subject" className="w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><CardTitle className="text-2xl text-slate-950">Your Library</CardTitle><CardDescription>Card-table hybrid view optimized for scanning and quick actions.</CardDescription></div><Badge className="bg-blue-50 text-blue-700">{savedResources.length} items</Badge></CardHeader>
        <CardContent className="grid gap-4">
          {savedResources.length ? savedResources.map((resource, index) => <ResourceRow key={`${resource.type}-${resource.id}`} resource={resource} index={index} />) : <div className="rounded-2xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg"><BookOpen className="h-7 w-7 text-blue-600" /></div><h3 className="text-lg font-black text-slate-950">No saved resources yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Generate a lesson plan or worksheet to build your teaching library.</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}

function ResourceRow({ resource, index }: { resource: any; index: number }) {
  const isWorksheet = resource.type === "worksheet";
  const Icon = isWorksheet ? ClipboardCheck : BookOpen;
  return (
    <div className="premium-hover reveal-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] items-start sm:items-center">
        <div className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl ${isWorksheet ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-600"}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{resource.title}</h3>
            <Badge>{resource.type}</Badge>
            <Badge className="bg-emerald-50 text-emerald-700 hidden sm:inline-flex">{resource.subject}</Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-1">{resource.detail || "Ready to open and export"}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Link href={resource.href} className="flex-1 sm:flex-none"><Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm"><ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Open</span></Button></Link>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="flex-1 sm:flex-none text-xs sm:text-sm"><Download className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Download</span></Button>
        </div>
      </div>
    </div>
  );
}
