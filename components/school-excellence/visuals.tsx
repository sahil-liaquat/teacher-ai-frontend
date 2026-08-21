"use client";

/**
 * Bespoke illustrations for /school-excellence.
 *
 * Every visual on this page is drawn from the page copy rather than imported as
 * a render: the planning strip shows the same calendar objects the planning
 * module lists, the execution loop cycles the same four status words the
 * teacher actually taps. Nothing here is decorative filler — if the copy
 * changes, the drawing is wrong, and that is deliberate.
 *
 * The hero composition is larger than the rest and lives in `hero-scene.tsx`.
 *
 * They are DOM + SVG rather than images so the labels stay real text (readable,
 * selectable, translatable) and the motion can be driven by scroll and state.
 * Every effect degrades to a still, correct diagram under
 * `prefers-reduced-motion`.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { EASE_PREMIUM } from "@/lib/use-motion";
import { CountUp } from "./primitives";

// ─── 2 · Pieces that work separately ─────────────────────────────────

/**
 * "Every school already has… But these pieces often work separately."
 *
 * The cards enter scattered and tilted, then settle into an aligned row as the
 * section arrives — the copy's whole argument in one gesture.
 */

const PIECES = [
  "Teachers",
  "Textbooks",
  "Curriculum",
  "Academic calendars",
  "Lesson plans",
  "Assessments",
] as const;

const SCATTER = [
  { x: -34, y: -18, rotate: -7 },
  { x: 26, y: 22, rotate: 5 },
  { x: -18, y: 26, rotate: 6 },
  { x: 30, y: -24, rotate: -5 },
  { x: -28, y: 16, rotate: 8 },
  { x: 22, y: -20, rotate: -6 },
];

export function SeparatePiecesVisual() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {PIECES.map((piece, index) => (
          <motion.li
            key={piece}
            initial={
              prefersReduced ? undefined : { opacity: 0, ...SCATTER[index % SCATTER.length] }
            }
            whileInView={prefersReduced ? undefined : { opacity: 1, x: 0, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: 0.85, ease: EASE_PREMIUM, delay: index * 0.07 }}
          >
            <span className="se-piece-card">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--se-accent)]" />
              {piece}
            </span>
          </motion.li>
        ))}
      </ul>

      <motion.div
        aria-hidden="true"
        initial={prefersReduced ? undefined : { scaleX: 0 }}
        whileInView={prefersReduced ? undefined : { scaleX: 1 }}
        viewport={{ once: true, margin: "-70px" }}
        transition={{ duration: 1, ease: EASE_PREMIUM, delay: 0.5 }}
        className="se-rule-glow mt-7 origin-center"
      />
    </div>
  );
}

// ─── 3 · The academic year (transformation 01) ───────────────────────

/**
 * "Your school knows not only what should be taught, but also when it should be
 * taught." — the curriculum laid against real terms, holidays, exams and
 * teaching days.
 */

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const TERMS = [
  { name: "Term 1", start: 1, span: 5 },
  { name: "Term 2", start: 6, span: 4 },
  { name: "Term 3", start: 10, span: 3 },
];

/** Column spans are 1-indexed against the 12 months above. */
const CALENDAR_MARKS = [
  { label: "Summer break", start: 3, span: 1, tone: "pending" as const },
  { label: "Term 1 exams", start: 5, span: 1, tone: "assessed" as const },
  { label: "Festival break", start: 8, span: 1, tone: "pending" as const },
  { label: "Half-yearly", start: 9, span: 1, tone: "assessed" as const },
  { label: "Winter break", start: 10, span: 1, tone: "pending" as const },
  { label: "Final exams", start: 12, span: 1, tone: "assessed" as const },
];

export function AcademicYearVisual() {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  const on = inView || prefersReduced;

  return (
    <div ref={ref} className="se-glass-3 se-rim overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--se-line)] bg-white/45 px-4 py-3 sm:px-5">
        <p className="se-ui text-[12px] font-black uppercase tracking-[0.14em] text-[var(--se-ink)]">
          Academic year
        </p>
        <p className="se-ui text-[12px] font-semibold text-[var(--se-muted)]">Apr — Mar</p>
      </div>

      <div className="p-4 sm:p-5">
        {/* Month ruler */}
        <div className="grid grid-cols-12 gap-[3px]">
          {MONTHS.map((month) => (
            <span
              key={month}
              className="se-ui rounded-[4px] bg-[var(--se-paper-warm-2)] py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--se-muted)] sm:text-[10px]"
            >
              {month}
            </span>
          ))}
        </div>

        {/* Terms */}
        <div className="mt-2 grid grid-cols-12 gap-[3px]">
          {TERMS.map((term, index) => (
            <div
              key={term.name}
              style={{ gridColumn: `${term.start} / span ${term.span}` }}
              className="overflow-hidden rounded-[6px] bg-[rgba(1,101,253,0.08)]"
            >
              <div
                className="se-bar-grow flex h-8 items-center justify-center rounded-[6px] bg-[linear-gradient(90deg,rgba(1,101,253,0.9),rgba(1,101,253,0.7))] px-2"
                style={{ transform: `scaleX(${on ? 1 : 0})`, transitionDelay: `${index * 140}ms` }}
              >
                <span className="se-ui truncate text-[10px] font-black uppercase tracking-[0.1em] text-white sm:text-[11px]">
                  {term.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Holidays + examinations */}
        <div className="mt-2 grid grid-cols-12 gap-[3px]">
          {CALENDAR_MARKS.map((mark, index) => {
            const color =
              mark.tone === "pending" ? "var(--se-status-pending)" : "var(--se-status-assessed)";

            return (
              <motion.div
                key={mark.label}
                initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
                animate={on && !prefersReduced ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, ease: EASE_PREMIUM, delay: 0.5 + index * 0.08 }}
                style={{
                  gridColumn: `${mark.start} / span ${mark.span}`,
                  borderColor: `${color}44`,
                  background: `${color}14`,
                }}
                className="flex h-7 items-center justify-center rounded-[5px] border"
                title={mark.label}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: color }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Legend + the counts the plan produces */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--se-line)] pt-4">
          <LegendDot color="var(--se-accent)" label="Terms" />
          <LegendDot color="var(--se-status-pending)" label="Holidays" />
          <LegendDot color="var(--se-status-assessed)" label="Examinations" />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {[
            { term: "Teaching days", value: 182 },
            { term: "Learning objectives", value: 946 },
            { term: "Classes mapped", value: 24 },
          ].map((stat) => (
            <div key={stat.term} className="rounded-lg bg-[var(--se-paper-warm)] px-3 py-2.5">
              <dd className="text-[17px] font-black leading-none text-[var(--se-ink)] sm:text-[20px]">
                <CountUp value={stat.value} />
              </dd>
              <dt className="mt-1.5 text-[10.5px] font-semibold leading-tight text-[var(--se-muted)] sm:text-[11.5px]">
                {stat.term}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-[var(--se-muted)]">
      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── 4 · The teacher's starting point (transformation 02) ────────────

/**
 * "Teachers shouldn't rebuild the teaching day from scratch." Everything the
 * copy promises a teacher opens with, laid out as the thing itself.
 */

const PLAN_ROWS = [
  { label: "Today's lesson", value: "Chapter 4 · Heat and Temperature" },
  { label: "Learning objectives", value: "Differentiate heat from temperature; read a lab thermometer" },
  { label: "Textbook reference", value: "Science 7 · pages 48–53" },
  { label: "Teaching guidance", value: "Demonstration first, then measurement in pairs" },
];

const PLAN_RESOURCES = ["Classroom activities", "Worksheets", "Assessments", "Teaching resources", "AI support"];

export function DailyPlanVisual() {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? undefined : "hidden"}
      whileInView={prefersReduced ? undefined : "visible"}
      viewport={{ once: true, margin: "-70px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
      className="se-glass-3 se-rim overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--se-line)] bg-white/45 px-4 py-3 sm:px-5">
        <div>
          <p className="se-ui text-[12px] font-black uppercase tracking-[0.14em] text-[var(--se-ink)]">
            Today
          </p>
          <p className="mt-0.5 text-[11.5px] font-semibold text-[var(--se-muted)]">
            Class 7B · Science · Period 3
          </p>
        </div>
        <span className="se-ui rounded-full bg-[var(--se-accent-tint)] px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.1em] text-[var(--se-accent-deep)]">
          Ready
        </span>
      </div>

      <dl className="px-4 sm:px-5">
        {PLAN_ROWS.map((row) => (
          <motion.div
            key={row.label}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_PREMIUM } },
            }}
            className="border-b border-[var(--se-line)] py-3.5 last:border-b-0"
          >
            <dt className="se-ui text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--se-muted)]">
              {row.label}
            </dt>
            <dd className="mt-1.5 text-[14px] font-semibold leading-[1.5] text-[var(--se-ink)]">
              {row.value}
            </dd>
          </motion.div>
        ))}
      </dl>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_PREMIUM } },
        }}
        className="border-t border-[var(--se-line)] bg-white/45 px-4 py-4 sm:px-5"
      >
        <p className="se-ui text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--se-muted)]">
          Attached to this lesson
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {PLAN_RESOURCES.map((resource) => (
            <li
              key={resource}
              className="rounded-full border border-[var(--se-line-strong)] bg-white px-3 py-1.5 text-[11.5px] font-bold text-[var(--se-ink-soft)]"
            >
              {resource}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

// ─── 5 · The classroom update loop (transformation 03) ───────────────

/**
 * "After teaching, the teacher makes a simple update… So when the classroom
 * changes, the plan changes with it."
 *
 * The four status words cycle on their own, and the academic plan underneath
 * responds to each one — the two halves of the sentence, animated. With reduced
 * motion it holds on "Taught".
 */

const UPDATES = [
  {
    status: "Taught",
    color: "var(--se-status-taught)",
    planTitle: "Chapter 4 marked complete",
    planDetail: "Coverage for Class 7B Science moves to 68%.",
    coverage: 68,
  },
  {
    status: "Pending",
    color: "var(--se-status-pending)",
    planTitle: "Carried to the next teaching day",
    planDetail: "The lesson stays open and the term plan absorbs the shift.",
    coverage: 61,
  },
  {
    status: "Rescheduled",
    color: "var(--se-status-rescheduled)",
    planTitle: "Moved to Thursday, period 5",
    planDetail: "Everything after it re-sequences against real teaching days.",
    coverage: 61,
  },
  {
    status: "Skipped",
    color: "var(--se-status-skipped)",
    planTitle: "Flagged in the academic plan",
    planDetail: "Leadership can see the gap while there is still time to act.",
    coverage: 58,
  },
] as const;

export function ExecutionLoopVisual() {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-100px" });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (prefersReduced || !inView) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % UPDATES.length), 2800);
    return () => window.clearInterval(timer);
  }, [prefersReduced, inView]);

  const active = UPDATES[index];

  return (
    <div ref={ref} className="space-y-3">
      {/* What the teacher does */}
      <div className="se-glass-3 se-rim overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--se-line)] bg-white/45 px-4 py-3 sm:px-5">
          <p className="se-ui text-[12px] font-black uppercase tracking-[0.14em] text-[var(--se-ink)]">
            After the lesson
          </p>
          <p className="se-ui text-[11.5px] font-semibold text-[var(--se-muted)]">Class 7B · Science</p>
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[14px] font-semibold leading-[1.5] text-[var(--se-ink)]">
            Chapter 4 · Heat and Temperature
          </p>
          <ul className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {UPDATES.map((update, updateIndex) => {
              const isActive = updateIndex === index;

              return (
                <li key={update.status}>
                  <span
                    aria-current={isActive ? "true" : undefined}
                    className="se-status-btn"
                    style={
                      isActive
                        ? {
                            borderColor: update.color,
                            background: `${update.color}14`,
                            color: update.color,
                          }
                        : undefined
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: isActive ? update.color : "var(--se-status-planned)" }}
                    />
                    {update.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* The connection back to the plan */}
      <div aria-hidden="true" className="relative mx-auto h-9 w-px overflow-hidden bg-[var(--se-line-strong)]">
        <span
          className={`absolute inset-x-[-1px] top-0 h-3 rounded-full ${prefersReduced ? "" : "se-spine-pulse"}`}
          style={{ background: active.color }}
        />
      </div>

      {/* What the plan does about it */}
      <div className="se-glass-3 se-rim overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--se-line)] bg-white/45 px-4 py-3 sm:px-5">
          <p className="se-ui text-[12px] font-black uppercase tracking-[0.14em] text-[var(--se-ink)]">
            The academic plan
          </p>
          <p className="se-ui text-[11.5px] font-semibold text-[var(--se-muted)]">Updated live</p>
        </div>

        <div className="p-4 sm:p-5">
          <motion.div key={active.status} initial={prefersReduced ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE_PREMIUM }}>
            <p className="text-[14px] font-bold leading-[1.45] text-[var(--se-ink)]">{active.planTitle}</p>
            <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--se-body)]">{active.planDetail}</p>
          </motion.div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="se-ui text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--se-muted)]">
                Curriculum coverage
              </p>
              <p className="se-ui text-[12.5px] font-black text-[var(--se-ink)]">{active.coverage}%</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(13,26,43,0.08)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: active.color }}
                initial={false}
                animate={{ width: `${active.coverage}%` }}
                transition={{ duration: prefersReduced ? 0 : 0.7, ease: EASE_PREMIUM }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 6 · Academic leadership (transformation 04) ─────────────────────

/**
 * "Run academics with visibility, not assumptions." Classes on track, classes
 * falling behind, and the counts behind the words — the exact list the copy
 * says leadership should be able to understand.
 */

const CLASS_ROWS = [
  { name: "Class 6A", subject: "Science", coverage: 84, state: "On track" as const },
  { name: "Class 7B", subject: "Science", coverage: 61, state: "Needs support" as const },
  { name: "Class 8C", subject: "Mathematics", coverage: 78, state: "On track" as const },
  { name: "Class 9A", subject: "Mathematics", coverage: 52, state: "Falling behind" as const },
];

const STATE_TONE = {
  "On track": "var(--se-status-taught)",
  "Needs support": "var(--se-status-pending)",
  "Falling behind": "var(--se-status-skipped)",
} as const;

const BOARD_TILES = [
  { label: "Lessons taught", value: 412, suffix: "" },
  { label: "Missed", value: 18, suffix: "" },
  { label: "Rescheduled", value: 26, suffix: "" },
  { label: "Teacher adoption", value: 91, suffix: "%" },
];

export function LeadershipBoardVisual() {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  const on = inView || prefersReduced;

  return (
    <div ref={ref} className="se-glass-3 se-rim overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--se-line)] px-4 py-3.5 sm:px-5">
        <p className="se-ui text-[12px] font-black uppercase tracking-[0.14em] text-[var(--se-ink)]">
          Academic implementation
        </p>
        <span className="se-ui inline-flex items-center gap-1.5 rounded-full bg-[var(--se-accent-tint)] px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.1em] text-[var(--se-accent-deep)]">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full bg-[var(--se-accent)] ${prefersReduced ? "" : "se-dot-ping"}`}
          />
          This week
        </span>
      </div>

      <ul className="px-4 sm:px-5">
        {CLASS_ROWS.map((row, index) => (
          <li key={row.name} className="border-b border-[var(--se-line)] py-3.5 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13.5px] font-bold text-[var(--se-ink)]">
                {row.name}
                <span className="ml-2 font-medium text-[var(--se-muted)]">{row.subject}</span>
              </p>
              <span
                className="se-ui shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.08em]"
                style={{ color: STATE_TONE[row.state], background: `${STATE_TONE[row.state]}16` }}
              >
                {row.state}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(13,26,43,0.08)]">
                <div
                  className="se-bar-grow h-full w-full rounded-full"
                  style={{
                    background: STATE_TONE[row.state],
                    transform: `scaleX(${on ? row.coverage / 100 : 0})`,
                    transitionDelay: `${index * 110}ms`,
                  }}
                />
              </div>
              <span className="w-10 text-right text-[12px] font-black text-[var(--se-ink)]">
                <CountUp value={row.coverage} suffix="%" />
              </span>
            </div>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-px border-t border-[var(--se-line)] bg-[var(--se-line)] sm:grid-cols-4">
        {BOARD_TILES.map((tile) => (
          <div key={tile.label} className="bg-[var(--se-paper-warm)] px-4 py-3.5">
            <dd className="text-[18px] font-black leading-none text-[var(--se-ink)]">
              <CountUp value={tile.value} suffix={tile.suffix} />
            </dd>
            <dt className="mt-1.5 text-[10.5px] font-semibold leading-tight text-[var(--se-muted)]">
              {tile.label}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── 7 · Ordinary AI vs grounded AI ──────────────────────────────────

/**
 * "Ordinary AI asks the teacher to explain everything again… TeachPad already
 * knows the academic context."
 *
 * Left panel keeps asking the six questions from the copy, one at a time,
 * forever. Right panel has all six answered before the teacher types anything.
 */

const AI_QUESTIONS = ["Class?", "Board?", "Book?", "Chapter?", "Topic?", "Learning objective?"] as const;

const AI_CONTEXT = [
  { label: "Class", value: "7B" },
  { label: "Board", value: "CBSE" },
  { label: "Book", value: "Science 7" },
  { label: "Chapter", value: "4 · Heat" },
  { label: "Topic", value: "Temperature" },
  { label: "Objective", value: "Read a thermometer" },
] as const;

const AI_OUTPUTS = [
  "Lesson plans",
  "Worksheets",
  "Assessments",
  "Presentations",
  "Notes",
  "Classroom activities",
  "Teaching resources",
] as const;

export function AiContextVisual() {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-100px" });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prefersReduced || !inView) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % AI_QUESTIONS.length), 1500);
    return () => window.clearInterval(timer);
  }, [prefersReduced, inView]);

  return (
    <div ref={ref} className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      {/* Ordinary AI */}
      <div className="flex flex-col rounded-2xl border border-[var(--se-line-strong)] bg-[var(--se-paper-warm)] p-5 sm:p-6">
        <p className="se-ui text-[10.5px] font-bold uppercase tracking-[0.15em] text-[var(--se-muted)]">
          Ordinary AI
        </p>
        <p className="se-display mt-2 text-[19px] leading-[1.2] sm:text-[21px]">
          Starts from a blank prompt.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-[var(--se-line-strong)] bg-white px-4 py-3.5">
          <span className="se-ui text-[13px] font-medium text-[var(--se-muted)]">
            Type your prompt
            <span aria-hidden="true" className={`ml-0.5 inline-block ${prefersReduced ? "" : "se-caret"}`}>|</span>
          </span>
        </div>

        <div className="mt-4 min-h-[132px] flex-1">
          <ul className="space-y-2">
            {AI_QUESTIONS.map((question, questionIndex) => {
              const asked = prefersReduced || questionIndex <= step;

              return (
                <motion.li
                  key={question}
                  animate={{ opacity: asked ? 1 : 0.18, x: asked ? 0 : -6 }}
                  transition={{ duration: 0.35, ease: EASE_PREMIUM }}
                  className="flex items-center gap-2.5 text-[13.5px] font-semibold text-[var(--se-ink-soft)]"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--se-paper-warm-2)] text-[10px] font-black text-[var(--se-muted)]"
                  >
                    ?
                  </span>
                  {question}
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* TeachPad */}
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--se-accent-line)] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(1,101,253,0.4)] sm:p-6">
        <span aria-hidden="true" className="se-core-sheen" />
        <p className="se-eyebrow">TeachPad AI</p>
        <p className="se-display mt-2 text-[19px] leading-[1.2] sm:text-[21px]">
          Already knows the academic context.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-2">
          {AI_CONTEXT.map((item, index) => (
            <motion.li
              key={item.label}
              initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
              whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: EASE_PREMIUM, delay: index * 0.07 }}
              className="rounded-lg border border-[var(--se-line)] bg-[var(--se-paper-warm)] px-3 py-2"
            >
              <p className="se-ui text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--se-muted)]">
                {item.label}
              </p>
              <p className="mt-0.5 text-[12.5px] font-bold leading-tight text-[var(--se-ink)]">{item.value}</p>
            </motion.li>
          ))}
        </ul>

        <div className="mt-5 border-t border-[var(--se-line)] pt-4">
          <p className="se-ui text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--se-muted)]">
            So teachers can create
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {AI_OUTPUTS.map((output, index) => (
              <motion.li
                key={output}
                initial={prefersReduced ? undefined : { opacity: 0, scale: 0.9 }}
                whileInView={prefersReduced ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, ease: EASE_PREMIUM, delay: 0.35 + index * 0.06 }}
                className="rounded-full bg-[var(--se-accent-tint)] px-3 py-1.5 text-[11.5px] font-bold text-[var(--se-accent-deep)]"
              >
                {output}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── 8 · Plan. Teach. See. Improve. ──────────────────────────────────

/** The four words the journey ends on, drawn as the loop they describe. */

const CYCLE = ["Plan", "Teach", "See", "Improve"] as const;

export function ImproveLoopVisual() {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-100px" });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReduced || !inView) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % CYCLE.length), 1600);
    return () => window.clearInterval(timer);
  }, [prefersReduced, inView]);

  return (
    <div ref={ref} className="mx-auto flex max-w-[560px] flex-wrap items-center justify-center gap-2.5">
      {CYCLE.map((word, index) => {
        const isActive = !prefersReduced && index === active;

        return (
          <span key={word} className="inline-flex items-center gap-2.5">
            <span
              className="se-cycle-word"
              style={
                isActive
                  ? {
                      borderColor: "var(--se-accent)",
                      background: "var(--se-accent)",
                      color: "#ffffff",
                      boxShadow: "0 12px 28px -12px rgba(1,101,253,0.6)",
                    }
                  : undefined
              }
            >
              {word}
            </span>
            <span
              aria-hidden="true"
              className="text-[13px] font-black text-[var(--se-status-planned)]"
            >
              {index === CYCLE.length - 1 ? "↻" : "→"}
            </span>
          </span>
        );
      })}
    </div>
  );
}
