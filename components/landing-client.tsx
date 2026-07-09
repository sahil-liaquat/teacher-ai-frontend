"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CirclePlay,
  Clock3,
  GraduationCap,
  Play,
  School,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  EASE_PREMIUM,
  DURATION_REVEAL,
  staggerContainer,
  staggerItem,
  staggerScaleItem,
  fadeSlideUp,
  slideFromLeft,
  slideFromRight,
  scaleIn,
  checklistContainer,
  checklistItem,
} from "@/lib/use-motion";
import {
  RevealOnScroll,
  StaggerGroup,
  StaggerFadeItem,
  StaggerScaleItem,
  Card3DTilt,
  ParallaxTilt,
  AnimatedCheckmark,
  CrossfadeTabs,
  StrokeLine,
} from "@/components/motion-primitives";

// ─── Data ────────────────────────────────────────────────────────────

const tools = [
  {
    title: "Lesson Planner",
    description: "Create structured chapter lesson plans in seconds.",
    image: "/landing/lesson-planner-3d-v2.png",
    imageAlt:
      "3D lesson planner card showing textbook-based lesson planning.",
    accent: "blue",
  },
  {
    title: "Worksheet Generator",
    description: "Generate matching practice questions and worksheets.",
    image: "/landing/worksheet-3d-v2.png",
    imageAlt:
      "3D worksheet card showing practice questions generated from a textbook chapter.",
    accent: "green",
  },
  {
    title: "Presentation Generator",
    description: "Turn textbook concepts into clean classroom slides.",
    image: "/landing/presentation-3d-v2.png",
    imageAlt:
      "3D presentation card showing classroom slides created from textbook content.",
    accent: "purple",
  },
  {
    title: "Live Quiz Generator",
    description: "Create interactive quizzes to check student understanding.",
    image: "/landing/live-quiz-3d-v2.png",
    imageAlt:
      "3D live quiz card showing interactive classroom quiz results.",
    accent: "orange",
  },
];

const textbookPoints = [
  "Uses the selected board or curriculum",
  "Uses the selected class, subject, textbook, and chapter",
  "Follows chapter flow, key concepts, examples, and exercises",
  "Creates more accurate, syllabus-aligned classroom content",
];

const steps = [
  {
    title: "Select your textbook",
    description:
      "Choose the board, class, subject, book, and chapter you want to teach.",
    image: "/assets/illustrations/textbook-library-header.png",
    imageAlt:
      "Teacher selecting a textbook chapter from a digital library.",
    Icon: BookOpen,
  },
  {
    title: "Choose what you want to create",
    description:
      "Pick a lesson plan, worksheet, presentation, notes, classroom activity, or quiz.",
    image: "/ai-tools/tool-icons.png",
    imageAlt:
      "TeachPad tool icons for lesson plans, worksheets, presentations, notes, activities, and quizzes.",
    Icon: WandSparkles,
  },
  {
    title: "Review, edit, and use",
    description:
      "TeachPad generates from the chapter, then you can customize, save, download, or use it directly in class.",
    image: "/landing/beautiful-content-lesson-plan.png",
    imageAlt:
      "Editable lesson plan output generated from textbook content.",
    Icon: GraduationCap,
  },
];

const contentTabs = [
  {
    label: "Presentation",
    image: "/landing/output-quality-presentation.png",
    imageAlt: "Presentation output preview",
  },
  {
    label: "Lesson Plan",
    image: "/landing/beautiful-content-lesson-plan.png",
    imageAlt: "Lesson plan output preview",
  },
  {
    label: "Worksheet",
    image: "/landing/worksheet-3d-v2.png",
    imageAlt: "Worksheet output preview",
  },
];

const contentPoints = [
  "Clear headings and sections",
  "Editable, download-ready output",
  "Saved resource library",
];

const schoolBenefits = [
  "Reducing teacher planning time",
  "Maintaining syllabus and chapter alignment",
  "Improving consistency across classes",
  "Creating reusable teaching resources",
];

// ─── Main Component ──────────────────────────────────────────────────

export default function LandingPageClient() {
  return (
    <>
      <HeroSection />
      <ToolsSection />
      <TextbookSection />
      <HowItWorksSection />
      <BeautifulContentSection />
      <ForSchoolsSection />
      <ResultsSection />
      <FinalCtaSection />
    </>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────

function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative bg-[radial-gradient(circle_at_16%_10%,#eef6ff_0,transparent_30%),radial-gradient(circle_at_90%_12%,#f5fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-32 lg:pt-32">
        {/* Stagger-reveal container for text + CTA */}
        <motion.div
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, ease: EASE_PREMIUM } },
          }}
          className="relative z-10 flex w-full max-w-5xl flex-col items-center"
        >
          {/* Headline */}
          <motion.h1
            variants={staggerItem}
            className="max-w-full text-[32px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[38px] sm:text-6xl lg:text-[72px]"
          >
            Teach from your <span className="text-blue-600">textbook.</span>
            <br />
            Let AI do the <span className="text-blue-600">preparation.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:mt-8 sm:text-lg sm:leading-8"
          >
            TeachPad helps teachers create lesson plans, worksheets,
            presentations, notes, activities, and quizzes directly from the
            textbook chapter they are teaching.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={staggerItem}
            className="mt-8 flex w-full max-w-[420px] flex-col justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          >
            <PrimaryLink href="/signup">Start Creating Free</PrimaryLink>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 sm:px-6"
              style={{
                transition:
                  "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
              }}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </span>
              See How It Works
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero image with parallax tilt + ambient float + blob */}
        <div className="relative z-0 mx-auto mt-16 w-full max-w-7xl sm:mt-24 lg:mt-32">
          {/* Gradient blob behind image */}
          <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />

          <ParallaxTilt className="relative z-10" maxDeg={3.5}>
            <motion.div
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.4 }}
            >
              <div className="hero-float">
                <Image
                  src="/landing/teachpad-main-hero-centered.png"
                  alt="TeachPad dashboard showing textbook-based lesson planning, worksheet generation, notes, presentations, and classroom activities."
                  width={1672}
                  height={941}
                  priority
                  className="mx-auto h-auto w-full drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)]"
                />
              </div>
            </motion.div>
          </ParallaxTilt>
        </div>
      </div>
    </section>
  );
}

// ─── Tools Section ───────────────────────────────────────────────────

function ToolsSection() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-7xl overflow-hidden px-5 py-24 sm:px-6 lg:px-8 lg:py-36"
    >
      <RevealOnScroll>
        <SectionHeading
          eyebrow="AI tools"
          title={
            <>
              <span className="text-blue-600">One textbook.</span> Many
              classroom resources.
            </>
          }
        />
      </RevealOnScroll>

      <StaggerGroup className="mx-auto mt-10 grid w-full max-w-[350px] min-w-0 gap-8 sm:max-w-none sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <StaggerScaleItem key={tool.title} className="h-full">
            <Card3DTilt className="rounded-2xl p-1 text-center h-full flex flex-col" showShadow={false}>
              <article className="group min-w-0 h-full flex flex-col">
                <div className="grid h-[180px] place-items-center overflow-visible sm:h-[230px] shrink-0">
                  <Image
                    src={tool.image}
                    alt={tool.imageAlt}
                    width={380}
                    height={380}
                    className="h-44 w-44 object-contain drop-shadow-[0_22px_38px_rgba(47,79,129,0.12)] sm:h-60 sm:w-60"
                    style={{
                      transition:
                        "transform var(--duration-micro) var(--ease-premium), filter var(--duration-micro) var(--ease-premium)",
                    }}
                  />
                </div>
                <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-start">
                  <h3 className="text-xl font-black text-slate-950">
                    {tool.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">
                    {tool.description}
                  </p>
                </div>
              </article>
            </Card3DTilt>
          </StaggerScaleItem>
        ))}
      </StaggerGroup>

      <RevealOnScroll delay={0.3}>
        <div className="mt-10 flex justify-center">
          <PrimaryLink href="/ai-tools">View All Tools</PrimaryLink>
        </div>
      </RevealOnScroll>
    </section>
  );
}

// ─── Textbook Section ────────────────────────────────────────────────

function TextbookSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="textbook-grounded"
      className="bg-gradient-to-b from-white to-[#f7fbff]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div>
            <Badge icon={BookOpen}>Textbook grounded</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              The textbook is the source.
              <br />
              AI is only the{" "}
              <span className="text-blue-600">assistant.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              TeachPad uses the selected textbook chapter as the foundation
              before generating any classroom material, so the output is
              created from the book your school actually follows.
            </p>

            {/* Checklist with stagger + SVG stroke-draw checkmarks */}
            <motion.ul
              initial={prefersReduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={checklistContainer}
              className="mt-7 space-y-4"
            >
              {textbookPoints.map((point) => (
                <motion.li
                  key={point}
                  variants={checklistItem}
                  className="flex items-start gap-3 text-sm font-semibold text-slate-700"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <AnimatedCheckmark className="h-3.5 w-3.5" />
                  </span>
                  {point}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.15}>
          <div className="relative mx-auto w-full max-w-[520px] lg:-mr-12 lg:max-w-none">
            <Image
              src="/landing/textbook-grounded-v2.png"
              alt="Open textbook with textbook analysis checklist"
              width={1500}
              height={1030}
              className="marketing-float-slow h-auto w-full drop-shadow-[0_26px_44px_rgba(47,79,129,0.12)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ─── How It Works Section ────────────────────────────────────────────

function HowItWorksSection() {
  const prefersReduced = useReducedMotion();
  const directions = [slideFromLeft, slideFromRight, slideFromLeft];

  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                From textbook to teaching material in{" "}
                <span className="text-blue-600">seconds.</span>
              </>
            }
          />
        </RevealOnScroll>

        {/* Connecting line between steps (desktop) */}
        <div className="mx-auto mt-16 hidden lg:block">
          <StrokeLine className="h-2 w-full" />
        </div>

        <div className="mt-12 grid gap-16 lg:mt-0 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={prefersReduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={directions[index]}
              className="group text-center"
            >
              <div className="relative grid min-h-[230px] place-items-center sm:min-h-[280px] lg:min-h-[320px]">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">
                  {index + 1}
                </span>
                {/* Scale-in for the final mockup image */}
                <motion.div
                  initial={
                    prefersReduced
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: index === 2 ? 0.9 : 0.95 }
                  }
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: DURATION_REVEAL,
                    ease: EASE_PREMIUM,
                    delay: 0.15,
                  }}
                >
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    width={360}
                    height={360}
                    className="h-48 w-48 object-contain drop-shadow-[0_24px_42px_rgba(47,79,129,0.14)] sm:h-64 sm:w-64 lg:h-72 lg:w-72"
                    style={{
                      transition:
                        "transform var(--duration-micro) var(--ease-premium)",
                    }}
                  />
                </motion.div>
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 text-blue-600">
                <step.Icon className="h-5 w-5" />
                <h3 className="text-lg font-black text-slate-950">
                  {step.title}
                </h3>
              </div>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">
                {step.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Beautiful Content Section ───────────────────────────────────────

function BeautifulContentSection() {
  const [activeTab, setActiveTab] = useState(0);
  const prefersReduced = useReducedMotion();

  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <div className="grid items-center gap-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:gap-16 sm:px-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-16 lg:py-20">
        {/* Image preview with crossfade */}
        <div className="-mx-5 -mb-8 sm:-mx-8 lg:-ml-10 lg:-mr-2">
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE_PREMIUM }}
              >
                <Image
                  src={contentTabs[activeTab].image}
                  alt={contentTabs[activeTab].imageAlt}
                  width={1448}
                  height={1086}
                  className="h-auto w-full translate-y-5 drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <RevealOnScroll>
          <div>
            <Badge icon={Sparkles}>Output quality</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Beautiful content.
              <br />
              Every time.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
              TeachPad outputs are designed for real teachers, not just for
              looking good on screen. Every resource is structured, editable,
              and easy to use in daily teaching.
            </p>

            {/* Tab controls */}
            <div className="mt-6 flex flex-wrap gap-2">
              {contentTabs.map((tab, i) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`rounded-full px-4 py-2 text-xs font-bold ${
                    i === activeTab
                      ? "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  style={{
                    transition:
                      "all var(--duration-micro) var(--ease-premium)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <motion.ul
              initial={prefersReduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={checklistContainer}
              className="mt-7 space-y-4"
            >
              {contentPoints.map((point) => (
                <motion.li
                  key={point}
                  variants={checklistItem}
                  className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <AnimatedCheckmark className="h-3.5 w-3.5" />
                  </span>
                  {point}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ─── For Schools Section ─────────────────────────────────────────────

function ForSchoolsSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="for-schools"
      className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36"
    >
      <div className="grid items-center gap-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:gap-16 sm:px-12 sm:py-16 lg:grid-cols-[1fr_0.85fr_0.75fr] lg:px-16 lg:py-20">
        <RevealOnScroll>
          <div className="-mx-5 -mb-5 sm:-mx-8 lg:-ml-10 lg:-mr-4">
            <Image
              src="/landing/school-3d-v2.png"
              alt="3D school building illustration"
              width={1600}
              height={900}
              className="marketing-float-slow h-auto w-full drop-shadow-[0_22px_40px_rgba(47,79,129,0.12)]"
            />
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <div id="pricing">
            <Badge icon={School}>For schools</Badge>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Keep every classroom aligned
              <br />
              with the textbook.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              TeachPad helps schools make teaching preparation faster, more
              consistent, and more curriculum-aligned.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PrimaryLink href="/signup">
                Book a Demo for Your School
              </PrimaryLink>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.2}>
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            {/* Quotation mark watermark */}
            <span
              className="pointer-events-none absolute -left-2 -top-6 select-none text-[120px] font-black leading-none text-blue-50"
              aria-hidden="true"
            >
              &ldquo;
            </span>

            <motion.div
              initial={prefersReduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={checklistContainer}
              className="relative z-10 grid gap-4"
            >
              {schoolBenefits.map((benefit) => (
                <motion.div
                  key={benefit}
                  variants={checklistItem}
                  className="flex items-start gap-3 text-sm font-semibold text-slate-700"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <AnimatedCheckmark className="h-4 w-4" />
                  </span>
                  {benefit}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ─── Results Section ─────────────────────────────────────────────────

function ResultsSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="mt-4 max-w-3xl text-xl font-bold leading-8 text-slate-900">
                &ldquo;TeachPad helps teachers prepare faster without moving
                away from the textbook. The content follows the chapter,
                feels easy to edit, and works well for real classroom
                teaching.&rdquo;
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-white px-5 py-4 shadow-sm">
              <p className="font-black text-slate-950">
                Academic Coordinator
              </p>
              <p className="mt-1 text-sm text-slate-500">Partner School</p>
            </div>
          </div>
        </article>
      </RevealOnScroll>
    </section>
  );
}

// ─── Final CTA Section ───────────────────────────────────────────────

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:pb-32 lg:pb-40 sm:px-6 lg:px-8">
      <RevealOnScroll>
        <div className="grid items-center gap-12 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5fbff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:grid-cols-[1fr_0.9fr] md:p-16 lg:p-20">
          <div>
            <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Create everything from your textbook.
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <PrimaryLink href="/signup">Start Free</PrimaryLink>
              <SecondaryLink href="/signup">
                Book a School Demo
              </SecondaryLink>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-blue-600" />
                Built for Indian teachers and schools
              </span>
            </div>
          </div>
          <Image
            src="/landing/backpack-globe-v2.png"
            alt="Backpack, globe, books, and stationery illustration"
            width={1600}
            height={900}
            className="marketing-float-slow mx-auto h-auto w-full max-w-xl"
          />
        </div>
      </RevealOnScroll>
    </section>
  );
}

// ─── Shared Components ───────────────────────────────────────────────

function PrimaryLink({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_22px_44px_rgba(37,99,235,0.35)] ${
        size === "sm"
          ? "h-11 px-5 text-sm"
          : "h-12 px-5 text-sm sm:px-6"
      }`}
      style={{
        transition:
          "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
      }}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 sm:px-6"
      style={{
        transition:
          "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
      }}
    >
      <CirclePlay className="h-4 w-4" />
      {children}
    </Link>
  );
}

function Badge({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-[350px] text-center sm:max-w-3xl"
          : "max-w-[350px] sm:max-w-3xl"
      }
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950 min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
        {title}
      </h2>
    </div>
  );
}
