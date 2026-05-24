import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  LayoutList,
  Play,
  Presentation,
  Rocket,
  Trophy,
  UserRound
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Tools | TeachPad",
  description: "AI-powered lesson planners, worksheets, presentations, and live quizzes for teachers."
};

const toolCards = [
  {
    title: "Lesson Planner",
    description: "Generate structured, textbook-grounded lesson plans in seconds.",
    image: "/ai-tools/lesson-planner.png",
    icon: LayoutList,
    href: "/dashboard/lesson-plans/new",
    cta: "Create Lesson Plan",
    color: "blue",
    tags: ["Textbook Grounded", "Activities", "Assessment", "NEP Ready"]
  },
  {
    title: "Worksheet Generator",
    description: "Create custom worksheets with practice questions and answer support.",
    image: "/ai-tools/worksheet-generator.png",
    icon: ClipboardList,
    href: "/dashboard/worksheets/new",
    cta: "Create Worksheet",
    color: "green",
    tags: ["MCQs", "Short Answers", "Answer Key", "Practice Based"]
  },
  {
    title: "Presentation Generator",
    description: "Turn topics into engaging classroom presentations with clear flow.",
    image: "/ai-tools/presentation-generator.png",
    icon: Presentation,
    href: "/dashboard/presentation-generator",
    cta: "Create Presentation",
    color: "purple",
    tags: ["Slide Outline", "Visual Flow", "Classroom Ready", "Topic Based"]
  },
  {
    title: "Live Quiz Generator",
    description: "Build interactive live quizzes for revision and student engagement.",
    image: "/ai-tools/live-quiz.png",
    icon: Trophy,
    href: "/dashboard/live-quiz/new",
    cta: "Create Live Quiz",
    color: "orange",
    tags: ["Fast Revision", "Interactive", "Instant Questions", "Engagement"]
  }
] as const;

const featureStrip = [
  {
    title: "Textbook Grounded",
    description: "All content is aligned to NCERT and leading textbooks.",
    Icon: BookOpen,
    color: "blue"
  },
  {
    title: "Teacher Friendly",
    description: "Designed for teachers - simple, intuitive, and easy to use.",
    Icon: UserRound,
    color: "green"
  },
  {
    title: "Ready to Use",
    description: "Download, edit, and share classroom-ready content instantly.",
    Icon: Rocket,
    color: "purple"
  }
] as const;

export default function AiToolsPage() {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#111827]">
      <MarketingHeader />
      <HeroSection />
      <ToolsGrid />
      <FeatureStrip />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_8%,#f7fbff_0,transparent_28%),radial-gradient(circle_at_86%_20%,#eff7ff_0,transparent_32%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-6 px-5 pb-12 pt-8 sm:gap-10 sm:px-10 lg:grid-cols-[0.82fr_1fr] lg:px-16 lg:pb-20 lg:pt-12">
        <div className="relative z-10 w-full max-w-[350px] sm:max-w-[620px]">
          <h1 className="text-[48px] font-black leading-[1.02] tracking-normal text-slate-950 sm:text-[70px] lg:text-[84px]">
            Create ready-to-teach content in <span className="text-blue-600">seconds</span>
          </h1>
          <p className="mt-5 max-w-full text-[22px] font-semibold leading-[1.32] text-slate-700 sm:max-w-[560px] sm:text-[28px] sm:leading-[1.35]">
            Everything teachers need to create classroom-ready content with AI.
          </p>

          <Link
            href="#tools"
            className="mt-8 inline-flex h-[52px] items-center justify-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 text-[14px] font-black text-slate-800 shadow-[0_15px_38px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 sm:mt-9 sm:h-14 sm:gap-4 sm:px-5 sm:pr-7 sm:text-[15px]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-blue-50 text-blue-600">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
            Watch How It Works
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[760px]">
          <div className="relative mx-auto h-[240px] max-w-[320px] overflow-hidden sm:h-[520px] sm:max-w-[760px] lg:h-[560px]">
            <Image
              src="/ai-tools/tool-icons.png"
              alt=""
              width={1536}
              height={1024}
              priority
              className="absolute left-1/2 top-1/2 h-auto w-[295px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_28px_48px_rgba(49,84,138,0.15)] sm:w-[760px] lg:w-[820px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsGrid() {
  return (
    <section id="tools" className="mx-auto w-full max-w-[1440px] overflow-hidden px-5 py-7 sm:px-10 lg:px-12">
      <div className="mx-auto grid w-full max-w-[350px] min-w-0 gap-5 sm:max-w-none lg:grid-cols-2">
        {toolCards.map((tool) => (
          <ToolCard key={tool.title} tool={tool} />
        ))}
      </div>
    </section>
  );
}

function ToolCard({ tool }: { tool: (typeof toolCards)[number] }) {
  const Icon = tool.icon;

  return (
    <article className={`group grid min-w-0 items-center gap-2 overflow-hidden rounded-[24px] border bg-white p-5 shadow-[0_18px_50px_rgba(30,80,140,0.04)] transition duration-300 hover:-translate-y-1 ${cardBorder(tool.color)} sm:min-h-[440px] sm:grid-cols-[0.95fr_1.05fr] sm:gap-3 sm:p-7 lg:p-9`}>
      <div className="relative grid min-h-[220px] place-items-center sm:min-h-[300px]">
        <DecorDot className={`left-0 top-[58%] h-7 w-7 ${dotClass(tool.color)}`} />
        <DecorDot className={`right-[8%] top-[28%] h-8 w-8 ${tool.color === "green" ? "bg-slate-200" : dotClass(tool.color)}`} />
        <Image
          src={tool.image}
          alt=""
          width={430}
          height={430}
          className="relative z-10 h-[230px] w-[230px] object-contain drop-shadow-[0_22px_35px_rgba(51,72,120,0.14)] transition duration-300 group-hover:scale-105 sm:h-[330px] sm:w-[330px]"
        />
      </div>

      <div className="relative z-10 min-w-0">
        <span className={`grid h-12 w-12 place-items-center rounded-[14px] text-white shadow-lg sm:h-14 sm:w-14 ${iconBg(tool.color)}`}>
          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>
        <h2 className="mt-5 text-[28px] font-black leading-tight text-slate-950 sm:mt-6 sm:text-[31px]">{tool.title}</h2>
        <p className="mt-4 max-w-full text-[16px] leading-7 text-slate-600 sm:max-w-[360px]">{tool.description}</p>
        <div className="mt-5 flex max-w-full flex-wrap gap-3 sm:max-w-[360px]">
          {tool.tags.map((tag) => (
            <span key={tag} className={`rounded-[12px] border px-4 py-2 text-[13px] font-semibold ${tagClass(tool.color)}`}>
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={tool.href}
          className={`mt-7 inline-flex h-[52px] w-full items-center justify-between rounded-[16px] border bg-white px-5 text-[14px] font-black transition hover:-translate-y-0.5 sm:h-14 sm:w-auto sm:min-w-[260px] sm:px-6 ${ctaClass(tool.color)}`}
        >
          {tool.cta}
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </article>
  );
}

function FeatureStrip() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-10 pt-8 sm:px-10 lg:px-12">
      <div className="mx-auto grid w-full max-w-[350px] gap-5 rounded-[24px] border border-blue-100 bg-white px-5 py-6 shadow-[0_18px_50px_rgba(30,80,140,0.04)] sm:max-w-none sm:px-7 sm:py-7 md:grid-cols-3 lg:px-12">
        {featureStrip.map((feature, index) => (
          <div key={feature.title} className={`flex items-center gap-4 sm:gap-7 ${index > 0 ? "md:border-l md:border-slate-200 md:pl-12" : ""}`}>
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white sm:h-16 sm:w-16 ${featureIconClass(feature.color)}`}>
              <feature.Icon className="h-9 w-9 sm:h-11 sm:w-11" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-[18px] font-black text-slate-950">{feature.title}</h2>
              <p className="mt-3 max-w-[260px] text-[14px] leading-6 text-slate-500">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DecorDot({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute rounded-full opacity-75 shadow-[inset_0_5px_10px_rgba(255,255,255,0.7),0_12px_22px_rgba(47,79,129,0.14)] ${className}`}
    />
  );
}

function cardBorder(color: string) {
  return {
    blue: "border-blue-200",
    green: "border-emerald-200",
    purple: "border-violet-200",
    orange: "border-orange-200"
  }[color];
}

function iconBg(color: string) {
  return {
    blue: "bg-gradient-to-br from-blue-400 to-blue-600",
    green: "bg-gradient-to-br from-emerald-300 to-emerald-600",
    purple: "bg-gradient-to-br from-violet-400 to-violet-600",
    orange: "bg-gradient-to-br from-orange-300 to-orange-500"
  }[color];
}

function tagClass(color: string) {
  return {
    blue: "border-blue-200 bg-blue-50 text-blue-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    purple: "border-violet-200 bg-violet-50 text-violet-600",
    orange: "border-orange-200 bg-orange-50 text-orange-600"
  }[color];
}

function ctaClass(color: string) {
  return {
    blue: "border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50",
    green: "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
    purple: "border-violet-200 text-violet-600 hover:border-violet-300 hover:bg-violet-50",
    orange: "border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
  }[color];
}

function dotClass(color: string) {
  return {
    blue: "bg-blue-300",
    green: "bg-emerald-300",
    purple: "bg-violet-300",
    orange: "bg-orange-300"
  }[color];
}

function featureIconClass(color: string) {
  return {
    blue: "text-blue-500 shadow-[0_14px_28px_rgba(37,99,235,0.12)]",
    green: "text-emerald-500 shadow-[0_14px_28px_rgba(16,185,129,0.12)]",
    purple: "text-violet-500 shadow-[0_14px_28px_rgba(124,58,237,0.12)]"
  }[color];
}
