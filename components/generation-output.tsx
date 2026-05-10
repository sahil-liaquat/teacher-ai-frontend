"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType, DragEvent, ReactNode } from "react";
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
  GripVertical,
  Lightbulb,
  MoreVertical,
  Pencil,
  PanelRight,
  Save,
  Share2,
  Trash2,
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
  textOf,
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
};

type LessonDocumentDraft = {
  title: string;
  metadata: LessonDocumentMetadata;
  sections: LessonDocumentSection[];
};

function LessonPlanDocumentOutput({
  output,
  onSave,
  onExport,
  onCopy,
  onShare
}: {
  output: any;
  onSave?: (output?: any) => void;
  onExport?: (output?: any) => void;
  onCopy?: (output?: any) => void;
  onShare?: (output?: any) => void;
}) {
  const [documentOutput, setDocumentOutput] = useState(output);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<LessonDocumentDraft | null>(null);
  const [draggingSectionKey, setDraggingSectionKey] = useState<string | null>(null);
  const documentDraft = useMemo(() => buildLessonDocumentDraft(documentOutput), [documentOutput]);
  const visibleDraft = isEditing && draft ? draft : documentDraft;
  const chapterDisplay = formatChapterDisplay(visibleDraft.metadata);

  useEffect(() => {
    setDocumentOutput(output);
    setIsEditing(false);
    setDraft(null);
    setDraggingSectionKey(null);
  }, [output]);

  function startEditing() {
    setDraft(structuredCloneDraft(documentDraft));
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(null);
    setIsEditing(false);
    setDraggingSectionKey(null);
  }

  function saveEditing() {
    if (!draft) return;
    const nextOutput = applyLessonDocumentDraft(documentOutput, draft);
    setDocumentOutput(nextOutput);
    setDraft(null);
    setIsEditing(false);
    setDraggingSectionKey(null);
    onSave?.(nextOutput);
  }

  function moveDraggedSection(targetKey: string) {
    if (!draft || !draggingSectionKey || draggingSectionKey === targetKey) return;
    const from = draft.sections.findIndex((section) => section.key === draggingSectionKey);
    const to = draft.sections.findIndex((section) => section.key === targetKey);
    if (from < 0 || to < 0) return;
    setDraft({ ...draft, sections: moveSection(draft.sections, from, to) });
  }

  return (
    <div className="w-full max-w-none">
      <div className="flex flex-col gap-3 border-b border-[#ebe7f4] bg-[#fbfaff]/90 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#756f92]">
            <Link href="/dashboard/lesson-plans/new" className="inline-flex items-center gap-1 text-[#6d38f2]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Inputs
            </Link>
            <span>/</span>
            <span>Lesson Plan Output</span>
          </div>
          {isEditing && draft ? (
            <InlineTextInput
              value={draft.title}
              onChange={(value) => setDraft({ ...draft, title: value })}
              className="mt-2 text-2xl font-black leading-tight text-[#17142f] sm:text-[28px]"
              ariaLabel="Lesson plan title"
            />
          ) : (
            <h1 className="mt-2 break-words text-2xl font-black leading-tight text-[#17142f] sm:text-[28px]">
              {chapterDisplay}
            </h1>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={saveEditing}><Save className="h-4 w-4" /> Save Changes</Button>
              <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onCopy?.(documentOutput)}><Copy className="h-4 w-4" /> Copy</Button>
              <Button variant="outline" size="sm" onClick={() => onExport?.(documentOutput)}><Download className="h-4 w-4" /> PDF</Button>
              {onShare ? <Button variant="outline" size="sm" onClick={() => onShare(documentOutput)}><Share2 className="h-4 w-4" /> Share</Button> : null}
              <Button variant="outline" size="sm" onClick={startEditing}><Pencil className="h-4 w-4" /> Edit</Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <article className="min-w-0 rounded-[16px] border border-[#ddd6ec] bg-white shadow-[0_18px_48px_rgba(39,30,91,0.08)]">
          <header className="border-b border-[#ebe7f4] px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] md:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#efe6ff] text-[#6d38f2]">AI Generated</Badge>
                  <Badge className="bg-[#e9fff4] text-[#16865a]">Textbook Grounded</Badge>
                  {isEditing ? <Badge className="bg-[#fff4da] text-[#9a6818]">Editing</Badge> : null}
                </div>
                {isEditing && draft ? (
                  <InlineTextInput
                    value={draft.title}
                    onChange={(value) => setDraft({ ...draft, title: value })}
                    className="mt-5 text-[30px] font-black leading-tight tracking-normal text-[#17142f] sm:text-[38px]"
                    ariaLabel="Document title"
                  />
                ) : (
                  <h2 className="mt-5 break-words text-[30px] font-black leading-tight tracking-normal text-[#17142f] sm:text-[38px]">
                    {visibleDraft.title}
                  </h2>
                )}
              </div>
              <LessonHeaderMeta
                metadata={visibleDraft.metadata}
                draft={draft}
                setDraft={setDraft}
                isEditing={isEditing}
              />
            </div>
          </header>

          <div className="grid gap-0 px-4 py-1 sm:px-6 lg:px-7">
            {visibleDraft.sections.map((section, index) => (
              <LessonSectionBlock
                key={section.key}
                index={index}
                section={section}
                isEditing={isEditing}
                onSectionChange={(nextSection) => {
                  if (!draft) return;
                  setDraft({
                    ...draft,
                    sections: draft.sections.map((item) => item.key === section.key ? nextSection : item)
                  });
                }}
                onDelete={() => {
                  if (!draft) return;
                  setDraft({ ...draft, sections: draft.sections.filter((item) => item.key !== section.key) });
                }}
                isDragging={draggingSectionKey === section.key}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", section.key);
                  event.dataTransfer.effectAllowed = "move";
                  setDraggingSectionKey(section.key);
                }}
                onDragOver={(event) => {
                  if (!isEditing) return;
                  event.preventDefault();
                }}
                onDrop={() => {
                  moveDraggedSection(section.key);
                  setDraggingSectionKey(null);
                }}
                onDragEnd={() => setDraggingSectionKey(null)}
              />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function LessonSectionBlock({
  index,
  section,
  isEditing,
  onSectionChange,
  onDelete,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: {
  index: number;
  section: LessonDocumentSection;
  isEditing?: boolean;
  onSectionChange?: (section: LessonDocumentSection) => void;
  onDelete?: () => void;
  isDragging?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}) {
  const id = lessonSectionId(section.title);
  const hasContent = section.outline?.length || section.lines?.length;

  return (
    <section
      id={id}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`grid gap-4 border-b border-[#f0edf7] py-6 transition last:border-b-0 ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="min-w-0">
        {isEditing ? (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-2">
              <button
                type="button"
                draggable
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                className="grid h-10 w-8 cursor-grab place-items-center rounded-[8px] border border-[#e5e1f1] bg-white text-[#756f92] active:cursor-grabbing"
                title="Drag section"
                aria-label={`Drag ${section.title}`}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <InlineTextInput
                value={section.title}
                onChange={(title) => onSectionChange?.({ ...section, title })}
                className="text-lg font-black leading-7 text-[#17142f]"
                ariaLabel={`Section ${index + 1} heading`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" size="icon" onClick={onDelete} title="Delete section" aria-label="Delete section">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <h3 className="break-words text-lg font-black leading-7 text-[#17142f]">{index + 1}. {section.title}</h3>
        )}
        <div className="mt-4">
          {section.outline ? (
            <LessonFlowBlock
              rows={section.outline}
              isEditing={isEditing}
              onRowsChange={(outline) => onSectionChange?.({ ...section, outline })}
            />
          ) : (
            <LessonBulletList
              lines={section.lines || []}
              isEditing={isEditing}
              onLinesChange={(lines) => onSectionChange?.({ ...section, lines })}
            />
          )}
          {!hasContent ? <LessonEmptyLine /> : null}
        </div>
      </div>
    </section>
  );
}

function LessonFlowBlock({
  rows,
  isEditing,
  onRowsChange
}: {
  rows: LessonOutlineRow[];
  isEditing?: boolean;
  onRowsChange?: (rows: LessonOutlineRow[]) => void;
}) {
  if (!rows.length) return null;
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e8e2f4]">
      {rows.map((row, index) => (
        <div key={`${row.phase}-${index}`} className="grid gap-3 border-b border-[#f0edf7] p-4 last:border-b-0 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div className="text-xs font-black uppercase tracking-[0.08em] text-[#6d38f2]">
            {isEditing ? (
              <InlineTextInput
                value={row.time}
                onChange={(time) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, time }))}
                className="text-xs font-black uppercase tracking-[0.08em] text-[#6d38f2]"
                ariaLabel={`Step ${index + 1} time`}
              />
            ) : row.time || "Time"}
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <div className="grid gap-2">
                <InlineTextInput
                  value={row.phase}
                  onChange={(phase) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, phase }))}
          className="text-base font-black text-[#17142f]"
                  ariaLabel={`Step ${index + 1} phase`}
                />
                <InlineTextArea
                  value={row.teacher_action}
                  onChange={(teacher_action) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, teacher_action }))}
                  ariaLabel={`Step ${index + 1} teacher action`}
                />
                <InlineTextArea
                  value={row.student_action}
                  onChange={(student_action) => onRowsChange?.(replaceOutlineRow(rows, index, { ...row, student_action }))}
                  ariaLabel={`Step ${index + 1} student action`}
                />
              </div>
            ) : (
              <>
                <p className="break-words text-base font-black text-[#17142f]">{row.phase || `Step ${index + 1}`}</p>
                {row.teacher_action ? <p className="mt-2 break-words text-base leading-7 text-[#4f4a66]">{row.teacher_action}</p> : null}
                {row.student_action ? (
                  <p className="mt-2 break-words text-base leading-7 text-[#6b6680]">
                    <span className="font-bold text-[#17142f]">Students: </span>{row.student_action}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonBulletList({
  lines,
  isEditing,
  onLinesChange
}: {
  lines: string[];
  isEditing?: boolean;
  onLinesChange?: (lines: string[]) => void;
}) {
  if (!lines.length) return null;
  if (isEditing) {
    return (
      <div className="grid gap-3">
        {lines.map((line, index) => (
          <InlineTextArea
            key={`${index}-${line.slice(0, 16)}`}
            value={line}
            onChange={(value) => onLinesChange?.(replaceLine(lines, index, value))}
            ariaLabel={`Editable line ${index + 1}`}
          />
        ))}
      </div>
    );
  }
  if (lines.length === 1) {
    return <p className="whitespace-pre-wrap break-words text-base leading-8 text-[#4f4a66]">{lines[0]}</p>;
  }
  return (
    <ul className="ml-5 grid list-disc gap-3">
      {lines.map((line, index) => (
        <li key={`${line}-${index}`} className="min-w-0 break-words pl-1 text-base leading-8 text-[#4f4a66]">
          {line}
        </li>
      ))}
    </ul>
  );
}

function LessonEmptyLine() {
  return (
    <p className="rounded-[10px] border border-dashed border-[#ded7ed] bg-[#fbfaff] px-4 py-3 text-base font-semibold text-[#7a748d]">
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
          <span className="font-black uppercase tracking-[0.08em] text-[#8a84a0]">{row.label}: </span>
          {isEditing && draft ? (
            <InlineTextInput
              value={draft.metadata[row.field] || ""}
              onChange={(nextValue) => setDraft({ ...draft, metadata: { ...draft.metadata, [row.field]: nextValue } })}
              className="ml-1 inline-block max-w-[190px] text-right text-xs font-bold text-[#17142f]"
              ariaLabel={row.label}
            />
          ) : (
            <span className="font-bold text-[#17142f]">{formatMetadataValue(row.value)}</span>
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
    <div className="min-w-0 rounded-[12px] border border-[#eee9f7] bg-[#fbfaff] p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#8a84a0]">{label}</p>
      {isEditing && draft ? (
        <InlineTextInput
          value={draft.metadata[field] || ""}
          onChange={(nextValue) => setDraft({ ...draft, metadata: { ...draft.metadata, [field]: nextValue } })}
          className="mt-1 text-sm font-bold text-[#17142f]"
          ariaLabel={label}
        />
      ) : (
        <p className="mt-1 break-words text-sm font-bold text-[#17142f]">{formatMetadataValue(value)}</p>
      )}
    </div>
  );
}

function CompactDetail({ label, value }: { label: string; value?: unknown }) {
  return (
    <div className="min-w-0 border-b border-[#f0edf7] pb-3 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#8a84a0]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#17142f]">{formatMetadataValue(value)}</p>
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

function formatChapterDisplay(metadata: Partial<LessonDocumentMetadata>) {
  const chapter = textOf(metadata.chapter);
  const chapterNumber = textOf(metadata.chapter_number);
  if (!chapter) return "Chapter not provided";
  if (/^chapter\s+\d+/i.test(chapter)) return chapter;
  return chapterNumber ? `Chapter ${chapterNumber}: ${chapter}` : chapter;
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
      className={`w-full min-w-0 rounded-[8px] border border-[#d9cff0] bg-white px-2 py-1 text-base outline-none ring-[#8a4df7]/20 transition focus:ring-4 sm:text-sm ${className || ""}`}
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
      className="w-full min-w-0 resize-y rounded-[10px] border border-[#d9cff0] bg-white px-3 py-2 text-base leading-7 text-[#4f4a66] outline-none ring-[#8a4df7]/20 transition focus:ring-4 sm:text-sm"
    />
  );
}

function buildLessonDocumentDraft(output: any): LessonDocumentDraft {
  const plan = normalizeLessonPlan(output);
  const metadata = plan.metadata || {};
  const existingDocumentSections = normalizeDocumentSections(output?.lesson_document_sections);
  if (existingDocumentSections.length) {
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
    sections: filterLessonSectionsBySelection([
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
    lesson_document_sections: draft.sections.map((section) => ({
      key: section.key,
      title: section.title,
      lines: section.lines ? section.lines.map((line) => line.trim()).filter(Boolean) : undefined,
      outline: section.outline ? section.outline.map((row) => ({ ...row })) : undefined
    }))
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
      : undefined
  })).filter((section) => section.lines?.length || section.outline?.length || section.title);
}

function structuredCloneDraft(draft: LessonDocumentDraft): LessonDocumentDraft {
  return {
    title: draft.title,
    metadata: { ...draft.metadata },
    sections: draft.sections.map((section) => ({
      ...section,
      lines: section.lines ? [...section.lines] : undefined,
      outline: section.outline ? section.outline.map((row) => ({ ...row })) : undefined
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
  onExport,
  onCopy,
  onShare
}: {
  output: any;
  streamKey?: string;
  streamSpeed?: "normal" | "fast" | "instant";
  onSave?: (output?: any) => void;
  onExport?: (output?: any) => void;
  onCopy?: (output?: any) => void;
  onShare?: (output?: any) => void;
}) {
  return <LessonPlanDocumentOutput output={output} onSave={onSave} onExport={onExport} onCopy={onCopy} onShare={onShare} />;

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
                  {streamLines(stream, "objectives", objectives.length ? objectives : []).map((item, index) => (
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

      <div className="no-print mb-5 border-b border-[#ebe7f4] bg-white pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-[#101039]">Generated Worksheet</h1>
            </div>
            <p className="mt-2 text-sm font-medium text-[#67627d]">{grade} • {subject} • {chapter}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onCopy}><Copy className="h-4 w-4" /> Copy</Button>
            <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4" /> PDF</Button>
            <Button size="sm" onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
          </div>
        </div>

        <div className="mt-4 flex rounded-[12px] border border-[#ebe7f4] bg-[#fbfaff] p-1">
          {["Worksheet", "Answer Key", "Marking Scheme"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-10 flex-1 rounded-[8px] text-sm font-bold ${tab === item ? "bg-[#17142f] text-white shadow-sm" : "text-[#67627d]"}`}
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
              <h2 className="break-words text-[19px] font-black leading-tight text-black sm:text-[22px]">{grade} - {subject}</h2>
              <p className="mt-1 break-words text-[16px] font-black leading-snug text-black sm:text-[18px]">{topic}</p>
              <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-700">Chapter: {chapter}</p>
              <p className="mt-1 break-words text-[11px] font-bold uppercase leading-5 tracking-[0.08em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">{metadata.board || "Board"} • {metadata.book || "Textbook"}</p>
            </div>
          </header>

          <div className="mt-7 grid gap-4 font-sans text-sm font-black sm:mt-10 sm:grid-cols-2 sm:gap-7">
            <div className="flex min-w-0 items-end gap-2">Name:<span className="h-5 min-w-0 flex-1 border-b border-slate-400" /></div>
            <div className="flex min-w-0 items-end gap-2">Date:<span className="h-5 min-w-0 flex-1 border-b border-slate-400" /></div>
          </div>
          <div className="mt-3 border-b border-slate-300" />

          <section className="mt-5 rounded-[8px] border border-slate-200 p-3 font-sans sm:p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900 sm:text-sm">Instructions</h3>
            <p className="mt-1 break-words text-[13px] font-semibold italic leading-6 text-slate-700 sm:text-sm">
              {output?.instructions || "Read each question carefully and answer in the space provided. For MCQs, choose the correct option. Answer all questions."}
            </p>
          </section>

          <div className="mt-7 grid gap-6 sm:mt-8 sm:gap-7">
            {sections.map((section: any, sectionIndex: number) => (
              <section key={`${section.section_title}-${sectionIndex}`} className="break-inside-avoid">
                <div className="mb-4 flex min-w-0 items-start gap-3 border-b border-slate-200 pb-2 font-sans">
                  <h3 className="min-w-0 flex-1 break-words text-[15px] font-black leading-6 text-black sm:text-[17px]">{section.section_title}</h3>
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

          <footer className="mt-10 flex flex-col gap-1 border-t border-slate-300 pt-3 font-sans text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
              <span className="min-w-0 break-words">{option}</span>
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
                  <td className="break-words border-r border-slate-200 px-3 py-2">{rowIndex + 1}. {item}</td>
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

function AnswerKeyView({ items }: { items: any[] }) {
  return (
    <section className="rounded-[12px] border border-[#d8d3e5] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-7">
      <h2 className="text-xl font-black text-[#101039]">Answer Key</h2>
      <div className="mt-5 grid gap-4">
        {items.map((section, index) => (
          <div key={`${section.section_title}-${index}`} className="rounded-[10px] border border-[#ebe7f4] bg-white p-4">
            <h3 className="font-black text-[#17142f]">{section.section_title || `Section ${index + 1}`}</h3>
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
    <section className="rounded-[12px] border border-[#d8d3e5] bg-white p-5 shadow-[0_12px_30px_rgba(39,30,91,0.04)] 2xl:p-7">
      <h2 className="text-xl font-black text-[#101039]">Marking Scheme</h2>
      <div className="mt-5 grid gap-4">
        {items.map((section, index) => (
          <div key={`${section.section_title}-${index}`} className="rounded-[10px] border border-[#ebe7f4] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-[#17142f]">{section.section_title || `Section ${index + 1}`}</h3>
              {section.marks_per_question ? <Badge>{section.marks_per_question}</Badge> : null}
            </div>
            <ul className="mt-3 grid gap-2 text-sm font-medium text-[#33304a]">
              {(section.guidelines || []).map((item: any, itemIndex: number) => (
                <li key={itemIndex} className="flex gap-2"><span className="font-black text-[#17142f]">•</span><span>{String(item)}</span></li>
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
