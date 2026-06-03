import { sanitizeFilename, textOf } from "@/lib/lesson-plan-export";

type GeneratedTextPdfOptions = {
  title: string;
  subtitle?: string;
  text: string;
  filenamePrefix: string;
  handwritten?: boolean;
};

export async function downloadGeneratedTextPdf({ title, subtitle, text, filenamePrefix, handwritten = false }: GeneratedTextPdfOptions) {
  if (handwritten) {
    await downloadHandwrittenTextPdf({ title, subtitle, text, filenamePrefix });
    return;
  }

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

async function downloadHandwrittenTextPdf({ title, subtitle, text, filenamePrefix }: Omit<GeneratedTextPdfOptions, "handwritten">) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = 1240;
  const canvasHeight = Math.round((canvasWidth * pageHeight) / pageWidth);
  const marginLeft = 128;
  const marginRight = 88;
  const top = 104;
  const bottom = 116;
  const usableWidth = canvasWidth - marginLeft - marginRight;
  const pageImages: string[] = [];
  let lineSeed = 0;
  let pageNumber = 1;
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare handwritten PDF canvas.");
  let y = top;

  function setupPage() {
    canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare handwritten PDF canvas.");

    context.fillStyle = "#fffdf7";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.strokeStyle = "rgba(96, 165, 250, 0.24)";
    context.lineWidth = 2;
    for (let lineY = 150; lineY < canvasHeight - 70; lineY += 44) {
      context.beginPath();
      context.moveTo(82, lineY);
      context.lineTo(canvasWidth - 72, lineY);
      context.stroke();
    }
    context.strokeStyle = "rgba(244, 114, 182, 0.42)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(102, 72);
    context.lineTo(102, canvasHeight - 72);
    context.stroke();

    if (pageNumber === 1) {
      context.fillStyle = "rgba(244, 114, 182, 0.10)";
      context.roundRect(92, 72, canvasWidth - 150, 88, 20);
      context.fill();
    }
    y = top;
  }

  function finishPage() {
    if (!context) return;
    context.save();
    context.font = handwrittenFont(18);
    context.fillStyle = "rgba(30, 58, 111, 0.62)";
    context.fillText(`TeachPad notes • ${pageNumber}`, marginLeft, canvasHeight - 54);
    context.restore();
    pageImages.push(canvas.toDataURL("image/jpeg", 0.92));
    pageNumber += 1;
  }

  function newPage() {
    finishPage();
    setupPage();
  }

  function ensureSpace(height: number) {
    if (y + height <= canvasHeight - bottom) return;
    newPage();
  }

  function handwrittenFont(size: number, weight = "500") {
    return `${weight} ${size}px "Noteworthy", "Bradley Hand", "Segoe Print", "Comic Sans MS", "Marker Felt", cursive`;
  }

  function jitter(amount: number) {
    lineSeed += 1;
    return Math.sin(lineSeed * 1.91) * amount;
  }

  function wrapLines(value: string, maxWidth: number, font: string) {
    const ctx = context;
    if (!ctx) return [];
    ctx.font = font;
    return textOf(value).split("\n").flatMap((rawLine) => {
      const words = rawLine.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [""];
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !current) {
          current = candidate;
        } else {
          lines.push(current);
          current = word;
        }
      }
      if (current) lines.push(current);
      return lines;
    });
  }

  function drawWrapped(value: string, options: { size: number; weight?: string; color?: string; gapAfter?: number; lineHeight?: number; underline?: boolean }) {
    if (!context) return;
    const clean = textOf(value).trim();
    if (!clean) return;
    const font = handwrittenFont(options.size, options.weight);
    const lines = wrapLines(clean, usableWidth, font);
    const lineHeight = options.lineHeight ?? options.size * 1.62;
    ensureSpace(lines.length * lineHeight + (options.gapAfter ?? 12));

    context.save();
    context.font = font;
    context.fillStyle = options.color ?? "#1e3a6f";
    context.textBaseline = "alphabetic";
    for (const line of lines) {
      const x = marginLeft + jitter(2.4);
      const baseline = y + jitter(1.4);
      context.save();
      context.translate(x, baseline);
      context.rotate((jitter(0.3) * Math.PI) / 180);
      context.fillText(line, 0, 0);
      if (options.underline && line.trim()) {
        context.strokeStyle = "rgba(244, 114, 182, 0.46)";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(0, 8);
        context.lineTo(Math.min(context.measureText(line).width, usableWidth), 8 + jitter(1));
        context.stroke();
      }
      context.restore();
      y += lineHeight;
    }
    context.restore();
    y += options.gapAfter ?? 12;
  }

  setupPage();
  drawWrapped(title || "Classroom Notes", { size: 42, weight: "700", color: "#0f2f68", gapAfter: 4, lineHeight: 54, underline: true });
  if (subtitle) drawWrapped(subtitle, { size: 24, weight: "600", color: "#be185d", gapAfter: 28, lineHeight: 34 });
  else y += 24;

  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    const [first, ...rest] = lines;
    const isHeading = rest.length > 0 && first.length <= 80 && !first.startsWith("-") && !/^\d+\./.test(first);
    if (isHeading) {
      drawWrapped(first, { size: 31, weight: "700", color: "#0f2f68", gapAfter: 8, lineHeight: 42, underline: true });
      for (const line of rest) {
        const bullet = line.startsWith("-") ? `• ${line.replace(/^-+\s*/, "")}` : line;
        drawWrapped(bullet, { size: 25, color: "#1e3a6f", gapAfter: 5, lineHeight: 38 });
      }
      y += 10;
    } else {
      for (const line of lines) {
        const bullet = line.startsWith("-") ? `• ${line.replace(/^-+\s*/, "")}` : line;
        drawWrapped(bullet, { size: 25, color: "#1e3a6f", gapAfter: 5, lineHeight: 38 });
      }
      y += 8;
    }
  }

  finishPage();
  pageImages.forEach((image, index) => {
    if (index > 0) pdf.addPage();
    pdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight);
  });
  pdf.save(`${sanitizeFilename(`${filenamePrefix}-${title || "generated-output"}-handwritten`)}.pdf`);
}
