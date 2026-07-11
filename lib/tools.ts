import type { ComponentType } from "react";
import {
  Activity,
  ClipboardList,
  FileText,
  NotebookPen,
  PenLine,
  Presentation,
} from "lucide-react";

export type ToolTone = "blue" | "green" | "orange" | "purple" | "aqua" | "yellow";
export type ToolStatus = "ready" | "beta" | "coming_soon";

export type ToolDefinition = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  publicHref: string;
  dashboardHref: string;
  cta: string;
  status: ToolStatus;
  tone: ToolTone;
  Icon: ComponentType<{ className?: string }>;
  image: string;
  imageAlt: string;
  bullets: string[];
  analyticsId: string;
  planAvailability: {
    starter: string;
    pro: string;
    school: string;
  };
};

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: "lesson-plan",
    name: "Lesson Plan Generator",
    shortName: "Lesson Plan",
    description: "Create structured lesson plans with objectives, flow, assessment, homework, and teacher notes from the chapter you select.",
    publicHref: "/lesson-plan-generator",
    dashboardHref: "/dashboard/lesson-plans/new",
    cta: "Create Lesson Plan",
    status: "ready",
    tone: "blue",
    Icon: FileText,
    image: "/ai-tools/showcase-lesson-plan.png",
    imageAlt: "TeachPad lesson plan output preview with objectives, classroom flow, and assessment details.",
    bullets: ["Chapter-based objectives", "Teacher-friendly lesson flow", "Assessment and homework included"],
    analyticsId: "tool_lesson_plan",
    planAvailability: {
      starter: "Limited trial access",
      pro: "Included",
      school: "Included with school templates",
    },
  },
  {
    id: "worksheet",
    name: "Worksheet Generator",
    shortName: "Worksheet",
    description: "Generate printable worksheets, answer keys, and marking schemes from your selected textbook chapter.",
    publicHref: "/worksheet-generator",
    dashboardHref: "/dashboard/worksheets/new",
    cta: "Create Worksheet",
    status: "ready",
    tone: "green",
    Icon: ClipboardList,
    image: "/ai-tools/showcase-worksheet.png",
    imageAlt: "TeachPad worksheet output preview with textbook-based practice questions.",
    bullets: ["Mixed question formats", "Answer key support", "Ready for revision or homework"],
    analyticsId: "tool_worksheet",
    planAvailability: {
      starter: "Limited trial access",
      pro: "Included",
      school: "Included with school formats",
    },
  },
  {
    id: "presentation",
    name: "Presentation Generator",
    shortName: "Presentation",
    description: "Turn textbook concepts into classroom slides with examples, speaker notes, and teachable structure.",
    publicHref: "/presentation-generator",
    dashboardHref: "/dashboard/presentation-generator",
    cta: "Create Presentation",
    status: "ready",
    tone: "orange",
    Icon: Presentation,
    image: "/ai-tools/showcase-presentation.png",
    imageAlt: "TeachPad presentation output preview with classroom slide content.",
    bullets: ["Slide-by-slide outline", "Visual concept explanation", "Download-ready classroom deck"],
    analyticsId: "tool_presentation",
    planAvailability: {
      starter: "Preview only",
      pro: "Included",
      school: "Included with branding support",
    },
  },
  {
    id: "notes",
    name: "Notes Generator",
    shortName: "Notes",
    description: "Create chapter notes with summaries, key terms, definitions, and revision-friendly structure.",
    publicHref: "/notes-generator",
    dashboardHref: "/dashboard/notes-generator",
    cta: "Create Notes",
    status: "ready",
    tone: "purple",
    Icon: NotebookPen,
    image: "/ai-tools/showcase-notes.png",
    imageAlt: "TeachPad notes output preview with chapter summaries and key terms.",
    bullets: ["Clear headings and key concepts", "Definitions and summaries", "Useful for blackboard and revision"],
    analyticsId: "tool_notes",
    planAvailability: {
      starter: "Preview only",
      pro: "Included",
      school: "Included",
    },
  },
  {
    id: "activity",
    name: "Classroom Activity Generator",
    shortName: "Activity",
    description: "Build classroom activities with materials, steps, timing, grouping ideas, and reflection prompts.",
    publicHref: "/classroom-activity-generator",
    dashboardHref: "/dashboard/activity-generator",
    cta: "Create Activity",
    status: "ready",
    tone: "aqua",
    Icon: Activity,
    image: "/ai-tools/showcase-activity.png",
    imageAlt: "TeachPad classroom activity output preview with steps, timings, and reflection prompts.",
    bullets: ["Objective-led activity plans", "Materials and timings included", "Built for active classrooms"],
    analyticsId: "tool_activity",
    planAvailability: {
      starter: "Preview only",
      pro: "Included",
      school: "Included",
    },
  },
  {
    id: "teacher-writing-assistant",
    name: "Writing Assistant",
    shortName: "Writing Assistant",
    description: "Draft parent messages, remarks, feedback, circulars, letters, emails, and bilingual rewrites for Indian school communication.",
    publicHref: "/ai-tools#teacher-writing-assistant",
    dashboardHref: "/dashboard/writing-assistant",
    cta: "Open Writing Assistant",
    status: "ready",
    tone: "yellow",
    Icon: PenLine,
    image: "/ai-tools/showcase-notes.png",
    imageAlt: "TeachPad writing assistant document editor preview.",
    bullets: ["Indian school formats", "Editable shared document", "PDF and Word export"],
    analyticsId: "tool_teacher_writing_assistant",
    planAvailability: {
      starter: "Limited trial access",
      pro: "Included",
      school: "Included",
    },
  },
];

export const ACTIVE_TOOLS = TOOL_REGISTRY.filter((tool) => tool.status === "ready" || tool.status === "beta");
export const READY_TOOLS = TOOL_REGISTRY.filter((tool) => tool.status === "ready");
