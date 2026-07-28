"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { WorksheetOutput } from "@/components/generation-output";
import { TranslationLanguageSwitcher } from "@/components/translation-language-switcher";
import { useToast } from "@/components/ui/toast";
import { backendApi, type WorksheetTranslation } from "@/lib/api";
import { downloadWorksheetPdf } from "@/lib/worksheet-export";
import { getErrorMessage } from "@/lib/errors";
import { isResourceSaved, saveResourceId } from "@/lib/saved-resources";
import { WorkspaceReturnBanner } from "@/components/workspace/workspace-return-banner";
import {
  WORKSHEET_LANGUAGES,
  WORKSHEET_LANGUAGE_LABELS,
  WORKSHEET_LOCALES,
  isWorksheetLanguage,
  worksheetSwitcherStrings,
  type WorksheetLanguage,
} from "@/lib/worksheet-localization";

export default function WorksheetDetailPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("Worksheet");
  const [generation, setGeneration] = useState<any>(null);
  const [hasUnsavedWorksheetChanges, setHasUnsavedWorksheetChanges] = useState(false);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);

  // Language variants. `activeLanguage` is null until the teacher picks one,
  // which means "show the primary". `translation` holds the variant currently on
  // screen; it is fetched lazily because switching languages is a read and most
  // worksheets only ever have one.
  const [activeLanguage, setActiveLanguage] = useState<WorksheetLanguage | null>(null);
  const [translation, setTranslation] = useState<WorksheetTranslation | null>(null);
  const [translatingLanguage, setTranslatingLanguage] = useState<WorksheetLanguage | null>(null);

  const primaryLanguage: WorksheetLanguage = isWorksheetLanguage(generation?.primary_language)
    ? generation.primary_language
    : "English";
  const currentLanguage = activeLanguage ?? primaryLanguage;
  const isViewingTranslation = currentLanguage !== primaryLanguage;
  const availableLanguages: string[] = generation?.available_languages?.length
    ? generation.available_languages
    : [primaryLanguage];

  // What the page renders and edits: the variant when one is selected, the
  // source otherwise.
  const activeOutput = isViewingTranslation ? translation?.output_json : generation?.output_json;

  useEffect(() => {
    if (generation) {
      setIsSaved(generation.is_saved ?? false);
    }
  }, [generation]);

  const handleSaveToLibrary = async () => {
    if (params.id) {
      try {
        const nextSaved = !isSaved;
        setIsSaved(nextSaved);
        await backendApi.updateResourceSavedState("worksheet", params.id, nextSaved);
        setGeneration((current: any) => current ? { ...current, is_saved: nextSaved } : current);
        toast({
          title: nextSaved ? "Saved to Library" : "Removed from Library",
          description: nextSaved ? "You can find this in your Saved Resources." : "Removed from your library."
        });
      } catch {
        setIsSaved(isSaved);
        toast({ title: "Error updating library", variant: "error" });
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    backendApi.worksheet(params.id)
      .then((worksheet) => {
        if (cancelled) return;
        setGeneration(worksheet);
      })
      .catch((err) => {
        if (cancelled) return;
        toast({
          title: "Could not load worksheet",
          description: getErrorMessage(err, "Try again"),
          variant: "error"
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id, toast]);

  useEffect(() => {
    if (!activeOutput || !hasUnsavedWorksheetChanges) return;
    const timeout = window.setTimeout(() => {
      saveEditedWorksheet(activeOutput, { silent: true })
        .then(() => setAutoSaveFailed(false))
        .catch(() => setAutoSaveFailed(true));
    }, 1200);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOutput, hasUnsavedWorksheetChanges, currentLanguage]);

  function handleWorksheetChange(output: any) {
    if (isViewingTranslation) {
      setTranslation((current) => current ? { ...current, output_json: output } : current);
    } else {
      setGeneration((current: any) => current ? { ...current, output_json: output } : current);
    }
    setHasUnsavedWorksheetChanges(true);
  }

  async function saveEditedWorksheet(output = activeOutput, options: { silent?: boolean } = {}) {
    if (!output) return;

    // Edits land on whichever variant is on screen — writing a translated
    // worksheet back to the source would overwrite the original language.
    if (isViewingTranslation) {
      const previous = translation;
      try {
        const saved = await backendApi.updateWorksheetTranslation(params.id, currentLanguage, output);
        setTranslation(saved);
        setHasUnsavedWorksheetChanges(false);
        if (!options.silent) {
          toast({ title: "Saved", description: "Worksheet saved.", variant: "success" });
        }
      } catch (err) {
        setTranslation(previous ? { ...previous, output_json: output } : previous);
        throw err;
      }
      return;
    }

    if (!generation) return;
    const nextGeneration = { ...generation, output_json: output };
    try {
      const saved = await backendApi.updateWorksheet(params.id, { output_json: output });
      setGeneration(saved);
      setHasUnsavedWorksheetChanges(false);
      if (!options.silent) {
        toast({ title: "Saved", description: "Worksheet saved.", variant: "success" });
      }
    } catch (err) {
      setGeneration(nextGeneration);
      throw err;
    }
  }

  /** Flush pending edits before leaving a variant, so nothing is dropped. */
  const flushPendingEdits = useCallback(async () => {
    if (!hasUnsavedWorksheetChanges) return;
    try {
      await saveEditedWorksheet(activeOutput, { silent: true });
    } catch {
      setAutoSaveFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedWorksheetChanges, activeOutput, currentLanguage]);

  async function selectLanguage(language: WorksheetLanguage) {
    if (language === currentLanguage) return;
    await flushPendingEdits();

    if (language === primaryLanguage) {
      setActiveLanguage(null);
      setTranslation(null);
      return;
    }

    setActiveLanguage(language);
    try {
      setTranslation(await backendApi.worksheetTranslation(params.id, language));
    } catch (err) {
      setActiveLanguage(null);
      setTranslation(null);
      toast({
        title: "Could not open that language",
        description: getErrorMessage(err, "Try again"),
        variant: "error"
      });
    }
  }

  async function translateTo(language: WorksheetLanguage) {
    if (translatingLanguage) return;
    await flushPendingEdits();
    setTranslatingLanguage(language);
    try {
      const created = await backendApi.translateWorksheet(params.id, language);
      setTranslation(created);
      setActiveLanguage(language);
      setGeneration((current: any) => current ? {
        ...current,
        available_languages: current.available_languages?.includes(language)
          ? current.available_languages
          : [...(current.available_languages ?? [primaryLanguage]), language]
      } : current);
      toast({
        title: `Translated into ${WORKSHEET_LANGUAGE_LABELS[language]}`,
        description: "The answer key and marking scheme were translated too.",
        variant: "success"
      });
    } catch (err) {
      toast({
        title: "Translation failed",
        description: getErrorMessage(err, "Try again in a moment."),
        variant: "error"
      });
    } finally {
      setTranslatingLanguage(null);
    }
  }

  const languageSwitcher = useMemo(
    () => (
      <TranslationLanguageSwitcher
        languages={WORKSHEET_LANGUAGES}
        labels={WORKSHEET_LANGUAGE_LABELS}
        availableLanguages={availableLanguages}
        activeLanguage={currentLanguage}
        translatingLanguage={translatingLanguage}
        isActiveStale={isViewingTranslation && Boolean(translation?.is_stale)}
        strings={worksheetSwitcherStrings(currentLanguage)}
        dir={WORKSHEET_LOCALES[currentLanguage].dir}
        onSelect={selectLanguage}
        onTranslate={translateTo}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableLanguages.join("|"), currentLanguage, translatingLanguage, isViewingTranslation, translation?.is_stale]
  );

  async function save(output = activeOutput) {
    try {
      await saveEditedWorksheet(output);
    } catch (err) {
      toast({ title: "Save failed", description: getErrorMessage(err, "Try again"), variant: "error" });
    }
  }

  function worksheetAsText(output: any) {
    return [
      output?.title,
      ...(output?.student_worksheet?.sections || []).flatMap((section: any) => [
        section.section_title,
        ...(section.questions || []).map((question: any, index: number) => `${index + 1}. ${question.question}`)
      ])
    ].filter(Boolean).join("\n");
  }

  async function copy(output = activeOutput) {
    await navigator.clipboard.writeText(worksheetAsText(output));
    toast({ title: "Copied" });
  }

  async function exportPdf(output = activeOutput) {
    await downloadWorksheetPdf(output);
    toast({ title: "PDF downloaded", description: "Exported as a proper text PDF." });
  }

  async function share(output = activeOutput) {
    const text = worksheetAsText(output);
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
      <WorkspaceReturnBanner />
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
        key={currentLanguage}
        output={activeOutput}
        language={currentLanguage}
        languageSwitcher={languageSwitcher}
        tab={tab}
        setTab={setTab}
        onSave={save}
        onCopy={copy}
        onExport={exportPdf}
        onShare={share}
        onChange={handleWorksheetChange}
        isSaved={isSaved}
        onSaveToLibrary={handleSaveToLibrary}
      />
    </div>
  );
}
