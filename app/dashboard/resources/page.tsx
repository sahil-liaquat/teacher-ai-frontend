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
      <Card><CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_150px_150px_150px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search resources" /></div><Select><option>All types</option><option>Lesson plan</option><option>Worksheet</option></Select><Input placeholder="Class" /><Input placeholder="Subject" /></CardContent></Card>
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
  return <div className="premium-hover reveal-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{ animationDelay: `${index * 60}ms` }}><div className="grid gap-4 xl:grid-cols-[auto_1fr_auto] xl:items-center"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${isWorksheet ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-600"}`}><Icon className="h-6 w-6" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{resource.title}</h3><Badge>{resource.type}</Badge><Badge className="bg-[#eef8f1] text-[#166534]">{resource.subject}</Badge></div><p className="mt-1 text-sm leading-6 text-slate-600">{resource.detail || "Ready to open and export"}</p></div><div className="flex flex-wrap gap-2"><Link href={resource.href}><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /> Open</Button></Link><Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-4 w-4" /> Download</Button></div></div></div>;
}
