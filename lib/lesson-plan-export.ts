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
  const header = [
    `Standard Lesson Plan - ${plan.title}${metadata.class ? ` (Grade ${metadata.class})` : ""}`,
    "",
    "Metadata",
    `Subject: ${metadata.subject || "-"}`,
    `Class/Grade: ${metadata.class || "-"}`,
    `Chapter: ${metadata.chapter || "-"}`,
    `Topic: ${metadata.topic || plan.title}`,
    `Textbook: ${metadata.book || "-"}`,
    `Duration: ${metadata.duration || "-"}`,
    ""
  ];
  const customSections = customLessonDocumentSections(output);
  if (customSections.length) {
    return [
      ...header,
      ...customSections.flatMap((section, index) => [
        `${index + 1}. ${stripLeadingNumber(section.title)}`,
        ...section.lines.map((line) => `- ${line}`),
        ""
      ])
    ].filter(Boolean).join("\n");
  }

  const lines = [
    ...header,
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
  const plan = normalizeLessonPlan(output);
  const metadata = output?.metadata || plan.metadata || {};
  const documentTitle = `${plan.title}${metadata.class ? ` - Class ${metadata.class}` : ""}`;
  const document = new TextPdfDocument(documentTitle);
  const sections = buildStructuredLessonPlanSections(output, plan, includeAnswerKey);

  document.addLessonTitle(plan.title);
  document.addLessonDetails([
    ["Class", metadata.class || metadata.grade],
    ["Subject", metadata.subject],
    ["Duration", metadata.duration || metadata.duration_minutes],
    ["Chapter", formatChapterDisplay(metadata)],
    ["Topic", metadata.topic || plan.title],
    ["Textbook", metadata.book || output?.textbook_source]
  ]);
  sections.forEach((section) => document.addStructuredSection(section.title, section.lines));
  return document.toBlob();
}

type BackwardsPlanSection = {
  title: string;
  paragraphs?: string[];
  bullets?: Array<string | { text: string; children?: string[] }>;
  subheading?: string;
  subBullets?: Array<string | { text: string; children?: string[] }>;
};

function buildBackwardsPlanSections(output: any, plan: NormalizedLessonPlan, includeAnswerKey: boolean): BackwardsPlanSection[] {
  const objectives = plan.objectives.length
    ? [`Students will be able to ${lowercaseFirst(joinSentenceParts(plan.objectives))}.`]
    : valueToLines(output?.learning_outcome).length
      ? valueToLines(output.learning_outcome)
      : ["Students will demonstrate understanding of the lesson topic using textbook evidence and classroom activities."];
  const assessmentQuestions = plan.assessments.map((item) => item.question).filter(Boolean);
  const answerKeyItems = plan.assessments
    .map((item) => textOf(item.expected_answer))
    .filter(Boolean);
  const lessonFlow = plan.outline.length ? plan.outline : [];
  const openingRows = lessonFlow.filter((item) => /warm|open|intro|hook/i.test(item.phase));
  const guidedRows = lessonFlow.filter((item) => /guided|practice|activity|direct|explain/i.test(item.phase));
  const independentRows = lessonFlow.filter((item) => /independent|assessment|check/i.test(item.phase));
  const closingRows = lessonFlow.filter((item) => /clos|conclusion|summary/i.test(item.phase));
  const differentiationEntries = Object.entries(plan.differentiation || {});

  return [
    {
      title: "LEARNING OBJECTIVE",
      paragraphs: objectives
    },
    {
      title: "ASSESSMENTS",
      bullets: [
        `Formative: ${assessmentQuestions[0] || "Students complete an exit ticket showing the main ideas and one example from the lesson."}`,
        `Summative: ${assessmentQuestions.slice(1).join(" ") || "Students write a short response explaining the concept using evidence from class materials."}`
      ],
      subheading: "Answer Key (for teacher use)",
      subBullets: [
        {
          text: "Sample expectations:",
          children: answerKeyItems.length
            ? answerKeyItems
            : [
              ...plan.keyPoints.slice(0, 3),
              plan.teacherNotes || "Review student responses for accuracy, evidence, and clear reasoning."
            ].filter((item): item is string => Boolean(item))
        }
      ]
    },
    {
      title: "KEY POINTS",
      bullets: plan.keyPoints.length ? plan.keyPoints : valueToLines(output?.physical_properties_key_features)
    },
    {
      title: "OPENING",
      bullets: buildFlowBullets(openingRows, [
        `Hook: ${textOf(output?.introduction_warm_up) || "Begin with a short question or prompt connected to students' daily life."}`,
        "Student activity: Students share quick responses with a partner before discussing as a class.",
        `Transition: Explain today's focus is ${plan.title}.`
      ])
    },
    {
      title: "INTRODUCTION TO NEW MATERIAL",
      bullets: [
        ...valueToLines(output?.explanation_of_concept),
        ...valueToLines(output?.chemical_properties_main_concept_details)
      ].length ? [
        ...valueToLines(output?.explanation_of_concept),
        ...valueToLines(output?.chemical_properties_main_concept_details)
      ] : [
        "Teacher presentation: Introduce the key concept using textbook evidence and a clear board summary.",
        "Interactive modeling: Walk through examples and connect each example to the lesson objective.",
        "Active engagement: Students annotate notes, label examples, or complete a short organizer."
      ]
    },
    {
      title: "GUIDED PRACTICE",
      bullets: buildFlowBullets(guidedRows, [
        "Behavioral expectations: Students work in pairs or small groups, stay on task, and cite evidence when making claims.",
        `Practice activity: ${plan.classroomActivity || textOf(output?.activity) || "Students complete a scaffolded classroom activity connected to the lesson."}`,
        "Teacher monitoring: Circulate, ask probing questions, and correct misconceptions.",
        "Check for understanding: Students share one response for quick class discussion."
      ])
    },
    {
      title: "INDEPENDENT PRACTICE",
      bullets: buildFlowBullets(independentRows, [
        "Behavioral expectations: Work quietly, use class materials for reference, and write complete responses.",
        `Assignment: ${assessmentQuestions[0] || "Students answer the assessment questions independently."}`,
        "Success criteria: Accurate content, clear evidence, logical reasoning, and organized writing."
      ])
    },
    {
      title: "DIFFERENTIATION",
      bullets: differentiationEntries.length
        ? differentiationEntries.map(([key, value]) => `${formatDifferentiationLabel(key)}: ${textOf(value)}`)
        : [
          "Below grade level: Provide sentence starters, simplified notes, and guided examples.",
          "On grade level: Complete the core lesson task independently using class notes.",
          "Above grade level: Add an extension question that requires evaluation and evidence."
        ]
    },
    {
      title: "CLOSING",
      bullets: buildFlowBullets(closingRows, [
        `Quick activity: Students summarize the most important idea from ${plan.title}.`,
        "Exit ticket: Students answer one key question and provide one example from the lesson."
      ])
    },
    {
      title: "EXTENSION / ABOVE-GRADE CHALLENGE",
      bullets: [
        "Students complete an extended response or research task that applies the lesson concept to a new example.",
        "This task should require evidence, explanation of trade-offs, and a clear recommendation or conclusion."
      ]
    },
    {
      title: "HOMEWORK",
      bullets: valueToLines(plan.homework).length ? valueToLines(plan.homework) : ["Review class notes and complete unfinished independent practice."]
    },
    {
      title: "STANDARDS ALIGNED",
      paragraphs: ["Which state's standards should I align to?"],
      bullets: ["Standard text not available", "Standard text not available", "Standard text not available"]
    }
  ];
}

function buildStructuredLessonPlanSections(output: any, plan: NormalizedLessonPlan, includeAnswerKey: boolean) {
  const customSections = customLessonDocumentSections(output);
  if (customSections.length) {
    return customSections.map((section, index) => ({
      title: `${index + 1}. ${stripLeadingNumber(section.title)}`,
      lines: section.lines.length ? section.lines : ["Not included in the generated output."]
    }));
  }

  const keyPoints = plan.keyPoints.length ? plan.keyPoints : arrayOf(output?.physical_properties_key_features);
  const differentiationLines = Object.entries(plan.differentiation || {}).map(
    ([key, value]) => `${formatDifferentiationLabel(key)}: ${value}`
  );
  const sections = [
    { title: "1. Learning Objectives", lines: plan.objectives },
    { title: "2. Previous Knowledge", lines: valueToLines(output?.previous_knowledge) },
    { title: "3. Key Textbook Points", lines: keyPoints },
    { title: "4. Teaching-Learning Materials", lines: plan.materials },
    { title: "5. Introduction / Warm-up", lines: valueToLines(output?.introduction_warm_up) },
    { title: "6. Explanation of Concept", lines: valueToLines(output?.explanation_of_concept) },
    {
      title: "7. Lesson Flow",
      lines: plan.outline.flatMap((item, index) => [
        `${index + 1}. ${item.time || "Time not specified"} | ${item.phase || "Lesson step"}`,
        item.teacher_action ? `Teacher: ${item.teacher_action}` : "",
        item.student_action ? `Students: ${item.student_action}` : ""
      ]).filter(Boolean)
    },
    { title: "8. Classroom Activity", lines: valueToLines(output?.classroom_activity || output?.activity || plan.classroomActivity) },
    { title: "9. Main Concept Details", lines: valueToLines(output?.chemical_properties_main_concept_details) },
    { title: "10. Daily Life Connection", lines: valueToLines(output?.uses_daily_life_connection) },
    { title: "11. Differentiation", lines: differentiationLines },
    {
      title: "12. Assessment",
      lines: plan.assessments.map((item, index) => {
        const answer = includeAnswerKey && item.expected_answer ? ` Expected answer: ${item.expected_answer}` : "";
        return `${index + 1}. ${item.question}${item.marks ? ` (${item.marks} mark${item.marks === 1 ? "" : "s"})` : ""}${answer}`;
      })
    },
    { title: "13. Board Work", lines: valueToLines(output?.board_work) },
    { title: "14. Homework", lines: valueToLines(plan.homework) },
    { title: "15. Learning Outcome", lines: valueToLines(output?.learning_outcome) },
    { title: "16. Teacher Notes", lines: valueToLines(plan.teacherNotes) }
  ];

  return sections.map((section) => ({
    title: section.title,
    lines: section.lines.length ? section.lines : ["Not included in the generated output."]
  }));
}

function customLessonDocumentSections(output: any): Array<{ title: string; lines: string[] }> {
  if (!Array.isArray(output?.lesson_document_sections)) return [];
  return output.lesson_document_sections.map((section: any, index: number) => {
    const outlineLines = Array.isArray(section?.outline)
      ? section.outline.flatMap((item: any, itemIndex: number) => [
        `${itemIndex + 1}. ${textOf(item?.time) || "Time not specified"} | ${textOf(item?.phase) || "Lesson step"}`,
        textOf(item?.teacher_action) ? `Teacher: ${textOf(item.teacher_action)}` : "",
        textOf(item?.student_action) ? `Students: ${textOf(item.student_action)}` : ""
      ]).filter(Boolean)
      : [];
    const lines = outlineLines.length ? outlineLines : Array.isArray(section?.lines) ? section.lines.map(textOf).filter(Boolean) : [];
    return {
      title: textOf(section?.title) || `Section ${index + 1}`,
      lines
    };
  }).filter((section: { title: string; lines: string[] }) => section.title && section.lines.length);
}

function stripLeadingNumber(value: string) {
  return value.replace(/^\s*\d+[.)]\s*/, "").trim();
}

function buildFlowBullets(rows: LessonOutlineRow[], fallback: string[]) {
  if (!rows.length) return fallback;
  return rows.flatMap((row) => [
    row.phase ? `${row.phase}${row.time ? ` (${row.time})` : ""}: ${row.teacher_action || "Teacher guides the lesson step."}` : row.teacher_action,
    row.student_action ? `Student activity: ${row.student_action}` : ""
  ]).filter(Boolean);
}

function joinSentenceParts(items: string[]) {
  return items
    .map((item) => item.replace(/[.]+$/, "").trim())
    .filter(Boolean)
    .join("; ");
}

function lowercaseFirst(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function formatGrade(value: unknown) {
  const raw = textOf(value);
  const match = raw.match(/\d+/);
  if (!match) return raw || "Class";
  const grade = Number(match[0]);
  const suffix = grade % 100 >= 11 && grade % 100 <= 13 ? "th" : grade % 10 === 1 ? "st" : grade % 10 === 2 ? "nd" : grade % 10 === 3 ? "rd" : "th";
  return `${grade}${suffix} Grade`;
}

function formatDifferentiationLabel(value: string) {
  const labels: Record<string, string> = {
    below_grade_level: "Below grade level",
    on_grade_level: "On grade level",
    above_grade_level: "Above grade level",
    language_support: "Language support",
    support: "Below grade level",
    core: "On grade level",
    challenge: "Above grade level"
  };
  return labels[value] || label(value);
}

class TextPdfDocument {
  private pages: string[][] = [[]];
  private y = 792;
  private readonly marginX = 68;
  private readonly pageHeight = 842;
  private readonly bottom = 64;
  private readonly usableWidth = 458;
  private readonly headerTitle: string;
  private readonly createdAt = new Date();

  constructor(headerTitle: string) {
    this.headerTitle = headerTitle;
    this.addPageHeader();
  }

  addLessonTitle(title: string) {
    this.write(title, { size: 22, bold: true, gapAfter: 22, maxChars: 40 });
  }

  addLessonDetails(rows: Array<[string, unknown]>) {
    const visibleRows = rows
      .map(([label, value]) => [label, textOf(value)] as [string, string])
      .filter(([, value]) => Boolean(value) && value !== "-");
    if (!visibleRows.length) return;

    this.ensureSpace(42 + visibleRows.length * 14);
    this.write("Lesson Details", { size: 14, bold: true, gapAfter: 6, maxChars: 42 });
    for (const [label, value] of visibleRows) {
      this.write(`${label}: ${value}`, { size: 10.8, gapAfter: 2, maxChars: 72 });
    }
    this.y -= 10;
  }

  addStructuredSection(title: string, lines: string[]) {
    this.ensureSpace(72);
    this.write(stripLeadingNumber(title), { size: 16, bold: true, gapBefore: 2, gapAfter: 7, maxChars: 44 });
    for (const line of lines) {
      if (shouldNumberLine(line)) {
        this.write(line, { size: 11.2, gapAfter: 4, maxChars: 70 });
      } else {
        this.writeBullet(line, 0);
      }
    }
    this.y -= 8;
  }

  addBackwardsSection(section: BackwardsPlanSection) {
    this.ensureSpace(72);
    this.write(section.title, { size: 18, bold: true, gapBefore: 2, gapAfter: 6, maxChars: 36 });
    for (const paragraph of section.paragraphs || []) {
      this.write(paragraph, { size: 11.2, gapAfter: 8 });
    }
    for (const bullet of section.bullets || []) {
      this.writeBullet(bullet, 0);
    }
    if (section.subheading) {
      this.write(section.subheading, { size: 15, bold: true, gapBefore: 4, gapAfter: 4, maxChars: 45 });
    }
    for (const bullet of section.subBullets || []) {
      this.writeBullet(bullet, 0);
    }
    this.y -= 8;
  }

  private writeBullet(bullet: string | { text: string; children?: string[] }, level: number) {
    const text = typeof bullet === "string" ? bullet : bullet.text;
    const children = typeof bullet === "string" ? [] : bullet.children || [];
    this.writeBulletText(text, level, children.length ? 2 : 4);
    for (const child of children) {
      this.writeBullet(child, level + 1);
    }
  }

  private writeBulletText(text: string, level: number, gapAfter: number) {
    const size = 11.2;
    const bulletX = this.marginX + level * 18 + 6;
    const textIndent = level * 18 + 18;
    const lines = wrapText(cleanPdfText(text), this.maxChars(size, textIndent));
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      this.ensureSpace(size + 10);
      if (index === 0) this.drawBulletMark(bulletX, this.y - 4, level);
      const x = this.marginX + textIndent;
      this.currentPage().push(`BT /F1 ${size} Tf 0 0 0 rg ${x} ${this.y} Td (${escapePdfText(line)}) Tj ET`);
      this.y -= Math.ceil(size * 1.32);
    }
    this.y -= gapAfter;
  }

  toBlob() {
    this.addPageFooters();
    const encoder = new TextEncoder();
    const objects: string[] = [];
    const pageObjectIds: number[] = [];

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

  private write(
    text: string,
    options: {
      size: number;
      bold?: boolean;
      indent?: number;
      hangingIndent?: number;
      gapBefore?: number;
      gapAfter?: number;
      maxChars?: number;
    }
  ) {
    if (options.gapBefore) this.y -= options.gapBefore;
    const indent = options.indent || 0;
    const hangingIndent = options.hangingIndent || 0;
    const lines = wrapText(cleanPdfText(text), options.maxChars || this.maxChars(options.size, indent));
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      this.ensureSpace(options.size + 10);
      const x = this.marginX + indent + (index > 0 ? hangingIndent : 0);
      this.currentPage().push(`BT /${options.bold ? "F2" : "F1"} ${options.size} Tf 0 0 0 rg ${x} ${this.y} Td (${escapePdfText(line)}) Tj ET`);
      this.y -= Math.ceil(options.size * 1.32);
    }
    if (options.gapAfter) this.y -= options.gapAfter;
  }

  private ensureSpace(height: number) {
    if (this.y - height >= this.bottom) return;
    this.pages.push([]);
    this.addPageHeader();
  }

  private currentPage() {
    return this.pages[this.pages.length - 1];
  }

  private maxChars(size: number, indent: number) {
    return Math.max(26, Math.floor((this.usableWidth - indent) / (size * 0.48)));
  }

  private addPageHeader() {
    this.y = this.pageHeight - 24;
    this.currentPage().push(`BT /F1 7.5 Tf 0 0 0 rg 23 ${this.y} Td (${escapePdfText(formatPdfDate(this.createdAt))}) Tj ET`);
    this.currentPage().push(`BT /F1 7.5 Tf 0 0 0 rg 260 ${this.y} Td (${escapePdfText(this.headerTitle)}) Tj ET`);
    this.y -= 26;
  }

  private drawBulletMark(x: number, y: number, level: number) {
    const r = level > 0 ? 1.8 : 1.45;
    const c = r * 0.5522847498;
    const path = `${x} ${y + r} m ${x + c} ${y + r} ${x + r} ${y + c} ${x + r} ${y} c ${x + r} ${y - c} ${x + c} ${y - r} ${x} ${y - r} c ${x - c} ${y - r} ${x - r} ${y - c} ${x - r} ${y} c ${x - r} ${y + c} ${x - c} ${y + r} ${x} ${y + r} c`;
    if (level > 0) {
      this.currentPage().push(`q 0 0 0 RG 0.5 w ${path} S Q`);
    } else {
      this.currentPage().push(`q 0 0 0 rg ${path} f Q`);
    }
  }

  private addPageFooters() {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      page.push(`BT /F1 7.5 Tf 0 0 0 rg 23 19 Td (${escapePdfText("about:blank")}) Tj ET`);
      page.push(`BT /F1 7.5 Tf 0 0 0 rg 560 19 Td (${escapePdfText(`${index + 1}/${total}`)}) Tj ET`);
    });
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

function formatPdfDate(value: Date) {
  const pad = (item: number) => String(item).padStart(2, "0");
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}, ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatChapterDisplay(metadata: Record<string, any>) {
  const chapter = textOf(metadata.chapter);
  const chapterNumber = textOf(metadata.chapter_number);
  if (!chapter) return "-";
  if (/^chapter\s+\d+/i.test(chapter)) return chapter;
  return chapterNumber ? `Chapter ${chapterNumber}: ${chapter}` : chapter;
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
