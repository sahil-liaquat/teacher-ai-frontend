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
            <div className="grid gap-4 xl:grid-cols-[auto_1fr_auto] xl:items-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eee7ff] text-primary"><BookOpen className="h-6 w-6" /></div>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{plan.topic}</h3><Badge>Lesson Plan</Badge><Badge className="bg-[#eef8f1] text-[#166534]">{plan.subject}</Badge></div><p className="mt-1 text-sm leading-6 text-slate-600">{[plan.class_name, plan.chapter_name, `${plan.duration_minutes} min`].filter(Boolean).join(" • ")}</p></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm"><Eye className="h-4 w-4" /> Open</Button><Button variant="outline" size="sm"><CalendarDays className="h-4 w-4" /> {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : "Saved"}</Button></div>
            </div>
          </Link>
        )) : !plans.isLoading ? <Card><CardContent className="p-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f3edff] text-primary"><BookOpen className="h-7 w-7" /></div><h3 className="text-lg font-black text-slate-950">No lesson plans yet.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Generate your first textbook-grounded lesson plan.</p><Link href="/dashboard/lesson-plans/new"><Button className="mt-5">Create Lesson Plan</Button></Link></CardContent></Card> : null}
      </div>
    </div>
  );
}
