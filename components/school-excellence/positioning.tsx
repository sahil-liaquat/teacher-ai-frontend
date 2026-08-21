"use client";

/**
 * Section 13 — This Is Not Another School ERP.
 * Section 14 — Technology Alone Doesn't Transform a School.
 *
 * Where the programme sits next to what the school already runs, and why the
 * software on its own is not the offer.
 */

import { Layers, Sparkles } from "lucide-react";
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
import { Beams, EdgeGlow, MeshField, PointerLight } from "./atmosphere";

const erpScope = ["Fees.", "Payroll.", "Transport.", "Attendance administration.", "Accounting.", "Inventory."];

const teachpadScope = [
  "Curriculum.",
  "Teachers.",
  "Teaching.",
  "Resources.",
  "Assessments.",
  "Academic progress.",
  "School leadership.",
];

const notEnough = [
  "That doesn't mean teachers will use it.",
  "It doesn't mean curriculum implementation will improve.",
  "It doesn't mean leadership will get better visibility.",
];

const requirements = [
  "The right academic structure.",
  "The right technology.",
  "Teacher enablement.",
  "Classroom adoption.",
  "Academic visibility.",
  "Continuous improvement.",
];

export function NotAnErp() {
  return (
    <Section tone="paper" labelledBy="se-erp-heading" className="se-noise overflow-x-clip">
      <MeshField tone="light" opacity={0.5} />
      <PointerLight tone="light" />

      <Container className={`relative z-[2] ${SECTION_PAD}`}>
        <Reveal className="mx-auto max-w-[42rem] text-center">
          <Eyebrow>Where it sits</Eyebrow>
          <WordReveal
            as="h2"
            id="se-erp-heading"
            text="This Is Not Another School ERP."
            accentFrom={3}
            className="se-display mt-6 block text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
          />
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-[1000px] gap-5 lg:mt-16 lg:grid-cols-2">
          <Reveal>
            <div className="se-surface se-rim h-full rounded-2xl bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)] p-6 sm:p-8">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[var(--se-muted)]">
                <Layers aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h3 className="se-display mt-6 text-[20px] leading-[1.25] text-[var(--se-ink-soft)] sm:text-[23px]">
                Your existing ERP can continue managing
              </h3>
              <ul className="mt-5 border-t border-[var(--se-line-strong)]">
                {erpScope.map((item) => (
                  <li
                    key={item}
                    className="border-b border-[var(--se-line-strong)] py-3 text-[15px] font-semibold text-[var(--se-muted)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="se-rim se-lift relative h-full overflow-hidden rounded-2xl border border-[var(--se-accent-line)] bg-[linear-gradient(180deg,#ffffff,#f7faff)] p-6 shadow-[0_28px_70px_-34px_rgba(1,101,253,0.5)] sm:p-8">
              <span aria-hidden="true" className="se-core-sheen" />
              <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-[var(--se-accent-tint)] text-[var(--se-accent)]">
                <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <h3 className="se-display relative mt-6 text-[20px] leading-[1.25] sm:text-[23px]">
                TeachPad focuses on something different:{" "}
                <span className="se-display-soft">what happens academically inside your school.</span>
              </h3>
              <ul className="relative mt-5 border-t border-[var(--se-line)]">
                {teachpadScope.map((item) => (
                  <li
                    key={item}
                    className="border-b border-[var(--se-line)] py-3 text-[15px] font-bold text-[var(--se-ink)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function TechnologyAlone() {
  return (
    <>
      <Section tone="navy" labelledBy="se-tech-heading" className="se-noise se-noise-dark overflow-x-clip">
        <MeshField tone="dark" opacity={0.8} />
        <Beams />
        <PointerLight tone="dark" />
        <EdgeGlow position="top" tone="dark" />
        <div aria-hidden="true" className="se-grid-lines se-grid-drift absolute inset-0 opacity-70" />

        <Container className={`relative z-[2] ${SECTION_PAD}`}>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Eyebrow onNavy>Why a programme, not a licence</Eyebrow>
              <h2
                id="se-tech-heading"
                className="se-display se-on-navy mt-6 text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[40px] lg:text-[46px]"
              >
                Technology Alone Doesn&rsquo;t Transform a School.
              </h2>

              <p className="mt-6 text-[17px] font-bold leading-[1.55] text-white sm:text-[19px]">
                A school can buy software tomorrow.
              </p>

              <ul className="mt-5 space-y-2.5">
                {notEnough.map((item) => (
                  <li
                    key={item}
                    className="text-[15.5px] leading-[1.6] text-[var(--se-navy-muted)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="se-ui text-[10.5px] font-black uppercase tracking-[0.16em] text-[#8ab4ff]">
                Real improvement requires
              </p>

              <RevealGroup as="ul" stagger={0.07} className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {requirements.map((item, index) => (
                  <RevealItem key={item} as="li" className="h-full">
                    <div className="se-surface-navy se-rim se-rim-navy se-lift-navy flex h-full items-start gap-3 p-4">
                      <span className="se-ui shrink-0 text-[11px] font-black tracking-[0.1em] text-[#8ab4ff]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[14.5px] font-bold leading-[1.45] text-white">{item}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>

              <p className="se-display se-on-navy mt-8 text-[20px] leading-[1.3] sm:text-[23px]">
                That is the{" "}
                <span className="se-display-soft-navy">TeachPad School Excellence Program.</span>
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Statement
        lead="Not another tool added to your school."
        trail="A stronger academic system built inside your school."
      />
    </>
  );
}
