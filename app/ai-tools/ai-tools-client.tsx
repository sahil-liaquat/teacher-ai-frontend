"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AiToolsShowcase } from "./showcase";
import {
  EASE_PREMIUM,
  DURATION_REVEAL,
  staggerContainer,
  staggerItem,
  checklistContainer,
  checklistItem,
} from "@/lib/use-motion";
import {
  RevealOnScroll,
  ParallaxTilt,
  AnimatedCheckmark,
} from "@/components/motion-primitives";

export function AiToolsClient() {
  return (
    <>
      <HeroSection />
      <RevealOnScroll>
        <AiToolsShowcase />
      </RevealOnScroll>
      <TextbookAlignedSection />
      <FinalCtaSection />
    </>
  );
}

function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#eef6ff_0,transparent_28%),radial-gradient(circle_at_88%_16%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-5 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32">
        {/* Text Area with Stagger */}
        <motion.div
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
        >
          <motion.div
            variants={staggerItem}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]"
          >
            <Sparkles className="h-4 w-4" />
            AI tools
          </motion.div>
          <motion.h1
            variants={staggerItem}
            className="text-[40px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[46px] sm:text-6xl lg:text-[72px]"
          >
            <span className="text-blue-600">One textbook.</span>
            <br />
            Every teaching resource.
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0"
          >
            TeachPad turns your selected textbook chapter into lesson plans, worksheets, presentations, notes, activities, and quizzes &mdash; all aligned with what you actually teach.
          </motion.p>

          <motion.div
            variants={staggerItem}
            className="mx-auto mt-7 flex max-w-[420px] flex-col justify-center gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center lg:mx-0 lg:justify-start"
          >
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700"
              style={{
                transition:
                  "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
              }}
            >
              Start Creating Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#showcase"
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
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

        {/* Hero Image with blob, float, and parallax tilt */}
        <div className="relative mx-auto w-full max-w-[820px] lg:-mr-12 lg:max-w-none">
          <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          <ParallaxTilt className="relative z-10" maxDeg={3.5}>
            <motion.div
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE_PREMIUM, delay: 0.4 }}
            >
              <div className="hero-float">
                <Image
                  src="/ai-tools/ai-tools-hero.png"
                  alt="TeachPad turns one textbook chapter into AI-generated teaching resources."
                  width={1448}
                  height={1086}
                  priority
                  className="h-auto w-full drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)]"
                />
              </div>
            </motion.div>
          </ParallaxTilt>
        </div>
      </div>
    </section>
  );
}

function TextbookAlignedSection() {
  const prefersReduced = useReducedMotion();
  const points = [
    "Starts from the selected board, class, subject, textbook, and chapter.",
    "Keeps lessons, worksheets, notes, and activities tied to what teachers actually cover.",
    "Helps schools keep classroom resources consistent across sections.",
  ];

  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
              <BookOpen className="h-4 w-4" />
              Textbook grounded
            </span>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              The chapter stays at the center.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              TeachPad does not create generic AI output. It uses the textbook chapter as the source, then shapes each resource for real classroom use.
            </p>

            <motion.ul
              initial={prefersReduced ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={checklistContainer}
              className="mt-7 space-y-4"
            >
              {points.map((point) => (
                <motion.li
                  key={point}
                  variants={checklistItem}
                  className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700"
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
          <div className="relative mx-auto w-full max-w-[680px] lg:max-w-none">
            <Image
              src="/assets/illustrations/textbook-library-header.png"
              alt="Open textbook with classroom learning materials."
              width={1672}
              height={941}
              className="marketing-float-slow h-auto w-full drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
            />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="overflow-hidden bg-white">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24 lg:px-8 lg:py-36">
          <div className="text-center lg:text-left">
            <h2 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0">
              Create everything from your textbook.
            </h2>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-blue-700"
                style={{
                  transition:
                    "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
                }}
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
                style={{
                  transition:
                    "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
                }}
              >
                Book a School Demo
              </Link>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">No credit card required</p>
          </div>

          <div>
            <Image
              src="/landing/backpack-globe-v2.png"
              alt="Backpack, globe, books, and stationery illustration"
              width={1600}
              height={900}
              className="marketing-float-slow mx-auto h-auto w-full max-w-xl"
            />
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
