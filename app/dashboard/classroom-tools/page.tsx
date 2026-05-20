"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICON_BASE = "/assets/teachpad-theme/teachpad_ai_tools_assets/icons";

const rawIcons = {
  bookOpen: `${ICON_BASE}/book-open.svg`,
  clipboard: `${ICON_BASE}/clipboard-list.svg`,
  fileText: `${ICON_BASE}/file-text.svg`,
  message: `${ICON_BASE}/message-circle.svg`,
  presentation: `${ICON_BASE}/presentation.svg`,
  image: `${ICON_BASE}/image-icon.svg`,
  wandSparkles: `${ICON_BASE}/wand-sparkles.svg`,
  checkCircle: `${ICON_BASE}/check-circle2.svg`,
  search: `${ICON_BASE}/search.svg`
} as const;

type RawIconName = keyof typeof rawIcons;

const tools: Array<{
  title: string;
  description: string;
  href: string;
  icon: RawIconName;
  badge: string;
  status: "ready" | "soon";
  panel: string;
  accent: string;
  iconBg: string;
}> = [
  {
    title: "Create Lesson Plan",
    description: "Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes.",
    href: "/dashboard/lesson-plans/new",
    icon: "bookOpen",
    badge: "Ready",
    status: "ready",
    panel: "from-[#fff7fb] to-white",
    accent: "bg-[#ffdce8]",
    iconBg: "bg-[#ffdce8]"
  },
  {
    title: "Create Worksheet",
    description: "Create printable worksheets, answer keys, and marking schemes from your selected chapter.",
    href: "/dashboard/worksheets/new",
    icon: "clipboard",
    badge: "Ready",
    status: "ready",
    panel: "from-[#fffaf0] to-white",
    accent: "bg-[#e5ffc6]",
    iconBg: "bg-[#e5ffc6]"
  },
  {
    title: "Quiz Generator",
    description: "Build quick classroom checks and practice questions from chapters and learning goals.",
    href: "#",
    icon: "fileText",
    badge: "Coming soon",
    status: "soon",
    panel: "from-[#fffaf0] to-white",
    accent: "bg-[#fff0bf]",
    iconBg: "bg-[#fff0bf]"
  },
  {
    title: "Rubric Assistant",
    description: "Draft criteria, scoring bands, and feedback language for projects and assignments.",
    href: "#",
    icon: "message",
    badge: "Coming soon",
    status: "soon",
    panel: "from-[#f7fff0] to-white",
    accent: "bg-[#c7f7ed]",
    iconBg: "bg-[#c7f7ed]"
  },
  {
    title: "Presentation Builder",
    description: "Shape teaching points into slides and class-ready explanations.",
    href: "#",
    icon: "presentation",
    badge: "Coming soon",
    status: "soon",
    panel: "from-[#f6f1ff] to-white",
    accent: "bg-[#e9e1ff]",
    iconBg: "bg-[#e9e1ff]"
  },
  {
    title: "Visual Explainer",
    description: "Turn difficult concepts into image-led explanations for classroom display.",
    href: "#",
    icon: "image",
    badge: "Coming soon",
    status: "soon",
    panel: "from-[#f0fdff] to-white",
    accent: "bg-[#eee9ff]",
    iconBg: "bg-[#eee9ff]"
  }
];

export default function ClassroomToolsPage() {
  return (
    <div className="mx-auto grid w-full max-w-[1240px] gap-4">
      <header className="overflow-hidden rounded-[24px] border border-teachpad-cardBorder bg-white/88 shadow-[0_18px_48px_var(--teachpad-shadowCard)] backdrop-blur-sm">
        <div className="relative min-h-[220px] p-5 sm:p-6">
          <div className="relative z-10 min-w-0 lg:max-w-[52%]">
            <h1 className="max-w-3xl text-[clamp(1.9rem,4vw,3.35rem)] font-black leading-[1.02] tracking-tight text-teachpad-ink">
              Choose the classroom tool you need.
            </h1>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[56%] overflow-hidden lg:block">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white/95 to-transparent" />
            <img
              src="/assets/illustrations/classroom-tools-header.png"
              alt=""
              aria-hidden="true"
              className="absolute right-0 top-1/2 w-[560px] -translate-y-1/2 select-none object-contain drop-shadow-[0_14px_14px_rgba(37,99,235,0.14)] xl:-right-2 xl:w-[680px]"
            />
          </div>
        </div>
      </header>

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
                <IconBubble icon={tool.icon} accent={tool.accent} iconBg={tool.iconBg} className="transition-transform duration-300 group-hover:scale-105" />
                <Badge className={available ? "border-[#c9f7fb] bg-[#dffafa] text-teachpad-blue" : "border-[#fff0bf] bg-[#fff0bf] text-[#b97800]"}>
                  {tool.badge}
                </Badge>
              </div>
              <div className="mt-5 flex-1">
                <h2 className="text-xl font-black tracking-tight text-teachpad-ink">{tool.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-teachpad-muted">{tool.description}</p>
              </div>
              <Button className="mt-5 w-full" variant={available ? "default" : "outline"} disabled={!available}>
                {available ? <Plus className="h-4 w-4" /> : null}
                {available ? "Open Tool" : "Coming Soon"}
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
  accent,
  iconBg,
  small = false,
  className
}: {
  icon: RawIconName;
  accent: string;
  iconBg: string;
  small?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-[20px] p-2 shadow-[0_12px_26px_rgba(30,50,80,0.07)]", small ? "h-8 w-8 p-0.5" : "h-16 w-16", accent, className)}>
      <span className={cn("grid place-items-center rounded-[18px] bg-white/55", small ? "h-7 w-7 rounded-[10px]" : "h-12 w-12", iconBg)}>
        <img src={rawIcons[icon]} alt="" className={cn("object-contain", small ? "h-4 w-4" : "h-7 w-7")} aria-hidden="true" />
      </span>
    </span>
  );
}
