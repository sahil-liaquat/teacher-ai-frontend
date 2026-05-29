"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Layers3,
  Lightbulb,
  Trophy
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type CompanionResourcesPanelProps = {
  topic?: string;
  classLabel?: string;
  subject?: string;
  board?: string;
  lessonPlanId?: string;
  className?: string;
  onCreateWorksheet?: () => void;
  onCreatePresentation?: () => void;
  onCreateNotes?: () => void;
  onCreateActivity?: () => void;
};

const resources = [
  {
    key: "worksheet",
    title: "Worksheet",
    description: "Practice questions from the same topic",
    href: "/dashboard/worksheets/new",
    image: "/ai-tools/worksheet-generator.png",
    color: "green"
  },
  {
    key: "presentation",
    title: "Presentation",
    description: "Turn this lesson into slides",
    href: "/dashboard/presentation-generator",
    image: "/ai-tools/presentation-generator.png",
    color: "red"
  },
  {
    key: "notes",
    title: "Notes",
    description: "Concise revision notes for students",
    href: "/dashboard/notes-generator",
    image: "/ai-tools/lesson-planner.png",
    color: "pink"
  },
  {
    key: "activity",
    title: "Activity",
    description: "Classroom activity based on the lesson",
    href: "/dashboard/activity-generator",
    icon: Trophy,
    color: "cyan"
  }
] as const;

export function CompanionResourcesPanel({
  topic,
  classLabel,
  subject,
  board,
  lessonPlanId,
  className,
  onCreateWorksheet,
  onCreatePresentation,
  onCreateNotes,
  onCreateActivity
}: CompanionResourcesPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const safeTopic = toCleanString(topic);
  const safeClassLabel = toCleanString(classLabel);
  const safeSubject = toCleanString(subject);
  const safeBoard = toCleanString(board);
  const safeLessonPlanId = toCleanString(lessonPlanId);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (safeTopic) params.set("topic", safeTopic);
    if (safeClassLabel) params.set("class", safeClassLabel);
    if (safeSubject) params.set("subject", safeSubject);
    if (safeBoard) params.set("board", safeBoard);
    if (safeLessonPlanId) params.set("lessonPlanId", safeLessonPlanId);
    return params.toString();
  }, [safeBoard, safeClassLabel, safeLessonPlanId, safeSubject, safeTopic]);

  function openResource(href: string, title: string, handler?: () => void) {
    if (handler) {
      handler();
      return;
    }
    router.push(`${href}${queryString ? `?${queryString}` : ""}`);
    toast({
      title: `${title} context ready`,
      description: "The generator will open with this lesson context in the URL."
    });
  }

  const handlers = {
    worksheet: onCreateWorksheet,
    presentation: onCreatePresentation,
    notes: onCreateNotes,
    activity: onCreateActivity
  };

  return (
    <aside className={cn("max-h-none self-start overflow-visible", className)} aria-label="Companion resources">
      <div className="max-h-none overflow-visible rounded-[20px] border border-teachpad-cardBorder bg-white shadow-[0_18px_48px_var(--teachpad-shadowCard)]">
        <div className="border-b border-[#eceef3] bg-gradient-to-br from-[#f8ffff] via-white to-[#f3fff8] px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-teachpad-blue to-blue-600 text-white shadow-[0_14px_28px_var(--teachpad-shadowBlue)]">
              <Layers3 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black leading-6 text-teachpad-ink">Companion Resources</h2>
              <p className="mt-1 text-sm font-medium leading-5 text-teachpad-muted">
                Use the same topic, class, subject, and textbook context.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid gap-3">
            {resources.map((resource) => {
              const Icon = "icon" in resource ? resource.icon : null;
              return (
                <button
                  key={resource.key}
                  type="button"
                  onClick={() => openResource(resource.href, resource.title, handlers[resource.key])}
                  className={cn(
                    "group flex min-h-[86px] w-full items-center gap-3 rounded-[16px] border bg-white p-3 text-left shadow-[0_8px_22px_rgba(30,50,80,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_var(--teachpad-shadowToolCard)]",
                    cardBorder(resource.color),
                    cardHover(resource.color)
                  )}
                >
                  <span className={cn("grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[16px] shadow-lg", iconBg(resource.color))}>
                    {Icon ? (
                      <Icon className="h-8 w-8 text-white transition duration-300 group-hover:scale-110" />
                    ) : "image" in resource ? (
                      <Image
                        src={resource.image}
                        alt=""
                        width={72}
                        height={72}
                        className="h-12 w-12 object-contain drop-shadow-[0_8px_12px_rgba(51,72,120,0.16)] transition duration-300 group-hover:scale-110"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-teachpad-ink">{resource.title}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-teachpad-muted">{resource.description}</span>
                  </span>
                  <ArrowRight className={cn("h-4 w-4 shrink-0 text-[#9ca0aa] transition group-hover:translate-x-0.5", arrowColor(resource.color))} />
                </button>
              );
            })}
          </div>

          <section className="rounded-[16px] border border-[#ffe1d2] bg-gradient-to-br from-[#fffaf0] to-white p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#fff0bf] text-[#b97800]">
                <Lightbulb className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-teachpad-ink">Best next step</h3>
                <p className="mt-1 text-sm font-semibold leading-5 text-teachpad-muted">
                  Create worksheet first to reinforce learning.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}

function toCleanString(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cardBorder(color: string) {
  return {
    green: "border-emerald-200",
    red: "border-rose-200",
    pink: "border-pink-200",
    cyan: "border-cyan-200"
  }[color];
}

function cardHover(color: string) {
  return {
    green: "hover:border-emerald-300 hover:bg-emerald-50/40",
    red: "hover:border-rose-300 hover:bg-rose-50/40",
    pink: "hover:border-pink-300 hover:bg-pink-50/40",
    cyan: "hover:border-cyan-300 hover:bg-cyan-50/40"
  }[color];
}

function iconBg(color: string) {
  return {
    green: "bg-gradient-to-br from-emerald-300 to-emerald-600",
    red: "bg-gradient-to-br from-rose-400 to-rose-600",
    pink: "bg-gradient-to-br from-pink-300 to-pink-600",
    cyan: "bg-gradient-to-br from-cyan-300 to-cyan-600"
  }[color];
}

function arrowColor(color: string) {
  return {
    green: "group-hover:text-emerald-700",
    red: "group-hover:text-rose-600",
    pink: "group-hover:text-pink-600",
    cyan: "group-hover:text-cyan-700"
  }[color];
}
