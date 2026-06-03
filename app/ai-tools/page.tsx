import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BookOpen,
  ClipboardList,
  ImageIcon,
  LayoutList,
  MessageCircle,
  NotebookPen,
  Presentation,
  Rocket,
  Sparkles,
  Trophy,
  UserRound
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Tools | TeachPad",
  description: "AI-powered lesson planners, worksheets, presentations, notes, and activities for teachers."
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
    color: "red",
    tags: ["Slide Outline", "Visual Flow", "Classroom Ready", "Topic Based"]
  },
  {
    title: "Notes Generator",
    description: "Create textbook-grounded notes with summaries, key terms, and revision questions.",
    image: "/ai-tools/lesson-planner.png",
    icon: NotebookPen,
    href: "/dashboard/notes-generator",
    cta: "Create Notes",
    color: "pink",
    tags: ["Chapter Notes", "Key Terms", "Blackboard Points", "Revision"]
  },
  {
    title: "Activity Generator",
    description: "Create textbook-grounded classroom activities with timing, grouping, and assessment prompts.",
    image: "/ai-tools/tool-icons.png",
    icon: Activity,
    href: "/dashboard/activity-generator",
    cta: "Create Activity",
    color: "cyan",
    tags: ["Group Tasks", "Materials", "Teacher Steps", "Exit Ticket"]
  },
  {
    title: "Live Quiz Generator",
    description: "Build interactive live quizzes for revision and student engagement.",
    image: "/ai-tools/live-quiz.png",
    icon: Trophy,
    href: "#",
    cta: "Coming Soon",
    color: "yellow",
    status: "soon",
    tags: ["Fast Revision", "Interactive", "Instant Questions", "Engagement"]
  },
  {
    title: "Rubric Assistant",
    description: "Draft criteria, scoring bands, and feedback language for classroom tasks.",
    image: "/ai-tools/tool-icons.png",
    icon: MessageCircle,
    href: "#",
    cta: "Coming Soon",
    color: "aqua",
    status: "soon",
    tags: ["Criteria", "Scoring", "Feedback", "Projects"]
  },
  {
    title: "Visual Explainer",
    description: "Turn difficult concepts into image-led explanations for classroom display.",
    image: "/ai-tools/tool-icons.png",
    icon: ImageIcon,
    href: "#",
    cta: "Coming Soon",
    color: "lavender",
    status: "soon",
    tags: ["Concepts", "Display", "Visuals", "Explain"]
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
      <MarketingHeader active="ai-tools" />
      <HeroSection />
      <ToolsGrid />
      <FeatureStrip />
      <MarketingFooter />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="bg-white px-3 pb-6 pt-2 sm:px-6 lg:px-8">
      <div className="relative mx-auto min-h-[300px] w-full max-w-[1440px] overflow-hidden rounded-[26px] border border-[#d9e5f3] bg-[linear-gradient(120deg,#ffffff_0%,#ffffff_52%,#f4f9ff_100%)] shadow-[0_18px_48px_rgba(37,99,235,0.06)] sm:min-h-[360px] lg:min-h-[408px]">
        <div className="relative z-10 flex min-h-[300px] flex-col justify-center px-6 py-8 sm:min-h-[360px] sm:px-12 lg:min-h-[408px] lg:px-16">
          <div className="absolute right-5 top-5 hidden items-center gap-2 rounded-full bg-[#eaf3ff] px-5 py-2 text-sm font-black text-[#1d68d8] shadow-[0_10px_24px_rgba(29,104,216,0.08)] sm:inline-flex lg:right-7 lg:top-6">
            <Sparkles className="h-4 w-4 fill-current" />
            Built for educators, designed for impact.
          </div>

          <div className="max-w-[690px] pr-0 lg:pr-[410px] xl:pr-0">
            <h1 className="text-[44px] font-black leading-[1.08] tracking-normal text-[#071b49] sm:text-[64px] lg:text-[72px]">
              Choose the <span className="text-[#126de8]">classroom tool</span> you need.
            </h1>
            <p className="mt-5 max-w-[620px] text-lg font-semibold leading-8 text-[#5b6478] sm:text-[22px] sm:leading-9">
              Powerful tools to plan, create, and engage&mdash;so you can focus on what matters most: your students.
            </p>
          </div>
        </div>

        <div className="pointer-events-none relative z-10 mx-auto -mt-12 h-[210px] w-full max-w-[460px] sm:-mt-20 sm:h-[300px] sm:max-w-[610px] lg:absolute lg:bottom-1 lg:right-8 lg:mt-0 lg:h-[360px] lg:w-[51%] lg:max-w-[680px] xl:right-16 xl:h-[382px] xl:max-w-[720px]">
          <Image
            src="/ai-tools/classroom-tools-header-illustration.png"
            alt=""
            width={1448}
            height={1086}
            priority
            className="h-full w-full object-contain object-bottom drop-shadow-[0_26px_38px_rgba(40,78,130,0.12)]"
          />
        </div>

        <div className="pointer-events-none absolute left-[56%] top-[88px] hidden h-2 w-2 rounded-full bg-[#93a7c5] opacity-75 lg:block" />
        <div className="pointer-events-none absolute left-[60%] top-[132px] hidden text-2xl font-black text-[#8bb8f5] lg:block">*</div>
        <div className="pointer-events-none absolute right-[30%] top-[62px] hidden text-3xl font-black text-[#b5c5df] lg:block">*</div>
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
  const available = !("status" in tool && tool.status === "soon");

  const card = (
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
        <span
          className={`mt-7 inline-flex h-[52px] w-full items-center justify-between rounded-[16px] border bg-white px-5 text-[14px] font-black transition sm:h-14 sm:w-auto sm:min-w-[260px] sm:px-6 ${ctaClass(tool.color)} ${available ? "hover:-translate-y-0.5" : "cursor-not-allowed opacity-70"}`}
        >
          {tool.cta}
          {available ? <ArrowRight className="h-5 w-5" /> : null}
        </span>
      </div>
    </article>
  );

  return available ? <Link href={tool.href}>{card}</Link> : card;
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
    red: "border-rose-200",
    pink: "border-pink-200",
    orange: "border-orange-200",
    cyan: "border-cyan-200",
    yellow: "border-amber-200",
    aqua: "border-cyan-200",
    lavender: "border-violet-200"
  }[color];
}

function iconBg(color: string) {
  return {
    blue: "bg-gradient-to-br from-blue-400 to-blue-600",
    green: "bg-gradient-to-br from-emerald-300 to-emerald-600",
    red: "bg-gradient-to-br from-rose-400 to-rose-600",
    pink: "bg-gradient-to-br from-pink-300 to-pink-600",
    orange: "bg-gradient-to-br from-orange-300 to-orange-500",
    cyan: "bg-gradient-to-br from-cyan-300 to-cyan-600",
    yellow: "bg-gradient-to-br from-amber-300 to-amber-500",
    aqua: "bg-gradient-to-br from-cyan-300 to-cyan-600",
    lavender: "bg-gradient-to-br from-violet-300 to-violet-600"
  }[color];
}

function tagClass(color: string) {
  return {
    blue: "border-blue-200 bg-blue-50 text-blue-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-600",
    pink: "border-pink-200 bg-pink-50 text-pink-600",
    orange: "border-orange-200 bg-orange-50 text-orange-600",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    aqua: "border-cyan-200 bg-cyan-50 text-cyan-700",
    lavender: "border-violet-200 bg-violet-50 text-violet-600"
  }[color];
}

function ctaClass(color: string) {
  return {
    blue: "border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50",
    green: "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
    red: "border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50",
    pink: "border-pink-200 text-pink-600 hover:border-pink-300 hover:bg-pink-50",
    orange: "border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50",
    cyan: "border-cyan-200 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50",
    yellow: "border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50",
    aqua: "border-cyan-200 text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50",
    lavender: "border-violet-200 text-violet-600 hover:border-violet-300 hover:bg-violet-50"
  }[color];
}

function dotClass(color: string) {
  return {
    blue: "bg-blue-300",
    green: "bg-emerald-300",
    red: "bg-rose-300",
    pink: "bg-pink-300",
    orange: "bg-orange-300",
    cyan: "bg-cyan-300",
    yellow: "bg-amber-300",
    aqua: "bg-cyan-300",
    lavender: "bg-violet-300"
  }[color];
}

function featureIconClass(color: string) {
  return {
    blue: "text-blue-500 shadow-[0_14px_28px_rgba(37,99,235,0.12)]",
    green: "text-emerald-500 shadow-[0_14px_28px_rgba(16,185,129,0.12)]",
    purple: "text-violet-500 shadow-[0_14px_28px_rgba(124,58,237,0.12)]"
  }[color];
}
