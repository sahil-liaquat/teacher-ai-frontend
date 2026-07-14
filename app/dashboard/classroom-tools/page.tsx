"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { cn } from "@/lib/utils";
import { ACTIVE_TOOLS } from "@/lib/tools";

const cardBase = "group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left outline-none focus:outline-none focus:ring-0 focus:border-white/70 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 active:border-white/70";

const cardStyles: Record<string, { card: string; glow: string; iconBox: string; text: string }> = {
  blue: {
    card: "from-[#eff6ff] via-[#eff6ff] to-white",
    glow: "bg-[#bfdbfe]/30",
    iconBox: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100",
    text: "group-hover/card:text-blue-600"
  },
  green: {
    card: "from-white via-emerald-50/70 to-white",
    glow: "bg-emerald-200/30",
    iconBox: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100",
    text: "group-hover/card:text-emerald-600"
  },
  yellow: {
    card: "from-[#fffaf0] via-amber-50/80 to-white",
    glow: "bg-amber-200/30",
    iconBox: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
    text: "group-hover/card:text-amber-600"
  },
  pink: {
    card: "from-white via-pink-50/70 to-white",
    glow: "bg-pink-200/30",
    iconBox: "bg-[#fff1f7] text-[#f45f98] ring-pink-100",
    text: "group-hover/card:text-pink-600"
  },
  red: {
    card: "from-white via-rose-50/75 to-white",
    glow: "bg-rose-200/30",
    iconBox: "bg-[#fff7f8] text-[#eb3b5a] ring-[#ffd9de]",
    text: "group-hover/card:text-rose-600"
  },
  aqua: {
    card: "from-[#f0fdff] via-cyan-50/70 to-white",
    glow: "bg-cyan-200/30",
    iconBox: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb]",
    text: "group-hover/card:text-cyan-600"
  },
  lavender: {
    card: "from-white via-violet-50/70 to-white",
    glow: "bg-violet-200/30",
    iconBox: "bg-violet-50 text-violet-600 ring-violet-100",
    text: "group-hover/card:text-violet-600"
  }
};

const tools: Array<{
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  status: "ready" | "beta" | "soon";
  tone: "blue" | "green" | "yellow" | "pink" | "red" | "aqua" | "lavender";
  buttonLabel?: string;
}> = ACTIVE_TOOLS.map((tool) => ({
  title: tool.name,
  description: {
    "lesson-plan": "Create structured lesson plans with objectives, flow, activities and checks.",
    worksheet: "Generate printable worksheets with varied questions and answer keys.",
    presentation: "Turn textbook concepts into teachable classroom slide decks.",
    notes: "Create chapter notes with summaries, key terms and revision points.",
    activity: "Build classroom activities with steps, materials and reflection prompts.",
    "teacher-writing-assistant": "Draft parent messages, feedback, remarks and school communication.",
  }[tool.id] || tool.description,
  href: tool.dashboardHref,
  icon: tool.Icon,
  badge: tool.status === "beta" ? "Beta" : "Ready",
  status: tool.status === "coming_soon" ? "soon" : tool.status,
  tone:
    tool.id === "presentation" ? "red" :
    tool.id === "notes" ? "pink" :
    tool.tone === "orange" ? "yellow" :
    tool.tone === "purple" ? "lavender" :
    tool.tone,
  buttonLabel: tool.cta,
}));

export default function ClassroomToolsPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      <DashboardBannerHeader
        titleTop="Choose the"
        titleHighlight="classroom tool"
        titleSuffix="you need."
        imageSrc="/ai-tools/classroom-tools-header-illustration.png"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:gap-4">
        {tools.map((tool) => {
          const available = tool.status === "ready" || tool.status === "beta";
          const s = cardStyles[tool.tone];
          const card = (
            <div
              className={cn(
                cardBase,
                s.card,
                !available && "opacity-86"
              )}
            >
              <div className={cn("absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl", s.glow)} />
              <div className={cn("shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 shadow-[0_14px_30px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105", s.iconBox)}>
                <tool.icon className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={cn("text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors", s.text)}>{tool.title}</h2>
                  {tool.status !== "ready" ? (
                    <Badge className="shrink-0 border-[#fff0bf] bg-[#fff0bf] px-2 py-0 text-[10px] text-[#b97800]">
                      {tool.badge}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">{tool.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover/card:translate-x-0.5" />
            </div>
          );
          return available ? <Link key={tool.title} href={tool.href}>{card}</Link> : <div key={tool.title}>{card}</div>;
        })}
      </section>
    </div>
  );
}
