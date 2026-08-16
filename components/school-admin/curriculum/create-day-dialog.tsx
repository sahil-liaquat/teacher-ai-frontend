"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Layers, X } from "lucide-react";
import type { PrimaryCurriculumLesson, PrimaryCurriculumTheme } from "@/lib/api";
import {
  EMPTY_SELECTION,
  SELECTION_PROBLEM_MESSAGES,
  applySelectionChange,
  canCreateDay,
  selectionProblem,
  subthemeGroups,
  topicOptions,
  type DayDraftSelection,
} from "@/lib/curriculum-day-draft";
import {
  dayTemplateOptions,
  previousDayInMonth,
  stepsFromLesson,
  templateSteps,
  type DayTemplateId,
} from "@/lib/primary-day-templates";
import { levelLabel, monthLabel } from "@/lib/school-admin-curriculum";
import type { StepDraft } from "@/lib/primary-authoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { weekdayName, weekdayAbbr } from "@/lib/primary-teaching-week";



export type CreateDayRequest = {
  themeId: string;
  topicId: string;
  dailyFocus: string | null;
  steps: StepDraft[];
};

/**
 * Create Teaching Day — where the Theme and Topic are actually chosen.
 *
 * ⚠ The whole reason this dialog exists. Clicking an empty grid cell used to
 * create a day immediately, silently stamping `themes.find(t => t.is_active)`
 * onto it. The author was never asked, and the Day Editor had no theme control,
 * so the day kept whatever theme it was handed — which then drove the teacher's
 * lookup and the resource matcher's dominant facet.
 *
 * The Theme/Topic rules are in `lib/curriculum-day-draft.ts` so they are unit
 * tested; this file is the form around them.
 */
export function CreateDayDialog({
  open,
  week,
  day,
  month,
  level,
  themes,
  monthLessons,
  busy,
  onCancel,
  onCreate,
}: {
  open: boolean;
  week: number;
  day: number;
  month: number;
  level: string;
  themes: PrimaryCurriculumTheme[];
  monthLessons: PrimaryCurriculumLesson[];
  busy: boolean;
  onCancel: () => void;
  onCreate: (request: CreateDayRequest) => void;
}) {
  const [selection, setSelection] = useState<DayDraftSelection>(EMPTY_SELECTION);
  const [dailyFocus, setDailyFocus] = useState("");
  const [template, setTemplate] = useState<DayTemplateId>("standard_routine");
  const [copyFromId, setCopyFromId] = useState("");

  const activeThemes = useMemo(() => themes.filter((theme) => theme.is_active), [themes]);
  const groups = subthemeGroups(activeThemes, selection.themeId);
  const topics = topicOptions(activeThemes, selection);

  const previousDay = useMemo(
    () => previousDayInMonth(monthLessons, week, day),
    [monthLessons, week, day],
  );
  const otherDays = useMemo(
    () => monthLessons.filter((lesson) => lesson.steps?.length && !(lesson.week === week && lesson.day === day)),
    [monthLessons, week, day],
  );
  const templates = useMemo(
    () => dayTemplateOptions({ previousDay, otherDays }),
    [previousDay, otherDays],
  );

  if (!open) return null;

  const problem = selectionProblem(activeThemes, selection);
  const needsCopySource = template === "copy_existing" && !copyFromId;
  const ready = canCreateDay(activeThemes, selection) && !needsCopySource && !busy;

  function change(patch: Partial<DayDraftSelection>) {
    setSelection((current) => applySelectionChange(activeThemes, current, patch));
  }

  function resolveSteps(): StepDraft[] {
    if (template === "copy_previous") return stepsFromLesson(previousDay);
    if (template === "copy_existing") {
      return stepsFromLesson(otherDays.find((lesson) => lesson.id === copyFromId));
    }
    return templateSteps(template);
  }

  function submit() {
    if (!ready) return;
    onCreate({
      themeId: selection.themeId,
      topicId: selection.topicId,
      dailyFocus: dailyFocus.trim() || null,
      steps: resolveSteps(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-day-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
              {levelLabel(level)} · {monthLabel(month)}
            </p>
            <h2 id="create-day-title" className="mt-1 text-xl font-semibold text-slate-950">
              Create Teaching Day
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Week {week}, {weekdayName(day) ?? `day ${day}`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel"
            onClick={onCancel}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <Field label="Theme" required htmlFor="create-day-theme">
            <Select
              id="create-day-theme"
              value={selection.themeId}
              onChange={(value) => change({ themeId: value })}
              placeholder={activeThemes.length ? "Select a theme…" : "No themes yet"}
              disabled={!activeThemes.length}
              options={activeThemes.map((theme) => ({ value: theme.id, label: theme.name }))}
            />
            {!activeThemes.length ? (
              <p className="mt-2 text-xs text-amber-800">
                Create a theme first — a teaching day has to belong to one.
              </p>
            ) : null}
          </Field>

          {groups.length ? (
            <Field label="Sub-theme" htmlFor="create-day-subtheme">
              <Select
                id="create-day-subtheme"
                value={selection.subthemeId}
                onChange={(value) => change({ subthemeId: value })}
                placeholder="All sub-themes"
                options={groups.map((group) => ({ value: group.id, label: group.name }))}
              />
            </Field>
          ) : null}

          <Field label="Topic" required htmlFor="create-day-topic">
            <Select
              id="create-day-topic"
              value={selection.topicId}
              onChange={(value) => change({ topicId: value })}
              disabled={!selection.themeId || !topics.length}
              placeholder={
                !selection.themeId
                  ? "Pick a theme first"
                  : topics.length
                    ? "Select a topic…"
                    : "This theme has no active topics"
              }
              options={topics.map((topic) => ({ value: topic.id, label: topic.name }))}
            />
            {selection.themeId && !topics.length ? (
              <p className="mt-2 text-xs text-amber-800">
                Add a topic to this theme in Themes before planning a day against it.
              </p>
            ) : null}
          </Field>

          <Field label="Daily focus" htmlFor="create-day-focus">
            <Input
              id="create-day-focus"
              value={dailyFocus}
              onChange={(event) => setDailyFocus(event.target.value)}
              placeholder="e.g. Identifying major body parts"
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-950">Start with</legend>
            <div className="space-y-2">
              {templates.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition",
                    template === option.id
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <input
                    type="radio"
                    name="day-template"
                    className="mt-1"
                    checked={template === option.id}
                    onChange={() => setTemplate(option.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                    {option.blocks ? (
                      <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <Layers className="h-3 w-3" />
                        {option.blocks} blocks · {option.minutes} min
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            {template === "copy_existing" ? (
              <Select
                id="create-day-copy-source"
                value={copyFromId}
                onChange={setCopyFromId}
                placeholder="Choose the day to copy…"
                options={otherDays.map((lesson) => ({
                  value: lesson.id,
                  label: `Week ${lesson.week}, day ${lesson.day} — ${lesson.title || lesson.daily_focus || "Untitled"}`,
                }))}
              />
            ) : null}
          </fieldset>
        </div>

        {problem ? (
          <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600">
            {SELECTION_PROBLEM_MESSAGES[problem]}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!ready}>
            {busy ? "Creating…" : "Create Teaching Day"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-950">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  );
}
