"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  backendApi,
  getCurrentUser,
  type PrimaryDayCoverage,
  type PrimaryPlannerActivity,
  type PrimaryThemeCoverage,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import {
  DAY_STATE_LABELS,
  PRIMARY_LEVEL_KEYS,
  THEME_STATE_LABELS,
  WEEKDAY_HEADINGS,
  dayStateTone,
  eachDate,
  formatDayLabel,
  formatMinutes,
  formatRangeLabel,
  formatShortDate,
  isSameMonth,
  levelFromDisplay,
  levelLabel,
  monthGridDates,
  parseLocalISODate,
  rangeFor,
  shiftMonths,
  shiftWeeks,
  themeStateTone,
  toLocalISODate,
  type CoverageRangeMode,
  type PrimaryLevelKey,
} from "@/lib/primary-coverage";
import { UnsupportedScriptError, downloadCoverageReportPdf } from "@/lib/primary-coverage-export";
import { cn } from "@/lib/utils";

type CoverageTab = "week" | "month" | "themes";

// Built once from the level tuple so the export never receives a raw enum key.
const LEVEL_LABEL_MAP: Record<string, string> = {};
for (const key of PRIMARY_LEVEL_KEYS) LEVEL_LABEL_MAP[key] = levelLabel(key);

// Widened to Record<string, string>: a Record over a Literal union is not
// assignable to one over `string` (no index signature), and the export module
// takes the wide form so it can stay import-free.
const DAY_STATE_LABEL_MAP: Record<string, string> = DAY_STATE_LABELS;
const THEME_STATE_LABEL_MAP: Record<string, string> = THEME_STATE_LABELS;

export default function PrimaryCoveragePage({ notify }: { notify: (message: string) => void }) {
  const { context } = usePrimaryTeachingContext();

  const [tab, setTab] = useState<CoverageTab>("week");
  // Kept separate from `tab` so opening Themes does not silently change which
  // range the export covers.
  const [rangeMode, setRangeMode] = useState<CoverageRangeMode>("week");
  const [anchor, setAnchor] = useState(() => toLocalISODate(new Date()));
  const [levelOverride, setLevelOverride] = useState<PrimaryLevelKey | null>(null);
  const [subject, setSubject] = useState("");

  const anchorDate = useMemo(() => parseLocalISODate(anchor), [anchor]);
  const range = useMemo(() => rangeFor(rangeMode, anchorDate), [rangeMode, anchorDate]);
  const rangeLabel = useMemo(
    () => formatRangeLabel(rangeMode, range.start, range.end),
    [rangeMode, range.start, range.end],
  );
  const activeLevel: PrimaryLevelKey =
    levelOverride || levelFromDisplay(context.level) || "nursery";

  // Both coverage queries run on every tab so "Export PDF" never produces half a
  // document or has to wait for a fetch. The expensive one is the gated one.
  const coverage = useQuery({
    queryKey: ["primary-coverage", range.start, range.end],
    queryFn: () => backendApi.primaryCoverage(range.start, range.end),
  });
  const themes = useQuery({
    queryKey: ["primary-theme-coverage", activeLevel],
    queryFn: () => backendApi.primaryThemeCoverage({ level: activeLevel }),
  });
  const activities = useQuery({
    queryKey: ["primary-planner-activities", range.start, range.end],
    queryFn: () => backendApi.plannerActivities(range.start, range.end),
    enabled: tab === "week",
  });
  const user = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: 60_000,
  });

  const daysByDate = useMemo(() => {
    const map: Record<string, PrimaryDayCoverage> = {};
    for (const day of coverage.data?.days || []) map[day.date] = day;
    return map;
  }, [coverage.data]);

  const activitiesByDate = useMemo(() => {
    const map: Record<string, PrimaryPlannerActivity[]> = {};
    for (const activity of activities.data || []) {
      if (!map[activity.date]) map[activity.date] = [];
      map[activity.date].push(activity);
    }
    return map;
  }, [activities.data]);

  // Subject is filtered client-side over ~51 rows so the dropdown always offers
  // every subject, instead of collapsing to whichever one is already selected.
  const subjectOptions = useMemo(() => {
    const out: string[] = [];
    for (const theme of themes.data?.themes || []) {
      if (out.indexOf(theme.subject) < 0) out.push(theme.subject);
    }
    return out;
  }, [themes.data]);

  const visibleThemes = useMemo(() => {
    const all = themes.data?.themes || [];
    return subject ? all.filter((theme) => theme.subject === subject) : all;
  }, [themes.data, subject]);

  const weekDates = useMemo(() => eachDate(range.start, range.end), [range.start, range.end]);
  const monthDates = useMemo(() => monthGridDates(anchorDate), [anchorDate]);

  function selectTab(next: CoverageTab) {
    setTab(next);
    if (next === "week" || next === "month") setRangeMode(next);
  }

  function step(direction: number) {
    const shifted =
      rangeMode === "month" ? shiftMonths(anchorDate, direction) : shiftWeeks(anchorDate, direction);
    setAnchor(toLocalISODate(shifted));
  }

  function handleExport() {
    if (!coverage.data || !themes.data) {
      notify("Coverage is still loading — try again in a moment.");
      return;
    }
    try {
      downloadCoverageReportPdf({
        teacherName: user.data?.full_name || user.data?.name || "Teacher",
        teacherEmail: user.data?.email || null,
        rangeLabel,
        themeLevelLabel: levelLabel(activeLevel),
        generatedOn: formatShortDate(toLocalISODate(new Date())),
        report: coverage.data,
        themeReport: themes.data,
        levelLabels: LEVEL_LABEL_MAP,
        dayStateLabels: DAY_STATE_LABEL_MAP,
        themeStateLabels: THEME_STATE_LABEL_MAP,
      });
      notify("Coverage report downloaded");
    } catch (error) {
      if (error instanceof UnsupportedScriptError) {
        // Devanagari conjuncts need complex-script shaping the built-in writer
        // cannot do. The browser can, and its dialog offers "Save as PDF" on
        // every platform we support. Same fallback the worksheet page uses.
        notify("Opening the print dialog — choose Save as PDF.");
        window.print();
        return;
      }
      notify(getErrorMessage(error, "Could not export the report. Try again."));
    }
  }

  const loading = coverage.isLoading || themes.isLoading;
  const failed = coverage.isError || themes.isError;
  const totals = coverage.data?.totals;

  return (
    <div className="mt-4 space-y-5">
      {/* Scoped to this component so these print rules only exist in the DOM
          while the coverage page is mounted — see the comment on
          .primary-coverage-print in primary.css for why they can't live in
          that (globally-imported) stylesheet. */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .primary-coverage-print,
          .primary-coverage-print * {
            visibility: visible;
          }
          .primary-coverage-print {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 24px;
            color: #111;
            font-size: 11px;
          }
          .primary-coverage-print h1 {
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .primary-coverage-print h2 {
            font-size: 13px;
            font-weight: 800;
            margin: 18px 0 6px;
          }
          .primary-coverage-print table {
            width: 100%;
            border-collapse: collapse;
          }
          .primary-coverage-print th,
          .primary-coverage-print td {
            border: 1px solid #ccc;
            padding: 3px 5px;
            text-align: left;
          }
          .primary-coverage-print thead {
            display: table-header-group;
          }
          .primary-coverage-print tr {
            break-inside: avoid;
          }
          .primary-coverage-print-note {
            margin-top: 14px;
            font-size: 9px;
            color: #555;
          }
        }
      `}</style>

      {/* ── controls ─────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#eeeeff]">
        <div className="inline-flex rounded-full bg-[#f4f4ff] p-1">
          {(["week", "month", "themes"] as CoverageTab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectTab(value)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-black capitalize transition",
                tab === value ? "bg-white text-[#6e41f5] shadow-sm" : "text-[#5a5f8f]",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        {tab !== "themes" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-[#eeeeff] hover:text-[#6e41f5]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[170px] text-center text-sm font-black text-[#17206a]">
              {rangeLabel}
            </span>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-[#eeeeff] hover:text-[#6e41f5]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(toLocalISODate(new Date()))}
              className="rounded-full bg-[#f4f4ff] px-3 py-2 text-[11px] font-black text-[#5a5f8f]"
            >
              {rangeMode === "month" ? "This month" : "This week"}
            </button>
          </div>
        )}

        {tab === "themes" && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Level"
              value={activeLevel}
              onChange={(event) => setLevelOverride(event.target.value as PrimaryLevelKey)}
              className="h-9 rounded-full bg-[#f4f4ff] px-4 text-xs font-black text-[#17206a]"
            >
              {PRIMARY_LEVEL_KEYS.map((key) => (
                <option key={key} value={key}>{levelLabel(key)}</option>
              ))}
            </select>
            <select
              aria-label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-9 rounded-full bg-[#f4f4ff] px-4 text-xs font-black text-[#17206a]"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={loading || failed}
          className="ml-auto inline-flex h-9 items-center gap-2 rounded-full bg-[#6e41f5] px-4 text-xs font-black text-white disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export PDF
        </button>
      </section>

      {loading && (
        <div className="flex items-center gap-2 rounded-3xl bg-white p-6 text-sm font-bold text-[#5a5f8f] shadow-sm ring-1 ring-[#eeeeff]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your coverage…
        </div>
      )}

      {failed && !loading && (
        <div className="rounded-3xl bg-rose-50 p-6 text-sm font-bold text-rose-700 ring-1 ring-rose-200">
          {getErrorMessage(coverage.error || themes.error, "Could not load coverage. Try again.")}
        </div>
      )}

      {/* ── summary strip ────────────────────────────────────────────── */}
      {!loading && !failed && totals && tab !== "themes" && (
        <section className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#eeeeff] sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Days with a plan" value={`${totals.days_with_plan} of ${totals.days_in_range}`} />
          <Stat label="Activities completed" value={`${totals.completed} of ${totals.activities}`} />
          <Stat label="Skipped or moved" value={`${totals.skipped + totals.rescheduled}`} />
          <Stat
            label="Time taught"
            value={`${formatMinutes(totals.minutes_completed)} of ${formatMinutes(totals.minutes_planned)}`}
          />
        </section>
      )}

      {/* ── week ─────────────────────────────────────────────────────── */}
      {!loading && !failed && tab === "week" && (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {weekDates.map((iso) => (
            <WeekCard
              key={iso}
              iso={iso}
              day={daysByDate[iso]}
              activities={activitiesByDate[iso] || []}
              loadingActivities={activities.isLoading}
            />
          ))}
        </section>
      )}

      {/* ── month ────────────────────────────────────────────────────── */}
      {!loading && !failed && tab === "month" && (
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#eeeeff]">
          <div className="grid grid-cols-7 gap-2 pb-2">
            {WEEKDAY_HEADINGS.map((heading) => (
              <div key={heading} className="text-center text-[10px] font-black uppercase text-[#9aa0c8]">
                {heading}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((iso) => (
              <MonthTile
                key={iso}
                iso={iso}
                day={daysByDate[iso]}
                inMonth={isSameMonth(iso, anchorDate)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── themes ───────────────────────────────────────────────────── */}
      {!loading && !failed && tab === "themes" && themes.data && (
        <section className="space-y-3">
          {themes.data.themes_authored === 0 && (
            <div className="rounded-3xl bg-amber-50 p-5 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
              No lessons have been authored for <strong>{levelLabel(activeLevel)}</strong> yet.
              This is a gap in TeachPad&apos;s curriculum, not in your teaching.
            </div>
          )}

          <div className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#eeeeff] sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Themes" value={`${themes.data.themes_total}`} />
            <Stat label="With a lesson" value={`${themes.data.themes_authored}`} />
            <Stat label="Completed" value={`${themes.data.themes_complete}`} />
            <Stat label="Steps taught" value={`${themes.data.steps_taught} of ${themes.data.steps_total}`} />
          </div>

          <p className="px-1 text-[11px] font-bold text-[#9aa0c8]">
            All time, at {levelLabel(activeLevel)}. When a lesson is republished it becomes a new
            version with new steps, so coverage for that theme starts again from zero.
          </p>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#eeeeff]">
            {visibleThemes.length === 0 && (
              <p className="p-6 text-sm font-bold text-[#5a5f8f]">No themes to show yet.</p>
            )}
            {visibleThemes.map((theme) => (
              <ThemeRow key={`${theme.theme_id}-${theme.subject}`} theme={theme} />
            ))}
          </div>
        </section>
      )}

      {/* ── print-only rendition, for the window.print() fallback ─────── */}
      {coverage.data && themes.data && (
        <div className="primary-coverage-print">
          <h1>Teaching Coverage Report</h1>
          <p>
            {user.data?.full_name || user.data?.name || "Teacher"}
            {user.data?.email ? ` — ${user.data.email}` : ""}
          </p>
          <p>
            Range: {rangeLabel} · Generated {formatShortDate(toLocalISODate(new Date()))}
          </p>

          <h2>Day by day</h2>
          <table>
            <thead>
              <tr><th>Date</th><th>Level</th><th>Subject</th><th>Theme</th><th>Done</th><th>Status</th></tr>
            </thead>
            <tbody>
              {coverage.data.days.map((day) => (
                <tr key={day.date}>
                  <td>{formatShortDate(day.date)}</td>
                  <td>{day.level ? levelLabel(day.level) : "—"}</td>
                  <td>{day.subject || "—"}</td>
                  <td>{day.theme_name || "—"}</td>
                  <td>{day.completed}/{day.total}</td>
                  <td>{DAY_STATE_LABELS[day.state]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Theme coverage — {levelLabel(activeLevel)} (all time)</h2>
          <table>
            <thead>
              <tr><th>Theme</th><th>Subject</th><th>Taught</th><th>%</th><th>Status</th></tr>
            </thead>
            <tbody>
              {themes.data.themes.map((theme) => (
                <tr key={`${theme.theme_id}-${theme.subject}-print`}>
                  <td>{theme.theme_name}</td>
                  <td>{theme.subject}</td>
                  <td>{theme.authored ? `${theme.steps_taught}/${theme.steps_total}` : "—"}</td>
                  <td>{theme.authored ? `${theme.completion_pct}%` : "—"}</td>
                  <td>{THEME_STATE_LABELS[theme.state]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="primary-coverage-print-note">
            Blank rows mean no plan was generated for that day. &ldquo;No lesson authored
            yet&rdquo; means TeachPad has no lesson for that theme at this level — it is not a
            gap in this teacher&apos;s work.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8f8ff] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#9aa0c8]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#17206a]">{value}</p>
    </div>
  );
}

function WeekCard({
  iso,
  day,
  activities,
  loadingActivities,
}: {
  iso: string;
  day?: PrimaryDayCoverage;
  activities: PrimaryPlannerActivity[];
  loadingActivities: boolean;
}) {
  const state = day?.state || "no_plan";
  const tone = dayStateTone(state);
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#eeeeff]">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-[#17206a]">{formatDayLabel(iso)}</p>
          <p className="mt-0.5 text-[11px] font-bold text-[#5a5f8f]">
            {day?.theme_name || "No theme"}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black",
            tone.chip,
            tone.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
          {DAY_STATE_LABELS[state]}
        </span>
      </header>

      {day && day.total > 0 && (
        <p className="mt-2 text-[11px] font-bold text-[#9aa0c8]">
          {day.completed}/{day.total} done · {formatMinutes(day.minutes_completed)} of{" "}
          {formatMinutes(day.minutes_planned)}
        </p>
      )}

      <div className="mt-3 space-y-1.5">
        {loadingActivities && (
          <p className="text-[11px] font-bold text-[#9aa0c8]">Loading activities…</p>
        )}
        {!loadingActivities && activities.length === 0 && (
          <p className="text-[11px] font-bold text-[#9aa0c8]">
            {state === "no_plan" ? "Nothing was planned for this day." : "No activities on this day."}
          </p>
        )}
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-2 rounded-xl bg-[#f8f8ff] px-3 py-2">
            <span className="w-11 shrink-0 text-[10px] font-black text-[#9aa0c8]">
              {(activity.start_time || "").slice(0, 5) || "--:--"}
            </span>
            <span className="flex-1 text-[11px] font-bold text-[#17206a]">
              {activity.title}
              {/* An ad-hoc activity has no curriculum step, so it counts here but
                  is invisible to the theme rollup. Say so rather than hide it. */}
              {!activity.curriculum_step_id && (
                <span className="ml-1 text-[10px] font-black text-[#9aa0c8]">· Added by you</span>
              )}
            </span>
            <span className="shrink-0 text-[10px] font-black capitalize text-[#5a5f8f]">
              {activity.status}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MonthTile({ iso, day, inMonth }: { iso: string; day?: PrimaryDayCoverage; inMonth: boolean }) {
  const state = day?.state || "no_plan";
  const tone = dayStateTone(state);
  return (
    <div
      title={`${formatShortDate(iso)} — ${DAY_STATE_LABELS[state]}`}
      className={cn(
        "min-h-[74px] rounded-2xl border p-2",
        inMonth ? tone.chip : "border-transparent bg-transparent",
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-[11px] font-black", inMonth ? "text-[#17206a]" : "text-[#d5d7ea]")}>
          {parseLocalISODate(iso).getDate()}
        </span>
        {inMonth && <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />}
      </div>
      {inMonth && day && day.total > 0 && (
        <>
          <p className={cn("mt-1 text-[10px] font-black", tone.text)}>
            {day.completed}/{day.total}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-bold text-[#9aa0c8]">{day.theme_name || ""}</p>
        </>
      )}
    </div>
  );
}

function ThemeRow({ theme }: { theme: PrimaryThemeCoverage }) {
  const tone = themeStateTone(theme.state);
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#f2f2fb] px-4 py-3 last:border-0">
      <div className="min-w-[190px] flex-1">
        <p className="text-sm font-black text-[#17206a]">
          {theme.emoji ? `${theme.emoji} ` : ""}
          {theme.theme_name}
        </p>
        <p className="text-[11px] font-bold text-[#9aa0c8]">{theme.subject}</p>
      </div>

      <div className="min-w-[140px] flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f2f2fb]">
          <div
            className={cn("h-full rounded-full", tone.dot)}
            style={{ width: `${theme.authored ? theme.completion_pct : 0}%` }}
          />
        </div>
      </div>

      {/* An unauthored theme shows a dash, never 0% — TeachPad's gap must not
          read as the teacher's. */}
      <span className="w-20 shrink-0 text-right text-xs font-black text-[#17206a]">
        {theme.authored ? `${theme.steps_taught}/${theme.steps_total}` : "—"}
      </span>
      <span className="w-12 shrink-0 text-right text-xs font-black text-[#5a5f8f]">
        {theme.authored ? `${theme.completion_pct}%` : "—"}
      </span>
      <span
        className={cn(
          "w-[160px] shrink-0 rounded-full border px-2 py-1 text-center text-[10px] font-black",
          tone.chip,
          tone.text,
        )}
      >
        {THEME_STATE_LABELS[theme.state]}
      </span>
    </div>
  );
}

