"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorksheetOutput } from "@/components/generation-output";
import { useToast } from "@/components/ui/toast";
import { backendApi } from "@/lib/api";
import { downloadWorksheetPdf } from "@/lib/worksheet-export";
import { getWorksheetGeneration, saveWorksheetGeneration } from "@/lib/worksheet-storage";

export default function WorksheetDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("Worksheet");
  const [generation, setGeneration] = useState<any>(null);
  const [hasUnsavedWorksheetChanges, setHasUnsavedWorksheetChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    backendApi.worksheet(params.id)
      .then((worksheet) => {
        if (cancelled) return;
        setGeneration(worksheet);
        saveWorksheetGeneration(worksheet);
      })
      .catch(() => {
        if (cancelled) return;
        setGeneration(getWorksheetGeneration(params.id));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    if (!generation?.output_json || !hasUnsavedWorksheetChanges) return;
    const timeout = window.setTimeout(() => {
      saveEditedWorksheet(generation.output_json, { silent: true }).catch(() => undefined);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [generation?.output_json, hasUnsavedWorksheetChanges]);

  function handleWorksheetChange(output: any) {
    setGeneration((current: any) => current ? { ...current, output_json: output } : current);
    setHasUnsavedWorksheetChanges(true);
  }

  async function saveEditedWorksheet(output = generation?.output_json, options: { silent?: boolean } = {}) {
    if (!generation || !output) return;
    const nextGeneration = { ...generation, output_json: output };
    saveWorksheetGeneration(nextGeneration);
    try {
      const saved = await backendApi.updateWorksheet(params.id, { output_json: output });
      setGeneration(saved);
      saveWorksheetGeneration(saved);
      setHasUnsavedWorksheetChanges(false);
    } catch {
      setGeneration(nextGeneration);
    }
    if (!options.silent) {
      toast({ title: "Saved", description: "Worksheet saved." });
    }
  }

  async function save(output = generation?.output_json) {
    await saveEditedWorksheet(output);
  }

  async function copy(output = generation?.output_json) {
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

  async function exportPdf(output = generation?.output_json) {
    await downloadWorksheetPdf(output);
    toast({ title: "PDF downloaded", description: "Exported as a proper text PDF." });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[860px] rounded-[18px] border border-[#dffafa] bg-white p-6 text-center shadow-[0_12px_30px_rgba(39,30,91,0.05)]">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#c9f7fb] border-t-[#6f3ee9]" />
        <p className="mt-4 text-sm font-bold text-[#6d6f78]">Loading worksheet...</p>
      </div>
    );
  }

  if (!generation?.output_json) {
    return (
      <div className="mx-auto max-w-[860px] rounded-[18px] border border-[#dffafa] bg-white p-6 text-center shadow-[0_12px_30px_rgba(39,30,91,0.05)]">
        <h1 className="text-xl font-black text-[#25262b]">Worksheet not found</h1>
        <p className="mt-2 text-sm font-medium text-[#6d6f78]">Generate a worksheet again to open the printable output.</p>
      </div>
    );
  }

  return (
    <div className="print-shell">
      <WorksheetOutput
        output={generation.output_json}
        tab={tab}
        setTab={setTab}
        onSave={save}
        onCopy={copy}
        onExport={exportPdf}
        onChange={handleWorksheetChange}
      />
    </div>
  );
}
