"use client";

/**
 * Section 6 — Powered by AI. Grounded in Your School.
 * Section 7 — Your Curriculum. Your Textbooks. Your Identity.
 *
 * The two sit together because they make the same promise from opposite ends:
 * the AI knows your school's context, and the programme does not replace your
 * school's identity to get it.
 */

import { Container, Eyebrow, Reveal, SECTION_PAD, Section, Statement } from "./primitives";
import { WordReveal } from "./media";
import { Beams, EdgeGlow, MeshField, PointerLight } from "./atmosphere";
import { AiContextVisual } from "./visuals";

const identityItems = [
  "Your curriculum.",
  "Your books.",
  "Your teachers.",
  "Your academic calendar.",
  "Your teaching approach.",
];

export function AiGrounded() {
  return (
    <Section id="ai" tone="warm" labelledBy="se-ai-heading" className="se-noise overflow-x-clip">
      <MeshField tone="light" opacity={0.6} />
      <PointerLight tone="light" />

      <Container className={`relative z-[2] ${SECTION_PAD}`}>
        <Reveal className="mx-auto max-w-[44rem] text-center">
          <Eyebrow>Powered by AI. Grounded in your school.</Eyebrow>
          <WordReveal
            as="h2"
            id="se-ai-heading"
            text="AI should understand what your teacher is teaching."
            accentFrom={4}
            className="se-display mt-6 block text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
          />
        </Reveal>

        <div className="mx-auto mt-12 max-w-[1020px] lg:mt-16">
          <AiContextVisual />
        </div>

        <Reveal delay={0.1} className="mx-auto mt-12 max-w-[44rem] text-center">
          <p className="se-display text-[21px] leading-[1.24] sm:text-[27px] lg:text-[31px]">
            Without starting from a{" "}
            <span className="se-display-soft">blank prompt every time.</span>
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

export function SchoolIdentity() {
  return (
    <>
      <Section tone="navy" labelledBy="se-identity-heading" className="se-noise se-noise-dark overflow-x-clip">
        <MeshField tone="dark" opacity={0.8} />
        <Beams />
        <PointerLight tone="dark" />
        <EdgeGlow position="top" tone="dark" />
        <div aria-hidden="true" className="se-grid-lines se-grid-drift absolute inset-0 opacity-70" />

        <Container className={`relative z-[2] ${SECTION_PAD}`}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Eyebrow onNavy>Your school stays your school</Eyebrow>
              <h2
                id="se-identity-heading"
                className="se-display se-on-navy mt-6 text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[40px] lg:text-[46px]"
              >
                Your Curriculum.
                <br />
                Your Textbooks.
                <br />
                <span className="se-display-soft-navy">Your Identity.</span>
              </h2>

              <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.75] text-[var(--se-navy-muted)] sm:text-[17px]">
                We are not replacing the academic identity of your school. TeachPad works around the
                curriculum your school already follows.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <ul className="border-t border-[var(--se-navy-line)]">
                {identityItems.map((item) => (
                  <li
                    key={item}
                    className="se-display se-on-navy border-b border-[var(--se-navy-line)] py-4 text-[20px] leading-[1.25] sm:py-5 sm:text-[24px]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Statement
        lead="Your school continues to be your school."
        trail="TeachPad gives it a stronger system to run academics."
      />
    </>
  );
}
