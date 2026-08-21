"use client";

/**
 * Section 3 — Imagine your school working differently.
 *
 * Paired rows rather than two disconnected lists, so each "before" reads
 * directly against the "with TeachPad" that replaces it. The leadership pair is
 * pulled out at the end because it is the one that changes the conversation
 * rather than the workflow.
 */

import { ArrowRight, Check, Eye, HelpCircle, Minus } from "lucide-react";
import {
  Container,
  Eyebrow,
  Reveal,
  RevealGroup,
  RevealItem,
  SECTION_PAD,
  Section,
} from "./primitives";
import { WordReveal } from "./media";
import { MeshField, PointerLight } from "./atmosphere";

const pairs: { before: string; after: string }[] = [
  {
    before: "Curriculum lives in documents.",
    after: "Curriculum becomes a live academic plan.",
  },
  {
    before: "Teachers prepare lessons separately.",
    after: "Teachers know what they need to teach each day.",
  },
  {
    before: "Resources are spread across folders and WhatsApp groups.",
    after: "Resources appear with the lesson.",
  },
  {
    before: "AI starts from a blank prompt.",
    after: "AI already understands the teaching context.",
  },
  {
    before: "Missed lessons are difficult to follow.",
    after: "Missed lessons can be rescheduled and tracked.",
  },
  {
    before: "Academic progress depends on manual updates.",
    after: "Academic progress is visible across classes.",
  },
];

const leadershipSees = ["What is happening.", "Where support is needed.", "What needs to happen next."];

export function BeforeAfter() {
  return (
    <Section
      id="what-changes"
      tone="paper"
      labelledBy="se-change-heading"
      className="se-noise overflow-x-clip"
    >
      <MeshField tone="light" opacity={0.5} />
      <PointerLight tone="light" />

      <Container className={`relative z-[2] ${SECTION_PAD}`}>
        <Reveal className="mx-auto max-w-[42rem] text-center">
          <Eyebrow>What changes</Eyebrow>
          <WordReveal
            as="h2"
            id="se-change-heading"
            text="Imagine your school working differently."
            accentFrom={3}
            className="se-display mt-6 block text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
          />
        </Reveal>

        <div className="mx-auto mt-12 max-w-[1000px] lg:mt-16">
          {/* Column headers — desktop only; each row is self-labelling on mobile. */}
          <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-[var(--se-ink)] pb-3 lg:grid">
            <p className="se-ui text-[11px] font-black uppercase tracking-[0.18em] text-[var(--se-muted)]">
              Before
            </p>
            <span aria-hidden="true" className="w-8" />
            <p className="se-ui text-[11px] font-black uppercase tracking-[0.18em] text-[var(--se-accent)]">
              With TeachPad
            </p>
          </div>

          <RevealGroup as="ul" stagger={0.06}>
            {pairs.map((pair) => (
              <RevealItem key={pair.before} as="li">
                <div className="se-shift-row grid items-center gap-x-6 gap-y-3 border-b border-[var(--se-line)] py-5 lg:grid-cols-[1fr_auto_1fr]">
                  <div className="flex items-start gap-3">
                    <Minus
                      aria-hidden="true"
                      className="mt-1 h-4 w-4 shrink-0 text-[var(--se-status-planned)]"
                    />
                    <span className="text-[15px] font-medium leading-[1.55] text-[var(--se-muted)]">
                      <span className="se-ui mr-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--se-status-planned)] lg:hidden">
                        Before
                      </span>
                      {pair.before}
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    className="se-shift-arrow hidden h-7 w-7 place-items-center rounded-full border border-[var(--se-line)] bg-[var(--se-paper-warm)] text-[var(--se-accent)] lg:grid"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>

                  <div className="flex items-start gap-3">
                    <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[var(--se-accent)]" />
                    <span className="text-[15px] font-semibold leading-[1.55] text-[var(--se-ink)]">
                      <span className="se-ui mr-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--se-accent)] lg:hidden">
                        With TeachPad
                      </span>
                      {pair.after}
                    </span>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* The leadership pair — the one that changes the conversation. */}
          <Reveal delay={0.1} className="mt-8">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
              <div className="se-surface se-rim h-full rounded-2xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-6 sm:p-7">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[var(--se-status-planned)]">
                  <HelpCircle aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <p className="se-ui mt-5 text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
                  Leadership asks
                </p>
                <p className="se-display mt-2.5 text-[20px] leading-[1.25] text-[var(--se-muted)] sm:text-[23px]">
                  &ldquo;How much syllabus is complete?&rdquo;
                </p>
              </div>

              <div className="se-rim se-lift relative h-full overflow-hidden rounded-2xl border border-[var(--se-accent-line)] bg-[linear-gradient(180deg,#ffffff,#f7faff)] p-6 shadow-[0_24px_60px_-30px_rgba(1,101,253,0.4)] sm:p-7">
                <span aria-hidden="true" className="se-core-sheen" />
                <span className="relative grid h-10 w-10 place-items-center rounded-lg bg-[var(--se-accent-tint)] text-[var(--se-accent)]">
                  <Eye aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <p className="se-ui relative mt-5 text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-accent-deep)]">
                  Leadership can see
                </p>
                <ul className="relative mt-2.5 space-y-2">
                  {leadershipSees.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        className="mt-[3px] h-4 w-4 shrink-0 text-[var(--se-accent)]"
                      />
                      <span className="se-display text-[17px] leading-[1.3] sm:text-[19px]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
