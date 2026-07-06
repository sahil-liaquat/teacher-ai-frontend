"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Eye, Sparkles } from "lucide-react";
import { backendApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LessonPlansListPage() {
  const plans = useQuery({ queryKey: ["lesson-plans-list"], queryFn: () => backendApi.lessonPlans(0, 50) });
  return (
    <div className="space-y-6">
      <PageHeader title="Lesson Plans" description="AI-generated lesson plans saved from your existing FastAPI backend." actions={<Link href="/dashboard/lesson-plans/new"><Button><Sparkles className="h-4 w-4" /> New Lesson Plan</Button></Link>} />
      {plans.isLoading ? <Card><CardContent className="p-6 text-sm font-semibold text-[#6d6f78]">Loading saved lesson plans...</CardContent></Card> : null}
      {plans.error ? <Card><CardContent className="p-6 text-red-700">{getErrorMessage(plans.error, "Could not load lesson plans")}</CardContent></Card> : null}
      <div className="grid gap-4">
        {plans.data?.items?.length ? plans.data.items.map((plan, index) => (
          <Link key={plan.id} href={`/dashboard/lesson-plans/${plan.id}`} className="clickable-card premium-hover reveal-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm [--clickable-card-hover-bg:linear-gradient(135deg,#dbeafe_0%,#ffffff_74%)]" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eee7ff] text-primary sm:h-12 sm:w-12 sm:rounded-2xl">
                  <BookOpen className="h-5.5 w-5.5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-955 text-[14px] sm:text-[15.5px] leading-snug break-words">
                    {plan.topic}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <Badge className="text-[10px] px-1.5 py-0.5 font-semibold">Lesson Plan</Badge>
                    <Badge className="bg-[#eef8f1] text-[#166534] text-[10px] px-1.5 py-0.5 font-semibold">{plan.subject}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                    {[plan.class_name, plan.chapter_name, `${plan.duration_minutes} min`].filter(Boolean).join(" • ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0 self-end sm:self-center justify-end sm:justify-start">
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold px-3 flex-1 sm:flex-initial justify-center">
                  <Eye className="h-3.5 w-3.5 mr-1" /> Open
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold text-slate-500 px-3 flex-1 sm:flex-initial justify-center">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" /> {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "Saved"}
                </Button>
              </div>
            </div>
          </Link>
        )) : !plans.isLoading ? <Card><CardContent className="p-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f3edff] text-primary"><BookOpen className="h-7 w-7" /></div><h3 className="text-lg font-black text-slate-950">No lesson plans yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Generate your first textbook-grounded lesson plan.</p><Link href="/dashboard/lesson-plans/new"><Button className="mt-5">Create Lesson Plan</Button></Link></CardContent></Card> : null}
      </div>
    </div>
  );
}
