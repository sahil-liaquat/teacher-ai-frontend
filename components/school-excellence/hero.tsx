"use client";

/**
 * Section 1 — Hero.
 *
 * The strongest visual moment on the page, and the only one that gets a full
 * atmospheric stack: lit field, raking beams, a grid that recedes, grain, and a
 * light that follows the cursor. The headline arrives blurred and resolves; the
 * scene beneath it has real perspective depth.
 *
 * The copy is unchanged and load-bearing: the programme name, the promise, and
 * the sentence naming the seven things TeachPad connects — which are exactly
 * the seven the diagram draws.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE_PREMIUM } from "@/lib/use-motion";
import { useLeadForm } from "./lead-form";
import { Container, Eyebrow } from "./primitives";
import { FloatArt, MagneticCta } from "./media";
import { MeshField, PointerLight, ScrollCue } from "./atmosphere";
export function Hero() {
  const { openLeadForm } = useLeadForm();
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="overview"
      data-se-anchor
      aria-labelledby="se-hero-heading"
      className="se-noise relative overflow-x-clip se-hero-bg"
    >
      <MeshField tone="light" />
      <PointerLight tone="light" size={680} />

      {/* The grid fades out toward the horizon rather than stopping at an edge,
          so the background reads as a receding plane. */}
      <div
        aria-hidden="true"
        className="se-grid-lines-ink absolute inset-0 opacity-[0.55] [mask-image:linear-gradient(180deg,#000_0%,#000_45%,transparent_92%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(1,101,253,0.32),transparent)]"
      />

      <Container className="relative z-[2] flex flex-col items-center pb-0 pt-14 text-center sm:pt-18 lg:pt-24">
        <motion.div
          initial={prefersReduced ? undefined : "hidden"}
          animate={prefersReduced ? undefined : "visible"}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.11 } } }}
          className="flex max-w-4xl flex-col items-center"
        >
          <HeroItem>
            <Eyebrow>TeachPad School Excellence Program</Eyebrow>
          </HeroItem>

          {/* `lcp` items rise and sharpen but never fade from zero — an element
              animating up from opacity 0 cannot register as the Largest
              Contentful Paint. */}
          <HeroItem lcp>
            <h1
              id="se-hero-heading"
              className="se-display mt-7 text-[36px] leading-[1.05] tracking-tight min-[390px]:text-[43px] sm:text-[56px] lg:text-[68px]"
            >
              Transform how your school{" "}
              <span className="se-gradient-text">plans, teaches and improves.</span>
            </h1>
          </HeroItem>

          <HeroItem>
            <p className="mt-7 max-w-[52ch] text-balance text-[16.5px] leading-[1.7] text-[var(--se-body)] sm:text-[18.5px]">
              A structured academic transformation programme that helps your school turn its
              curriculum into consistent classroom practice — every class, every day.
            </p>
          </HeroItem>

          <HeroItem>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
              <MagneticCta onClick={() => openLeadForm("pilot")} variant="primary">
                Start Your School Excellence Journey
                <ArrowRight aria-hidden="true" className="h-4 w-4 se-cta-arrow" />
              </MagneticCta>
              <MagneticCta onClick={() => openLeadForm("consultation")} variant="secondary">
                Book a School Consultation
              </MagneticCta>
            </div>
          </HeroItem>
        </motion.div>
      </Container>

      {/* The artwork carries the rest of the viewport. It names the same seven
          inputs the paragraph below it names, which is why the alt text spells
          them out rather than calling this a diagram. */}
      <div className="relative z-[2] mx-auto mt-10 w-full max-w-[1240px] px-5 sm:mt-12 sm:px-8">
        <FloatArt
          src="/landing/se/connected-system.png"
          alt="TeachPad at the centre of a school's academic system, connected to curriculum documents, teachers, textbooks, the academic calendar, classroom resources, assessments and school leadership."
          width={1672}
          height={941}
          priority
          entrance={false}
          parallax={64}
          tilt={5}
          glow="strong"
          sizes="(max-width: 1024px) 100vw, 1180px"
          className="mx-auto max-w-[1180px]"
        />
      </div>

      <Container className="relative z-[2] pb-14 pt-8 text-center sm:pb-20 sm:pt-10">
        <motion.p
          initial={prefersReduced ? undefined : { opacity: 0, y: 14, filter: "blur(6px)" }}
          whileInView={prefersReduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: EASE_PREMIUM }}
          className="mx-auto max-w-[62ch] text-balance text-[15px] font-semibold leading-[1.7] text-[var(--se-ink-soft)] sm:text-[16.5px]"
        >
          TeachPad brings together your curriculum, teachers, textbooks, academic calendar,
          classroom resources, assessments and school leadership into{" "}
          <span className="text-[var(--se-accent)]">one connected academic system.</span>
        </motion.p>

        <motion.div
          initial={prefersReduced ? undefined : { opacity: 0 }}
          animate={prefersReduced ? undefined : { opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 1.6 }}
          className="mt-12 flex justify-center"
        >
          <ScrollCue />
        </motion.div>
      </Container>
    </section>
  );
}

function HeroItem({ children, lcp = false }: { children: React.ReactNode; lcp?: boolean }) {
  return (
    <motion.div
      variants={{
        hidden: lcp ? { y: 16, filter: "blur(7px)" } : { opacity: 0, y: 20, filter: "blur(7px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.9, ease: EASE_PREMIUM },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
