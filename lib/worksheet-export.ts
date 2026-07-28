import { sanitizeFilename, textOf } from "@/lib/lesson-plan-export";

type PdfTextOptions = {
  size?: number;
  bold?: boolean;
  color?: RGB;
  indent?: number;
  gapAfter?: number;
  lineHeight?: number;
};

type RGB = [number, number, number];

const BLUE: RGB = [0.04, 0.49, 1];
const DARK: RGB = [0.05, 0.05, 0.16];
const MUTED: RGB = [0.37, 0.4, 0.5];
const LIGHT_BLUE: RGB = [0.93, 0.97, 1];
const LINE_BLUE: RGB = [0.72, 0.85, 1];

export async function downloadWorksheetPdf(output: any) {
  const metadata = output?.metadata || {};
  const title = textOf(output?.title || metadata.topic || "worksheet");
  const filename = `${sanitizeFilename(`worksheet-${title}-${metadata.grade || "class"}`)}.pdf`;
  const blob = createWorksheetPdfBlob(output);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createWorksheetPdfBlob(output: any) {
  const pdf = new WorksheetPdfDocument();
  const metadata = output?.metadata || {};
  const sections = output?.student_worksheet?.sections || [];
  const grade = metadata.grade ? `Grade ${metadata.grade}` : textOf(metadata.class || "Class");
  const subject = textOf(metadata.subject || "Subject");
  const topic = textOf(metadata.topic || output?.title || "Worksheet");
  const chapter = textOf(metadata.chapter || "Chapter");

  pdf.addHeader({
    title: `${grade} - ${subject}`,
    topic,
    chapter,
    source: `${textOf(metadata.board || "Board")} • ${textOf(metadata.book || "Textbook")}`,
  });
  pdf.addNameDateLines();
  pdf.addInstructions(output?.instructions || "Read each question carefully and answer in the space provided. For MCQs, choose the correct option. Answer all questions.");

  sections.forEach((section: any, sectionIndex: number) => {
    pdf.addSectionHeading(section.section_title || `Part ${String.fromCharCode(65 + sectionIndex)}`, section.marks);
    (section.questions || []).forEach((question: any, index: number) => {
      pdf.addQuestion(question, index + 1, section.question_type || section.section_title || "");
    });
  });

  pdf.addFooter();
  return pdf.toBlob();
}

class WorksheetPdfDocument {
  private pages: string[][] = [[]];
  private y = 780;
  private readonly marginX = 50;
  private readonly pageHeight = 842;
  private readonly bottom = 56;
  private readonly usableWidth = 495;

  addHeader({ title, topic, chapter, source }: { title: string; topic: string; chapter: string; source: string }) {
    this.write(title, { size: 17, bold: true, color: BLUE, gapAfter: 2 });
    this.write(topic, { size: 13, bold: true, color: BLUE, gapAfter: 2 });
    this.write(`Chapter: ${chapter}`, { size: 10, bold: true, color: MUTED, gapAfter: 2 });
    this.write(source.toUpperCase(), { size: 8, bold: true, color: MUTED, gapAfter: 28 });
  }

  addNameDateLines() {
    this.ensureSpace(34);
    this.writeAt("Name:", this.marginX, this.y, { size: 10, bold: true, color: DARK });
    this.line(this.marginX + 42, this.y - 2, 390, this.y - 2, LINE_BLUE);
    this.writeAt("Date:", 410, this.y, { size: 10, bold: true, color: DARK });
    this.line(446, this.y - 2, 545, this.y - 2, LINE_BLUE);
    this.y -= 16;
    this.line(this.marginX, this.y, 545, this.y, LINE_BLUE, 1.4);
    this.y -= 18;
  }

  addInstructions(instructions: string) {
    const lines = wrapText(cleanPdfText(instructions), 92);
    const height = 30 + lines.length * 13;
    this.ensureSpace(height + 12);
    this.rect(this.marginX, this.y - height + 12, this.usableWidth, height, LIGHT_BLUE, LIGHT_BLUE, true);
    this.writeAt("INSTRUCTIONS", this.marginX + 10, this.y - 4, { size: 9, bold: true, color: DARK });
    this.y -= 18;
    for (const line of lines) {
      this.write(line, { size: 9, bold: true, color: BLUE, indent: 10, gapAfter: 1 });
    }
    this.y -= 18;
  }

  addSectionHeading(title: string, marks?: number) {
    this.ensureSpace(42);
    this.writeAt("≡", this.marginX, this.y, { size: 14, bold: true, color: BLUE });
    this.writeAt(cleanPdfText(title), this.marginX + 22, this.y, { size: 12, bold: true, color: BLUE });
    if (marks) this.writeAt(`${marks} marks`, 495, this.y, { size: 8, bold: true, color: MUTED });
    this.y -= 22;
  }

  addQuestion(question: any, number: number, questionType: string) {
    const options = question.options || [];
    const left = question.left_column || question.left || [];
    const right = question.right_column || question.right || [];
    const lines = wrapText(cleanPdfText(`${number}. ${textOf(question.question)}`), 86);
    this.ensureSpace(30 + lines.length * 14);
    lines.forEach((line, index) => this.write(line, { size: 10.5, bold: index === 0, color: DARK, gapAfter: 2 }));

    if (options.length) {
      for (let i = 0; i < options.length; i += 2) {
        this.ensureSpace(16);
        this.circle(this.marginX + 34, this.y + 2.8, 3.5, MUTED);
        this.writeAt(cleanPdfText(options[i]), this.marginX + 44, this.y, { size: 9.5, color: DARK });
        if (options[i + 1]) {
          this.circle(this.marginX + 261, this.y + 2.8, 3.5, MUTED);
          this.writeAt(cleanPdfText(options[i + 1]), this.marginX + 271, this.y, { size: 9.5, color: DARK });
        }
        this.y -= 15;
      }
      this.y -= 7;
      return;
    }

    if (left.length && right.length) {
      this.addMatchTable(left, right);
      this.y -= 8;
      return;
    }

    this.addAnswerLines(defaultAnswerLines(question.answer_lines, questionType));
    this.y -= 7;
  }

  addMatchTable(left: string[], right: string[]) {
    const rows = Math.max(left.length, right.length);
    const rowHeight = 22;
    const tableHeight = 24 + rows * rowHeight;
    this.ensureSpace(tableHeight + 10);
    const x = this.marginX + 28;
    const width = 430;
    this.rect(x, this.y - tableHeight + 8, width, tableHeight, [1, 1, 1], LINE_BLUE, false);
    this.rect(x, this.y - 16, width, 24, LIGHT_BLUE, LINE_BLUE, true);
    this.line(x + width / 2, this.y + 8, x + width / 2, this.y - tableHeight + 8, LINE_BLUE);
    this.writeAt("Column A", x + 8, this.y - 7, { size: 9, bold: true, color: BLUE });
    this.writeAt("Column B", x + width / 2 + 8, this.y - 7, { size: 9, bold: true, color: BLUE });
    this.y -= 28;
    for (let index = 0; index < rows; index += 1) {
      this.writeAt(`${index + 1}. ${cleanPdfText(left[index] || "")}`, x + 8, this.y, { size: 9, color: DARK });
      this.writeAt(`${String.fromCharCode(65 + index)}. ${cleanPdfText(right[index] || "")}`, x + width / 2 + 8, this.y, { size: 9, color: DARK });
      this.line(x, this.y - 8, x + width, this.y - 8, LINE_BLUE, 0.5);
      this.y -= rowHeight;
    }
  }

  addAnswerLines(count: number) {
    for (let index = 0; index < count; index += 1) {
      this.ensureSpace(18);
      this.line(this.marginX + 28, this.y - 4, 545, this.y - 4, LINE_BLUE, 0.7);
      this.y -= 18;
    }
  }

  addFooter() {
    const pageCount = this.pages.length;
    this.pages.forEach((page, index) => {
      page.push(`${rgb(MUTED, "fill")} BT /F1 8 Tf ${this.marginX} 32 Td (Generated by TeachPad) Tj ET`);
      page.push(`${rgb(MUTED, "fill")} BT /F1 8 Tf 492 32 Td (Page ${index + 1} of ${pageCount}) Tj ET`);
    });
  }

  toBlob() {
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
      const contentId = addObject(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);
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
    for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  }

  private write(text: string, options: PdfTextOptions = {}) {
    const size = options.size || 10;
    const indent = options.indent || 0;
    const lines = wrapText(cleanPdfText(text), this.maxChars(size, indent));
    for (const line of lines) {
      this.ensureSpace(size + 8);
      this.writeAt(line, this.marginX + indent, this.y, options);
      this.y -= options.lineHeight || Math.ceil(size * 1.35);
    }
    this.y -= options.gapAfter || 0;
  }

  private writeAt(text: string, x: number, y: number, options: PdfTextOptions = {}) {
    const size = options.size || 10;
    this.currentPage().push(`${rgb(options.color || DARK, "fill")} BT /${options.bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdfText(cleanPdfText(text))}) Tj ET`);
  }

  private rect(x: number, y: number, width: number, height: number, fill: RGB, stroke: RGB, filled: boolean) {
    this.currentPage().push(`${rgb(fill, "fill")} ${rgb(stroke, "stroke")} ${x} ${y} ${width} ${height} re ${filled ? "B" : "S"}`);
  }

  private line(x1: number, y1: number, x2: number, y2: number, color: RGB, width = 1) {
    this.currentPage().push(`${rgb(color, "stroke")} ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  private circle(x: number, y: number, r: number, stroke: RGB) {
    const k = r * 0.5522847498;
    const xR = (x + r).toFixed(2);
    const xL = (x - r).toFixed(2);
    const yT = (y + r).toFixed(2);
    const yB = (y - r).toFixed(2);
    const xKPlus = (x + k).toFixed(2);
    const xKMinus = (x - k).toFixed(2);
    const yKPlus = (y + k).toFixed(2);
    const yKMinus = (y - k).toFixed(2);
    const xStr = x.toFixed(2);
    const yStr = y.toFixed(2);

    this.currentPage().push(
      `${rgb(stroke, "stroke")} 0.7 w ` +
      `${xR} ${yStr} m ` +
      `${xR} ${yKPlus} ${xKPlus} ${yT} ${xStr} ${yT} c ` +
      `${xKMinus} ${yT} ${xL} ${yKPlus} ${xL} ${yStr} c ` +
      `${xL} ${yKMinus} ${xKMinus} ${yB} ${xStr} ${yB} c ` +
      `${xKPlus} ${yB} ${xR} ${yKMinus} ${xR} ${yStr} c ` +
      `S`
    );
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
    return Math.max(42, Math.floor((this.usableWidth - indent) / (size * 0.5)));
  }
}

function defaultAnswerLines(value: unknown, questionType: string) {
  const provided = Number(value || 0);
  if (provided > 0) return Math.min(provided, 6);
  const type = questionType.toLowerCase();
  if (type.includes("long")) return 5;
  if (type.includes("application")) return 3;
  if (type.includes("short")) return 2;
  return 1;
}

function wrapText(text: string, maxChars: number) {
  const words = cleanPdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
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
  return lines.length ? lines : [""];
}

function rgb(value: RGB, mode: "fill" | "stroke") {
  const [r, g, b] = value;
  return `${r} ${g} ${b} ${mode === "fill" ? "rg" : "RG"}`;
}

function cleanPdfText(value: unknown) {
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
