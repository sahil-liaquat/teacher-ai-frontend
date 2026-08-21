"use client";

/**
 * Section 4 — One Program. Four Transformations.
 *
 * The page's centrepiece, built as sticky storytelling rather than four stacked
 * feature rows: the product surface holds still on the left while the four
 * chapters scroll past on the right, and the surface swaps to match whichever
 * chapter the reader is actually in. That way the four promises are *shown*
 * rather than described, and the reader never loses the thing being described.
 *
 * The whole block is one dark chapter so the light product surfaces read as
 * screens floating in a lit room — and so the page has a clear act break.
 *
 * Below `lg` there is nothing to stick: each chapter simply carries its own
 * visual underneath it, which is the better mobile reading order anyway.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "framer-motion";
import { Check } from "lucide-react";
import {
  Container,
  Eyebrow,
  Index,
  Reveal,
  RevealGroup,
  RevealItem,
  Section,
  StatusTag,
  type StatusName,
} from "./primitives";
import { WordReveal } from "./media";
import { Beams, MeshField, PointerLight } from "./atmosphere";
import {
  AcademicYearVisual,
  DailyPlanVisual,
  ExecutionLoopVisual,
  LeadershipBoardVisual,
} from "./visuals";

const planningItems = [
  "Academic year",
  "Terms",
  "Classes",
  "Subjects",
  "Textbooks",
  "Holidays",
  "Examinations",
  "Teaching days",
  "Learning objectives",
];

const preparationItems = [
  "Today's lesson",
  "Learning objectives",
  "Textbook references",
  "Teaching guidance",
  "Classroom activities",
  "Worksheets",
  "Assessments",
  "Teaching resources",
  "AI support",
];

const executionStatuses: StatusName[] = ["Taught", "Pending", "Rescheduled", "Skipped"];

const leadershipItems = [
  "Which classes are on track",
  "Which classes are falling behind",
  "What was taught",
  "What was missed",
  "What was rescheduled",
  "Curriculum progress",
  "Assessment progress",
  "Teacher adoption",
  "Areas requiring support",
];

type Chapter = {
  index: number;
  eyebrow: string;
  headline: string;
  lede: string;
  items?: string[];
  extra?: ReactNode;
  closer: ReactNode;
  visual: ReactNode;
};

const chapters: Chapter[] = [
  {
    index: 1,
    eyebrow: "Transform Academic Planning",
    headline: "From yearly plans to everyday execution.",
    lede: "We help your school structure its curriculum and connect it with your actual:",
    items: planningItems,
    closer: (
      <>
        Your school knows not only <strong className="se-on-navy">what</strong> should be taught, but
        also <strong className="se-display-soft-navy">when</strong> it should be taught.
      </>
    ),
    visual: <AcademicYearVisual />,
  },
  {
    index: 2,
    eyebrow: "Transform Teacher Preparation",
    headline: "Give every teacher a stronger starting point.",
    lede: "Teachers shouldn't rebuild the teaching day from scratch. TeachPad gives them the academic context they need:",
    items: preparationItems,
    closer: (
      <>
        Less time preparing from zero.{" "}
        <strong className="se-display-soft-navy">More time focused on teaching.</strong>
      </>
    ),
    visual: <DailyPlanVisual />,
  },
  {
    index: 3,
    eyebrow: "Transform Classroom Execution",
    headline: "Keep the curriculum moving throughout the year.",
    lede: "After teaching, the teacher makes a simple update:",
    extra: (
      <>
        <ul className="mt-6 flex flex-wrap gap-2.5">
          {executionStatuses.map((status) => (
            <li key={status}>
              <StatusTag status={status} className="!px-3.5 !py-2 !text-[12.5px]" />
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[46ch] text-[15px] leading-[1.7] text-[var(--se-navy-muted)] sm:text-[16px]">
          TeachPad connects that update back to the school&rsquo;s academic plan.
        </p>
      </>
    ),
    closer: (
      <>
        So when the classroom changes…{" "}
        <strong className="se-display-soft-navy">the plan changes with it.</strong>
      </>
    ),
    visual: <ExecutionLoopVisual />,
  },
  {
    index: 4,
    eyebrow: "Transform Academic Leadership",
    headline: "Run academics with visibility, not assumptions.",
    lede: "School leaders can understand:",
    items: leadershipItems,
    closer: (
      <>
        Stop chasing academic updates.{" "}
        <strong className="se-display-soft-navy">Start acting on academic evidence.</strong>
      </>
    ),
    visual: <LeadershipBoardVisual />,
  },
];

export function Transformations() {
  const [active, setActive] = useState(1);

  return (
    <Section
      id="programme"
      tone="navy"
      labelledBy="se-programme-heading"
      className="se-noise se-noise-dark overflow-x-clip"
    >
      <MeshField tone="dark" opacity={0.85} />
      <Beams />
      <PointerLight tone="dark" size={760} />
      <div aria-hidden="true" className="se-grid-lines se-grid-drift absolute inset-0 opacity-70" />

      <Container className="relative z-[2] pb-20 pt-20 sm:pb-28 sm:pt-28 lg:pb-36 lg:pt-32">
        <Reveal className="mx-auto max-w-[44rem] text-center">
          <Eyebrow onNavy>The programme</Eyebrow>
          <WordReveal
            as="h2"
            id="se-programme-heading"
            text="One Program. Four Transformations."
            accentFrom={2}
            onNavy
            className="se-display se-on-navy mt-6 block text-[31px] leading-[1.1] min-[390px]:text-[36px] sm:text-[46px] lg:text-[54px]"
          />
        </Reveal>

        <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-16">
          {/* The surface that holds still. Desktop only — there is nothing to
              stick against on a phone, and the visual belongs with its chapter
              in a single scrolling column. */}
          <div className="hidden lg:sticky lg:top-[132px] lg:block">
            <ChapterIndex active={active} />

            {/* The crossfade is CSS rather than a JS animation: four stacked
                panels animating on every chapter change is exactly the kind of
                work that should live on the compositor, and a plain transition
                cannot be left half-finished if rAF is throttled. */}
            <div className="relative mt-6 min-h-[520px]">
              {chapters.map((chapter) => {
                const isActive = chapter.index === active;

                return (
                  <div
                    key={chapter.index}
                    aria-hidden={!isActive}
                    data-active={isActive}
                    className="se-swap absolute inset-x-0 top-0"
                  >
                    {chapter.visual}
                  </div>
                );
              })}
            </div>
          </div>

          {/* The chapters that move. */}
          <ol className="space-y-20 lg:space-y-0">
            {chapters.map((chapter) => (
              <ChapterBlock key={chapter.index} chapter={chapter} onEnter={setActive} />
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/** 01–04 above the sticky surface, marking where the reader is. */
function ChapterIndex({ active }: { active: number }) {
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {chapters.map((chapter) => (
        <li key={chapter.index}>
          <span className="se-chapter-pill" data-active={chapter.index === active}>
            <span aria-hidden="true" className="se-chapter-pill-dot" />
            {String(chapter.index).padStart(2, "0")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ChapterBlock({
  chapter,
  onEnter,
}: {
  chapter: Chapter;
  onEnter: (index: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  // A narrow band across the middle of the viewport: whichever chapter is in
  // it is the one the reader is actually looking at, which is what the sticky
  // surface has to match.
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onEnter(chapter.index);
  }, [inView, onEnter, chapter.index]);

  return (
    <li ref={ref} className="lg:flex lg:min-h-[min(88vh,780px)] lg:flex-col lg:justify-center lg:py-10">
      <Reveal>
        <div className="flex items-center gap-3">
          <span className="se-chapter-num">{String(chapter.index).padStart(2, "0")}</span>
          <span aria-hidden="true" className="h-px w-8 bg-[var(--se-navy-line)]" />
          <Index onNavy>{chapter.eyebrow}</Index>
        </div>

        <h3
          className="se-display se-on-navy mt-5 text-[26px] leading-[1.14] sm:text-[34px] lg:text-[40px]"
        >
          {chapter.headline}
        </h3>

        <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.75] text-[var(--se-navy-muted)] sm:text-[17px]">
          {chapter.lede}
        </p>

        {chapter.items ? (
          <RevealGroup as="ul" stagger={0.05} className="mt-6 grid gap-x-6 gap-y-0 sm:grid-cols-2">
            {chapter.items.map((item) => (
              <RevealItem key={item} as="li">
                <span className="flex items-start gap-2.5 border-b border-[var(--se-navy-line)] py-2.5 text-[14px] font-semibold leading-[1.5] text-white">
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#8ab4ff]" />
                  {item}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : null}

        {chapter.extra}

        {/* The mobile surface: same visual, in reading order with its chapter. */}
        <div className="mt-10 lg:hidden">{chapter.visual}</div>

        <p className="se-display se-on-navy mt-8 max-w-[30ch] text-[19px] leading-[1.32] sm:text-[22px]">
          {chapter.closer}
        </p>
      </Reveal>
    </li>
  );
}
