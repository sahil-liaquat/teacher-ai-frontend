"use client";

/**
 * Section 8 — What Changes for Teachers?
 * Section 9 — What Changes for Principals?
 *
 * The two people who have to feel the difference for the programme to be real.
 * Teachers get the four "instead of" swaps from the copy; principals get the
 * Monday-morning questions, set against the one photograph on the page.
 */

import { ArrowDown, Check } from "lucide-react";
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
import { FramedArt, WordReveal } from "./media";
import { MeshField, PointerLight } from "./atmosphere";
import { seImages } from "./se-images";

const teacherSwaps: { instead: string; now: string }[] = [
  {
    instead: "“What do I need to prepare for tomorrow?”",
    now: "They open TeachPad and already have the teaching context in front of them.",
  },
  {
    instead: "Searching multiple folders…",
    now: "Resources are connected to the lesson.",
  },
  {
    instead: "Repeatedly explaining context to AI…",
    now: "AI already knows it.",
  },
  {
    instead: "Writing long implementation reports…",
    now: "The teacher simply updates what happened.",
  },
];

const principalQuestions = [
  "Are our classes on track?",
  "What was not taught last week?",
  "Which lessons were rescheduled?",
  "Where is assessment falling behind?",
  "Which classes require support?",
  "Are teachers actually using the academic system?",
  "What should our academic team focus on this week?",
];

export function ForTeachers() {
  return (
    <>
      <Section id="for-teachers" tone="paper" labelledBy="se-teachers-heading" className="se-noise overflow-x-clip">
        <MeshField tone="light" opacity={0.5} />
        <PointerLight tone="light" />

        <Container className={`relative z-[2] ${SECTION_PAD}`}>
          <Reveal className="mx-auto max-w-[42rem] text-center">
            <Eyebrow>For teachers</Eyebrow>
            <WordReveal
              as="h2"
              id="se-teachers-heading"
              text="What Changes for Teachers?"
              className="se-display mt-6 block text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
            />
            <p className="mx-auto mt-6 max-w-[40ch] text-[17px] font-bold leading-[1.6] text-[var(--se-ink)] sm:text-[19px]">
              They start every day better prepared.
            </p>
          </Reveal>

          <RevealGroup as="ul" className="mx-auto mt-12 grid max-w-[1000px] gap-4 sm:grid-cols-2 lg:mt-16">
            {teacherSwaps.map((swap) => (
              <RevealItem key={swap.instead} as="li" className="h-full">
                <div className="se-surface se-rim se-lift flex h-full flex-col rounded-2xl p-6 sm:p-7">
                  <p className="se-ui text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
                    Instead of
                  </p>
                  <p className="mt-2.5 text-[15px] font-medium leading-[1.55] text-[var(--se-muted)]">
                    {swap.instead}
                  </p>

                  <span
                    aria-hidden="true"
                    className="mt-5 grid h-7 w-7 place-items-center rounded-full bg-[var(--se-accent-tint)] text-[var(--se-accent)]"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </span>

                  <p className="se-display mt-5 text-[18px] leading-[1.32] sm:text-[20px]">{swap.now}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Statement
        lead="Technology should reduce teacher work."
        trail="Not create another task for teachers."
      />
    </>
  );
}

export function ForPrincipals() {
  return (
    <>
      <Section
        id="for-leadership"
        tone="warm"
        labelledBy="se-principals-heading"
        className="se-noise overflow-x-clip"
      >
        <MeshField tone="light" opacity={0.55} />
        <PointerLight tone="light" />

        <Container className={`relative z-[2] ${SECTION_PAD}`}>
          <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <Reveal>
              <Eyebrow>For principals</Eyebrow>
              <h2
                id="se-principals-heading"
                className="se-display mt-6 text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[40px] lg:text-[46px]"
              >
                What Changes for Principals?
              </h2>
              <p className="mt-5 text-[18px] font-bold leading-[1.5] text-[var(--se-accent)] sm:text-[21px]">
                Monday morning looks different.
              </p>

              <p className="se-ui mt-8 text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
                You should be able to answer
              </p>

              <RevealGroup as="ul" stagger={0.06} className="mt-3 border-t border-[var(--se-line-strong)]">
                {principalQuestions.map((question) => (
                  <RevealItem key={question} as="li">
                    <span className="flex items-start gap-3 border-b border-[var(--se-line-strong)] py-3.5 text-[15px] font-semibold leading-[1.55] text-[var(--se-ink)]">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--se-accent)]"
                      />
                      {question}
                    </span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </Reveal>

            <Reveal delay={0.12} className="lg:sticky lg:top-28">
              <FramedArt
                {...seImages.leadership}
                parallax={36}
                sizes="(max-width: 1024px) 100vw, 520px"
              />

              <div className="mt-6 rounded-2xl border border-[var(--se-line-strong)] bg-white p-6 sm:p-7">
                <p className="se-display text-[21px] leading-[1.3] sm:text-[24px]">
                  One school.
                  <br />
                  One academic system.
                  <br />
                  <span className="se-display-soft">Much clearer academic conversations.</span>
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
