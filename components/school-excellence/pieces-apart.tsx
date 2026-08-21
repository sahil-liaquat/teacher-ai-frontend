"use client";

/**
 * Section 2 — Every school already has the pieces.
 *
 * The argument the whole page rests on: the parts exist, they just aren't
 * connected. The cards enter scattered and settle into a row as you scroll, so
 * the gesture makes the point before the copy does.
 */

import { AlertTriangle, FolderX, Gauge, UserX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { WordReveal } from "./media";
import { MeshField, PointerLight } from "./atmosphere";
import { SeparatePiecesVisual } from "./visuals";

const separations: { title: string; Icon: LucideIcon }[] = [
  { title: "Teachers prepare independently.", Icon: UserX },
  { title: "Resources stay scattered.", Icon: FolderX },
  { title: "Classes move at different speeds.", Icon: Gauge },
  { title: "Missed lessons become difficult to track.", Icon: AlertTriangle },
];

export function PiecesApart() {
  return (
    <>
      <Statement
        lead="Great schools don't just make plans."
        trail="They make sure those plans reach every classroom."
      />

      <Section tone="paper" labelledBy="se-pieces-heading" className="se-noise overflow-x-clip">
        <MeshField tone="light" opacity={0.55} />
        <PointerLight tone="light" />

        <Container className={`relative z-[2] ${SECTION_PAD}`}>
          <Reveal className="mx-auto max-w-[44rem] text-center">
            <Eyebrow>Every school already has</Eyebrow>
            <WordReveal
              as="h2"
              id="se-pieces-heading"
              text="The pieces are already there. They just work separately."
              accentFrom={5}
              className="se-display mt-6 block text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
            />
          </Reveal>

          <div className="mx-auto mt-12 max-w-[1000px] lg:mt-16">
            <SeparatePiecesVisual />
          </div>

          <Reveal className="mx-auto mt-14 max-w-[44rem] text-center lg:mt-18">
            <p className="se-display text-[22px] leading-[1.2] sm:text-[28px]">
              But these pieces often work separately.
            </p>
          </Reveal>

          <RevealGroup className="mx-auto mt-9 grid max-w-[1000px] gap-4 sm:grid-cols-2" as="ul">
            {separations.map((item) => (
              <RevealItem key={item.title} as="li" className="h-full">
                <div className="se-surface se-rim se-lift flex h-full items-start gap-4 p-5">
                  <span className="se-card-icon grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[rgba(245,158,11,0.1)] text-[var(--se-status-pending)]">
                    <item.Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <p className="pt-2 text-[15px] font-semibold leading-[1.5] text-[var(--se-ink)]">
                    {item.title}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.15} className="mx-auto mt-4 max-w-[1000px]">
            <div className="se-rim se-lift relative flex items-start gap-4 rounded-2xl border border-[rgba(239,68,68,0.22)] bg-[linear-gradient(180deg,rgba(254,242,242,0.9),rgba(255,255,255,0.9))] p-5 shadow-[0_18px_40px_-28px_rgba(239,68,68,0.6)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[var(--se-status-skipped)]">
                <AlertTriangle aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <p className="pt-2 text-[15px] font-semibold leading-[1.5] text-[var(--se-ink)]">
                And school leaders often discover academic gaps only when it is too late.
              </p>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Statement
        tone="navy"
        lead="TeachPad brings everything together."
        trail="So your academic plan doesn't remain on paper."
        support="It becomes what actually happens in the classroom."
      />
    </>
  );
}
