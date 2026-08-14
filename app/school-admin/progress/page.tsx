"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading, SchoolAdminPage, SectionHeading } from "@/components/school-admin/shared/page-primitives";

/**
 * Progress — the monitoring layer, foundation only.
 *
 * ⚠ Shows no metrics. Curriculum coverage is the one question the existing data
 * can already answer, and it is answered today inside the curriculum workspace;
 * duplicating a partial version here would create a second number for the same
 * thing. When the assessment chain lands this page becomes the place those
 * numbers live, and the link below is the honest interim answer.
 */

const QUESTIONS = [
  "What curriculum was planned?",
  "What was actually taught?",
  "What remains?",
  "Which outcomes were assessed?",
  "What evidence exists?",
  "Where are classes falling behind?",
];

const SURFACES = [
  { label: "Curriculum coverage", note: "Planned versus published teaching days.", ready: true },
  { label: "Teaching progress", note: "What teachers have delivered.", ready: false },
  { label: "Learning outcome coverage", note: "Which outcomes have been taught and checked.", ready: false },
  { label: "Assessment completion", note: "Which assessments are done.", ready: false },
  { label: "Curriculum gaps", note: "Where the plan has holes.", ready: false },
  { label: "Teacher planning status", note: "Who is ready for next week.", ready: false },
];

export default function SchoolProgressPage() {
  return (
    <SchoolAdminPage>
      <PageHeading
        eyebrow="Progress"
        title="Progress & monitoring"
        description="Whether the curriculum this school adopted is actually reaching classrooms."
      />

      <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">Foundation only</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/80">
          Most of these measures depend on the assessment chain, which does not record data
          yet. Rather than show a dashboard of zeroes that look like real findings, this
          page names the questions it will answer and points at the one surface that can
          already answer part of it.
        </p>
        <Link
          href="/school-admin/curriculum"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-900 hover:border-amber-400"
        >
          See curriculum coverage <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <SectionHeading title="The questions this layer owns" />
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {QUESTIONS.map((question) => (
            <li key={question} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {question}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <SectionHeading
          title="Planned surfaces"
          description="Marked honestly: one of these has data behind it today, the rest do not."
        />
        <ul className="mt-5 divide-y divide-slate-100">
          {SURFACES.map(({ label, note, ready }) => (
            <li key={label} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm font-bold text-slate-900">{label}</span>
                <span className="block text-xs text-slate-500">{note}</span>
              </span>
              <span
                className={
                  ready
                    ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700"
                    : "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500"
                }
              >
                {ready ? "Has data" : "Not yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </SchoolAdminPage>
  );
}
