"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CheckCircle2, Link2, LockKeyhole } from "lucide-react";
import { backendApi, type PrimaryAcademicYear } from "@/lib/api";
import { curriculumHref } from "@/lib/school-admin-curriculum";
import { Button } from "@/components/ui/button";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";

export function SettingsWorkspace() {
  const years = useQuery<PrimaryAcademicYear[]>({ queryKey: ["school-admin", "academic-years"], queryFn: backendApi.schoolAdminAcademicYears });
  const current = years.data?.find((year) => year.is_active);
  // "no years at all" and "years exist but none is current" need different
  // wording: the second is fixable in one click, and it is why every
  // readiness figure on the other screens reads zero.
  const hasYears = Boolean(years.data?.length);
  return <SchoolAdminPage>
    <PageHeading eyebrow="School controls" title="Settings" description="Only settings backed by real school-wide behavior appear here. Curriculum content is managed in its own workspace." />
    {years.isError ? <PageError description="The school-wide curriculum settings could not be loaded." onRetry={() => void years.refetch()} /> : <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><CalendarDays className="h-5 w-5" /></span><h2 className="mt-5 text-lg font-semibold text-slate-950">Current academic year</h2><p className="mt-2 text-sm leading-6 text-slate-600">{current ? <><strong className="font-semibold text-slate-900">{current.name}</strong> is the default context used by school admin and teacher-facing primary curriculum.</> : hasYears ? <>No academic year is set as current, so curriculum readiness reads zero everywhere. Open academic years and choose <strong className="font-semibold text-slate-900">Make current</strong> on the year you are planning.</> : "No academic year exists yet. Create one to give drafts and published curriculum a school context."}</p><Link href="/school-admin/academic-years" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">{hasYears && !current ? "Choose a current year" : "Manage academic years"} <ArrowRight className="h-4 w-4" /></Link></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole className="h-5 w-5" /></span><h2 className="mt-5 text-lg font-semibold text-slate-950">Publishing safety</h2><p className="mt-2 text-sm leading-6 text-slate-600">School drafts stay private until an administrator reviews and publishes them. TeachPad master lessons remain read-only.</p><div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Always on</div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Link2 className="h-5 w-5" /></span><h2 className="mt-5 text-lg font-semibold text-slate-950">Shareable curriculum context</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Academic year, level, month, teaching day, and classroom block selections are kept in the curriculum URL. Links return administrators to the same planning context without creating a hidden preference.</p><Link href={curriculumHref({ year: current?.id, level: "nursery" })} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:border-blue-200 hover:text-blue-700">Open curriculum <ArrowRight className="h-4 w-4" /></Link></section>
    </div>}
    <p className="text-sm leading-6 text-slate-500">School profile, users, billing, and notifications are not exposed here because this release does not have school-scoped persistence for those controls.</p>
  </SchoolAdminPage>;
}
