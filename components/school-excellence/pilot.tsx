"use client";

/**
 * Section 10 — The 60-Day School Excellence Pilot.
 * Section 11 — At Day 60, don't ask…
 * Section 12 — Your School Excellence Review.
 *
 * The offer, the test the school should hold it to, and what leadership gets in
 * writing at the end. Kept in one file because the three only make sense read
 * in that order.
 */

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { useLeadForm } from "./lead-form";
import {
  Container,
  Eyebrow,
  Reveal,
  RevealGroup,
  RevealItem,
  SECTION_PAD,
  Section,
  Statement,
} from "./primitives";
import { MagneticCta, WordReveal } from "./media";
import { Beams, EdgeGlow, MeshField, PointerLight } from "./atmosphere";

const realThings = [
  "Your real teachers.",
  "Your real curriculum.",
  "Your real textbooks.",
  "Your real classrooms.",
];

const pilotWork: { verb: string; detail: string }[] = [
  { verb: "Understand", detail: "your existing academic system." },
  { verb: "Set Up", detail: "your school workspace." },
  { verb: "Map", detail: "your curriculum and academic calendar." },
  { verb: "Enable", detail: "teachers and coordinators." },
  { verb: "Launch", detail: "TeachPad in real classrooms." },
  { verb: "Track", detail: "academic implementation." },
  { verb: "Review", detail: "what changed and what still needs improvement." },
];

const dayThreeQuestions = [
  "Are teachers better prepared?",
  "Is the curriculum being implemented more consistently?",
  "Can we see which classes are falling behind?",
  "Are missed lessons being tracked?",
  "Are teaching and assessment better connected?",
  "Does leadership have better academic visibility?",
  "Is our school running academics better than it was 60 days ago?",
];

const reviewItems = [
  "What improved",
  "What slowed down",
  "Where teachers need support",
  "Where curriculum gaps remain",
  "What leadership should focus on next",
  "How the programme can expand across the school",
];

export function Pilot() {
  const { openLeadForm } = useLeadForm();

  return (
    <Section id="pilot" tone="paper" labelledBy="se-pilot-heading" className="se-noise overflow-x-clip">
      <MeshField tone="light" opacity={0.6} />
      <PointerLight tone="light" />

      <Container className={`relative z-[2] ${SECTION_PAD}`}>
        <Reveal className="mx-auto max-w-[44rem] text-center">
          <Eyebrow>Start with a focused transformation</Eyebrow>
          <WordReveal
            as="h2"
            id="se-pilot-heading"
            text="The 60-Day School Excellence Pilot"
            accentFrom={1}
            className="se-display mt-6 block text-[31px] leading-[1.1] min-[390px]:text-[36px] sm:text-[46px] lg:text-[54px]"
          />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-[1000px] gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="se-display text-[22px] leading-[1.24] sm:text-[26px]">
              Don&rsquo;t change the whole school at once.
              <br />
              <span className="se-display-soft">Start with 1–3 grades.</span>
            </p>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {realThings.map((thing) => (
                <li
                  key={thing}
                  className="se-surface se-rim se-lift px-4 py-3.5 text-[14px] font-bold text-[var(--se-ink)]"
                >
                  {thing}
                </li>
              ))}
            </ul>

            <p className="mt-7 max-w-[46ch] text-[16px] leading-[1.75] text-[var(--se-body)]">
              For 60 days, TeachPad works with your school to implement the complete academic
              workflow.
            </p>

            <div className="mt-8">
              <MagneticCta onClick={() => openLeadForm("pilot")} variant="primary">
                Start the 60-Day School Excellence Pilot
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </MagneticCta>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="se-ui text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
              During the pilot we
            </p>

            <PilotSequence />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/**
 * The seven pilot activities, played rather than listed.
 *
 * The copy describes an ordered sixty days of work, so the list runs itself
 * once when it comes into view: each row's rule draws in turn and its number
 * takes the accent. It is the same information a static list carries — it just
 * behaves like the sequence it is describing.
 *
 * It plays once, forward, and never loops: a list that keeps re-animating in
 * the reader's periphery is a distraction, not a flourish.
 */
function PilotSequence() {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, margin: "-90px" });
  const prefersReduced = useReducedMotion();
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReduced) {
      setLit(pilotWork.length);
      return;
    }

    // The counter lives outside state so the interval can stop itself once the
    // list has finished. Deciding that inside the state updater would work, but
    // updaters have to stay pure — StrictMode invokes them twice in development
    // and the sequence would cut short.
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setLit(step);
      if (step >= pilotWork.length) clearInterval(timer);
    }, 260);

    return () => clearInterval(timer);
  }, [inView, prefersReduced]);

  return (
    <ol ref={ref} className="mt-3 border-t border-[var(--se-line-strong)]">
      {pilotWork.map((item, index) => (
        <li
          key={item.verb}
          data-lit={index < lit}
          className="se-seq-item flex items-baseline gap-4 border-b border-[var(--se-line-strong)] py-4"
        >
          <span className="se-seq-num se-ui w-6 shrink-0 text-[11px] font-black tracking-[0.1em]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-[15px] leading-[1.55] text-[var(--se-body)]">
            <strong className="se-display text-[17px] leading-[1.3] sm:text-[18px]">
              {item.verb}
            </strong>{" "}
            {item.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function DaySixtyTest() {
  return (
    <Section tone="navy" labelledBy="se-day60-heading" className="se-noise se-noise-dark overflow-x-clip">
      <MeshField tone="dark" opacity={0.8} />
      <Beams />
      <PointerLight tone="dark" />
      <EdgeGlow position="top" tone="dark" />
      <div aria-hidden="true" className="se-grid-lines se-grid-drift absolute inset-0 opacity-70" />

      <Container className={`relative z-[2] ${SECTION_PAD}`}>
        <Reveal className="mx-auto max-w-[46rem] text-center">
          <Eyebrow onNavy>The real test</Eyebrow>
          <h2
            id="se-day60-heading"
            className="se-display se-on-navy mt-6 text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[48px]"
          >
            At Day 60, Don&rsquo;t Ask:
          </h2>

          <p className="mx-auto mt-7 inline-flex max-w-full items-center gap-3 rounded-xl border border-[var(--se-navy-line)] bg-white/[0.04] px-5 py-4 text-left">
            <X aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--se-status-skipped)]" />
            <span className="text-[16px] font-semibold leading-[1.5] text-[var(--se-navy-muted)] line-through sm:text-[18px]">
              &ldquo;Did teachers like the software?&rdquo;
            </span>
          </p>

          <p className="mt-8 text-[18px] font-bold leading-[1.5] text-white sm:text-[21px]">
            Ask something much more important.
          </p>
        </Reveal>

        <RevealGroup as="ul" stagger={0.07} className="mx-auto mt-12 grid max-w-[1000px] gap-3 sm:grid-cols-2">
          {dayThreeQuestions.map((question, index) => (
            <RevealItem
              key={question}
              as="li"
              className={index === dayThreeQuestions.length - 1 ? "sm:col-span-2" : ""}
            >
              <div className="se-surface-navy se-rim se-rim-navy se-lift-navy flex h-full items-start gap-3.5 p-5">
                <span
                  aria-hidden="true"
                  className="se-ui mt-0.5 shrink-0 text-[11px] font-black tracking-[0.1em] text-[#8ab4ff]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="se-display se-on-navy text-[16.5px] leading-[1.35] sm:text-[18px]">
                  {question}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

export function ExcellenceReview() {
  return (
    <>
      <Section tone="warm" labelledBy="se-review-heading" className="se-noise overflow-x-clip">
        <MeshField tone="light" opacity={0.5} />
        <PointerLight tone="light" />

        <Container className={`relative z-[2] ${SECTION_PAD}`}>
          <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <Reveal>
              <Eyebrow>At the end of the pilot</Eyebrow>
              <h2
                id="se-review-heading"
                className="se-display mt-6 text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[40px] lg:text-[46px]"
              >
                Your School
                <br />
                <span className="se-display-soft">Excellence Review</span>
              </h2>
              <p className="mt-6 max-w-[44ch] text-[16px] leading-[1.75] text-[var(--se-body)] sm:text-[17px]">
                At the end of the pilot, school leadership receives a structured review of the
                implementation.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="se-glass-3 se-rim overflow-hidden">
                <div className="border-b border-[var(--se-line)] bg-white px-5 py-4">
                  <p className="se-ui text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
                    School Excellence Review · Day 60
                  </p>
                </div>
                <ul className="bg-white px-5">
                  {reviewItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 border-b border-[var(--se-line)] py-4 text-[14.5px] font-semibold text-[var(--se-ink)] last:border-b-0"
                    >
                      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--se-accent)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Statement
        lead="The goal isn't to prove that TeachPad was used."
        trail="The goal is to understand whether the school became better at academic execution."
      />
    </>
  );
}
