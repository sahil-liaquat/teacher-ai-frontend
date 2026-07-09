"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FileText, NotebookPen, Presentation, Puzzle } from "lucide-react";

const tools = [
  {
    title: "Lesson Plan",
    description: "Create structured lesson plans with objectives, outline, assessments, homework, and classroom flow from the chapter you select.",
    image: "/ai-tools/showcase-lesson-plan.png",
    imageAlt: "TeachPad lesson plan output preview with objectives, classroom flow, and assessment details.",
    href: "/lesson-plan-generator",
    cta: "Create Lesson Plan",
    Icon: FileText,
    tone: "blue",
    bullets: ["Chapter-based objectives", "Teacher-friendly lesson flow", "Assessment and homework included"]
  },
  {
    title: "Worksheet",
    description: "Generate practice sheets that match the grade, topic, difficulty, marks, and question types your class needs.",
    image: "/ai-tools/showcase-worksheet.png",
    imageAlt: "TeachPad worksheet output preview with textbook-based practice questions.",
    href: "/worksheet-generator",
    cta: "Create Worksheet",
    Icon: ClipboardList,
    tone: "green",
    bullets: ["Mixed question formats", "Answer key support", "Ready for revision or homework"]
  },
  {
    title: "Presentation",
    description: "Turn textbook concepts into clean classroom slides with visual flow, examples, diagrams, and teachable structure.",
    image: "/ai-tools/showcase-presentation.png",
    imageAlt: "TeachPad presentation output preview with classroom slide content.",
    href: "/presentation-generator",
    cta: "Create Presentation",
    Icon: Presentation,
    tone: "orange",
    bullets: ["Slide-by-slide outline", "Visual concept explanation", "Download-ready classroom deck"]
  },
  {
    title: "Notes",
    description: "Create concise chapter notes with summaries, definitions, key terms, formulas, and revision-friendly structure.",
    image: "/ai-tools/showcase-notes.png",
    imageAlt: "TeachPad notes output preview with chapter summaries and key terms.",
    href: "/notes-generator",
    cta: "Create Notes",
    Icon: NotebookPen,
    tone: "purple",
    bullets: ["Clear headings and key concepts", "Definitions and summaries", "Useful for blackboard and revision"]
  },
  {
    title: "Activity",
    description: "Build classroom activities with materials, steps, timing, grouping ideas, and reflection prompts.",
    image: "/ai-tools/showcase-activity.png",
    imageAlt: "TeachPad classroom activity output preview with steps, timings, and reflection prompts.",
    href: "/classroom-activity-generator",
    cta: "Create Activity",
    Icon: Puzzle,
    tone: "orange",
    bullets: ["Objective-led activity plans", "Materials and timings included", "Built for active classrooms"]
  }
] as const;

const toneClasses = {
  blue: {
    icon: "bg-blue-600 text-white",
    badge: "bg-blue-50 text-blue-700",
    link: "bg-blue-600 text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] hover:bg-blue-700"
  },
  green: {
    icon: "bg-emerald-500 text-white",
    badge: "bg-emerald-50 text-emerald-700",
    link: "bg-emerald-600 text-white shadow-[0_18px_36px_rgba(16,185,129,0.22)] hover:bg-emerald-700"
  },
  orange: {
    icon: "bg-orange-500 text-white",
    badge: "bg-orange-50 text-orange-700",
    link: "bg-orange-500 text-white shadow-[0_18px_36px_rgba(249,115,22,0.22)] hover:bg-orange-600"
  },
  purple: {
    icon: "bg-violet-500 text-white",
    badge: "bg-violet-50 text-violet-700",
    link: "bg-violet-600 text-white shadow-[0_18px_36px_rgba(124,58,237,0.22)] hover:bg-violet-700"
  },
} as const;

export function AiToolsShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [frameMode, setFrameMode] = useState<"before" | "active" | "after">("before");
  const safeActiveIndex = Math.min(activeIndex, tools.length - 1);
  const activeTool = tools[safeActiveIndex];
  const activeTone = toneClasses[activeTool.tone];

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const nextIndex = Math.min(tools.length - 1, Math.floor(progress * tools.length));
      const nextMode = rect.top > 0 ? "before" : rect.bottom <= window.innerHeight ? "after" : "active";
      setActiveIndex(nextIndex);
      setFrameMode(nextMode);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const progressText = useMemo(() => `${safeActiveIndex + 1} / ${tools.length}`, [safeActiveIndex]);
  const framePositionClass =
    frameMode === "active"
      ? "fixed left-1/2 top-0 z-20 w-full max-w-7xl -translate-x-1/2"
      : frameMode === "after"
        ? "absolute bottom-0 left-1/2 w-full max-w-7xl -translate-x-1/2"
        : "absolute left-1/2 top-0 w-full max-w-7xl -translate-x-1/2";

  return (
    <section id="showcase" className="bg-white">
      <div className="mx-auto max-w-7xl px-5 pb-0 pt-24 text-center sm:px-6 lg:px-8 lg:pt-36">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">AI tools showcase</p>
        <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Scroll through every resource TeachPad can create.
        </h2>
      </div>

      <section ref={sectionRef} className="relative -mt-6 min-h-[500vh] sm:-mt-8 lg:-mt-10">
        <div className={`${framePositionClass} grid h-screen grid-rows-[1.02fr_0.98fr] items-center gap-0 overflow-hidden px-3 py-0 sm:px-5 md:grid-rows-[1.12fr_0.88fr] lg:grid-cols-[1.12fr_0.88fr] lg:grid-rows-1 lg:gap-10 lg:px-8`}>
          <div className="relative min-h-[360px] w-full bg-transparent sm:min-h-[480px] lg:min-h-[620px]">
            {tools.map((tool, index) => {
              const isActive = index === safeActiveIndex;
              const isPast = index < safeActiveIndex;
              return (
                <Image
                  key={tool.title}
                  src={tool.image}
                  alt={tool.imageAlt}
                  width={1448}
                  height={1086}
                  priority={index === 0}
                  className={`absolute left-1/2 top-1/2 h-full w-full max-w-full -translate-x-1/2 object-contain transition duration-700 ease-out ${
                    isActive
                      ? "-translate-y-1/2 scale-100 opacity-100"
                      : isPast
                        ? "-translate-y-[68%] scale-95 opacity-0"
                        : "-translate-y-[34%] scale-95 opacity-0"
                  }`}
                />
              );
            })}
          </div>

          <div className="relative min-w-0 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center gap-2 lg:mb-7 lg:justify-start">
              {tools.map((tool, index) => (
                <button
                  key={tool.title}
                  type="button"
                  aria-label={`Show ${tool.title}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === safeActiveIndex ? "w-10 bg-blue-600" : "w-2.5 bg-slate-200 hover:bg-slate-300"}`}
                />
              ))}
            </div>

            <div key={activeTool.title} className="animate-[fadeTool_520ms_ease-out]">
              <span className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-xs font-black sm:text-sm ${activeTone.badge}`}>
                <activeTool.Icon className="h-4 w-4" />
                {progressText}
              </span>
              <h3 className="mt-4 text-[38px] font-black leading-none tracking-tight text-slate-950 sm:text-[48px] lg:mt-6 lg:text-[58px]">{activeTool.title}</h3>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7 lg:mx-0 lg:mt-6 lg:text-lg lg:leading-8">{activeTool.description}</p>
              <ul className="mx-auto mt-5 max-w-md space-y-3 text-left lg:mx-0 lg:mt-7 lg:space-y-4">
                {activeTool.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-sm font-semibold text-slate-700 lg:text-base">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-blue-600">
                      <Check className="h-4 w-4" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <Link
                href={activeTool.href}
                className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5 lg:mt-9 lg:h-12 lg:px-6 ${activeTone.link}`}
              >
                {activeTool.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeTool {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
