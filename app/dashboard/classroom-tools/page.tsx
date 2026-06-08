"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  ClipboardList,
  ImageIcon,
  LayoutList,
  MessageCircle,
  NotebookPen,
  Presentation,
  RadioTower
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { cn } from "@/lib/utils";

const cardStyles: Record<string, { card: string; iconBox: string; iconShadow: string; glow: string }> = {
  blue: {
    card: "bg-gradient-to-br from-[#eff6ff] via-[#eff6ff] to-white",
    iconBox: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100",
    iconShadow: "shadow-[0_14px_30px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-[#bfdbfe]/30"
  },
  green: {
    card: "bg-gradient-to-br from-white via-emerald-50/70 to-white",
    iconBox: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100",
    iconShadow: "shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-emerald-200/30"
  },
  yellow: {
    card: "bg-gradient-to-br from-[#fffaf0] via-amber-50/80 to-white",
    iconBox: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
    iconShadow: "shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-amber-200/30"
  },
  pink: {
    card: "bg-gradient-to-br from-white via-pink-50/70 to-white",
    iconBox: "bg-[#fff1f7] text-[#f45f98] ring-pink-100",
    iconShadow: "shadow-[0_14px_30px_rgba(244,95,152,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-pink-200/30"
  },
  red: {
    card: "bg-gradient-to-br from-white via-rose-50/80 to-white",
    iconBox: "bg-[#fff7f8] text-[#eb3b5a] ring-[#ffd9de]",
    iconShadow: "shadow-[0_14px_30px_rgba(235,59,90,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-rose-200/30"
  },
  aqua: {
    card: "bg-gradient-to-br from-[#f0fdff] via-cyan-50/70 to-white",
    iconBox: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb]",
    iconShadow: "shadow-[0_14px_30px_rgba(22,169,182,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-cyan-200/30"
  },
  lavender: {
    card: "bg-gradient-to-br from-[#f6f1ff] via-violet-50/70 to-white",
    iconBox: "bg-[#f6f1ff] text-[#8b5cf6] ring-[#e9e1ff]",
    iconShadow: "shadow-[0_14px_30px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-violet-200/30"
  }
};

const tools: Array<{
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  status: "ready" | "soon";
  tone: "blue" | "green" | "yellow" | "pink" | "red" | "aqua" | "lavender";
  buttonLabel?: string;
}> = [
  {
    title: "Lesson Plan Generator",
    description: "Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes.",
    href: "/dashboard/lesson-plans/new",
    icon: LayoutList,
    badge: "Ready",
    status: "ready",
    tone: "blue"
  },
  {
    title: "Worksheet Generator",
    description: "Create printable worksheets, answer keys, and marking schemes from your selected chapter.",
    href: "/dashboard/worksheets/new",
    icon: ClipboardList,
    badge: "Ready",
    status: "ready",
    tone: "green"
  },
  {
    title: "Presentation Generator",
    description: "Turn a topic into a clean classroom slide deck with speaker notes and activity prompts.",
    href: "/dashboard/presentation-generator",
    icon: Presentation,
    badge: "Ready",
    status: "ready",
    tone: "red"
  },
  {
    title: "Notes Generator",
    description: "Create textbook-grounded chapter notes with key terms, summaries, and revision questions.",
    href: "/dashboard/notes-generator",
    icon: NotebookPen,
    badge: "Ready",
    status: "ready",
    tone: "pink",
    buttonLabel: "Create Notes"
  },
  {
    title: "Activity Generator",
    description: "Create hands-on classroom activities, group tasks, and quick engagement prompts.",
    href: "/dashboard/activity-generator",
    icon: Activity,
    badge: "Ready",
    status: "ready",
    tone: "aqua",
    buttonLabel: "Create Activity"
  },
  {
    title: "Live Quiz Generator",
    description: "Create textbook-based quizzes, share a link with students, and track marks instantly.",
    href: "#",
    icon: RadioTower,
    badge: "Coming soon",
    status: "soon",
    tone: "yellow"
  },
  {
    title: "Rubric Assistant",
    description: "Draft criteria, scoring bands, and feedback language for projects and assignments.",
    href: "#",
    icon: MessageCircle,
    badge: "Coming soon",
    status: "soon",
    tone: "aqua"
  },
  {
    title: "Visual Explainer",
    description: "Turn difficult concepts into image-led explanations for classroom display.",
    href: "#",
    icon: ImageIcon,
    badge: "Coming soon",
    status: "soon",
    tone: "lavender"
  }
];

export default function ClassroomToolsPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <DashboardBannerHeader
        titleTop="Choose the"
        titleHighlight="classroom tool"
        titleSuffix="you need."
        imageSrc="/ai-tools/classroom-tools-header-illustration.png"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const available = tool.status === "ready";
          const s = cardStyles[tool.tone];
          const card = (
            <div
              className={cn(
                "clickable-card group relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-[20px] border border-white/60 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_var(--teachpad-shadowToolCard)]",
                s.card,
                !available && "opacity-86"
              )}
            >
              <div className={cn("absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl", s.glow)} />
              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className={cn(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-[22px] ring-1 transition-transform duration-300 group-hover:scale-105",
                    s.iconBox, s.iconShadow
                  )}>
                    <tool.icon className="h-7 w-7 stroke-[2.3]" aria-hidden="true" />
                  </span>
                  {!available ? (
                    <Badge className="border-[#fff0bf] bg-[#fff0bf] text-[#b97800]">
                      {tool.badge}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-5 flex-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{tool.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{tool.description}</p>
                </div>
                <Button className="mt-5 w-full" variant={available ? "default" : "outline"} disabled={!available}>
                  {available ? tool.buttonLabel || "Open Tool" : "Coming Soon"}
                </Button>
              </div>
            </div>
          );
          return available ? <Link key={tool.title} href={tool.href}>{card}</Link> : <div key={tool.title}>{card}</div>;
        })}
      </section>
    </div>
  );
}
