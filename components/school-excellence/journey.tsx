"use client";

/**
 * Section 5 — The School Excellence Journey.
 *
 * Six steps on one spine. The spine fills as the reader scrolls, so the page
 * behaves like the thing it describes: an implementation that advances rather
 * than a list of promises. Steps 02 and 04 carry the two chains the copy names,
 * drawn as chains.
 */

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Container, Eyebrow, Reveal, SECTION_PAD, Section } from "./primitives";
import { StepBadge, WordReveal } from "./media";
import { MeshField, PointerLight } from "./atmosphere";
import { ImproveLoopVisual } from "./visuals";

const structureChain = [
  "School",
  "Academic Year",
  "Classes",
  "Curriculum",
  "Textbooks",
  "Calendar",
  "Teaching Plan",
];

const classroomChain = ["Planned", "Taught", "Pending", "Rescheduled", "Assessed"];

const understandItems = [
  "Your curriculum.",
  "Your textbooks.",
  "Your academic calendar.",
  "Your teachers.",
  "Your planning process.",
  "Your assessments.",
  "Your challenges.",
];

export function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 28, restDelta: 0.001 });

  return (
    <Section id="journey" tone="paper" labelledBy="se-journey-heading" className="se-noise overflow-x-clip">
      <MeshField tone="light" opacity={0.5} />
      <PointerLight tone="light" />

      <Container className={`relative z-[2] ${SECTION_PAD}`}>
        <Reveal className="mx-auto max-w-[42rem] text-center">
          <Eyebrow>Implementation</Eyebrow>
          <WordReveal
            as="h2"
            id="se-journey-heading"
            text="The School Excellence Journey"
            className="se-display mt-6 block text-[29px] leading-[1.12] min-[390px]:text-[33px] sm:text-[42px] lg:text-[50px]"
          />
          <p className="mx-auto mt-6 max-w-[46ch] text-[16px] leading-[1.75] text-[var(--se-body)] sm:text-[17px]">
            We don&rsquo;t give your school a login and leave.{" "}
            <strong className="font-bold text-[var(--se-ink)]">
              TeachPad is implemented with your school.
            </strong>
          </p>
        </Reveal>

        <div ref={ref} className="relative mx-auto mt-14 max-w-[820px] lg:mt-18">
          {/* The spine, and the part of it the reader has already covered. */}
          <div aria-hidden="true" className="se-journey-spine absolute bottom-0 left-[21px] top-0 w-px" />
          <motion.div
            aria-hidden="true"
            style={prefersReduced ? { scaleY: 1 } : { scaleY }}
            className="absolute bottom-0 left-[21px] top-0 w-px origin-top bg-[var(--se-accent)]"
          />

          <ol className="space-y-10 sm:space-y-12">
            <Step index={1} title="Understand Your School" lede="We study how academics currently work.">
              <ul className="mt-4 grid gap-x-6 sm:grid-cols-2">
                {understandItems.map((item) => (
                  <li
                    key={item}
                    className="border-b border-[var(--se-line)] py-2.5 text-[14px] font-semibold text-[var(--se-ink-soft)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <Closer>Every transformation starts by understanding the school first.</Closer>
            </Step>

            <Step
              index={2}
              title="Build Your Academic System"
              lede="TeachPad is configured around your school. Not the other way around."
            >
              <p className="se-ui mt-5 text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
                We structure
              </p>
              <Chain items={structureChain} className="mt-3" />
              <Closer>Your existing academic structure becomes one connected system.</Closer>
            </Step>

            <Step
              index={3}
              title="Prepare Your Teachers"
              lede="Teachers and academic coordinators learn the actual workflows they will use every day."
            >
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {["Not another presentation.", "Not another complicated software training."].map((item) => (
                  <p
                    key={item}
                    className="rounded-lg border border-[var(--se-line-strong)] bg-[var(--se-paper-warm)] px-4 py-3 text-[13.5px] font-semibold text-[var(--se-muted)] line-through decoration-2"
                  >
                    {item}
                  </p>
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-[1.7] text-[var(--se-body)]">
                They work with:{" "}
                <strong className="font-bold text-[var(--se-ink)]">
                  their classes, their curriculum and their textbooks.
                </strong>
              </p>
            </Step>

            <Step
              index={4}
              title="Take It Into Real Classrooms"
              lede="Teachers begin using TeachPad during everyday teaching."
            >
              <p className="se-ui mt-5 text-[10.5px] font-black uppercase tracking-[0.16em] text-[var(--se-muted)]">
                The school starts seeing what is
              </p>
              <Chain items={classroomChain} className="mt-3" />
              <Closer>Now the academic plan becomes a living system.</Closer>
            </Step>

            <Step
              index={5}
              title="See What Needs Attention"
              lede="Leadership starts getting visibility into academic implementation."
            >
              <p className="mt-4 text-[15px] leading-[1.7] text-[var(--se-muted)]">
                Not at the end of the term.
              </p>
              <Closer>While there is still time to act.</Closer>
            </Step>

            <Step
              index={6}
              title="Improve Continuously"
              lede="Your school reviews what worked, where teaching slowed down and where support is needed."
            >
              <Closer>Then those insights improve the next cycle of planning and teaching.</Closer>
            </Step>
          </ol>
        </div>

        <Reveal delay={0.1} className="mt-16 text-center lg:mt-20">
          <p className="se-display text-[24px] leading-[1.2] sm:text-[32px] lg:text-[38px]">
            Plan. Teach. See. Improve.
          </p>
          <p className="mt-3 text-[15px] font-semibold text-[var(--se-muted)]">Again and again.</p>
          <div className="mt-8">
            <ImproveLoopVisual />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function Step({
  index,
  title,
  lede,
  children,
}: {
  index: number;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <Reveal as="li" className="relative pl-[62px]">
      <span className="absolute left-0 top-0 z-10 bg-[var(--se-paper)] py-0.5">
        <StepBadge index={index} />
      </span>

      <p className="se-ui pt-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--se-accent)]">
        Step {String(index).padStart(2, "0")}
      </p>
      <h3 className="se-display mt-2 text-[22px] leading-[1.2] sm:text-[27px]">{title}</h3>
      <p className="mt-3 max-w-[52ch] text-[15.5px] leading-[1.7] text-[var(--se-body)]">{lede}</p>
      {children}
    </Reveal>
  );
}

function Closer({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 border-l-2 border-[var(--se-accent)] pl-4 text-[15px] font-bold leading-[1.6] text-[var(--se-ink)]">
      {children}
    </p>
  );
}

/** A left-to-right chain of stages, wrapping on narrow screens. */
function Chain({ items, className = "" }: { items: string[]; className?: string }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.ol
      initial={prefersReduced ? undefined : "hidden"}
      whileInView={prefersReduced ? undefined : "visible"}
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className={`flex flex-wrap items-center gap-y-2 ${className}`}
    >
      {items.map((item, index) => (
        <motion.li
          key={item}
          variants={{
            hidden: { opacity: 0, x: -8 },
            visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
          }}
          className="flex items-center"
        >
          <span className="rounded-md border border-[var(--se-accent-line)] bg-[var(--se-accent-tint)] px-2.5 py-1.5 text-[12px] font-bold text-[var(--se-accent-deep)]">
            {item}
          </span>
          {index < items.length - 1 ? (
            <ChevronRight
              aria-hidden="true"
              className="mx-0.5 h-3.5 w-3.5 shrink-0 text-[var(--se-status-planned)]"
            />
          ) : null}
        </motion.li>
      ))}
    </motion.ol>
  );
}
