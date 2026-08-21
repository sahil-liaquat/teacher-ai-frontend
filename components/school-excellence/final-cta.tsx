"use client";

/**
 * Section 15 — The close.
 *
 * The seven "where" lines arrive one at a time as the section comes up, so the
 * picture of the school assembles itself before the two buttons appear.
 */

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_PREMIUM } from "@/lib/use-motion";
import { useLeadForm } from "./lead-form";
import { Container, Eyebrow, Reveal, RevealGroup, RevealItem } from "./primitives";
import { MagneticCta, WordReveal } from "./media";
import { Beams, MeshField, PointerLight, useHeroDepthEnabled } from "./atmosphere";

/** Same WebGL chunk as the hero, dark palette — it bookends the page. */
const HeroDepth = dynamic(() => import("./hero-3d"), { ssr: false });

const conditions = [
  "Where teachers start prepared.",
  "Where curriculum stays on track.",
  "Where resources are ready when needed.",
  "Where AI understands the academic context.",
  "Where missed teaching doesn't disappear.",
  "Where leadership knows what needs attention.",
  "And where every academic year becomes better than the one before it.",
];

export function FinalCta() {
  const { openLeadForm } = useLeadForm();
  const prefersReduced = useReducedMotion();
  const depthEnabled = useHeroDepthEnabled();

  return (
    <section
      aria-labelledby="se-close-heading"
      className="se-noise se-noise-dark relative overflow-x-clip bg-[var(--se-navy)] text-[var(--se-navy-ink)]"
    >
      <MeshField tone="dark" opacity={0.9} />
      {depthEnabled ? <HeroDepth variant="dark" /> : null}
      <Beams />
      <PointerLight tone="dark" size={820} />
      <div aria-hidden="true" className="se-grid-lines se-grid-drift absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(1,101,253,0.35),transparent_70%)]"
      />

      <Container className="relative z-[2] py-20 text-center sm:py-28 lg:py-36">
        <Reveal>
          <Eyebrow onNavy>TeachPad School Excellence Program</Eyebrow>
        </Reveal>

        <WordReveal
          as="h2"
          id="se-close-heading"
          text="Build a School Where the Plan Reaches Every Classroom."
          className="se-display se-on-navy mx-auto mt-7 block max-w-[20ch] text-[31px] leading-[1.08] min-[390px]:text-[36px] sm:text-[48px] lg:text-[58px]"
        />

        <RevealGroup as="ul" stagger={0.09} className="mx-auto mt-10 max-w-[38rem]">
          {conditions.map((condition) => (
            <RevealItem key={condition} as="li">
              <p className="border-b border-[var(--se-navy-line)] py-3 text-[15.5px] font-semibold leading-[1.5] text-[var(--se-navy-muted)] sm:text-[16.5px]">
                {condition}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>

        <motion.p
          initial={prefersReduced ? undefined : { opacity: 0, y: 16 }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE_PREMIUM }}
          className="se-display se-on-navy mx-auto mt-12 max-w-[24ch] text-[24px] leading-[1.2] sm:text-[32px] lg:text-[38px]"
        >
          Transform the way your school{" "}
          <span className="se-display-soft-navy">runs academics.</span>
        </motion.p>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <MagneticCta onClick={() => openLeadForm("pilot")} variant="onnavy">
              Start the 60-Day School Excellence Pilot
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </MagneticCta>
            <MagneticCta onClick={() => openLeadForm("consultation")} variant="ghost-onnavy">
              Book a School Consultation
            </MagneticCta>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mx-auto mt-12 max-w-[40ch] border-t border-[var(--se-navy-line)] pt-8 text-[16px] font-semibold leading-[1.6] text-[var(--se-navy-muted)] sm:text-[17.5px]">
            Your school already has the plan.
            <br />
            <span className="text-white">Let&rsquo;s build the system that makes it happen.</span>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
