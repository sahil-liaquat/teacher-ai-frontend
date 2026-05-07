"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  BookOpen,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  Lightbulb,
  MoreVertical,
  Pencil,
  Save,
  Share2,
  Target,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  applyLessonPlanEdits,
  arrayOf,
  normalizeLessonPlan,
  type LessonAssessment,
  type LessonOutlineRow,
  type NormalizedLessonPlan
} from "@/lib/lesson-plan-export";

const differentiationLabels: Record<string, string> = {
  below_grade_level: "Below Grade Level",
  on_grade_level: "On Grade Level",
  above_grade_level: "Above Grade Level",
  language_support: "Language Support",
  support: "Support",
  core: "Core",
  challenge: "Challenge"
};

function formatDifferentiationLabel(key: string) {
  return differentiationLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function LessonPlanOutput({
  output,
  streamKey,
  streamSpeed = "normal",
  onSave,
  onExport,
  onCopy
}: {
  output: any;
  streamKey?: string;
  streamSpeed?: "normal" | "fast" | "instant";
  onSave?: () => void;
  onExport?: () => void;
  onCopy?: () => void;
}) {
  const metadata = output?.metadata || {};
  const outline = output?.lesson_outline || [];
  const objectives = output?.learning_objectives || [];
  const concepts = output?.key_concepts || [];
  const strategies = output?.teaching_method_strategy || [];
  const materials = output?.materials_needed || [];
  const title = output?.title || "Generated Lesson Plan";
  const strategyDescription = output?.classroom_activity || "Insufficient textbook content available for this section.";
  const hasStructuredLessonPlan = Boolean(
    output?.previous_knowledge ||
    output?.introduction_warm_up ||
    output?.explanation_of_concept ||
    output?.chemical_properties_main_concept_details ||
    output?.board_work ||
    output?.learning_outcome
  );
  const structuredSections = useMemo(
    () => [
      { key: "previous", number: "2", title: "Previous Knowledge", icon: BookOpen, tone: "cyan" as const, value: output?.previous_knowledge },
      { key: "materials", number: "3", title: "Teaching-Learning Materials", icon: Box, tone: "cyan" as const, value: materials },
      { key: "introduction", number: "4", title: "Introduction / Warm-up", icon: Lightbulb, tone: "amber" as const, value: output?.introduction_warm_up },
      { key: "explanation", number: "5", title: "Explanation of Concept", icon: BookOpen, tone: "indigo" as const, value: output?.explanation_of_concept },
      { key: "features", number: "6", title: "Physical Properties / Key Features", icon: CheckCircle2, tone: "pink" as const, value: output?.physical_properties_key_features?.length ? output.physical_properties_key_features : concepts },
      { key: "activity", number: "7", title: "Activity", icon: Users, tone: "emerald" as const, value: output?.classroom_activity || output?.activity },
      { key: "details", number: "8", title: "Chemical Properties / Main Concept Details", icon: ClipboardCheck, tone: "indigo" as const, value: output?.chemical_properties_main_concept_details },
      { key: "uses", number: "9", title: "Uses / Daily Life Connection", icon: Target, tone: "emerald" as const, value: output?.uses_daily_life_connection },
      { key: "assessment", number: "10", title: "Assessment / Check for Understanding", icon: ClipboardCheck, tone: "amber" as const, value: output?.assessment_questions || [] },
      { key: "board", number: "11", title: "Board Work", icon: Pencil, tone: "cyan" as const, value: output?.board_work },
      { key: "homework", number: "12", title: "Homework", icon: FileText, tone: "pink" as const, value: output?.homework },
      { key: "outcome", number: "13", title: "Learning Outcome", icon: Target, tone: "emerald" as const, value: output?.learning_outcome }
    ],
    [concepts, materials, output]
  );
  const streamSpecs = useMemo(
    () => [
      { key: "title", length: title.length },
      { key: "objectives", length: textLength(objectives) },
      ...structuredSections.map((section) => ({ key: section.key, length: textLength(valueToLines(section.value)) })),
      { key: "outline", length: textLength(outline.map((item: any) => `${item.phase}. ${item.teacher_action}. ${item.student_action}`)) },
      { key: "concepts", length: textLength(concepts) },
      { key: "strategy", length: textLength(strategies) + strategyDescription.length },
      { key: "differentiation", length: textLength(Object.values(output?.differentiation || {})) },
      { key: "assessment", length: textLength((output?.assessment_questions || []).map((item: any) => item.question)) },
      { key: "materials", length: textLength(materials) },
      { key: "notes", length: String(output?.teacher_notes || "").length }
    ],
    [concepts, materials, objectives, outline, output, strategies, strategyDescription, structuredSections, title]
  );
  const stream = useProgressiveStream(streamSpecs, Boolean(output), streamSpeed, streamKey);
  const typedTitle = stream.text("title", title);

  return (
    <div className="mx-auto min-w-0 max-w-[1180px] 2xl:max-w-[1440px]">
      <div className="overflow-hidden rounded-[24px] border border-[#ebe7f4] bg-white shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#fbf6ff] to-white px-4 py-6 sm:px-8 sm:py-8">
          <Link href="/dashboard/lesson-plans/new">
            <Button variant="outline" size="sm" className="mb-7 border-[#dac6f6] text-[#7a43e8]">
              Back to Inputs
            </Button>
          </Link>
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-lg font-black text-[#101039]">Generated Lesson Plan</h1>
                <Badge className="bg-[#f0e5ff] text-[#7a43e8]">AI Generated</Badge>
              </div>
              <h2 className="mt-4 max-w-4xl break-words text-[30px] font-black tracking-tight text-[#101039] 2xl:mt-5 2xl:text-4xl">
                {typedTitle}
                {!stream.done("title") ? <TypingCursor /> : null}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <MetaBadge color="indigo" icon={Lightbulb} label={metadata.subject || "Subject"} />
                <MetaBadge color="cyan" icon={BookOpen} label={metadata.class ? `${metadata.class} Grade` : "Class"} />
                <MetaBadge color="emerald" icon={Target} label={metadata.duration || "Duration"} />
                <MetaBadge color="amber" icon={FileText} label={metadata.chapter || "Chapter"} />
                <MetaBadge color="blue" icon={BookOpen} label={metadata.book || "Book"} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm"><Pencil className="h-4 w-4" /> Edit Plan</Button>
              <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4" /> Download</Button>
              <Button variant="outline" size="sm"><Share2 className="h-4 w-4" /> Share</Button>
              <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="absolute bottom-0 right-10 hidden h-36 w-96 lg:block opacity-80">
            <div className="absolute bottom-0 right-0 h-20 w-56 rounded-t-full bg-blue-100" />
            <div className="absolute bottom-0 right-40 h-20 w-20 bg-indigo-400" />
            <div className="absolute bottom-0 right-28 h-28 w-10 bg-indigo-600" />
            <div className="absolute bottom-0 right-12 h-8 w-20 rounded-t-lg bg-amber-300" />
            <div className="absolute bottom-0 right-64 h-16 w-12 rounded-t-lg bg-purple-400" />
          </div>
        </div>

        <div className="grid min-w-0 gap-5 px-4 pb-5 pt-5 sm:px-6 sm:pb-6 2xl:gap-6 2xl:px-8 2xl:pb-8 2xl:pt-6">
          {stream.visible("objectives") ? (
            <NumericCard number="1" title="Learning Objectives" icon={Target} tone="indigo">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <ul className="grid gap-3 text-sm leading-6 text-slate-700">
                  {streamLines(stream, "objectives", objectives.length ? objectives : ["Insufficient textbook content available for this section."]).map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <span>{item}{index === streamLines(stream, "objectives", objectives).length - 1 && !stream.done("objectives") ? <TypingCursor /> : null}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </NumericCard>
          ) : <StreamingPlaceholder title="Learning objectives" />}

          {hasStructuredLessonPlan ? structuredSections.map((section) => (
            stream.visible(section.key) ? (
              <NumericCard key={section.key} number={section.number} title={section.title} icon={section.icon} tone={section.tone}>
                <StructuredSectionContent value={section.value} stream={stream} streamKeyName={section.key} />
              </NumericCard>
            ) : <StreamingPlaceholder key={section.key} title={section.title} />
          )) : null}

          {!hasStructuredLessonPlan ? (
            <>
          {stream.visible("outline") ? (
            <NumericCard number="2" title="Lesson Outline" icon={ClipboardCheck} tone="indigo">
              <div className="grid gap-0 overflow-hidden rounded-lg border border-slate-200">
                {outline.map((item: any, index: number) => {
                const tone = timelineTones[index % timelineTones.length];
                const textBudget = Math.max(0, stream.count("outline") - outline.slice(0, index).reduce((sum: number, previous: any) => sum + `${previous.phase}. ${previous.teacher_action}. ${previous.student_action}`.length, 0));
                if (textBudget <= 0) return null;
                return (
                  <div key={index} className="grid min-w-0 border-b border-slate-200 last:border-b-0 md:grid-cols-[120px_minmax(0,1fr)]">
                    <div className={`flex items-center gap-3 border-r border-slate-200 p-4 ${tone.bg}`}>
                      <div className={`grid h-10 w-10 place-items-center rounded-full text-white ${tone.icon}`}>
                        {index === 0 ? <Lightbulb className="h-5 w-5" /> : index === 1 ? <BookOpen className="h-5 w-5" /> : index === 2 ? <Users className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
                      </div>
                      <span className="font-black text-slate-900 text-sm">{item.time || "10 min"}</span>
                    </div>
                    <div className="bg-white p-4">
                      <p className="font-black text-slate-900">{item.phase}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{String(item.teacher_action || "").slice(0, textBudget)}{!stream.done("outline") && index === Math.min(outline.length - 1, Math.max(0, Math.floor(stream.count("outline") / 120))) ? <TypingCursor /> : null}</p>
                      {textBudget > String(item.teacher_action || "").length ? (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold text-slate-500">Student Action:</p>
                          <ul className="list-disc list-inside text-sm leading-6 text-slate-600 space-y-1">
                            {String(item.student_action || "").slice(0, textBudget - String(item.teacher_action || "").length).split('\n').map((line, i) => line.trim() && <li key={i}>{line.trim()}</li>)}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              </div>
            </NumericCard>
          ) : <StreamingPlaceholder title="Lesson outline" />}

          {stream.visible("concepts") ? (
            <NumericCard number="3" title="Key Concepts" icon={Lightbulb} tone="pink">
              <div className="grid gap-4 md:grid-cols-2">
                {streamLines(stream, "concepts", concepts.slice(0, 4)).map((item: string, index: number) => (
                  <ConceptCard key={index}>{item}{index === streamLines(stream, "concepts", concepts.slice(0, 4)).length - 1 && !stream.done("concepts") ? <TypingCursor /> : null}</ConceptCard>
                ))}
              </div>
            </NumericCard>
          ) : <StreamingPlaceholder title="Key concepts" />}

          {stream.visible("strategy") ? (
            <NumericCard number="4" title="Teaching Method & Strategy" icon={CheckCircle2} tone="emerald">
              <div className="flex flex-wrap gap-2 mb-4">
                {streamLines(stream, "strategy", strategies).map((item: string, index: number) => (
                  <Badge key={index} className="bg-emerald-100 px-3 py-1.5 text-emerald-700 text-xs font-semibold">
                    {item}
                  </Badge>
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-700">
                {stream.text("strategy", strategyDescription)}
                {!stream.done("strategy") ? <TypingCursor /> : null}
              </p>
            </NumericCard>
          ) : <StreamingPlaceholder title="Teaching strategy" />}

          {stream.visible("assessment") ? (
            <NumericCard number="5" title="Assessment Questions" icon={ClipboardCheck} tone="amber">
              <div className="grid gap-3">
                {streamLines(stream, "assessment", (output?.assessment_questions || []).slice(0, 5).map((item: any) => item.question)).map((question: string, index: number) => (
                  <div key={index} className="grid min-w-0 grid-cols-[40px_minmax(0,1fr)] items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-amber-300 bg-white font-black text-amber-600 text-xs">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{question}{index === streamLines(stream, "assessment", []).length - 1 && !stream.done("assessment") ? <TypingCursor /> : null}</p>
                      <p className="text-xs text-slate-500 mt-1">({output?.assessment_questions?.[index]?.marks || 1} mark{(output?.assessment_questions?.[index]?.marks || 1) > 1 ? 's' : ''})</p>
                    </div>
                  </div>
                ))}
              </div>
            </NumericCard>
          ) : <StreamingPlaceholder title="Assessment questions" />}

          {stream.visible("materials") ? (
            <NumericCard number="6" title="Materials Needed" icon={Box} tone="cyan">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {streamLines(stream, "materials", materials).map((item: string, index: number) => (
                  <div key={index} className="grid min-h-24 place-items-center rounded-lg border border-slate-200 bg-slate-50 p-4 text-center hover:bg-cyan-50 transition-colors">
                    <div>
                      <BookOpen className="mb-2 h-6 w-6 text-cyan-600 mx-auto" />
                      <span className="text-sm font-semibold text-slate-900">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </NumericCard>
          ) : <StreamingPlaceholder title="Materials needed" />}

          {stream.visible("differentiation") ? (
            <NumericCard number="7" title="Differentiation" icon={Users} tone="indigo">
              <div className="grid gap-3">
                {Object.entries(output?.differentiation || {}).map(([key, value]) => (
                  <div key={key} className="grid min-w-0 gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                    <Badge className="justify-center bg-indigo-100 py-2 text-xs font-semibold text-indigo-700">
                      {formatDifferentiationLabel(key)}
                    </Badge>
                    <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">{stream.text("differentiation", String(value))}</div>
                  </div>
                ))}
              </div>
            </NumericCard>
          ) : <StreamingPlaceholder title="Differentiation" />}
            </>
          ) : null}
        </div>

        <div className="px-4 pb-6 sm:px-8 sm:pb-8">
          <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black text-slate-900 flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-600 text-white font-black text-sm">{hasStructuredLessonPlan ? "14" : "8"}</span>
                      Teacher Notes
                    </h3>
                    {stream.visible("notes") ? (
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {stream.text("notes", output?.teacher_notes || "")}
                        {!stream.done("notes") ? <TypingCursor /> : null}
                      </p>
                    ) : <p className="mt-3 text-sm font-medium text-slate-500">Waiting for teacher notes<TypingCursor /></p>}
                  </div>
                  <div className="hidden rotate-3 rounded-lg bg-amber-300 px-4 py-3 text-center text-xs font-black shadow-md md:block flex-shrink-0">
                    Great<br />Teaching!
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={onSave} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"><FileText className="h-4 w-4" /> Edit Plan</Button>
            <Button variant="outline" onClick={onExport} className="border-slate-300 text-slate-600 hover:bg-slate-100"><Download className="h-4 w-4" /> Download PDF</Button>
            <Button variant="outline" onClick={onCopy} className="border-slate-300 text-slate-600 hover:bg-slate-100"><Share2 className="h-4 w-4" /> Share Plan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorksheetOutput({
  output,
  tab,
  setTab,
  onSave,
  onExport,
  onCopy
}: {
  output: any;
  tab: string;
  setTab: (tab: string) => void;
  onSave?: () => void;
  onExport?: () => void;
  onCopy?: () => void;
}) {
  const metadata = output?.metadata || {};
  const sections = output?.student_worksheet?.sections || [];
  const title = output?.title || "Worksheet";
  const grade = metadata.grade ? `Grade ${metadata.grade}` : metadata.class || "Class";
  const subject = metadata.subject || "Subject";
  const chapter = metadata.chapter || "Chapter";
  const topic = metadata.topic || title;

  return (
    <div className="mx-auto max-w-[1060px] 2xl:max-w-[1180px]">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .worksheet-print-page { box-shadow: none !important; border: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
          .print-shell { padding: 0 !important; }
        }
      `}</style>

      <div className="no-print mb-5 rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_12px_30px_rgba(39,30,91,0.05)] 2xl:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-[#101039]">Generated Worksheet</h1>
              <Badge className="bg-[#dbfae6] text-[#218e55]">Printable A4</Badge>
            </div>
            <p className="mt-2 text-sm font-medium text-[#67627d]">{grade} • {subject} • {chapter}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onCopy}><Copy className="h-4 w-4" /> Copy</Button>
            <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4" /> PDF</Button>
            <Button size="sm" onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>

        <div className="mt-4 flex rounded-[14px] border border-[#ebe7f4] bg-[#fbfaff] p-1">
          {["Worksheet", "Answer Key", "Marking Scheme"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-10 flex-1 rounded-[10px] text-sm font-bold ${tab === item ? "bg-[#2585ff] text-white shadow-sm" : "text-[#67627d]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === "Worksheet" ? (
        <article className="worksheet-print-page w-full max-w-none border border-[#dfe8f7] bg-white px-4 py-6 font-serif text-[14px] leading-6 text-black shadow-[0_18px_48px_rgba(39,30,91,0.10)] sm:px-8 sm:py-8 md:px-10 lg:px-12 lg:py-11 lg:text-[15px]">
          <header className="grid min-w-0 gap-4 font-sans sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
            <div className="min-w-0">
              <h2 className="break-words text-[19px] font-black leading-tight text-[#0b7cff] sm:text-[22px]">{grade} - {subject}</h2>
              <p className="mt-1 break-words text-[16px] font-black leading-snug text-[#2f83ff] sm:text-[18px]">{topic}</p>
              <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-700">Chapter: {chapter}</p>
              <p className="mt-1 break-words text-[11px] font-bold uppercase leading-5 tracking-[0.08em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">{metadata.board || "Board"} • {metadata.book || "Textbook"}</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#d6e8ff] text-center text-[11px] font-black text-[#2585ff] sm:h-16 sm:w-16 sm:text-xs">
              TAI
            </div>
          </header>

          <div className="mt-7 grid gap-4 font-sans text-sm font-black sm:mt-10 sm:grid-cols-2 sm:gap-7">
            <div className="flex min-w-0 items-end gap-2">Name:<span className="h-5 min-w-0 flex-1 border-b border-slate-400" /></div>
            <div className="flex min-w-0 items-end gap-2">Date:<span className="h-5 min-w-0 flex-1 border-b border-slate-400" /></div>
          </div>
          <div className="mt-3 border-b-2 border-[#b7d8ff]" />

          <section className="mt-5 rounded-[8px] bg-[#eef6ff] p-3 font-sans sm:p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900 sm:text-sm">Instructions</h3>
            <p className="mt-1 break-words text-[13px] font-semibold italic leading-6 text-[#0b7cff] sm:text-sm">
              {output?.instructions || "Read each question carefully and answer in the space provided. For MCQs, choose the correct option. Answer all questions."}
            </p>
          </section>

          <div className="mt-7 grid gap-6 sm:mt-8 sm:gap-7">
            {sections.map((section: any, sectionIndex: number) => (
              <section key={`${section.section_title}-${sectionIndex}`} className="break-inside-avoid">
                <div className="mb-4 flex min-w-0 items-start gap-3 font-sans">
                  <span className="shrink-0 text-xl font-black leading-6 text-[#2585ff]">≡</span>
                  <h3 className="min-w-0 flex-1 break-words text-[15px] font-black leading-6 text-[#0b7cff] sm:text-[17px]">{section.section_title}</h3>
                  {section.marks ? <span className="shrink-0 pt-1 text-xs font-black text-slate-500">{section.marks} marks</span> : null}
                </div>
                <div className="grid gap-4 sm:gap-5">
                  {(section.questions || []).map((question: any, index: number) => (
                    <WorksheetQuestion key={index} question={question} index={index} questionType={section.question_type || section.section_title} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 flex flex-col gap-1 border-t border-[#cfe4ff] pt-3 font-sans text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Generated by Teacher AI Tools</span>
            <span>Textbook-grounded worksheet</span>
          </footer>
        </article>
      ) : tab === "Answer Key" ? (
        <AnswerKeyView items={output?.answer_key || []} />
      ) : (
        <MarkingSchemeView items={output?.marking_scheme || []} />
      )}
    </div>
  );
}

function WorksheetQuestion({ question, index, questionType }: { question: any; index: number; questionType: string }) {
  const left = question.left_column || question.left || [];
  const right = question.right_column || question.right || [];
  const options = question.options || [];
  const lineCount = Number(question.answer_lines || defaultAnswerLines(questionType));

  return (
    <div className="min-w-0 break-inside-avoid">
      <p className="break-words font-serif text-[14px] leading-6 sm:text-[15px]">
        <span className="mr-3 font-sans font-black">{index + 1}.</span>{question.question}
      </p>
      {options.length ? (
        <div className="mt-2 grid gap-x-10 gap-y-2 pl-5 font-sans text-[13px] sm:grid-cols-2 sm:pl-9 sm:text-sm">
          {options.map((option: string, optionIndex: number) => (
            <span key={`${option}-${optionIndex}`} className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-[#b7d8ff]" />
              <span className="min-w-0 break-words">{option}</span>
            </span>
          ))}
        </div>
      ) : null}
      {left.length && right.length ? (
        <div className="mt-3 overflow-x-auto rounded-[6px] border border-[#b7d8ff] font-sans text-[13px] sm:text-sm">
          <table className="w-full min-w-[420px] table-fixed border-collapse">
            <thead className="bg-[#eef6ff] text-left text-[#0b7cff]">
              <tr><th className="w-1/2 border-r border-[#b7d8ff] px-3 py-2">Column A</th><th className="px-3 py-2">Column B</th></tr>
            </thead>
            <tbody>
              {left.map((item: string, rowIndex: number) => (
                <tr key={`${item}-${rowIndex}`} className="border-t border-[#dcecff]">
                  <td className="break-words border-r border-[#dcecff] px-3 py-2">{rowIndex + 1}. {item}</td>
                  <td className="break-words px-3 py-2">{String.fromCharCode(65 + rowIndex)}. {right[rowIndex] || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {!options.length && !left.length ? <AnswerLines count={lineCount} /> : null}
    </div>
  );
}

function AnswerLines({ count }: { count: number }) {
  return (
    <div className="mt-2 grid gap-2 pl-5 sm:pl-9">
      {Array.from({ length: Math.max(1, Math.min(count, 6)) }).map((_, index) => (
        <span key={index} className="h-5 border-b border-dashed border-[#b7d8ff]" />
      ))}
    </div>
  );
}

function defaultAnswerLines(questionType: string) {
  const type = questionType.toLowerCase();
  if (type.includes("long")) return 5;
  if (type.includes("application")) return 3;
  if (type.includes("short")) return 2;
  if (type.includes("one word")) return 1;
  return 1;
}

function AnswerKeyView({ items }: { items: any[] }) {
  return (
    <section className="rounded-[18px] border border-[#dfe8f7] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.05)] 2xl:p-7">
      <h2 className="text-xl font-black text-[#101039]">Answer Key</h2>
      <div className="mt-5 grid gap-4">
        {items.map((section, index) => (
          <div key={`${section.section_title}-${index}`} className="rounded-[14px] border border-[#ebe7f4] bg-[#fbfcff] p-4">
            <h3 className="font-black text-[#0b7cff]">{section.section_title || `Section ${index + 1}`}</h3>
            <ol className="mt-3 grid gap-2 text-sm font-medium text-[#33304a]">
              {(section.answers || []).map((answer: any, answerIndex: number) => (
                <li key={answerIndex} className="flex gap-2"><span className="font-black">{answerIndex + 1}.</span><span>{String(answer)}</span></li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarkingSchemeView({ items }: { items: any[] }) {
  return (
    <section className="rounded-[18px] border border-[#dfe8f7] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.05)] 2xl:p-7">
      <h2 className="text-xl font-black text-[#101039]">Marking Scheme</h2>
      <div className="mt-5 grid gap-4">
        {items.map((section, index) => (
          <div key={`${section.section_title}-${index}`} className="rounded-[14px] border border-[#ebe7f4] bg-[#fbfcff] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-[#0b7cff]">{section.section_title || `Section ${index + 1}`}</h3>
              {section.marks_per_question ? <Badge>{section.marks_per_question}</Badge> : null}
            </div>
            <ul className="mt-3 grid gap-2 text-sm font-medium text-[#33304a]">
              {(section.guidelines || []).map((item: any, itemIndex: number) => (
                <li key={itemIndex} className="flex gap-2"><span className="font-black text-[#2585ff]">•</span><span>{String(item)}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoCard({
  title,
  icon: Icon,
  tone,
  className,
  children
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof sectionTones;
  className?: string;
  children: ReactNode;
}) {
  const colors = sectionTones[tone];
  return (
    <section className={`rounded-xl border border-[#e4e8f3] bg-white p-5 shadow-[0_12px_30px_rgba(31,42,87,0.04)] ${className || ""}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-full ${colors.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-black text-[#081436]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function NumericCard({
  number,
  title,
  icon: Icon,
  tone,
  className,
  children
}: {
  number: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof numericCardTones;
  className?: string;
  children: ReactNode;
}) {
  const colors = numericCardTones[tone];
  return (
    <section className={`rounded-[18px] border border-[#ebe7f4] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-6 ${className || ""}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-full font-black text-white text-sm ${colors.badge}`}>
          {number}
        </div>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MetaBadge({
  color,
  icon: Icon,
  label
}: {
  color: keyof typeof metaTones;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Badge className={`${metaTones[color]} gap-2 px-4 py-2 text-sm font-semibold`}>
      <Icon className="h-4 w-4" />
      {label}
    </Badge>
  );
}

function ConceptCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[#f4c8d0] bg-[#fff3f6] p-4 text-sm leading-6 text-[#55516e]">
      <CheckCircle2 className="mb-3 h-4 w-4 text-rose-500" />
      {children}
    </div>
  );
}

function StructuredSectionContent({
  value,
  stream,
  streamKeyName
}: {
  value: unknown;
  stream: ReturnType<typeof useProgressiveStream>;
  streamKeyName: string;
}) {
  const lines = valueToLines(value);
  const visibleLines = streamLines(stream, streamKeyName, lines.length ? lines : ["Textbook content was insufficient for this section."]);
  if (!visibleLines.length) return <p className="text-sm font-medium text-slate-500">Preparing section<TypingCursor /></p>;

  if (visibleLines.length === 1) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {visibleLines[0]}
        {!stream.done(streamKeyName) ? <TypingCursor /> : null}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 text-sm leading-6 text-slate-700">
      {visibleLines.map((line, index) => (
        <li key={`${streamKeyName}-${index}`} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
          <span>
            {line}
            {index === visibleLines.length - 1 && !stream.done(streamKeyName) ? <TypingCursor /> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StreamingPlaceholder({ title, className }: { title: string; className?: string }) {
  return (
    <section className={`rounded-[18px] border border-[#ebe7f4] bg-white p-5 shadow-[0_12px_30px_rgba(31,42,87,0.04)] ${className || ""}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#f1edff] text-[#6d38f2]">
          <SparkleDot />
        </div>
        <h3 className="text-lg font-black text-[#081436]">{title}</h3>
      </div>
      <p className="text-sm font-medium leading-6 text-[#67728a]">Waiting for {title.toLowerCase()}<TypingCursor /></p>
    </section>
  );
}

function SparkleDot() {
  return <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#6d38f2]" />;
}

function TypingCursor() {
  return <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[#6d38f2]" />;
}

function textLength(value: unknown): number {
  if (Array.isArray(value)) return value.map(String).join("\n").length || 1;
  return String(value || "").length || 1;
}

function valueToLines(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(valueToLines).filter(Boolean);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("question" in record) return [String(record.question || "")];
    if ("feature" in record || "textbook_detail" in record) {
      return [`${record.feature || "Feature"}: ${record.textbook_detail || ""}`.trim()];
    }
    return Object.entries(record).map(([key, item]) => `${formatDifferentiationLabel(key)}: ${String(item || "")}`);
  }
  return String(value).split(/\n+/).map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

function useProgressiveStream(
  specs: Array<{ key: string; length: number }>,
  enabled: boolean,
  speed: "normal" | "fast" | "instant" = "normal",
  streamKey = "",
) {
  const signature = `${streamKey}|${speed}|${specs.map((item) => `${item.key}:${item.length}`).join("|")}`;
  const [activeIndex, setActiveIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const instant = speed === "instant";

  useEffect(() => {
    setActiveIndex(0);
    setCharCount(0);
  }, [signature]);

  useEffect(() => {
    if (!enabled || !specs.length || instant) return;
    const current = specs[activeIndex];
    if (!current) return;
    const increment = speed === "fast" ? 42 : 16;
    const intervalMs = speed === "fast" ? 8 : 12;
    const sectionDelay = speed === "fast" ? 45 : 90;
    const interval = window.setInterval(() => {
      setCharCount((count) => {
        if (count >= current.length) {
          return count;
        }
        const next = Math.min(count + increment, current.length);
        if (next >= current.length) {
          if (activeIndex < specs.length - 1) {
            window.setTimeout(() => {
              setActiveIndex((index) => Math.min(index + 1, specs.length - 1));
              setCharCount(0);
            }, sectionDelay);
          }
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [activeIndex, enabled, instant, speed, specs]);

  return {
    visible: (key: string) => {
      if (instant) return true;
      const index = specs.findIndex((item) => item.key === key);
      return index >= 0 && index <= activeIndex;
    },
    done: (key: string) => {
      if (instant) return true;
      const index = specs.findIndex((item) => item.key === key);
      return index >= 0 && (index < activeIndex || (index === activeIndex && charCount >= specs[index].length));
    },
    count: (key: string) => {
      const index = specs.findIndex((item) => item.key === key);
      if (index < 0) return 0;
      if (instant) return specs[index].length;
      if (index < activeIndex) return specs[index].length;
      if (index === activeIndex) return charCount;
      return 0;
    },
    text: (key: string, text: string) => {
      const index = specs.findIndex((item) => item.key === key);
      if (instant) return text;
      if (index < 0 || index < activeIndex) return text;
      if (index > activeIndex) return "";
      return text.slice(0, charCount);
    }
  };
}

function streamLines(stream: ReturnType<typeof useProgressiveStream>, key: string, lines: unknown[]): string[] {
  const budget = stream.count(key);
  const visible: string[] = [];
  let used = 0;
  for (const line of lines.map(String)) {
    if (used >= budget) break;
    const remaining = budget - used;
    visible.push(line.slice(0, remaining));
    used += line.length + 1;
  }
  return visible.filter(Boolean);
}

const metaTones = {
  indigo: "bg-[#f0e5ff] text-[#7a43e8]",
  cyan: "bg-[#e3f8ff] text-[#1482a8]",
  emerald: "bg-[#dbfae6] text-[#218e55]",
  amber: "bg-[#fff0d8] text-[#bc7619]",
  blue: "bg-[#e3f0ff] text-[#2c75d0]"
};

const numericCardTones = {
  indigo: { badge: "bg-[#7a43e8]" },
  pink: { badge: "bg-[#f05b7a]" },
  emerald: { badge: "bg-[#24a760]" },
  amber: { badge: "bg-[#d88920]" },
  cyan: { badge: "bg-[#2c75d0]" }
};

const sectionTones = {
  indigo: { icon: "bg-indigo-100 text-indigo-600" },
  pink: { icon: "bg-rose-100 text-rose-600" },
  emerald: { icon: "bg-emerald-100 text-emerald-600" },
  blue: { icon: "bg-blue-100 text-blue-600" },
  amber: { icon: "bg-amber-100 text-amber-600" }
};

const timelineTones = [
  { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", panel: "bg-white" },
  { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", panel: "bg-white" },
  { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", panel: "bg-white" },
  { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600", panel: "bg-white" },
  { bg: "bg-cyan-50", icon: "bg-cyan-100 text-cyan-600", panel: "bg-white" }
];
