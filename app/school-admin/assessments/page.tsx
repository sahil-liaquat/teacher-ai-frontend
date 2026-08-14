"use client";

import { ClipboardCheck, FileText, Camera, FolderOpen, MessageSquare, Mic } from "lucide-react";
import { PageHeading, SchoolAdminPage, SectionHeading } from "@/components/school-admin/shared/page-primitives";

/**
 * Assessments — architectural foundation, not yet an operational surface.
 *
 * ⚠ Deliberately shows no data and offers no actions. The assessment domain
 * boundary is real (see the chain below) but nothing writes to it yet, and a
 * screen full of plausible-looking empty widgets would read as a product that
 * works and is merely unused. This page states what it is instead.
 */

const EVIDENCE_KINDS = [
  { icon: FileText, label: "Quiz & worksheet", note: "Generated material, marked and mapped back to outcomes." },
  { icon: Camera, label: "Observation", note: "What a teacher saw, captured in the moment." },
  { icon: FolderOpen, label: "Project & portfolio", note: "Extended work gathered over a term." },
  { icon: ClipboardCheck, label: "Rubric", note: "Criterion-referenced judgement, not just a mark." },
  { icon: Mic, label: "Oral assessment", note: "Spoken performance, especially in early years." },
  { icon: MessageSquare, label: "Teacher note", note: "Professional judgement recorded as evidence." },
];

export default function SchoolAssessmentsPage() {
  return (
    <SchoolAdminPage>
      <PageHeading
        eyebrow="Assessments"
        title="Assessment & evidence"
        description="How this school checks what students have learned, tied to the curriculum outcomes it teaches."
      />

      <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">Foundation only</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/80">
          The assessment domain is defined and tenant-scoped, but no assessment can be
          recorded yet. This surface exists so the boundary is built correctly before data
          arrives — deliberately empty rather than showing figures nothing produces.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <SectionHeading
          title="The chain this is being built on"
          description="Assessment is meaningful only when it points back at a learning outcome. Marks alone are not the model."
        />
        <ol className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold">
          {["Learning outcome", "Teaching", "Assessment", "Evidence", "Student progress"].map(
            (step, index, all) => (
              <li key={step} className="flex items-center gap-2">
                <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">{step}</span>
                {index < all.length - 1 ? <span className="text-slate-300">→</span> : null}
              </li>
            ),
          )}
        </ol>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
        <SectionHeading
          title="Evidence types the model must carry"
          description="A curriculum that is thematic or competency-based cannot be assessed by marks alone, so the foundation is evidence-shaped from the start."
        />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EVIDENCE_KINDS.map(({ icon: Icon, label, note }) => (
            <li key={label} className="rounded-2xl border border-slate-200 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-900">{label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
            </li>
          ))}
        </ul>
      </section>
    </SchoolAdminPage>
  );
}
