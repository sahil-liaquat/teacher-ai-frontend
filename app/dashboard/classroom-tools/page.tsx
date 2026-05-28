"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Activity,
  BookOpen,
  ClipboardCheck,
  ImageIcon,
  MessageCircle,
  NotebookPen,
  Plus,
  Presentation,
  RadioTower
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const tools: Array<{
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge: string;
  status: "ready" | "soon";
  panel: string;
  tone: "blue" | "green" | "yellow" | "pink" | "red" | "aqua" | "lavender";
  buttonLabel?: string;
}> = [
  {
    title: "Create Lesson Plan",
    description: "Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes.",
    href: "/dashboard/lesson-plans/new",
    icon: BookOpen,
    badge: "Ready",
    status: "ready",
    panel: "from-[#eef6ff] to-white",
    tone: "blue"
  },
  {
    title: "Create Worksheet",
    description: "Create printable worksheets, answer keys, and marking schemes from your selected chapter.",
    href: "/dashboard/worksheets/new",
    icon: ClipboardCheck,
    badge: "Ready",
    status: "ready",
    panel: "from-[#ecfff6] to-white",
    tone: "green"
  },
  {
    title: "Presentation Generator",
    description: "Turn a topic into a clean classroom slide deck with speaker notes and activity prompts.",
    href: "/dashboard/presentation-generator",
    icon: Presentation,
    badge: "Ready",
    status: "ready",
    panel: "from-[#fff1f3] to-white",
    tone: "red"
  },
  {
    title: "Notes Generator",
    description: "Create textbook-grounded chapter notes with key terms, summaries, and revision questions.",
    href: "/dashboard/notes-generator",
    icon: NotebookPen,
    badge: "Ready",
    status: "ready",
    panel: "from-[#fff1f7] to-white",
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
    panel: "from-[#f0fdff] to-white",
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
    panel: "from-[#fffaf0] to-white",
    tone: "yellow"
  },
  {
    title: "Rubric Assistant",
    description: "Draft criteria, scoring bands, and feedback language for projects and assignments.",
    href: "#",
    icon: MessageCircle,
    badge: "Coming soon",
    status: "soon",
    panel: "from-[#f7fff0] to-white",
    tone: "aqua"
  },
  {
    title: "Visual Explainer",
    description: "Turn difficult concepts into image-led explanations for classroom display.",
    href: "#",
    icon: ImageIcon,
    badge: "Coming soon",
    status: "soon",
    panel: "from-[#f0fdff] to-white",
    tone: "lavender"
  }
];

export default function ClassroomToolsPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5">
      <PageHeader
        title="Choose the classroom tool you need."
        size="hero"
        illustration={
          <>
            <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white/95 to-transparent" />
            <img
              src="/assets/illustrations/classroom-tools-header.png"
              alt=""
              aria-hidden="true"
              className="absolute right-10 top-1/2 w-[300px] -translate-y-1/2 select-none object-contain drop-shadow-[0_14px_14px_rgba(37,99,235,0.14)] xl:right-12 xl:w-[360px]"
            />
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const available = tool.status === "ready";
          const card = (
            <div
              className={cn(
                "group flex h-full min-h-[260px] flex-col rounded-[24px] border border-teachpad-cardBorder bg-gradient-to-br p-5 shadow-[0_14px_34px_var(--teachpad-shadowCard)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_var(--teachpad-shadowToolCard)]",
                tool.panel,
                !available && "opacity-86"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <IconBubble icon={tool.icon} tone={tool.tone} className="transition-transform duration-300 group-hover:scale-105" />
                {!available ? (
                  <Badge className="border-[#fff0bf] bg-[#fff0bf] text-[#b97800]">
                    {tool.badge}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-5 flex-1">
                <h2 className="text-xl font-black tracking-tight text-teachpad-ink">{tool.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">{tool.description}</p>
              </div>
              <Button className="mt-5 w-full" variant={available ? "default" : "outline"} disabled={!available}>
                {available ? <Plus className="h-4 w-4" /> : null}
                {available ? tool.buttonLabel || "Open Tool" : "Coming Soon"}
                {available ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          );
          return available ? <Link key={tool.title} href={tool.href}>{card}</Link> : <div key={tool.title}>{card}</div>;
        })}
      </section>
    </div>
  );
}

function IconBubble({
  icon,
  tone,
  className
}: {
  icon: ComponentType<{ className?: string }>;
  tone: "blue" | "green" | "yellow" | "pink" | "red" | "aqua" | "lavender";
  className?: string;
}) {
  const Icon = icon;
  const styles = {
    blue: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100 shadow-[0_14px_30px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    green: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100 shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)]",
    yellow: "bg-[#fff6df] text-[#f0a22f] ring-amber-100 shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    pink: "bg-[#fff1f7] text-[#f45f98] ring-pink-100 shadow-[0_14px_30px_rgba(244,95,152,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    red: "bg-[#fff7f8] text-[#eb3b5a] ring-[#ffd9de] shadow-[0_14px_30px_rgba(235,59,90,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    aqua: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb] shadow-[0_14px_30px_rgba(22,169,182,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    lavender: "bg-[#f6f1ff] text-[#8b5cf6] ring-[#e9e1ff] shadow-[0_14px_30px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]"
  };

  return (
    <span className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-[22px] ring-1", styles[tone], className)}>
      <Icon className="h-8 w-8 stroke-[2.3]" aria-hidden="true" />
    </span>
  );
}
