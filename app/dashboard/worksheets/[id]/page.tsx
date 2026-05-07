"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorksheetOutput } from "@/components/generation-output";
import { useToast } from "@/components/ui/toast";
import { downloadWorksheetPdf } from "@/lib/worksheet-export";
import { getWorksheetGeneration, saveWorksheetGeneration } from "@/lib/worksheet-storage";

export default function WorksheetDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("Worksheet");
  const [generation, setGeneration] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    setGeneration(getWorksheetGeneration(params.id));
  }, [params.id]);

  async function save() {
    if (!generation?.output_json) return;
    saveWorksheetGeneration(generation);
    toast({ title: "Saved", description: "Worksheet saved locally." });
  }

  async function copy() {
    const output = generation?.output_json;
    const text = [
      output?.title,
      ...(output?.student_worksheet?.sections || []).flatMap((section: any) => [
        section.section_title,
        ...(section.questions || []).map((question: any, index: number) => `${index + 1}. ${question.question}`)
      ])
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  }

  async function exportPdf() {
    await downloadWorksheetPdf(generation.output_json);
    toast({ title: "PDF downloaded", description: "Exported as a proper text PDF." });
  }

  if (!generation?.output_json) {
    return (
      <div className="mx-auto max-w-[860px] rounded-[18px] border border-[#ebe7f4] bg-white p-6 text-center shadow-[0_12px_30px_rgba(39,30,91,0.05)]">
        <h1 className="text-xl font-black text-[#101039]">Worksheet not found</h1>
        <p className="mt-2 text-sm font-medium text-[#67627d]">Generate a worksheet again to open the printable output.</p>
      </div>
    );
  }

  return (
    <div className="print-shell">
      <WorksheetOutput output={generation.output_json} tab={tab} setTab={setTab} onSave={save} onCopy={copy} onExport={exportPdf} />
    </div>
  );
}
