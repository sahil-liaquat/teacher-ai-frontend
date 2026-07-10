"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, CalendarDays, Eye, Sparkles } from "lucide-react";
import { backendApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorksheetsListPage() {
  const worksheets = useQuery({ queryKey: ["worksheets-list"], queryFn: () => backendApi.worksheets(0, 50) });
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <PageHeader title="Worksheets" description="AI-generated worksheets saved from your existing FastAPI backend." actions={<Link href="/dashboard/worksheets/new"><Button><Sparkles className="h-4 w-4" /> New Worksheet</Button></Link>} />
      {worksheets.isLoading ? <Card><CardContent className="p-6 text-sm font-semibold text-[#6d6f78]">Loading saved worksheets...</CardContent></Card> : null}
      {worksheets.error ? <Card><CardContent className="p-6 text-red-700">{getErrorMessage(worksheets.error, "Could not load worksheets")}</CardContent></Card> : null}
      <div className="grid gap-4">
        {worksheets.data?.items?.length ? worksheets.data.items.map((worksheet, index) => {
          const output = worksheet.output_json || {};
          const metadata = output.metadata || {};
          const topic = output.title || metadata.topic || "Generated Worksheet";
          const subject = metadata.subject || "Science";
          const class_name = metadata.grade ? `Grade ${metadata.grade}` : metadata.class || "Class";
          const chapter_name = metadata.chapter || "";

          return (
            <Link key={worksheet.id} href={`/dashboard/worksheets/${worksheet.id}`} className="clickable-card premium-hover-sm reveal-card relative overflow-hidden rounded-[18px] border border-white/70 bg-gradient-to-br from-white via-emerald-50/70 to-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] [--clickable-card-hover-bg:linear-gradient(135deg,#e6fbf4_0%,#ffffff_74%)]" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/88 text-[#159565] shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)] ring-1 ring-emerald-100 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <ClipboardCheck className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-950 text-[14px] sm:text-[15.5px] leading-snug break-words">
                      {topic}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge className="text-[10px] px-1.5 py-0.5 font-semibold">Worksheet</Badge>
                      <Badge className="bg-[#eef8f1] text-[#166534] text-[10px] px-1.5 py-0.5 font-semibold">{subject}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                      {[class_name, chapter_name].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0 self-end sm:self-center justify-end sm:justify-start">
                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-3 flex-1 sm:flex-initial justify-center rounded-full">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Open
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-slate-500 px-3 flex-1 sm:flex-initial justify-center rounded-full">
                    <CalendarDays className="h-3.5 w-3.5 mr-1" /> {worksheet.created_at ? new Date(worksheet.created_at).toLocaleDateString() : "Saved"}
                  </Button>
                </div>
              </div>
            </Link>
          );
        }) : !worksheets.isLoading ? <Card><CardContent className="p-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#ecfff7] text-[#159565]"><ClipboardCheck className="h-7 w-7" /></div><h3 className="text-lg font-black text-slate-950">No worksheets yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Generate your first textbook-grounded worksheet.</p><Link href="/dashboard/worksheets/new"><Button className="mt-5">Create Worksheet</Button></Link></CardContent></Card> : null}
      </div>
    </div>
  );
}
