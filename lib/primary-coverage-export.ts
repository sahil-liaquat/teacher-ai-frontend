/**
 * The Primary coverage report as a downloadable PDF.
 *
 * IMPORT-FREE ON PURPOSE (same rule as lib/primary-coverage.ts): this module is
 * executed by `node --experimental-strip-types --test`, which resolves neither
 * the `@/*` alias nor a transitive module graph. Label vocabularies are INJECTED
 * through CoverageExportInput rather than imported, so nothing is duplicated.
 *
 * Mechanism follows lib/worksheet-export.ts exactly: hand-rolled PDF 1.4 bytes,
 * Type1 Helvetica with WinAnsiEncoding, Blob -> object URL -> anchor click. The
 * primitives are knowingly duplicated from that file rather than extracted,
 * because refactoring a live revenue-path exporter to serve a flagged-off
 * Primary feature is the wrong trade. Extracting lib/pdf-primitives.ts is a
 * worthwhile follow-up; it is not this task.
 *
 * NON-LATIN: WinAnsiEncoding cannot render Devanagari or Nastaliq, and embedding
 * a font would not help — both need complex-script shaping (conjuncts,
 * ligatures) a glyph-per-codepoint writer cannot do. Six of the 51 seeded theme
 * rows are Devanagari. downloadCoverageReportPdf throws UnsupportedScriptError
 * and the caller falls back to window.print(), exactly as
 * app/dashboard/worksheets/[id]/page.tsx already does for worksheets.
 */

export class UnsupportedScriptError extends Error {
  constructor() {
    super("This coverage report needs the browser's print dialog.");
    this.name = "UnsupportedScriptError";
  }
}

// Structural shapes, satisfied by the lib/api.ts coverage types. Declared here
// rather than imported so this module stays import-free.
export type CoverageExportDay = {
  date: string;
  level: string | null;
  subject: string | null;
  theme_name: string | null;
  total: number;
  completed: number;
  state: string;
};

export type CoverageExportTotals = {
  days_in_range: number;
  days_with_plan: number;
  days_without_plan: number;
  activities: number;
  completed: number;
  partially_completed: number;
  skipped: number;
  rescheduled: number;
  minutes_planned: number;
  minutes_completed: number;
};

export type CoverageExportReport = {
  start: string;
  end: string;
  days: CoverageExportDay[];
  totals: CoverageExportTotals;
};

export type CoverageExportTheme = {
  theme_name: string;
  subject: string;
  steps_total: number;
  steps_taught: number;
  completion_pct: number;
  state: string;
  authored: boolean;
};

export type CoverageExportThemeReport = {
  themes: CoverageExportTheme[];
  themes_total: number;
  themes_authored: number;
  themes_not_authored: number;
  themes_complete: number;
  completion_pct: number;
};

export type CoverageExportInput = {
  teacherName: string;
  teacherEmail?: string | null;
  rangeLabel: string;
  themeLevelLabel: string;
  generatedOn: string;
  report: CoverageExportReport;
  themeReport: CoverageExportThemeReport;
  levelLabels: Record<string, string>;
  dayStateLabels: Record<string, string>;
  themeStateLabels: Record<string, string>;
};

type RGB = [number, number, number];

const BLUE: RGB = [0.04, 0.49, 1];
const DARK: RGB = [0.05, 0.05, 0.16];
const MUTED: RGB = [0.37, 0.4, 0.5];
const LIGHT: RGB = [0.93, 0.97, 1];
const LINE: RGB = [0.72, 0.85, 1];

const DAY_COLUMNS = [78, 62, 78, 165, 52, 80];
const THEME_COLUMNS = [190, 100, 70, 45, 110];

const FOOTNOTE =
  'Blank rows mean no plan was generated for that day. "No lesson authored yet" ' +
  "means TeachPad has no lesson for that theme at this level - it is not a gap " +
  "in this teacher's work.";

function labelFor(labels: Record<string, string>, key: string): string {
  // Degrade to the raw key rather than throwing: a state added server-side must
  // not break an export the teacher is standing in front of.
  return labels[key] || key;
}

/** The exact substitutions the writer applies before stripping. */
export function normaliseForPdf(value: string): string {
  return String(value == null ? "" : value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•·]/g, "-");
}

/**
 * True when any string would be silently deleted by the writer.
 *
 * Normalisation runs BEFORE the test on purpose: without it, one em-dash in a
 * theme name would push an entirely English report through the print dialog.
 */
export function coverageNeedsPrintDialog(strings: string[]): boolean {
  for (const value of strings) {
    if (/[^\x09\x0A\x0D\x20-\x7E]/.test(normaliseForPdf(value))) return true;
  }
  return false;
}

/** Every string the writer will draw. Emoji are neither drawn nor scanned. */
export function buildCoverageExportStrings(input: CoverageExportInput): string[] {
  const strings: string[] = [
    "TeachPad",
    "Teaching Coverage Report",
    input.teacherName,
    input.teacherEmail || "",
    input.rangeLabel,
    input.themeLevelLabel,
    input.generatedOn,
    FOOTNOTE,
  ];
  for (const day of input.report.days) {
    strings.push(day.level ? labelFor(input.levelLabels, day.level) : "");
    strings.push(day.subject || "");
    strings.push(day.theme_name || "");
    strings.push(labelFor(input.dayStateLabels, day.state));
  }
  for (const theme of input.themeReport.themes) {
    strings.push(theme.theme_name);
    strings.push(theme.subject);
    strings.push(labelFor(input.themeStateLabels, theme.state));
  }
  return strings.filter((value) => value.length > 0);
}

export function coverageFilename(rangeLabel: string): string {
  const slug = `teachpad-primary-coverage-${rangeLabel || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return slug || "teachpad-primary-coverage";
}

export function downloadCoverageReportPdf(input: CoverageExportInput): void {
  if (coverageNeedsPrintDialog(buildCoverageExportStrings(input))) {
    throw new UnsupportedScriptError();
  }
  const blob = createCoverageReportBlob(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${coverageFilename(input.rangeLabel)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createCoverageReportBlob(input: CoverageExportInput): Blob {
  const pdf = new CoveragePdfDocument();
  const totals = input.report.totals;

  pdf.header(
    "Teaching Coverage Report",
    input.teacherName,
    input.teacherEmail || "",
    input.rangeLabel,
    input.generatedOn,
  );

  pdf.sectionTitle("Summary");
  pdf.summaryLines([
    `Days in range: ${totals.days_in_range}   With a plan: ${totals.days_with_plan}   Without: ${totals.days_without_plan}`,
    `Activities: ${totals.activities}   Completed: ${totals.completed}   Partly: ${totals.partially_completed}   Skipped: ${totals.skipped}   Moved: ${totals.rescheduled}`,
    `Minutes planned: ${totals.minutes_planned}   Minutes completed: ${totals.minutes_completed}`,
  ]);

  pdf.sectionTitle(`Day by day (${input.rangeLabel})`);
  pdf.tableHead(DAY_COLUMNS, ["Date", "Level", "Subject", "Theme", "Done", "Status"]);
  for (const day of input.report.days) {
    pdf.tableRow(DAY_COLUMNS, [
      day.date,
      day.level ? labelFor(input.levelLabels, day.level) : "-",
      day.subject || "-",
      day.theme_name || "-",
      `${day.completed}/${day.total}`,
      labelFor(input.dayStateLabels, day.state),
    ]);
  }

  pdf.sectionTitle(`Theme coverage - ${input.themeLevelLabel} (all time)`);
  pdf.summaryLines([
    `Themes: ${input.themeReport.themes_total}   Authored: ${input.themeReport.themes_authored}   Not authored: ${input.themeReport.themes_not_authored}   Complete: ${input.themeReport.themes_complete}`,
    `Overall completion across authored themes: ${input.themeReport.completion_pct}%`,
  ]);
  pdf.tableHead(THEME_COLUMNS, ["Theme", "Subject", "Taught", "%", "Status"]);
  for (const theme of input.themeReport.themes) {
    pdf.tableRow(THEME_COLUMNS, [
      theme.theme_name,
      theme.subject,
      theme.authored ? `${theme.steps_taught}/${theme.steps_total}` : "-",
      // A dash, never "0%": an unauthored theme is TeachPad's gap, not the
      // teacher's, and a percentage would read as an accusation.
      theme.authored ? `${theme.completion_pct}%` : "-",
      labelFor(input.themeStateLabels, theme.state),
    ]);
  }

  pdf.note(FOOTNOTE);
  pdf.footer();
  return pdf.toBlob();
}

class CoveragePdfDocument {
  private pages: string[][] = [[]];
  private y = 790;
  private readonly marginX = 40;
  private readonly pageHeight = 842;
  private readonly bottom = 56;
  private readonly usableWidth = 515;

  header(title: string, name: string, email: string, range: string, generatedOn: string) {
    this.writeAt("TeachPad", this.marginX, this.y, { size: 9, bold: true, color: BLUE });
    this.y -= 24;
    this.writeAt(title, this.marginX, this.y, { size: 18, bold: true, color: DARK });
    this.y -= 20;
    this.writeAt(name, this.marginX, this.y, { size: 11, bold: true, color: DARK });
    this.y -= 14;
    if (email) {
      this.writeAt(email, this.marginX, this.y, { size: 9, color: MUTED });
      this.y -= 14;
    }
    this.writeAt(`Range: ${range}`, this.marginX, this.y, { size: 9, bold: true, color: MUTED });
    this.writeAt(`Generated ${generatedOn}`, 400, this.y, { size: 9, color: MUTED });
    this.y -= 12;
    this.line(this.marginX, this.y, this.marginX + this.usableWidth, this.y, LINE, 1.2);
    this.y -= 22;
  }

  sectionTitle(text: string) {
    this.ensureSpace(34);
    this.writeAt(fit(text, this.usableWidth, 12), this.marginX, this.y, {
      size: 12, bold: true, color: BLUE,
    });
    this.y -= 18;
  }

  summaryLines(lines: string[]) {
    for (const line of lines) {
      this.ensureSpace(16);
      this.writeAt(fit(line, this.usableWidth, 9), this.marginX, this.y, { size: 9, color: DARK });
      this.y -= 13;
    }
    this.y -= 8;
  }

  tableHead(columns: number[], cells: string[]) {
    this.ensureSpace(30);
    this.rect(this.marginX, this.y - 6, this.usableWidth, 18, LIGHT, LINE, true);
    let x = this.marginX + 4;
    for (let index = 0; index < columns.length; index += 1) {
      this.writeAt(fit(cells[index] || "", columns[index] - 8, 8.5), x, this.y, {
        size: 8.5, bold: true, color: BLUE,
      });
      x += columns[index];
    }
    this.y -= 20;
  }

  tableRow(columns: number[], cells: string[]) {
    this.ensureSpace(18);
    let x = this.marginX + 4;
    for (let index = 0; index < columns.length; index += 1) {
      this.writeAt(fit(cells[index] || "", columns[index] - 8, 8.5), x, this.y, {
        size: 8.5, color: DARK,
      });
      x += columns[index];
    }
    this.y -= 6;
    this.line(this.marginX, this.y, this.marginX + this.usableWidth, this.y, LINE, 0.4);
    this.y -= 10;
  }

  note(text: string) {
    this.ensureSpace(40);
    this.y -= 6;
    for (const line of wrapText(cleanPdfText(text), 108)) {
      this.ensureSpace(14);
      this.writeAt(line, this.marginX, this.y, { size: 8, color: MUTED });
      this.y -= 11;
    }
  }

  footer() {
    const pageCount = this.pages.length;
    for (let index = 0; index < pageCount; index += 1) {
      this.pages[index].push(
        `${rgb(MUTED, "fill")} BT /F1 8 Tf ${this.marginX} 32 Td (Generated by TeachPad) Tj ET`,
      );
      this.pages[index].push(
        `${rgb(MUTED, "fill")} BT /F1 8 Tf 470 32 Td (Page ${index + 1} of ${pageCount}) Tj ET`,
      );
    }
  }

  toBlob(): Blob {
    const encoder = new TextEncoder();
    const objects: string[] = [];
    const pageObjectIds: number[] = [];
    const addObject = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = addObject("PAGES_PLACEHOLDER");
    const fontRegularId = addObject(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    );
    const fontBoldId = addObject(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    );

    for (const page of this.pages) {
      const stream = page.join("\n");
      const contentId = addObject(
        `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`,
      );
      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] ` +
          `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> ` +
          `/Contents ${contentId} 0 R >>`,
      );
      pageObjectIds.push(pageId);
    }

    objects[pagesId - 1] =
      `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] ` +
      `/Count ${pageObjectIds.length} >>`;

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
    pdf +=
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  }

  private writeAt(
    text: string,
    x: number,
    y: number,
    options: { size?: number; bold?: boolean; color?: RGB } = {},
  ) {
    const size = options.size || 9;
    const font = options.bold ? "F2" : "F1";
    this.currentPage().push(
      `${rgb(options.color || DARK, "fill")} BT /${font} ${size} Tf ${x} ${y} Td ` +
        `(${escapePdfText(cleanPdfText(text))}) Tj ET`,
    );
  }

  private rect(x: number, y: number, width: number, height: number, fill: RGB, stroke: RGB, filled: boolean) {
    this.currentPage().push(
      `${rgb(fill, "fill")} ${rgb(stroke, "stroke")} ${x} ${y} ${width} ${height} re ${filled ? "B" : "S"}`,
    );
  }

  private line(x1: number, y1: number, x2: number, y2: number, color: RGB, width = 1) {
    this.currentPage().push(`${rgb(color, "stroke")} ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  private ensureSpace(height: number) {
    if (this.y - height >= this.bottom) return;
    this.pages.push([]);
    this.y = this.pageHeight - 52;
  }

  private currentPage(): string[] {
    return this.pages[this.pages.length - 1];
  }
}

/**
 * Truncate to a column. Helvetica metrics are not available to a hand-rolled
 * writer, so this uses the same character-width estimate lib/worksheet-export.ts
 * does. Over-estimating slightly is safe; overflowing a column is not.
 */
function fit(text: string, width: number, size: number): string {
  const clean = cleanPdfText(text);
  const maxChars = Math.max(3, Math.floor(width / (size * 0.52)));
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars - 3)}...`;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
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

function rgb(value: RGB, mode: "fill" | "stroke"): string {
  return `${value[0]} ${value[1]} ${value[2]} ${mode === "fill" ? "rg" : "RG"}`;
}

function cleanPdfText(value: unknown): string {
  return normaliseForPdf(String(value == null ? "" : value)).replace(
    /[^\x09\x0A\x0D\x20-\x7E]/g,
    "",
  );
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
