"use client";

import Link from "next/link";
import { createElement, useEffect, useMemo, useState } from "react";
import type { ComponentType, FocusEvent, KeyboardEvent, ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Box,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  FileText,
  Lightbulb,
  MoreVertical,
  PanelRight,
  Pencil,
  Save,
  Share2,
  Target,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OutputMetadataFooter } from "@/components/output-metadata-footer";
import {
  arrayOf,
  normalizeLessonPlan,
  textOf,
  type LessonOutlineRow,
} from "@/lib/lesson-plan-export";
import { Badge } from "@/components/ui/badge";

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

type LessonDocumentMetadata = {
  subject: string;
  class: string;
  chapter: string;
  chapter_number?: string;
  duration: string;
  book: string;
  topic: string;
  board: string;
};

type LessonDocumentSection = {
  key: string;
  title: string;
  lines?: string[];
  outline?: LessonOutlineRow[];
  children?: LessonDocumentSection[];
};

type LessonDocumentDraft = {
  title: string;
  metadata: LessonDocumentMetadata;
  sections: LessonDocumentSection[];
};

function LessonPlanDocumentOutput({
  output,
  onSave,
  onChange,
  onExport,
  onCopy,
  onShare
}: {
  output: any;
  onSave?: (output?: any) => void;
  onChange?: (output?: any) => void;
  onExport?: (output?: any) => void;
  onCopy?: (output?: any) => void;
  onShare?: (output?: any) => void;
}) {
  const [documentOutput, setDocumentOutput] = useState(output);
  const [draft, setDraft] = useState<LessonDocumentDraft>(() => buildLessonDocumentDraft(output));
  const chapterDisplay = formatChapterDisplay(draft.metadata);

  useEffect(() => {
    setDocumentOutput(output);
    setDraft(buildLessonDocumentDraft(output));
  }, [output]);

  function commitDraft(nextDraft: LessonDocumentDraft, notifyChange = true) {
    setDraft(nextDraft);
    const nextOutput = applyLessonDocumentDraft(documentOutput, nextDraft);
    setDocumentOutput(nextOutput);
    if (notifyChange) onChange?.(nextOutput);
    return nextOutput;
  }

  function updateDraft(updater: (current: LessonDocumentDraft) => LessonDocumentDraft) {
    commitDraft(updater(draft));
  }

  function saveDocument() {
    onSave?.(applyLessonDocumentDraft(documentOutput, draft));
  }

  return (
    <div className="w-full max-w-none">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .lesson-plan-print-page { box-shadow: none !important; border: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
          .print-shell { padding: 0 !important; }
        }
      `}</style>

      <div className="no-print mb-5 border-b border-[#dffafa] bg-white pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#6d6f78]">
            <Link href="/dashboard/lesson-plans/new" className="inline-flex items-center gap-1 text-[#1677ff]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Inputs
            </Link>
            <span>/</span>
            <span>Lesson Plan Output</span>
          </div>
          <h1 className="mt-2 break-words text-2xl font-black leading-tight text-[#25262b] sm:text-[28px]">
            {chapterDisplay}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#6d6f78]">
            {formatGradeValue(draft.metadata.class)} • {formatMetadataValue(draft.metadata.subject)} • {formatMetadataValue(draft.metadata.chapter)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onCopy?.(documentOutput)}><Copy className="h-4 w-4" /> Copy</Button>
          <Button variant="outline" size="sm" onClick={() => onExport?.(documentOutput)}><Download className="h-4 w-4" /> PDF</Button>
          {onShare ? <Button variant="outline" size="sm" onClick={() => onShare(documentOutput)}><Share2 className="h-4 w-4" /> Share</Button> : null}
          {onSave ? <Button variant="outline" size="sm" onClick={saveDocument}><Save className="h-4 w-4" /> Save</Button> : null}
        </div>
        </div>
      </div>

      <div className="min-w-0">
        <article className="lesson-plan-print-page min-w-0 border border-[#d8d3e5] bg-white px-4 py-6 font-serif text-[14px] leading-6 text-black shadow-[0_18px_48px_rgba(39,30,91,0.06)] sm:px-8 sm:py-8 md:px-10 lg:px-12 lg:py-11 lg:text-[15px]">
          <header className="grid min-w-0 gap-4 border-b border-slate-300 pb-5 font-sans sm:gap-6">
            <div className="grid gap-5">
              <div className="min-w-0">
                <EditableText
                  as="h2"
                  value={draft.title}
                  onCommit={(title) => updateDraft((current) => ({ ...current, title }))}
                  className="break-words text-[20px] font-black leading-tight tracking-normal text-black sm:text-[24px]"
                  ariaLabel="Document title"
                  singleLine
                />
                <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-700">
                  <span>Chapter: </span>
                  <EditableText
                    as="span"
                    value={formatChapterDisplay(draft.metadata)}
                    onCommit={(chapter) => updateDraft((current) => ({ ...current, metadata: { ...current.metadata, chapter } }))}
                    ariaLabel="Lesson chapter"
                    singleLine
                  />
                </p>
                <p className="mt-1 break-words text-[11px] font-bold uppercase leading-5 tracking-[0.08em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                  {formatMetadataValue(draft.metadata.board || "Board")}
                  <span> • </span>
                  {formatMetadataValue(draft.metadata.book || "Textbook")}
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-0">
            {draft.sections.map((section, index) => (
              <LessonSectionBlock
                key={section.key}
                index={index}
                section={section}
                onSectionChange={(nextSection) => {
                  updateDraft((current) => ({
                    ...current,
                    sections: current.sections.map((item) => item.key === section.key ? nextSection : item)
                  }));
                }}
              />
            ))}
          </div>

          <OutputMetadataFooter
            subject={draft.metadata.subject}
            grade={formatGradeValue(draft.metadata.class)}
            chapter={draft.metadata.chapter}
            source={draft.metadata.book}
            generatedAt={documentOutput?.generated_at || documentOutput?.created_at || documentOutput?.updated_at}
          />
        </article>
      </div>
    </div>
  );
}

function LessonSectionBlock({
  index,
  section,
  onSectionChange,
}: {
  index: number;
  section: LessonDocumentSection;
  onSectionChange?: (section: LessonDocumentSection) => void;
}) {
  const id = lessonSectionId(section.title);
  const hasContent = section.outline?.length || section.lines?.length || section.children?.length;

  return (
    <section
      id={id}
      className="grid gap-4 break-inside-avoid border-b border-slate-200 py-6 transition last:border-b-0"
    >
      <div className="min-w-0">
        <h3 className="break-words font-sans text-[15px] font-black leading-6 text-black sm:text-[17px]">
          <span>{index + 1}. </span>
          <EditableText
            as="span"
            value={section.title}
            onCommit={(title) => onSectionChange?.({ ...section, title })}
            ariaLabel={`Section ${index + 1} heading`}
            singleLine
          />
        </h3>
        <div className="mt-4">
          {section.outline ? (
            <LessonFlowBlock
              rows={section.outline}
              onRowsChange={(outline) => onSectionChange?.({ ...section, outline })}
            />
          ) : section.children?.length ? null : (
            <LessonBulletList
              lines={section.lines || []}
              onLinesChange={(lines) => onSectionChange?.({ ...section, lines })}
            />
          )}
          {section.children?.length ? (
            <div className="mt-5 grid gap-4 border-l-2 border-slate-200 pl-4">
              {section.children.map((child, childIndex) => (
                <div key={child.key || `${child.title}-${childIndex}`}>
                  <div className="flex items-start gap-2">
                    <span className="pt-0.5 font-sans text-[14px] font-black text-black sm:text-[15px]">
                      {toRoman(childIndex + 1)}.
                    </span>
                    <EditableText
                      as="h4"
                      value={child.title}
                      onCommit={(title) => onSectionChange?.({
                        ...section,
                        children: section.children?.map((item, index) => index === childIndex ? { ...item, title } : item)
                      })}
                      className="font-sans text-[14px] font-black text-black sm:text-[15px]"
                      ariaLabel={`Subheading ${childIndex + 1}`}
                      singleLine
                    />
                  </div>
                  <div className="mt-2">
                    <LessonBulletList
                      lines={child.lines || []}
                      onLinesChange={(lines) => onSectionChange?.({
                        ...section,
                        children: section.children?.map((item, index) => index === childIndex ? { ...item, lines } : item)
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {!hasContent ? <LessonEmptyLine /> : null}
        </div>
      </div>
    </section>
  );
}

function toRoman(value: number) {
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"]
  ];
  let remaining = value;
  let result = "";
  for (const [amount, label] of numerals) {
    while (remaining >= amount) {
      result += label;
      remaining -= amount;
    }
  }
  return result.toLowerCase();
}

function LessonFlowBlock({
  rows,
  onRowsChange
}: {
  rows: LessonOutlineRow[];
  onRowsChange?: (rows: LessonOutlineRow[]) => void;
}) {
  if (!rows.length) return null;
  return (
    <div className="overflow-hidden rounded-[6px] border border-slate-300 font-sans text-[13px] sm:text-sm">
      {rows.map((row, index) => (
        <div key={`${row.phase}-${index}`} className="grid gap-3 border-b border-slate-200 p-3 last:border-b-0 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
            <EditableText
              as="span"
              value={row.time || "Time"}
              onCommit={(time) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, time }))}
              ariaLabel={`Step ${index + 1} time`}
              singleLine
            />
          </div>
          <div className="min-w-0">
            <EditableText
              as="p"
              value={row.phase || `Step ${index + 1}`}
              onCommit={(phase) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, phase }))}
              className="break-words font-black text-black"
              ariaLabel={`Step ${index + 1} phase`}
              singleLine
            />
            {row.teacher_action ? (
              <EditableText
                as="p"
                value={row.teacher_action}
                onCommit={(teacher_action) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, teacher_action }))}
                className="mt-2 whitespace-pre-wrap break-words leading-6 text-slate-700"
                ariaLabel={`Step ${index + 1} teacher action`}
              />
            ) : null}
            {row.student_action ? (
              <p className="mt-2 break-words leading-6 text-slate-700">
                <span className="font-bold text-black">Students: </span>
                <EditableText
                  as="span"
                  value={row.student_action}
                  onCommit={(student_action) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, student_action }))}
                  className="whitespace-pre-wrap"
                  ariaLabel={`Step ${index + 1} student action`}
                />
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonBulletList({
  lines,
  onLinesChange
}: {
  lines: string[];
  onLinesChange?: (lines: string[]) => void;
}) {
  if (!lines.length) return null;
  if (lines.length === 1) {
    return (
      <EditableText
        as="p"
        value={lines[0]}
        onCommit={(value) => onLinesChange?.(replaceLine(lines, 0, value))}
        className="whitespace-pre-wrap break-words font-serif text-[14px] leading-6 text-black sm:text-[15px]"
        ariaLabel="Editable lesson text"
      />
    );
  }
  return (
    <ul className="ml-5 grid list-disc gap-3">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="min-w-0 break-words pl-1 font-serif text-[14px] leading-6 text-black sm:text-[15px]">
          <EditableText
            as="span"
            value={line}
            onCommit={(value) => onLinesChange?.(replaceLine(lines, index, value))}
            className="whitespace-pre-wrap"
            ariaLabel={`Editable bullet ${index + 1}`}
          />
        </li>
      ))}
    </ul>
  );
}

function LessonEmptyLine() {
  return (
    <p className="rounded-[8px] border border-dashed border-slate-300 px-4 py-3 font-sans text-sm font-semibold text-slate-500">
      Not included in the generated output.
    </p>
  );
}

function LessonHeaderMeta({
  metadata,
  draft,
  setDraft,
  isEditing
}: {
  metadata: LessonDocumentMetadata;
  draft: LessonDocumentDraft | null;
  setDraft: (draft: LessonDocumentDraft) => void;
  isEditing: boolean;
}) {
  const rows: Array<{ label: string; value?: unknown; field: keyof LessonDocumentMetadata }> = [
    { label: "Class", value: metadata.class, field: "class" },
    { label: "Subject", value: metadata.subject, field: "subject" },
    { label: "Duration", value: metadata.duration, field: "duration" }
  ];

  return (
    <div className="hidden min-w-0 justify-self-end text-right md:grid md:gap-1">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0 text-xs leading-5 text-[#5f5a73]">
          <span className="font-black uppercase tracking-[0.08em] text-[#5b7194]">{row.label}: </span>
          {isEditing && draft ? (
            <InlineTextInput
              value={draft.metadata[row.field] || ""}
              onChange={(nextValue) => setDraft({ ...draft, metadata: { ...draft.metadata, [row.field]: nextValue } })}
              className="ml-1 inline-block max-w-[190px] text-right text-xs font-bold text-[#25262b]"
              ariaLabel={row.label}
            />
          ) : (
            <span className="font-bold text-[#25262b]">{formatMetadataValue(row.value)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function LessonDetailRow({
  label,
  value,
  field,
  draft,
  setDraft,
  isEditing
}: {
  label: string;
  value?: unknown;
  field: keyof LessonDocumentMetadata;
  draft: LessonDocumentDraft | null;
  setDraft: (draft: LessonDocumentDraft) => void;
  isEditing: boolean;
}) {
  return (
    <div className="min-w-0 rounded-[12px] border border-[#eee9f7] bg-[#f8ffff] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#5b7194]">{label}</p>
      {isEditing && draft ? (
        <InlineTextInput
          value={draft.metadata[field] || ""}
          onChange={(nextValue) => setDraft({ ...draft, metadata: { ...draft.metadata, [field]: nextValue } })}
          className="mt-1 text-sm font-bold text-[#25262b]"
          ariaLabel={label}
        />
      ) : (
        <p className="mt-1 break-words text-sm font-bold text-[#25262b]">{formatMetadataValue(value)}</p>
      )}
    </div>
  );
}

function CompactDetail({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="min-w-0 border-b border-[#eceef3] pb-3 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#5b7194]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#25262b]">{formatMetadataValue(value)}</p>
    </div>
  );
}

function lessonSectionId(title: string) {
  return `lesson-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function formatMetadataValue(value: unknown, suffix = "") {
  const text = textOf(value);
  if (!text) return "Not provided";
  return suffix ? `${text} ${suffix}` : text;
}

function formatGradeValue(value: unknown) {
  const text = textOf(value);
  if (!text) return "";
  return text.replace(/\b(class|grade)\b/gi, "").trim() || text;
}

function formatGeneratedDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatChapterDisplay(metadata: Partial<LessonDocumentMetadata>) {
  const chapter = textOf(metadata.chapter);
  const chapterNumber = textOf(metadata.chapter_number);
  if (!chapter) return "Chapter not provided";
  if (/^chapter\s+\d+/i.test(chapter)) return chapter;
  return chapterNumber ? `Chapter ${chapterNumber}: ${chapter}` : chapter;
}

function EditableText({
  as = "span",
  value,
  onCommit,
  className,
  ariaLabel,
  singleLine = false
}: {
  as?: keyof HTMLElementTagNameMap;
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  ariaLabel: string;
  singleLine?: boolean;
}) {
  const editableClassName = [
    "min-w-0 rounded-[6px] outline-none ring-[#1677ff]/20 transition focus:bg-[#f8ffff] focus:ring-2",
    className || ""
  ].join(" ");

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!singleLine || event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  }

  return createElement(
    as,
    {
      contentEditable: true,
      suppressContentEditableWarning: true,
      role: "textbox",
      "aria-label": ariaLabel,
      className: editableClassName,
      onBlur: (event: FocusEvent<HTMLElement>) => {
        const text = event.currentTarget.innerText.replace(/\u00a0/g, " ").trim();
        if (text !== value) onCommit(text);
      },
      onKeyDown: handleKeyDown
    },
    value
  );
}

function InlineTextInput({
  value,
  onChange,
  className,
  ariaLabel
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full min-w-0 rounded-[8px] border border-[#c9f7fb] bg-white px-2 py-1 text-base outline-none ring-[#1677ff]/20 transition focus:ring-4 sm:text-sm ${className || ""}`}
    />
  );
}

function InlineTextArea({
  value,
  onChange,
  ariaLabel
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={Math.max(2, Math.min(7, value.split(/\n/).length + Math.ceil(value.length / 90)))}
      className="w-full min-w-0 resize-y rounded-[10px] border border-[#c9f7fb] bg-white px-3 py-2 text-base leading-7 text-[#4f4a66] outline-none ring-[#1677ff]/20 transition focus:ring-4 sm:text-sm"
    />
  );
}

function buildLessonDocumentDraft(output: any): LessonDocumentDraft {
  const plan = normalizeLessonPlan(output);
  const metadata = plan.metadata || {};
  const schoolFormatEnabled = Boolean(output?.school_format?.requested && output?.school_format?.available);
  const existingDocumentSections = normalizeDocumentSections(output?.lesson_document_sections);
  if (existingDocumentSections.length && (output?.document_format === "custom" || output?.document_format === "school_format")) {
    return {
      title: plan.title || output?.title || "Generated Lesson Plan",
      metadata: {
        subject: textOf(metadata.subject),
        class: textOf(metadata.class || metadata.grade),
        chapter: textOf(metadata.chapter),
        chapter_number: textOf(metadata.chapter_number),
        duration: textOf(metadata.duration || metadata.duration_minutes),
        book: textOf(metadata.book || output?.textbook_source),
        topic: textOf(metadata.topic || plan.title),
        board: textOf(metadata.board)
      },
      sections: existingDocumentSections
    };
  }
  const keyPoints = plan.keyPoints.length ? plan.keyPoints : arrayOf(output?.physical_properties_key_features);
  const selectedComponents = arrayOf(output?.selected_components);
  const schoolFormatSections = schoolFormatEnabled ? normalizeSchoolFormatSections(output?.school_format_sections) : [];
  const differentiationLines = Object.entries(plan.differentiation || {}).map(
    ([key, value]) => `${formatDifferentiationLabel(key)}: ${value}`
  );
  const assessmentLines = plan.assessments.map((item, index) => {
    const marks = item.marks ? ` (${item.marks} mark${Number(item.marks) === 1 ? "" : "s"})` : "";
    const answer = item.expected_answer ? ` Expected answer: ${item.expected_answer}` : "";
    return `${index + 1}. ${item.question}${marks}${answer}`;
  });

  return {
    title: plan.title || output?.title || "Generated Lesson Plan",
    metadata: {
      subject: textOf(metadata.subject),
      class: textOf(metadata.class || metadata.grade),
      chapter: textOf(metadata.chapter),
      chapter_number: textOf(metadata.chapter_number),
      duration: textOf(metadata.duration || metadata.duration_minutes),
      book: textOf(metadata.book || output?.textbook_source),
      topic: textOf(metadata.topic || plan.title),
      board: textOf(metadata.board)
    },
    sections: schoolFormatSections.length ? schoolFormatSections : filterLessonSectionsBySelection([
      { key: "objectives", title: "Learning Objectives", lines: plan.objectives },
      { key: "previous_knowledge", title: "Previous Knowledge", lines: valueToLines(output?.previous_knowledge) },
      { key: "key_points", title: "Key Textbook Points", lines: keyPoints },
      { key: "materials", title: "Teaching-Learning Materials", lines: plan.materials },
      { key: "introduction", title: "Introduction / Warm-up", lines: valueToLines(output?.introduction_warm_up) },
      { key: "explanation", title: "Explanation of Concept", lines: valueToLines(output?.explanation_of_concept) },
      { key: "lesson_flow", title: "Lesson Flow", outline: plan.outline },
      { key: "activity", title: "Classroom Activity", lines: valueToLines(output?.classroom_activity || output?.activity || plan.classroomActivity) },
      { key: "main_details", title: "Main Concept Details", lines: valueToLines(output?.chemical_properties_main_concept_details) },
      { key: "daily_life", title: "Daily Life Connection", lines: valueToLines(output?.uses_daily_life_connection) },
      { key: "differentiation", title: "Differentiation", lines: differentiationLines },
      { key: "assessment", title: "Assessment", lines: assessmentLines },
      { key: "board_work", title: "Board Work", lines: valueToLines(output?.board_work) },
      { key: "homework", title: "Homework", lines: valueToLines(plan.homework) },
      { key: "learning_outcome", title: "Learning Outcome", lines: valueToLines(output?.learning_outcome) },
      { key: "teacher_notes", title: "Teacher Notes", lines: valueToLines(plan.teacherNotes) }
    ], selectedComponents)
  };
}

function filterLessonSectionsBySelection(sections: LessonDocumentSection[], selectedComponents: string[]) {
  if (!selectedComponents.length) return sections;
  const normalizedSelection = new Set(selectedComponents.map(normalizeComponentName));
  const alwaysVisible = new Set(["objectives", "previous_knowledge", "key_points", "lesson_flow", "board_work", "learning_outcome"]);
  const sectionComponentMap: Record<string, string[]> = {
    materials: ["Materials Needed"],
    introduction: ["Warm-up / Introduction"],
    explanation: ["Direct Instruction"],
    activity: ["Classroom Activity"],
    main_details: ["Direct Instruction"],
    daily_life: ["Class Discussion", "Direct Instruction"],
    differentiation: ["Differentiation"],
    assessment: ["Assessment"],
    homework: ["Homework"],
    teacher_notes: ["Teacher Notes"],
  };

  return sections.filter((section) => {
    if (alwaysVisible.has(section.key)) return true;
    const controllingComponents = sectionComponentMap[section.key];
    if (!controllingComponents) return true;
    return controllingComponents.some((component) => normalizedSelection.has(normalizeComponentName(component)));
  });
}

function normalizeComponentName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function applyLessonDocumentDraft(baseOutput: any, draft: LessonDocumentDraft) {
  const section = (key: string) => draft.sections.find((item) => item.key === key);
  const lines = (key: string) => section(key)?.lines?.map((line) => line.trim()).filter(Boolean) || [];
  const joined = (key: string) => lines(key).join("\n");
  const assessmentQuestions = lines("assessment").map((line) => ({
    question: line.replace(/^\d+[.)]\s*/, "").trim(),
    marks: 1
  }));
  const differentiation = Object.fromEntries(
    lines("differentiation").map((line, index) => {
      const [rawKey, ...rest] = line.split(":");
      const label = rest.length ? rawKey : `item_${index + 1}`;
      const value = rest.length ? rest.join(":").trim() : line;
      return [label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `item_${index + 1}`, value];
    })
  );

  return {
    ...(baseOutput || {}),
    title: draft.title,
    lesson_title: draft.title,
    metadata: {
      ...(baseOutput?.metadata || {}),
      subject: draft.metadata.subject,
      class: draft.metadata.class,
      chapter: draft.metadata.chapter,
      chapter_number: draft.metadata.chapter_number,
      duration: draft.metadata.duration,
      book: draft.metadata.book,
      topic: draft.metadata.topic,
      board: draft.metadata.board
    },
    learning_objectives: lines("objectives"),
    learning_objective: lines("objectives"),
    previous_knowledge: joined("previous_knowledge"),
    key_textbook_points: lines("key_points"),
    key_concepts: lines("key_points"),
    materials_needed: lines("materials"),
    introduction_warm_up: joined("introduction"),
    explanation_of_concept: joined("explanation"),
    lesson_outline: section("lesson_flow")?.outline || [],
    classroom_activity: joined("activity"),
    chemical_properties_main_concept_details: joined("main_details"),
    uses_daily_life_connection: joined("daily_life"),
    differentiation,
    assessment_questions: assessmentQuestions,
    board_work: joined("board_work"),
    homework: joined("homework"),
    learning_outcome: joined("learning_outcome"),
    teacher_notes: joined("teacher_notes"),
    textbook_source: draft.metadata.book,
    document_format: baseOutput?.school_format?.requested && baseOutput?.school_format?.available ? "school_format" : "custom",
    lesson_document_sections: draft.sections.map((section) => ({
      key: section.key,
      title: section.title,
      lines: section.lines ? section.lines.map((line) => line.trim()).filter(Boolean) : undefined,
      outline: section.outline ? section.outline.map((row) => ({ ...row })) : undefined,
      children: section.children?.map((child) => ({
        key: child.key,
        title: child.title,
        lines: child.lines ? child.lines.map((line) => line.trim()).filter(Boolean) : undefined
      }))
    })),
    school_format_sections: baseOutput?.school_format?.requested && baseOutput?.school_format?.available
      ? draft.sections.map((section) => ({
        title: section.title,
        content: (section.lines || []).join("\n"),
        children: section.children?.map((child) => ({
          title: child.title,
          content: (child.lines || []).join("\n")
        }))
      }))
      : baseOutput?.school_format_sections
  };
}

function normalizeDocumentSections(value: any): LessonDocumentSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((section, index) => ({
    key: textOf(section?.key) || `section_${index + 1}`,
    title: textOf(section?.title) || `Section ${index + 1}`,
    lines: Array.isArray(section?.lines) ? section.lines.map(textOf).filter(Boolean) : undefined,
    outline: Array.isArray(section?.outline)
      ? section.outline.map((row: any) => ({
        time: textOf(row?.time),
        phase: textOf(row?.phase),
        teacher_action: textOf(row?.teacher_action),
        student_action: textOf(row?.student_action),
        notes: textOf(row?.notes)
      }))
      : undefined,
    children: normalizeDocumentSections(section?.children)
  })).filter((section) => section.lines?.length || section.outline?.length || section.title);
}

function normalizeSchoolFormatSections(value: any): LessonDocumentSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((section, index) => {
    const record = typeof section === "object" && section !== null ? section : {};
    const title = textOf(record.title || record.heading || record.name);
    const content = record.content ?? record.lines ?? record.text ?? "";
    return {
      key: textOf(record.key) || `school_format_${index + 1}`,
      title: title || `Section ${index + 1}`,
      lines: valueToLines(content),
      children: normalizeSchoolFormatSections(record.children)
    };
  }).filter((section) => section.title && (section.lines.length || section.children?.length));
}

function structuredCloneDraft(draft: LessonDocumentDraft): LessonDocumentDraft {
  return {
    title: draft.title,
    metadata: { ...draft.metadata },
    sections: draft.sections.map((section) => ({
      ...section,
      lines: section.lines ? [...section.lines] : undefined,
      outline: section.outline ? section.outline.map((row) => ({ ...row })) : undefined,
      children: section.children ? structuredCloneDraft({ title: "", metadata: draft.metadata, sections: section.children }).sections : undefined
    }))
  };
}

function replaceLine(lines: string[], index: number, value: string) {
  return lines.map((line, lineIndex) => lineIndex === index ? value : line);
}

function replaceOutlineRow(rows: LessonOutlineRow[], index: number, value: LessonOutlineRow) {
  return rows.map((row, rowIndex) => rowIndex === index ? value : row);
}

function moveSection(sections: LessonDocumentSection[], from: number, to: number) {
  if (to < 0 || to >= sections.length) return sections;
  const next = [...sections];
  const [section] = next.splice(from, 1);
  next.splice(to, 0, section);
  return next;
}

export function LessonPlanOutput({
  output,
  streamKey,
  streamSpeed = "normal",
  onSave,
  onChange,
  onExport,
  onCopy,
  onShare
}: {
  output: any;
  streamKey?: string;
  streamSpeed?: "normal" | "fast" | "instant";
  onSave?: (output?: any) => void;
  onChange?: (output?: any) => void;
  onExport?: (output?: any) => void;
  onCopy?: (output?: any) => void;
  onShare?: (output?: any) => void;
}) {
  return <LessonPlanDocumentOutput output={output} onSave={onSave} onChange={onChange} onExport={onExport} onCopy={onCopy} onShare={onShare} />;

  const metadata = output?.metadata || {};
  const outline = output?.lesson_outline || [];
  const objectives = output?.learning_objectives || [];
  const concepts = output?.key_concepts || [];
  const strategies = output?.teaching_method_strategy || [];
  const materials = output?.materials_needed || [];
  const title = output?.title || "Generated Lesson Plan";
  const strategyDescription = output?.classroom_activity || "";
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
      { key: "explanation", number: "5", title: "Explanation of Concept", icon: BookOpen, tone: "blue" as const, value: output?.explanation_of_concept },
      { key: "features", number: "6", title: "Physical Properties / Key Features", icon: CheckCircle2, tone: "pink" as const, value: output?.physical_properties_key_features?.length ? output.physical_properties_key_features : concepts },
      { key: "activity", number: "7", title: "Activity", icon: Users, tone: "emerald" as const, value: output?.classroom_activity || output?.activity },
      { key: "details", number: "8", title: "Chemical Properties / Main Concept Details", icon: ClipboardCheck, tone: "blue" as const, value: output?.chemical_properties_main_concept_details },
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
      <div className="overflow-hidden rounded-[24px] border border-[#dffafa] bg-white shadow-[0_18px_50px_rgba(39,30,91,0.08)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#f8ffff] to-white px-4 py-6 sm:px-8 sm:py-8">
          <Link href="/dashboard/lesson-plans/new">
            <Button variant="outline" size="sm" className="mb-7 border-[#c9f7fb] text-[#1677ff]">
              Back to Inputs
            </Button>
          </Link>
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-lg font-black text-[#25262b]">Generated Lesson Plan</h1>
              </div>
              <h2 className="mt-4 max-w-4xl break-words text-[30px] font-black tracking-tight text-[#25262b] 2xl:mt-5 2xl:text-4xl">
                {typedTitle}
                {!stream.done("title") ? <TypingCursor /> : null}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <MetaBadge color="blue" icon={Lightbulb} label={metadata.subject || "Subject"} />
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
            <div className="absolute bottom-0 right-40 h-20 w-20 bg-blue-400" />
            <div className="absolute bottom-0 right-28 h-28 w-10 bg-blue-600" />
            <div className="absolute bottom-0 right-12 h-8 w-20 rounded-t-lg bg-amber-300" />
            <div className="absolute bottom-0 right-64 h-16 w-12 rounded-t-lg bg-blue-400" />
          </div>
        </div>

        <div className="grid min-w-0 gap-5 px-4 pb-5 pt-5 sm:px-6 sm:pb-6 2xl:gap-6 2xl:px-8 2xl:pb-8 2xl:pt-6">
          {stream.visible("objectives") ? (
            <NumericCard number="1" title="Learning Objectives" icon={Target} tone="blue">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <ul className="grid gap-3 text-sm leading-6 text-slate-700">
                  {streamLines(stream, "objectives", objectives.length ? objectives : []).map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
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
            <NumericCard number="2" title="Lesson Outline" icon={ClipboardCheck} tone="blue">
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
            <NumericCard number="7" title="Differentiation" icon={Users} tone="blue">
              <div className="grid gap-3">
                {Object.entries(output?.differentiation || {}).map(([key, value]) => (
                  <div key={key} className="grid min-w-0 gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                    <Badge className="justify-center bg-blue-100 py-2 text-xs font-semibold text-blue-700">
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
            <Button onClick={onSave} className="bg-gradient-to-r from-blue-600 to-blue-600 text-white hover:from-blue-700 hover:to-blue-700"><FileText className="h-4 w-4" /> Edit Plan</Button>
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
  onChange,
  onExport,
  onCopy
}: {
  output: any;
  tab: string;
  setTab: (tab: string) => void;
  onSave?: (output?: any) => void;
  onChange?: (output?: any) => void;
  onExport?: (output?: any) => void;
  onCopy?: (output?: any) => void;
}) {
  const [worksheetOutput, setWorksheetOutput] = useState(output);
  const metadata = worksheetOutput?.metadata || {};
  const sections = worksheetOutput?.student_worksheet?.sections || [];
  const title = worksheetOutput?.title || "Worksheet";
  const grade = metadata.grade ? `Grade ${metadata.grade}` : metadata.class || "Class";
  const subject = metadata.subject || "Subject";
  const chapter = metadata.chapter || "Chapter";
  const topic = metadata.topic || title;

  useEffect(() => {
    setWorksheetOutput(output);
  }, [output]);

  function commitWorksheet(nextOutput: any) {
    setWorksheetOutput(nextOutput);
    onChange?.(nextOutput);
  }

  function updateWorksheet(updater: (current: any) => any) {
    commitWorksheet(updater(worksheetOutput || {}));
  }

  function updateMetadata(field: string, value: string) {
    const metadataValue = field === "grade" ? (value.replace(/\b(class|grade)\b/gi, "").trim() || value) : value;
    updateWorksheet((current) => ({
      ...current,
      title: field === "topic" ? value : current.title,
      metadata: {
        ...(current.metadata || {}),
        [field]: metadataValue,
        ...(field === "grade" ? { class: metadataValue } : {}),
        ...(field === "topic" ? { topic: value } : {})
      }
    }));
  }

  function updateSection(sectionIndex: number, updater: (section: any) => any) {
    updateWorksheet((current) => {
      const currentSections = current?.student_worksheet?.sections || [];
      return {
        ...current,
        student_worksheet: {
          ...(current.student_worksheet || {}),
          sections: currentSections.map((section: any, index: number) => index === sectionIndex ? updater(section) : section)
        }
      };
    });
  }

  function updateQuestion(sectionIndex: number, questionIndex: number, updater: (question: any) => any) {
    updateSection(sectionIndex, (section) => ({
      ...section,
      questions: (section.questions || []).map((question: any, index: number) => index === questionIndex ? updater(question) : question)
    }));
  }

  function updateAnswerKey(items: any[]) {
    updateWorksheet((current) => ({ ...current, answer_key: items }));
  }

  function updateMarkingScheme(items: any[]) {
    updateWorksheet((current) => ({ ...current, marking_scheme: items }));
  }

  return (
    <div className="w-full max-w-none">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .worksheet-print-page { box-shadow: none !important; border: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; }
          .print-shell { padding: 0 !important; }
        }
      `}</style>

      <div className="no-print mb-5 border-b border-[#dffafa] bg-white pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#6d6f78]">
              <Link href="/dashboard/worksheets/new" className="inline-flex items-center gap-1 text-[#159565]">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Inputs
              </Link>
              <span>/</span>
              <span>Worksheet Output</span>
            </div>
            <h1 className="mt-2 break-words text-2xl font-black leading-tight text-[#25262b] sm:text-[28px]">Generated Worksheet</h1>
            <p className="mt-2 text-sm font-medium text-[#6d6f78]">{grade} • {subject} • {chapter}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onCopy?.(worksheetOutput)}><Copy className="h-4 w-4" /> Copy</Button>
            <Button variant="outline" size="sm" onClick={() => onExport?.(worksheetOutput)}><Download className="h-4 w-4" /> PDF</Button>
            <Button size="sm" onClick={() => onSave?.(worksheetOutput)}><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>

        <div className="mt-4 flex rounded-[12px] border border-[#dffafa] bg-[#f8ffff] p-1">
          {["Worksheet", "Answer Key", "Marking Scheme"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-10 flex-1 rounded-[8px] text-sm font-bold ${tab === item ? "bg-[#25262b] text-white shadow-sm" : "text-[#6d6f78]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {tab === "Worksheet" ? (
        <article className="worksheet-print-page w-full max-w-none border border-[#d8d3e5] bg-white px-4 py-6 font-serif text-[14px] leading-6 text-black shadow-[0_18px_48px_rgba(39,30,91,0.06)] sm:px-8 sm:py-8 md:px-10 lg:px-12 lg:py-11 lg:text-[15px]">
          <header className="grid min-w-0 gap-4 font-sans sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
            <div className="min-w-0">
              <h2 className="break-words text-[19px] font-black leading-tight text-black sm:text-[22px]">
                <EditableText as="span" value={grade} onCommit={(value) => updateMetadata("grade", value)} ariaLabel="Worksheet grade" singleLine />
                <span> - </span>
                <EditableText as="span" value={subject} onCommit={(value) => updateMetadata("subject", value)} ariaLabel="Worksheet subject" singleLine />
              </h2>
              <EditableText
                as="p"
                value={topic}
                onCommit={(value) => updateMetadata("topic", value)}
                className="mt-1 break-words text-[16px] font-black leading-snug text-black sm:text-[18px]"
                ariaLabel="Worksheet topic"
                singleLine
              />
              <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-700">
                <span>Chapter: </span>
                <EditableText as="span" value={chapter} onCommit={(value) => updateMetadata("chapter", value)} ariaLabel="Worksheet chapter" singleLine />
              </p>
              <p className="mt-1 break-words text-[11px] font-bold uppercase leading-5 tracking-[0.08em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                <EditableText as="span" value={metadata.board || "Board"} onCommit={(value) => updateMetadata("board", value)} ariaLabel="Worksheet board" singleLine />
                <span> • </span>
                <EditableText as="span" value={metadata.book || "Textbook"} onCommit={(value) => updateMetadata("book", value)} ariaLabel="Worksheet textbook" singleLine />
              </p>
            </div>
          </header>

          <div className="mt-7 grid gap-4 font-sans text-sm font-black sm:mt-10 sm:grid-cols-2 sm:gap-7">
            <div className="flex min-w-0 items-end gap-2">Name:<span className="h-5 min-w-0 flex-1 border-b border-slate-400" /></div>
            <div className="flex min-w-0 items-end gap-2">Date:<span className="h-5 min-w-0 flex-1 border-b border-slate-400" /></div>
          </div>
          <div className="mt-3 border-b border-slate-300" />

          <section className="mt-5 rounded-[8px] border border-slate-200 p-3 font-sans sm:p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900 sm:text-sm">Instructions</h3>
            <EditableText
              as="p"
              value={worksheetOutput?.instructions || "Read each question carefully and answer in the space provided. For MCQs, choose the correct option. Answer all questions."}
              onCommit={(instructions) => updateWorksheet((current) => ({ ...current, instructions }))}
              className="mt-1 break-words text-[13px] font-semibold italic leading-6 text-slate-700 sm:text-sm"
              ariaLabel="Worksheet instructions"
            />
          </section>

          <div className="mt-7 grid gap-6 sm:mt-8 sm:gap-7">
            {sections.map((section: any, sectionIndex: number) => (
              <section key={`${section.section_title}-${sectionIndex}`} className="break-inside-avoid">
                <div className="mb-4 flex min-w-0 items-start gap-3 border-b border-slate-200 pb-2 font-sans">
                  <EditableText
                    as="h3"
                    value={section.section_title || `Section ${sectionIndex + 1}`}
                    onCommit={(section_title) => updateSection(sectionIndex, (currentSection) => ({ ...currentSection, section_title }))}
                    className="min-w-0 flex-1 break-words text-[15px] font-black leading-6 text-black sm:text-[17px]"
                    ariaLabel={`Worksheet section ${sectionIndex + 1} title`}
                    singleLine
                  />
                  {section.marks ? <span className="shrink-0 pt-1 text-xs font-black text-slate-500">{section.marks} marks</span> : null}
                </div>
                <div className="grid gap-4 sm:gap-5">
                  {(section.questions || []).map((question: any, index: number) => (
                    <WorksheetQuestion
                      key={index}
                      question={question}
                      index={index}
                      questionType={section.question_type || section.section_title}
                      onQuestionChange={(nextQuestion) => updateQuestion(sectionIndex, index, () => nextQuestion)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <OutputMetadataFooter
            subject={subject}
            grade={grade}
            chapter={chapter}
            source={metadata.book || worksheetOutput?.textbook_source}
            generatedAt={worksheetOutput?.generated_at || worksheetOutput?.created_at || worksheetOutput?.updated_at}
          />
        </article>
      ) : tab === "Answer Key" ? (
        <AnswerKeyView items={worksheetOutput?.answer_key || []} onItemsChange={updateAnswerKey} />
      ) : (
        <MarkingSchemeView items={worksheetOutput?.marking_scheme || []} onItemsChange={updateMarkingScheme} />
      )}
    </div>
  );
}

function WorksheetQuestion({
  question,
  index,
  questionType,
  onQuestionChange
}: {
  question: any;
  index: number;
  questionType: string;
  onQuestionChange?: (question: any) => void;
}) {
  const left = question.left_column || question.left || [];
  const right = question.right_column || question.right || [];
  const options = question.options || [];
  const lineCount = Number(question.answer_lines || defaultAnswerLines(questionType));

  function updateOption(optionIndex: number, value: string) {
    onQuestionChange?.({
      ...question,
      options: options.map((option: string, index: number) => index === optionIndex ? value : option)
    });
  }

  function updateMatchColumn(column: "left_column" | "right_column", values: string[], rowIndex: number, value: string) {
    onQuestionChange?.({
      ...question,
      [column]: values.map((item: string, index: number) => index === rowIndex ? value : item),
      [column === "left_column" ? "left" : "right"]: values.map((item: string, index: number) => index === rowIndex ? value : item)
    });
  }

  return (
    <div className="min-w-0 break-inside-avoid">
      <p className="break-words font-serif text-[14px] leading-6 sm:text-[15px]">
        <span className="mr-3 font-sans font-black">{index + 1}.</span>
        <EditableText
          as="span"
          value={question.question || ""}
          onCommit={(value) => onQuestionChange?.({ ...question, question: value })}
          ariaLabel={`Worksheet question ${index + 1}`}
        />
      </p>
      {options.length ? (
        <div className="mt-2 grid gap-x-10 gap-y-2 pl-5 font-sans text-[13px] sm:grid-cols-2 sm:pl-9 sm:text-sm">
          {options.map((option: string, optionIndex: number) => (
            <span key={`${option}-${optionIndex}`} className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
              <EditableText
                as="span"
                value={option}
                onCommit={(value) => updateOption(optionIndex, value)}
                className="min-w-0 break-words"
                ariaLabel={`Question ${index + 1} option ${optionIndex + 1}`}
              />
            </span>
          ))}
        </div>
      ) : null}
      {left.length && right.length ? (
        <div className="mt-3 overflow-x-auto rounded-[6px] border border-slate-300 font-sans text-[13px] sm:text-sm">
          <table className="w-full min-w-[420px] table-fixed border-collapse">
            <thead className="bg-slate-50 text-left text-black">
              <tr><th className="w-1/2 border-r border-slate-300 px-3 py-2">Column A</th><th className="px-3 py-2">Column B</th></tr>
            </thead>
            <tbody>
              {left.map((item: string, rowIndex: number) => (
                <tr key={`${item}-${rowIndex}`} className="border-t border-slate-200">
                  <td className="break-words border-r border-slate-200 px-3 py-2">
                    <span>{rowIndex + 1}. </span>
                    <EditableText
                      as="span"
                      value={item}
                      onCommit={(value) => updateMatchColumn("left_column", left, rowIndex, value)}
                      ariaLabel={`Question ${index + 1} column A row ${rowIndex + 1}`}
                    />
                  </td>
                  <td className="break-words px-3 py-2">
                    <span>{String.fromCharCode(65 + rowIndex)}. </span>
                    <EditableText
                      as="span"
                      value={right[rowIndex] || ""}
                      onCommit={(value) => updateMatchColumn("right_column", right, rowIndex, value)}
                      ariaLabel={`Question ${index + 1} column B row ${rowIndex + 1}`}
                    />
                  </td>
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
        <span key={index} className="h-5 border-b border-dashed border-slate-300" />
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

function AnswerKeyView({ items, onItemsChange }: { items: any[]; onItemsChange?: (items: any[]) => void }) {
  function updateSection(index: number, value: any) {
    onItemsChange?.(items.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  return (
    <section className="rounded-[12px] border border-[#d8d3e5] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-7">
      <h2 className="text-xl font-black text-[#25262b]">Answer Key</h2>
      <div className="mt-5 grid gap-4">
        {items.map((section, index) => (
          <div key={`${section.section_title}-${index}`} className="rounded-[10px] border border-[#dffafa] bg-white p-4">
            <EditableText
              as="h3"
              value={section.section_title || `Section ${index + 1}`}
              onCommit={(section_title) => updateSection(index, { ...section, section_title })}
              className="font-black text-[#25262b]"
              ariaLabel={`Answer key section ${index + 1}`}
              singleLine
            />
            <ol className="mt-3 grid gap-2 text-sm font-medium text-[#33304a]">
              {(section.answers || []).map((answer: any, answerIndex: number) => (
                <li key={answerIndex} className="flex gap-2">
                  <span className="font-black">{answerIndex + 1}.</span>
                  <EditableText
                    as="span"
                    value={String(answer)}
                    onCommit={(value) => updateSection(index, {
                      ...section,
                      answers: (section.answers || []).map((item: any, itemIndex: number) => itemIndex === answerIndex ? value : item)
                    })}
                    ariaLabel={`Answer ${answerIndex + 1}`}
                  />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarkingSchemeView({ items, onItemsChange }: { items: any[]; onItemsChange?: (items: any[]) => void }) {
  function updateSection(index: number, value: any) {
    onItemsChange?.(items.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  return (
    <section className="rounded-[12px] border border-[#d8d3e5] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-7">
      <h2 className="text-xl font-black text-[#25262b]">Marking Scheme</h2>
      <div className="mt-5 grid gap-4">
        {items.map((section, index) => (
          <div key={`${section.section_title}-${index}`} className="rounded-[10px] border border-[#dffafa] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <EditableText
                as="h3"
                value={section.section_title || `Section ${index + 1}`}
                onCommit={(section_title) => updateSection(index, { ...section, section_title })}
                className="font-black text-[#25262b]"
                ariaLabel={`Marking scheme section ${index + 1}`}
                singleLine
              />
              {section.marks_per_question ? <Badge>{section.marks_per_question}</Badge> : null}
            </div>
            <ul className="mt-3 grid gap-2 text-sm font-medium text-[#33304a]">
              {(section.guidelines || []).map((item: any, itemIndex: number) => (
                <li key={itemIndex} className="flex gap-2">
                  <span className="font-black text-[#25262b]">•</span>
                  <EditableText
                    as="span"
                    value={String(item)}
                    onCommit={(value) => updateSection(index, {
                      ...section,
                      guidelines: (section.guidelines || []).map((guideline: any, guidelineIndex: number) => guidelineIndex === itemIndex ? value : guideline)
                    })}
                    ariaLabel={`Marking guideline ${itemIndex + 1}`}
                  />
                </li>
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
    <section className={`rounded-[18px] border border-[#dffafa] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-6 ${className || ""}`}>
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
  const visibleLines = streamLines(stream, streamKeyName, lines.length ? lines : ["Not included in the generated output."]);
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
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
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
    <section className={`rounded-[18px] border border-[#dffafa] bg-white p-5 shadow-[0_12px_30px_rgba(31,42,87,0.04)] ${className || ""}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#dffafa] text-[#1677ff]">
          <SparkleDot />
        </div>
        <h3 className="text-lg font-black text-[#081436]">{title}</h3>
      </div>
      <p className="text-sm font-medium leading-6 text-[#67728a]">Waiting for {title.toLowerCase()}<TypingCursor /></p>
    </section>
  );
}

function SparkleDot() {
  return <span className="h-2.5 w-2.5 animate-ping rounded-full bg-[#1677ff]" />;
}

function TypingCursor() {
  return <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-[#1677ff]" />;
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
  blue: "bg-[#dffafa] text-[#1677ff]",
  cyan: "bg-[#e3f8ff] text-[#1482a8]",
  emerald: "bg-[#e5ffc6] text-[#8ec63f]",
  amber: "bg-[#fff0bf] text-[#f4b400]"
};

const numericCardTones = {
  blue: { badge: "bg-[#1677ff]" },
  pink: { badge: "bg-[#f05b7a]" },
  emerald: { badge: "bg-[#8ec63f]" },
  amber: { badge: "bg-[#f4b400]" },
  cyan: { badge: "bg-[#2c75d0]" }
};

const sectionTones = {
  blue: { icon: "bg-blue-100 text-blue-600" },
  pink: { icon: "bg-rose-100 text-rose-600" },
  emerald: { icon: "bg-emerald-100 text-emerald-600" },
  amber: { icon: "bg-amber-100 text-amber-600" }
};

const timelineTones = [
  { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", panel: "bg-white" },
  { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", panel: "bg-white" },
  { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", panel: "bg-white" },
  { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600", panel: "bg-white" },
  { bg: "bg-cyan-50", icon: "bg-cyan-100 text-cyan-600", panel: "bg-white" }
];
