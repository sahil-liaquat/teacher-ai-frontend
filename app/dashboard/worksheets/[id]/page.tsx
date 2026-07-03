"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { WorksheetOutput } from "@/components/generation-output";
import { useToast } from "@/components/ui/toast";
import { backendApi } from "@/lib/api";
import { downloadWorksheetPdf } from "@/lib/worksheet-export";
import { getWorksheetGeneration, saveWorksheetGeneration } from "@/lib/worksheet-storage";
import { getErrorMessage } from "@/lib/errors";

export default function WorksheetDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("Worksheet");
  const [generation, setGeneration] = useState<any>(null);
  const [hasUnsavedWorksheetChanges, setHasUnsavedWorksheetChanges] = useState(false);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);
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
      saveEditedWorksheet(generation.output_json, { silent: true })
        .then(() => setAutoSaveFailed(false))
        .catch(() => setAutoSaveFailed(true));
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
      if (!options.silent) {
        toast({ title: "Saved", description: "Worksheet saved.", variant: "success" });
      }
    } catch (err) {
      setGeneration(nextGeneration);
      throw err;
    }
  }

  async function save(output = generation?.output_json) {
    try {
      await saveEditedWorksheet(output);
    } catch (err) {
      toast({ title: "Save failed", description: getErrorMessage(err, "Try again"), variant: "error" });
    }
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

  async function share(output = generation?.output_json) {
    const text = [
      output?.title,
      ...(output?.student_worksheet?.sections || []).flatMap((section: any) => [
        section.section_title,
        ...(section.questions || []).map((question: any, index: number) => `${index + 1}. ${question.question}`)
      ])
    ].filter(Boolean).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: output?.title || "Worksheet", text });
        toast({ title: "Shared" });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Share text copied", description: "Paste it wherever you want to share." });
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast({ title: "Share failed", description: "Could not share this worksheet." });
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
        <div className="w-full max-w-[420px] rounded-3xl border border-[#dffafa] bg-white p-8 text-center shadow-[0_20px_50px_rgba(39,30,91,0.04)]">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#6f3ee9]" />
          <p className="mt-5 text-sm font-bold text-slate-600">Loading worksheet...</p>
        </div>
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
      {autoSaveFailed ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          <span>Changes not saved — we'll keep retrying as you edit.</span>
          <button
            type="button"
            className="font-black underline"
            onClick={() =>
              void saveEditedWorksheet()
                .then(() => setAutoSaveFailed(false))
                .catch(() => setAutoSaveFailed(true))
            }
          >
            Retry now
          </button>
        </div>
      ) : null}
      <WorksheetOutput
        output={generation.output_json}
        tab={tab}
        setTab={setTab}
        onSave={save}
        onCopy={copy}
        onExport={exportPdf}
        onShare={share}
        onChange={handleWorksheetChange}
      />
    </div>
  );
}
