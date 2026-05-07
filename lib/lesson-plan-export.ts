export type LessonOutlineRow = {
  time: string;
  phase: string;
  teacher_action: string;
  student_action: string;
  notes?: string;
};

export type LessonAssessment = {
  question: string;
  marks: number;
  expected_answer?: string;
};

export type NormalizedLessonPlan = {
  title: string;
  metadata: Record<string, any>;
  objectives: string[];
  keyPoints: string[];
  outline: LessonOutlineRow[];
  strategies: string[];
  classroomActivity: string;
  materials: string[];
  differentiation: Record<string, string>;
  assessments: LessonAssessment[];
  homework: string;
  teacherNotes: string;
  finalChecklist: string[];
};

export function normalizeLessonPlan(output: any): NormalizedLessonPlan {
  const metadata = output?.metadata || {};
  const richAssessments = output?.assessments || {};
  const rawAssessmentQuestions = Array.isArray(output?.assessment_questions) ? output.assessment_questions : [];
  const assessmentQuestions = rawAssessmentQuestions.map((item: any) => ({
    question: textOf(item?.question || item),
    marks: Number(item?.marks || 1),
    expected_answer: textOf(item?.expected_answer || "")
  }));
  const derivedAssessmentQuestions = [
    ...arrayOf(richAssessments?.formative_checks),
    ...arrayOf(richAssessments?.exit_ticket)
  ].map((item) => ({ question: textOf(item), marks: 1, expected_answer: "" }));

  return {
    title: textOf(output?.lesson_title || output?.title || metadata.topic || "Generated Lesson Plan"),
    metadata,
    objectives: arrayOf(output?.learning_objectives).length ? arrayOf(output?.learning_objectives) : arrayOf(output?.learning_objective),
    keyPoints: arrayOf(output?.key_textbook_points).length ? arrayOf(output?.key_textbook_points) : arrayOf(output?.key_concepts),
    outline: normalizeOutline(output),
    strategies: arrayOf(output?.teaching_method_strategy),
    classroomActivity: textOf(output?.classroom_activity || output?.opening?.hook || ""),
    materials: arrayOf(output?.materials_needed),
    differentiation: normalizeDifferentiation(output?.differentiation),
    assessments: assessmentQuestions.length ? assessmentQuestions : derivedAssessmentQuestions,
    homework: textOf(output?.homework || output?.homework_extension?.homework || output?.homework_extension?.extension || ""),
    teacherNotes: textOf(output?.teacher_notes || output?.teacher_tips_common_misconceptions?.tips || ""),
    finalChecklist: arrayOf(output?.final_checklist)
  };
}

export function applyLessonPlanEdits(base: any, draft: NormalizedLessonPlan) {
  const next = {
    ...(base || {}),
    title: draft.title,
    lesson_title: draft.title,
    metadata: { ...(base?.metadata || {}), ...(draft.metadata || {}) },
    learning_objectives: draft.objectives,
    learning_objective: draft.objectives,
    key_concepts: draft.keyPoints,
    key_textbook_points: draft.keyPoints,
    lesson_outline: draft.outline,
    materials_needed: draft.materials,
    differentiation: draft.differentiation,
    assessment_questions: draft.assessments,
    homework: draft.homework,
    teacher_notes: draft.teacherNotes,
    final_checklist: draft.finalChecklist
  };
  if (base?.homework_extension && typeof base.homework_extension === "object") {
    next.homework_extension = { ...base.homework_extension, homework: draft.homework };
  }
  return next;
}

export function formatLessonPlanForClipboard(output: any, includeAnswerKey = true) {
  const plan = normalizeLessonPlan(output);
  const metadata = plan.metadata || {};
  const lines = [
    `Standard Lesson Plan - ${plan.title}${metadata.class ? ` (Grade ${metadata.class})` : ""}`,
    "",
    "Metadata",
    `Subject: ${metadata.subject || "-"}`,
    `Class/Grade: ${metadata.class || "-"}`,
    `Chapter: ${metadata.chapter || "-"}`,
    `Topic: ${metadata.topic || plan.title}`,
    `Textbook: ${metadata.book || "-"}`,
    `Duration: ${metadata.duration || "-"}`,
    "",
    section("1. Learning Objectives", plan.objectives),
    section("2. Key Textbook Points", plan.keyPoints),
    section("3. Materials Needed", plan.materials),
    "4. Lesson Flow / Lesson Outline",
    ...plan.outline.map((item, index) => `${index + 1}. ${item.time || "-"} | ${item.phase || "-"}\n   Teacher: ${item.teacher_action || "-"}\n   Students: ${item.student_action || "-"}`),
    "",
    section("5. Classroom Activity", [plan.classroomActivity]),
    section("6. Differentiation", Object.entries(plan.differentiation).map(([key, value]) => `${label(key)}: ${value}`)),
    "7. Assessment Questions",
    ...plan.assessments.map((item, index) => {
      const answer = includeAnswerKey && item.expected_answer ? `\n   Expected answer: ${item.expected_answer}` : "";
      return `${index + 1}. ${item.question} (${item.marks || 1} mark${Number(item.marks || 1) === 1 ? "" : "s"})${answer}`;
    }),
    "",
    section("8. Homework / Extension", [plan.homework]),
    section("9. Teacher Notes", [plan.teacherNotes]),
    plan.finalChecklist.length ? section("10. Final Checklist", plan.finalChecklist) : ""
  ];
  return lines.filter(Boolean).join("\n");
}

export async function downloadLessonPlanPdf(output: any, includeAnswerKey = false) {
  const plan = normalizeLessonPlan(output);
  const filename = `${sanitizeFilename(`lesson-plan-${plan.title}-${plan.metadata.class || "class"}`)}.pdf`;
  const blob = createLessonPlanPdfBlob(output, includeAnswerKey);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createLessonPlanPdfBlob(output: any, includeAnswerKey = false) {
  const document = new TextPdfDocument();
  const plan = normalizeLessonPlan(output);
  const metadata = output?.metadata || plan.metadata || {};
  const structured = buildStructuredLessonPlanSections(output, plan, includeAnswerKey);

  document.addTitle(`Lesson Plan: ${plan.title}`);
  document.addKeyValueBlock([
    ["Board", metadata.board || "-"],
    ["Class", metadata.class || metadata.grade || "-"],
    ["Subject", metadata.subject || "-"],
    ["Chapter", metadata.chapter || "-"],
    ["Topic", metadata.topic || plan.title],
    ["Duration", metadata.duration || formatDuration(metadata.duration_minutes) || "-"],
    ["Textbook Source", output?.textbook_source || metadata.book || "-"]
  ]);

  for (const section of structured) {
    document.addSection(section.title, section.lines);
  }

  return document.toBlob();
}

function buildStructuredLessonPlanSections(output: any, plan: NormalizedLessonPlan, includeAnswerKey: boolean) {
  const sections = [
    { title: "1. Learning Objectives", lines: plan.objectives },
    { title: "2. Previous Knowledge", lines: valueToLines(output?.previous_knowledge) },
    { title: "3. Teaching-Learning Materials", lines: plan.materials },
    { title: "4. Introduction / Warm-up", lines: valueToLines(output?.introduction_warm_up) },
    { title: "5. Explanation of Concept", lines: valueToLines(output?.explanation_of_concept) },
    { title: "6. Physical Properties / Key Features", lines: valueToLines(output?.physical_properties_key_features?.length ? output.physical_properties_key_features : plan.keyPoints) },
    { title: "7. Activity", lines: valueToLines(output?.classroom_activity || output?.activity || plan.classroomActivity) },
    { title: "8. Chemical Properties / Main Concept Details", lines: valueToLines(output?.chemical_properties_main_concept_details) },
    { title: "9. Uses / Daily Life Connection", lines: valueToLines(output?.uses_daily_life_connection) },
    {
      title: "10. Assessment / Check for Understanding",
      lines: plan.assessments.map((item, index) => {
        const answer = includeAnswerKey && item.expected_answer ? ` Expected answer: ${item.expected_answer}` : "";
        return `${index + 1}. ${item.question}${item.marks ? ` (${item.marks} mark${item.marks === 1 ? "" : "s"})` : ""}${answer}`;
      })
    },
    { title: "11. Board Work", lines: valueToLines(output?.board_work) },
    { title: "12. Homework", lines: valueToLines(plan.homework) },
    { title: "13. Learning Outcome", lines: valueToLines(output?.learning_outcome) }
  ];

  if (plan.teacherNotes) sections.push({ title: "Teacher Notes", lines: valueToLines(plan.teacherNotes) });
  return sections.map((section) => ({
    title: section.title,
    lines: section.lines.length ? section.lines : ["Textbook content was not available for this section."]
  }));
}

class TextPdfDocument {
  private pages: string[][] = [[]];
  private y = 792;
  private readonly marginX = 48;
  private readonly pageHeight = 842;
  private readonly bottom = 54;
  private readonly usableWidth = 499;

  addTitle(title: string) {
    this.write(title, { size: 18, bold: true, gapAfter: 12 });
    this.write("Classroom-ready, textbook-grounded lesson plan", { size: 10, gapAfter: 14 });
  }

  addKeyValueBlock(rows: Array<[string, unknown]>) {
    this.ensureSpace(20 + rows.length * 15);
    this.write("LESSON DETAILS", { size: 11, bold: true, gapAfter: 7 });
    for (const [key, value] of rows) {
      this.write(`${key}: ${textOf(value) || "-"}`, { size: 10, indent: 8, gapAfter: 3 });
    }
    this.y -= 10;
  }

  addSection(title: string, lines: string[]) {
    this.ensureSpace(62);
    this.write(title, { size: 12, bold: true, gapBefore: 4, gapAfter: 7 });
    for (const line of lines.length ? lines : ["Not specified."]) {
      const bullet = shouldNumberLine(line) ? line : `• ${line}`;
      this.write(bullet, { size: 10, indent: 10, gapAfter: 4 });
    }
    this.y -= 6;
  }

  toBlob() {
    const encoder = new TextEncoder();
    const objects: string[] = [];
    const pageObjectIds: number[] = [];
    const contentObjectIds: number[] = [];

    const addObject = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = addObject("PAGES_PLACEHOLDER");
    const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

    for (const page of this.pages) {
      const stream = page.join("\n");
      const streamBytes = encoder.encode(stream).length;
      const contentId = addObject(`<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream`);
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageObjectIds.push(pageId);
      contentObjectIds.push(contentId);
    }

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(encoder.encode(pdf).length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  }

  private write(text: string, options: { size: number; bold?: boolean; indent?: number; gapBefore?: number; gapAfter?: number }) {
    if (options.gapBefore) this.y -= options.gapBefore;
    const lines = wrapText(cleanPdfText(text), this.maxChars(options.size, options.indent || 0));
    for (const line of lines) {
      this.ensureSpace(options.size + 8);
      this.currentPage().push(`BT /${options.bold ? "F2" : "F1"} ${options.size} Tf ${this.marginX + (options.indent || 0)} ${this.y} Td (${escapePdfText(line)}) Tj ET`);
      this.y -= Math.ceil(options.size * 1.42);
    }
    if (options.gapAfter) this.y -= options.gapAfter;
  }

  private ensureSpace(height: number) {
    if (this.y - height >= this.bottom) return;
    this.pages.push([]);
    this.y = this.pageHeight - 50;
  }

  private currentPage() {
    return this.pages[this.pages.length - 1];
  }

  private maxChars(size: number, indent: number) {
    return Math.max(42, Math.floor((this.usableWidth - indent) / (size * 0.52)));
  }
}

function wrapText(text: string, maxChars: number) {
  const paragraphs = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const lines: string[] = [];
  for (const paragraph of paragraphs.length ? paragraphs : [""]) {
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function valueToLines(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(valueToLines).filter(Boolean);
  if (typeof value === "object") {
    if ("question" in value) return [textOf(value.question)];
    if ("feature" in value || "textbook_detail" in value) return [`${textOf(value.feature || "Feature")}: ${textOf(value.textbook_detail)}`];
    return Object.entries(value).map(([key, item]) => `${label(key)}: ${textOf(item)}`).filter(Boolean);
  }
  return String(value).split(/\n+/).map((line) => line.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
}

function formatDuration(value: unknown) {
  if (!value) return "";
  return `${value} minutes`;
}

function shouldNumberLine(value: string) {
  return /^\s*\d+[.)]/.test(value);
}

function cleanPdfText(value: string) {
  return textOf(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export async function shareLessonPlan(output: any) {
  const plan = normalizeLessonPlan(output);
  const text = formatLessonPlanForClipboard(output, false);
  const shareData = { title: plan.title, text };
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return "cancelled";
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}

export function sanitizeFilename(value: string) {
  return (value || "lesson-plan")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "lesson-plan";
}

export function arrayOf(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean);
  if (typeof value === "object") return Object.values(value).map(textOf).filter(Boolean);
  return String(value).split(/\n+/).map((item) => item.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
}

export function textOf(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join("; ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${label(key)}: ${textOf(item)}`)
      .filter(Boolean)
      .join("; ");
  }
  return String(value).trim();
}

function normalizeOutline(output: any): LessonOutlineRow[] {
  const oldOutline = Array.isArray(output?.lesson_outline) ? output.lesson_outline : [];
  if (oldOutline.length) {
    return oldOutline.map((item: any) => ({
      time: textOf(item.time),
      phase: textOf(item.phase),
      teacher_action: textOf(item.teacher_action),
      student_action: textOf(item.student_action),
      notes: textOf(item.notes)
    }));
  }
  const rows: LessonOutlineRow[] = [];
  if (output?.opening) {
    rows.push({
      time: "5 min",
      phase: "Opening",
      teacher_action: textOf(output.opening.teacher_action || output.opening.hook),
      student_action: textOf(output.opening.student_action)
    });
  }
  for (const item of output?.guided_practice || []) {
    rows.push({
      time: "10 min",
      phase: `Guided Practice ${item?.level ? `- ${item.level}` : ""}`,
      teacher_action: textOf(item?.task),
      student_action: textOf(item?.success_criteria)
    });
  }
  if (output?.independent_practice) {
    rows.push({
      time: "8 min",
      phase: "Independent Practice",
      teacher_action: textOf(output.independent_practice.task),
      student_action: arrayOf(output.independent_practice.success_criteria).join("; ")
    });
  }
  return rows;
}

function normalizeDifferentiation(value: any): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, textOf(item)]).filter(([, item]) => Boolean(item)));
}

function section(title: string, items: string[]) {
  return [title, ...(items.length ? items : ["Not specified."]).map((item) => `- ${item}`), ""].join("\n");
}

function label(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
