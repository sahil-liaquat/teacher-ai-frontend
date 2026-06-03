import { sanitizeFilename, textOf } from "@/lib/lesson-plan-export";

type GeneratedTextPdfOptions = {
  title: string;
  subtitle?: string;
  text: string;
  filenamePrefix: string;
};

export async function downloadGeneratedTextPdf({ title, subtitle, text, filenamePrefix }: GeneratedTextPdfOptions) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 48;
  const bottom = 56;
  const usableWidth = pageWidth - marginX * 2;
  let y = 56;

  function ensureSpace(height: number) {
    if (y + height <= pageHeight - bottom) return;
    pdf.addPage();
    y = 56;
  }

  function writeWrapped(value: string, options: { size?: number; bold?: boolean; color?: [number, number, number]; gapAfter?: number; lineHeight?: number } = {}) {
    const clean = textOf(value).trim();
    if (!clean) return;
    const size = options.size ?? 10.5;
    const lineHeight = options.lineHeight ?? size * 1.45;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...(options.color ?? [37, 38, 43]));
    const lines = pdf.splitTextToSize(clean, usableWidth) as string[];
    ensureSpace(lines.length * lineHeight + (options.gapAfter ?? 6));
    for (const line of lines) {
      pdf.text(line, marginX, y);
      y += lineHeight;
    }
    y += options.gapAfter ?? 6;
  }

  function writeHeader() {
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(marginX - 12, 34, usableWidth + 24, 72, 10, 10, "F");
    y = 64;
    writeWrapped(title || "Generated Output", { size: 18, bold: true, color: [37, 99, 235], gapAfter: 2, lineHeight: 22 });
    if (subtitle) writeWrapped(subtitle, { size: 10, bold: true, color: [100, 116, 139], gapAfter: 24, lineHeight: 13 });
    else y += 20;
  }

  writeHeader();

  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    const [first, ...rest] = lines;
    const isHeading = rest.length > 0 && first.length <= 80 && !first.startsWith("-") && !/^\d+\./.test(first);
    if (isHeading) {
      writeWrapped(first, { size: 12, bold: true, color: [15, 23, 42], gapAfter: 4, lineHeight: 16 });
      for (const line of rest) {
        writeWrapped(line, { size: 10.5, color: [51, 65, 85], gapAfter: 3, lineHeight: 15 });
      }
      y += 6;
    } else {
      for (const line of lines) {
        writeWrapped(line, { size: 10.5, color: [51, 65, 85], gapAfter: 3, lineHeight: 15 });
      }
      y += 4;
    }
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(marginX, pageHeight - 38, pageWidth - marginX, pageHeight - 38);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`TeachPad • Page ${page} of ${pageCount}`, marginX, pageHeight - 22);
  }

  pdf.save(`${sanitizeFilename(`${filenamePrefix}-${title || "generated-output"}`)}.pdf`);
}
