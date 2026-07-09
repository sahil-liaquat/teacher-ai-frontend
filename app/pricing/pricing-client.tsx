"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  GraduationCap,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  EASE_PREMIUM,
  DURATION_REVEAL,
  staggerContainer,
  staggerItem,
  staggerScaleItem,
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
} from "@/components/motion-primitives";

const plans = [
  {
    name: "Starter",
    eyebrow: "Try TeachPad",
    price: "Free",
    period: "to start",
    description: "Explore textbook-grounded generation and create your first teaching resources.",
    href: "/signup",
    cta: "Start Free",
    tone: "slate",
    features: [
      "Textbook-grounded setup",
      "Lesson plan and worksheet access",
      "Saved resources preview",
      "Upgrade when you need more",
    ],
  },
  {
    name: "Pro",
    eyebrow: "For teachers",
    price: "₹299",
    period: "/month",
    altPrice: "or ₹1,699/year",
    description: "For teachers who want every classroom resource ready in seconds.",
    href: "/signup",
    cta: "Start Creating",
    tone: "blue",
    badge: "Best value",
    features: [
      "Unlimited lesson plans & worksheets",
      "Presentation generator",
      "Export to PDF, DOCX & PPTX",
      "RAG-grounded textbook AI",
      "Priority generation queue",
    ],
  },
  {
    name: "School",
    eyebrow: "For teams",
    price: "Custom",
    period: "school plan",
    description:
      "Bring TeachPad to every teacher with aligned formats, shared curriculum setup, and school support.",
    href: "/signup",
    cta: "Book a School Demo",
    tone: "green",
    features: [
      "Teacher onboarding support",
      "School format alignment",
      "Curriculum and textbook setup",
      "Central admin visibility",
      "Priority support",
    ],
  },
] as const;

const comparison = [
  "Lesson plans",
  "Worksheets",
  "Presentations",
  "Notes",
  "Activities",
  "Textbook-grounded generation",
  "Saved resource library",
];

const faqs = [
  {
    question: "Can I start without paying?",
    answer: "Yes. You can create an account and try TeachPad before choosing a paid plan.",
  },
  {
    question: "Which plan should an individual teacher choose?",
    answer:
      "Most individual teachers should choose Pro Monthly or Pro Annual. Annual gives the best effective monthly price.",
  },
  {
    question: "Do school plans include custom formats?",
    answer:
      "School plans can support school-specific lesson-plan formats and curriculum setup where available.",
  },
];

export function PricingClient() {
  return (
    <>
      <HeroSection />
      <PlansSection />
      <ComparisonSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_10%,#eef6ff_0,transparent_30%),radial-gradient(circle_at_88%_14%,#f4fbff_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-16 pt-16 text-center lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:pb-32 lg:pt-32 lg:text-left">
        <motion.div
          initial={prefersReduced ? "visible" : "hidden"}
          animate="visible"
          variants={staggerContainer}
          className="relative z-10"
        >
          <motion.span
            variants={staggerItem}
            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]"
          >
            <Sparkles className="h-4 w-4" />
            Simple pricing
          </motion.span>
          <motion.h1
            variants={staggerItem}
            className="mx-auto mt-5 max-w-3xl text-[32px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[40px] sm:text-6xl lg:mx-0 lg:text-[72px]"
          >
            <span className="text-blue-600">Start free.</span> Upgrade when you are ready.
          </motion.h1>
          <motion.p
            variants={staggerItem}
            className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0"
          >
            Simple pricing for textbook-grounded classroom resources.
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
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
              href="#plans"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
              style={{
                transition:
                  "transform var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
              }}
            >
              View Plans
            </Link>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-[760px] lg:-mr-10 lg:max-w-none">
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
                  alt="TeachPad dashboard with AI teaching tools for lesson planning and classroom resources."
                  width={1672}
                  height={941}
                  priority
                  className="h-auto w-full drop-shadow-[0_28px_48px_rgba(47,79,129,0.15)]"
                />
              </div>
            </motion.div>
          </ParallaxTilt>
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section id="plans" className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Plans</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Pick the plan that fits how you teach.
          </h2>
        </div>
      </RevealOnScroll>

      <StaggerGroup className="mt-10 grid gap-5 md:grid-cols-3 max-w-md mx-auto md:max-w-none">
        {plans.map((plan) => (
          <StaggerScaleItem key={plan.name} className="flex flex-col">
            <Card3DTilt
              maxTilt={5}
              className={`relative flex flex-1 flex-col rounded-2xl border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-7 ${
                plan.tone === "blue"
                  ? "border-blue-200 bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              {"badge" in plan && plan.badge ? (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {plan.badge}
                </span>
              ) : null}

              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                {plan.eyebrow}
              </p>
              <h3 className="mt-4 text-3xl font-black text-slate-950">{plan.name}</h3>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-5xl font-black tracking-tight text-slate-950">{plan.price}</span>
                <span className="pb-2 text-sm font-bold text-slate-500">{plan.period}</span>
              </div>
              {"altPrice" in plan ? (
                <p className="mt-2 text-sm font-black text-blue-600">{plan.altPrice}</p>
              ) : (
                <div className="mt-2 h-5" />
              )}
              <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">{plan.description}</p>
              
              <motion.ul
                initial={prefersReduced ? "visible" : "hidden"}
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={checklistContainer}
                className="mt-7 space-y-4 mb-8"
              >
                {plan.features.map((feature) => (
                  <motion.li
                    key={feature}
                    variants={checklistItem}
                    className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                      <AnimatedCheckmark className="h-3.5 w-3.5" />
                    </span>
                    {feature}
                  </motion.li>
                ))}
              </motion.ul>

              <Link
                href={plan.href}
                className={`mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black hover:-translate-y-0.5 ${
                  plan.tone === "blue"
                    ? "bg-blue-600 text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:bg-blue-700 hover:shadow-[0_22px_44px_rgba(37,99,235,0.35)]"
                    : "border border-slate-200 bg-white text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] hover:border-blue-200 hover:text-blue-600"
                }`}
                style={{
                  transition:
                    "transform var(--duration-micro) var(--ease-premium), background-color var(--duration-micro) var(--ease-premium), border-color var(--duration-micro) var(--ease-premium), box-shadow var(--duration-micro) var(--ease-premium)",
                }}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card3DTilt>
          </StaggerScaleItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-8 lg:py-36">
        <RevealOnScroll>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
              <WandSparkles className="h-4 w-4" />
              What Pro unlocks
            </span>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Every core classroom resource from one chapter.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              Pro is for teachers who repeatedly create teaching material and want the full TeachPad workflow available whenever planning starts.
            </p>
          </div>
        </RevealOnScroll>

        <StaggerGroup className="grid gap-3 sm:grid-cols-2">
          {comparison.map((item) => (
            <StaggerFadeItem key={item}>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <span className="text-sm font-black text-slate-800">{item}</span>
              </div>
            </StaggerFadeItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-6 lg:px-8 lg:py-36">
      <RevealOnScroll>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Questions</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Pricing without surprises.
          </h2>
        </div>
      </RevealOnScroll>

      <StaggerGroup className="mx-auto mt-10 grid max-w-4xl gap-4">
        {faqs.map((faq) => (
          <StaggerFadeItem key={faq.question}>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)]">
              <h3 className="text-lg font-black text-slate-950">{faq.question}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{faq.answer}</p>
            </article>
          </StaggerFadeItem>
        ))}
      </StaggerGroup>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)]">
      <RevealOnScroll>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:gap-24 lg:px-8 lg:py-36">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
              <GraduationCap className="h-4 w-4" />
              Built for Indian teachers and schools
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0">
              Start with your textbook. Choose the plan when you are ready.
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
