"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Sparkles, X } from "lucide-react";
import { backendApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { PRIMARY_LEVELS, PRIMARY_LEVEL_TO_API, type PrimaryTeachingContext } from "@/lib/primary-context-helpers";

/** What the teacher picked, resolved all the way down to a real theme row. */
export type PrimaryPlanSetup = {
  level: PrimaryTeachingContext["level"];
  subject: string;
  themeId: string;
  themeName: string;
  language: string;
};

type Props = {
  open: boolean;
  /** Pre-fills the form so a teacher whose context is already set just confirms. */
  initialLevel: string;
  initialSubject: string;
  initialTheme: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (setup: PrimaryPlanSetup) => void;
};

const selectClass =
  "w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</label>
      <div className="relative">
        {children}
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

export default function PrimaryPlanSetupModal({
  open,
  initialLevel,
  initialSubject,
  initialTheme,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [level, setLevel] = useState(initialLevel);
  const [subject, setSubject] = useState(initialSubject);
  const [themeId, setThemeId] = useState("");

  // Re-seed from the teacher's saved context every time the modal opens, so
  // reopening after a cancel doesn't strand whatever was half-picked last time.
  useEffect(() => {
    if (!open) return;
    setLevel(initialLevel);
    setSubject(initialSubject);
    setThemeId("");
  }, [open, initialLevel, initialSubject]);

  // Themes come from the curriculum API, not the static theme list, because
  // generation matches on theme_id. A name picked off the static list that has
  // no matching curriculum row resolves to an empty id and the generate call is
  // silently refused — which is exactly the dead end this modal replaces.
  // `level` only sets each theme's has_published_lesson flag server-side, so one
  // fetch per level covers every subject.
  const themesQuery = useQuery({
    queryKey: ["primary-curriculum-themes", level, undefined],
    queryFn: () => backendApi.primaryCurriculumThemes({ level: PRIMARY_LEVEL_TO_API[level as PrimaryTeachingContext["level"]] }),
    enabled: open && !!level,
  });

  // Only themes with an authored lesson at this level can produce a day.
  const teachable = useMemo(
    () => (themesQuery.data ?? []).filter((theme) => theme.has_published_lesson),
    [themesQuery.data]
  );

  const subjectOptions = useMemo(
    () => Array.from(new Set(teachable.map((theme) => theme.subject))).sort(),
    [teachable]
  );

  const themeOptions = useMemo(
    () => teachable.filter((theme) => theme.subject === subject),
    [teachable, subject]
  );

  // Theme names are unique per (name, language, subject), so the same name can
  // appear twice in one subject. Only spell the language out when it disambiguates.
  const showThemeLanguage = useMemo(
    () => new Set(themeOptions.map((theme) => theme.language)).size > 1,
    [themeOptions]
  );

  // Keep the pre-filled subject/theme only while they are still real options.
  useEffect(() => {
    if (subject && subjectOptions.length > 0 && !subjectOptions.includes(subject)) setSubject("");
  }, [subject, subjectOptions]);

  useEffect(() => {
    if (themeId) return;
    const match = themeOptions.find((theme) => theme.name === initialTheme);
    if (match) setThemeId(match.id);
  }, [themeId, themeOptions, initialTheme]);

  if (!open) return null;

  const selectedTheme = themeOptions.find((theme) => theme.id === themeId);
  const canSubmit = !!level && !!subject && !!selectedTheme && !submitting;

  const handleSubmit = () => {
    if (!canSubmit || !selectedTheme) return;
    onSubmit({
      level: level as PrimaryTeachingContext["level"],
      subject,
      themeId: selectedTheme.id,
      themeName: selectedTheme.name,
      language: selectedTheme.language,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Set up today's plan"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900">Set up today's plan</h3>
            <p className="mt-0.5 text-[11px] font-bold text-[#454c86]">
              Pick what you're teaching and we'll build the day.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <Field label="Class">
            <select
              value={level}
              onChange={(event) => {
                setLevel(event.target.value);
                setSubject("");
                setThemeId("");
              }}
              className={selectClass}
            >
              <option value="">Select class…</option>
              {PRIMARY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject">
            <select
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setThemeId("");
              }}
              disabled={subjectOptions.length === 0}
              className={selectClass}
            >
              <option value="">{subjectOptions.length === 0 ? "Pick a class first" : "Select subject…"}</option>
              {subjectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Theme / Topic">
            <select
              value={themeId}
              onChange={(event) => setThemeId(event.target.value)}
              disabled={themeOptions.length === 0}
              className={selectClass}
            >
              <option value="">{themeOptions.length === 0 ? "Pick a subject first" : "Select theme…"}</option>
              {themeOptions.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.emoji ? `${theme.emoji} ` : ""}
                  {theme.name}
                  {showThemeLanguage ? ` · ${theme.language}` : ""}
                </option>
              ))}
            </select>
          </Field>

          {themesQuery.isFetching && (
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading themes…
            </p>
          )}

          {themesQuery.isError && (
            <p className="text-[11px] font-bold text-rose-600">
              {getErrorMessage(themesQuery.error, "We couldn't load the themes. Try again.")}
            </p>
          )}

          {/* An empty list here is a curriculum gap, not teacher error — say so
              plainly instead of the old "pick a level, subject and theme". */}
          {!themesQuery.isFetching && !themesQuery.isError && level && teachable.length === 0 && (
            <p className="text-[11px] font-bold text-amber-700">
              No themes have been published for {level} yet. Pick another class, or ask your admin to publish
              curriculum for this one.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8e7fb] bg-white px-4 py-2 text-xs font-bold text-[#454c86] hover:bg-[#f7f4ff]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-5 py-2 text-xs font-black text-white shadow-md shadow-violet-100 transition hover:bg-[#5b32d3] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate plan
          </button>
        </div>
      </div>
    </div>
  );
}
