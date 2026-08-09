"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronsRight,
  CheckSquare,
  ClipboardList,
  Clock3,
  Download,
  Edit3,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  UsersRound,
  MoreVertical,
  AlertCircle,
  Flag,
  MoreHorizontal,
  FolderOpen,
  Image,
  HelpCircle,
  ListTodo,
  ClipboardCheck,
  MessageSquare,
  Layers,
  FileText,
  Play,
  Maximize2,
  X,
} from "lucide-react";
import {
  backendApi,
  type PrimaryPlannerActivity,
  type PrimaryPlannerActivityStatus,
  type PrimaryStudent,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { adaptApiResource, type PrimaryResource } from "@/lib/primary-resource-adapter";
import { OBSERVATION_RATINGS, RATING_LABELS, ratingTone, type ObservationRating } from "@/lib/primary-roster";
import { primaryStepImage } from "@/lib/primary-step-images";
import { stepDetailFields, type StepDetailField, type StepDetailFieldType } from "@/lib/primary-step-fields";
import { usePrimarySection } from "@/lib/use-primary-section";
import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { cn } from "@/lib/utils";

type StepPresentation = {
  label: string;
  emoji: string;
  subtitle: string;
  learningArea: string;
  gradient: string;
  numberTone: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  focusBorder: string;
  focusRing: string;
  buttonBg: string;
  hoverBorder: string;
};

const STEP_PRESENTATION: Record<string, StepPresentation> = {
  warm_up: { 
    label: "Warm Up", 
    emoji: "☀️", 
    subtitle: "Welcome every learner and get minds and bodies ready.", 
    learningArea: "Classroom Readiness", 
    gradient: "from-purple-50 via-white to-violet-50", 
    numberTone: "bg-purple-100 text-purple-700",
    accentText: "text-purple-600",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-100",
    focusBorder: "focus:border-purple-500",
    focusRing: "focus:ring-purple-500/15",
    buttonBg: "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/20",
    hoverBorder: "hover:border-purple-500/30"
  },
  introduction: { 
    label: "Introduction", 
    emoji: "💡", 
    subtitle: "Introduce today’s idea with simple, joyful conversation.", 
    learningArea: "Concept Building", 
    gradient: "from-blue-50 via-white to-cyan-50", 
    numberTone: "bg-blue-100 text-blue-700",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    focusBorder: "focus:border-blue-500",
    focusRing: "focus:ring-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/20",
    hoverBorder: "hover:border-blue-500/30"
  },
  story_or_rhyme: { 
    label: "Story or Rhyme", 
    emoji: "📖", 
    subtitle: "Build language and imagination through listening together.", 
    learningArea: "Communication", 
    gradient: "from-amber-50 via-white to-yellow-50", 
    numberTone: "bg-amber-100 text-amber-700",
    accentText: "text-amber-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-100",
    focusBorder: "focus:border-amber-500",
    focusRing: "focus:ring-amber-500/15",
    buttonBg: "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/20",
    hoverBorder: "hover:border-amber-500/30"
  },
  picture_talk: { 
    label: "Picture Talk", 
    emoji: "🖼️", 
    subtitle: "Look closely, notice details and share ideas together.", 
    learningArea: "Observation & Language", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  classroom_activity: { 
    label: "Classroom Activity", 
    emoji: "🎨", 
    subtitle: "Learn together through a guided hands-on experience.", 
    learningArea: "Experiential Learning", 
    gradient: "from-pink-50 via-white to-rose-50", 
    numberTone: "bg-pink-100 text-pink-700",
    accentText: "text-pink-600",
    accentBg: "bg-pink-50",
    accentBorder: "border-pink-100",
    focusBorder: "focus:border-pink-500",
    focusRing: "focus:ring-pink-500/15",
    buttonBg: "bg-pink-600 hover:bg-pink-700 hover:shadow-pink-600/20",
    hoverBorder: "hover:border-pink-500/30"
  },
  worksheet: { 
    label: "Worksheet", 
    emoji: "📝", 
    subtitle: "Practise today’s learning with clear, focused tasks.", 
    learningArea: "Early Literacy & Practice", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  assessment: { 
    label: "Assessment", 
    emoji: "✅", 
    subtitle: "Check understanding gently and celebrate progress.", 
    learningArea: "Learning Check", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  movement: { 
    label: "Movement", 
    emoji: "🏃", 
    subtitle: "Move, stretch and learn through active play.", 
    learningArea: "Physical Development", 
    gradient: "from-emerald-50 via-white to-green-50", 
    numberTone: "bg-emerald-100 text-emerald-700",
    accentText: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    focusBorder: "focus:border-emerald-500",
    focusRing: "focus:ring-emerald-500/15",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20",
    hoverBorder: "hover:border-emerald-500/30"
  },
  routine: { 
    label: "Routine", 
    emoji: "🕐", 
    subtitle: "Build confidence through a familiar classroom rhythm.", 
    learningArea: "Independence & Wellbeing", 
    gradient: "from-orange-50 via-white to-amber-50", 
    numberTone: "bg-orange-100 text-orange-700",
    accentText: "text-orange-600",
    accentBg: "bg-orange-50",
    accentBorder: "border-orange-100",
    focusBorder: "focus:border-orange-500",
    focusRing: "focus:ring-orange-500/15",
    buttonBg: "bg-orange-600 hover:bg-orange-700 hover:shadow-orange-600/20",
    hoverBorder: "hover:border-orange-500/30"
  },
  circle_time: { 
    label: "Circle Time", 
    emoji: "🌞", 
    subtitle: "Start with connection, conversation and joy.", 
    learningArea: "Communication", 
    gradient: "from-purple-50 via-white to-violet-50", 
    numberTone: "bg-purple-100 text-purple-700",
    accentText: "text-purple-600",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-100",
    focusBorder: "focus:border-purple-500",
    focusRing: "focus:ring-purple-500/15",
    buttonBg: "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/20",
    hoverBorder: "hover:border-purple-500/30"
  },
  story: { 
    label: "Story Time", 
    emoji: "📖", 
    subtitle: "Listen to a story and learn together.", 
    learningArea: "Communication", 
    gradient: "from-amber-50 via-white to-yellow-50", 
    numberTone: "bg-amber-100 text-amber-700",
    accentText: "text-amber-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-100",
    focusBorder: "focus:border-amber-500",
    focusRing: "focus:ring-amber-500/15",
    buttonBg: "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/20",
    hoverBorder: "hover:border-amber-500/30"
  },
  flashcards: { 
    label: "Flashcards", 
    emoji: "🃏", 
    subtitle: "See it, say it and remember it together.", 
    learningArea: "Vocabulary & Recall", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  craft: { 
    label: "Craft Activity", 
    emoji: "✂️", 
    subtitle: "Get creative and build something meaningful.", 
    learningArea: "Fine Motor Skills", 
    gradient: "from-pink-50 via-white to-rose-50", 
    numberTone: "bg-pink-100 text-pink-700",
    accentText: "text-pink-600",
    accentBg: "bg-pink-50",
    accentBorder: "border-pink-100",
    focusBorder: "focus:border-pink-500",
    focusRing: "focus:ring-pink-500/15",
    buttonBg: "bg-pink-600 hover:bg-pink-700 hover:shadow-pink-600/20",
    hoverBorder: "hover:border-pink-500/30"
  },
  song: { 
    label: "Song & Movement", 
    emoji: "🎵", 
    subtitle: "Sing, move and have fun together.", 
    learningArea: "Physical Development", 
    gradient: "from-purple-50 via-white to-violet-50", 
    numberTone: "bg-purple-100 text-purple-700",
    accentText: "text-purple-600",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-100",
    focusBorder: "focus:border-purple-500",
    focusRing: "focus:ring-purple-500/15",
    buttonBg: "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/20",
    hoverBorder: "hover:border-purple-500/30"
  },
  game: { 
    label: "Game", 
    emoji: "🎲", 
    subtitle: "Practise through playful turn-taking and teamwork.", 
    learningArea: "Social Learning", 
    gradient: "from-emerald-50 via-white to-green-50", 
    numberTone: "bg-emerald-100 text-emerald-700",
    accentText: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    focusBorder: "focus:border-emerald-500",
    focusRing: "focus:ring-emerald-500/15",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20",
    hoverBorder: "hover:border-emerald-500/30"
  },
  reflection: { 
    label: "Reflection", 
    emoji: "💛", 
    subtitle: "Pause, remember and celebrate today’s learning.", 
    learningArea: "Metacognition", 
    gradient: "from-blue-50 via-white to-indigo-50", 
    numberTone: "bg-blue-100 text-blue-700",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    focusBorder: "focus:border-blue-500",
    focusRing: "focus:ring-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/20",
    hoverBorder: "hover:border-blue-500/30"
  },
  parent_note: { 
    label: "Parent Note", 
    emoji: "💌", 
    subtitle: "Share today’s learning and a simple home connection.", 
    learningArea: "Family Partnership", 
    gradient: "from-blue-50 via-white to-indigo-50", 
    numberTone: "bg-blue-100 text-blue-700",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    focusBorder: "focus:border-blue-500",
    focusRing: "focus:ring-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/20",
    hoverBorder: "hover:border-blue-500/30"
  },
  arrival_routine: { 
    label: "Arrival and Routine", 
    emoji: "🎒", 
    subtitle: "Welcome learners and establish a smooth start to the day.", 
    learningArea: "Routine & Independence", 
    gradient: "from-purple-50 via-white to-violet-50", 
    numberTone: "bg-purple-100 text-purple-700",
    accentText: "text-purple-600",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-100",
    focusBorder: "focus:border-purple-500",
    focusRing: "focus:ring-purple-500/15",
    buttonBg: "bg-purple-600 hover:bg-purple-700 hover:shadow-purple-600/20",
    hoverBorder: "hover:border-purple-500/30"
  },
  free_play: { 
    label: "Free Play", 
    emoji: "🧸", 
    subtitle: "Encourage self-directed exploration and social interactions.", 
    learningArea: "Social Development", 
    gradient: "from-emerald-50 via-white to-green-50", 
    numberTone: "bg-emerald-100 text-emerald-700",
    accentText: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    focusBorder: "focus:border-emerald-500",
    focusRing: "focus:ring-emerald-500/15",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20",
    hoverBorder: "hover:border-emerald-500/30"
  },
  story_rhyme_picture_talk: { 
    label: "Story, Rhyme or Picture Talk", 
    emoji: "🗣️", 
    subtitle: "Language development, listening skills, and critical thinking.", 
    learningArea: "Communication & Language", 
    gradient: "from-amber-50 via-white to-yellow-50", 
    numberTone: "bg-amber-100 text-amber-700",
    accentText: "text-amber-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-100",
    focusBorder: "focus:border-amber-500",
    focusRing: "focus:ring-amber-500/15",
    buttonBg: "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/20",
    hoverBorder: "hover:border-amber-500/30"
  },
  concept_exploration: { 
    label: "Concept Exploration", 
    emoji: "🔍", 
    subtitle: "Explore today's core focus with concrete objects or discussion.", 
    learningArea: "Concept Discovery", 
    gradient: "from-blue-50 via-white to-cyan-50", 
    numberTone: "bg-blue-100 text-blue-700",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    focusBorder: "focus:border-blue-500",
    focusRing: "focus:ring-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/20",
    hoverBorder: "hover:border-blue-500/30"
  },
  classroom_activity_game: { 
    label: "Classroom Activity or Game", 
    emoji: "🧩", 
    subtitle: "Active, collaborative learning through play and creation.", 
    learningArea: "Collaboration & Application", 
    gradient: "from-pink-50 via-white to-rose-50", 
    numberTone: "bg-pink-100 text-pink-700",
    accentText: "text-pink-600",
    accentBg: "bg-pink-50",
    accentBorder: "border-pink-100",
    focusBorder: "focus:border-pink-500",
    focusRing: "focus:ring-pink-500/15",
    buttonBg: "bg-pink-600 hover:bg-pink-700 hover:shadow-pink-600/20",
    hoverBorder: "hover:border-pink-500/30"
  },
  practice: { 
    label: "Practice", 
    emoji: "✏️", 
    subtitle: "Reinforce literacy, numeracy or creative skills.", 
    learningArea: "Early Practice", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  numeracy_time: { 
    label: "Numeracy Time", 
    emoji: "🔢", 
    subtitle: "Reinforce numeracy concepts with practice.", 
    learningArea: "Numeracy", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  literacy_time: { 
    label: "Literacy Time", 
    emoji: "🔤", 
    subtitle: "Reinforce reading and writing with practice.", 
    learningArea: "Literacy", 
    gradient: "from-teal-50 via-white to-emerald-50", 
    numberTone: "bg-teal-100 text-teal-700",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    focusBorder: "focus:border-teal-500",
    focusRing: "focus:ring-teal-500/15",
    buttonBg: "bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/20",
    hoverBorder: "hover:border-teal-500/30"
  },
  meal_time: { 
    label: "Meal Time", 
    emoji: "🍲", 
    subtitle: "Enjoy a healthy meal and practice good manners.", 
    learningArea: "Wellbeing & Hygiene", 
    gradient: "from-orange-50 via-white to-amber-50", 
    numberTone: "bg-orange-100 text-orange-700",
    accentText: "text-orange-600",
    accentBg: "bg-orange-50",
    accentBorder: "border-orange-100",
    focusBorder: "focus:border-orange-500",
    focusRing: "focus:ring-orange-500/15",
    buttonBg: "bg-orange-600 hover:bg-orange-700 hover:shadow-orange-600/20",
    hoverBorder: "hover:border-orange-500/30"
  },
  creative_time: { 
    label: "Creative Time", 
    emoji: "🎨", 
    subtitle: "Express creativity and experiment with crafts.", 
    learningArea: "Art & Self Expression", 
    gradient: "from-pink-50 via-white to-rose-50", 
    numberTone: "bg-pink-100 text-pink-700",
    accentText: "text-pink-600",
    accentBg: "bg-pink-50",
    accentBorder: "border-pink-100",
    focusBorder: "focus:border-pink-500",
    focusRing: "focus:ring-pink-500/15",
    buttonBg: "bg-pink-600 hover:bg-pink-700 hover:shadow-pink-600/20",
    hoverBorder: "hover:border-pink-500/30"
  },
  outdoor_play: { 
    label: "Outdoor Play", 
    emoji: "🛝", 
    subtitle: "Play outdoors and coordinate body movements.", 
    learningArea: "Physical Development", 
    gradient: "from-emerald-50 via-white to-green-50", 
    numberTone: "bg-emerald-100 text-emerald-700",
    accentText: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-100",
    focusBorder: "focus:border-emerald-500",
    focusRing: "focus:ring-emerald-500/15",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20",
    hoverBorder: "hover:border-emerald-500/30"
  },
  goodbye: { 
    label: "Goodbye Circle", 
    emoji: "👋", 
    subtitle: "Conclude the day, reflect on learning, and prepare for home.", 
    learningArea: "Social & Emotional Well-being", 
    gradient: "from-blue-50 via-white to-indigo-50", 
    numberTone: "bg-blue-100 text-blue-700",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    focusBorder: "focus:border-blue-500",
    focusRing: "focus:ring-blue-500/15",
    buttonBg: "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/20",
    hoverBorder: "hover:border-blue-500/30"
  },
};

const DEFAULT_PRESENTATION: StepPresentation = {
  label: "Classroom Activity",
  emoji: "✨",
  subtitle: "Guide learners through today’s classroom experience.",
  learningArea: "Holistic Development",
  gradient: "from-violet-50 via-white to-blue-50",
  numberTone: "bg-violet-100 text-violet-700",
  accentText: "text-violet-600",
  accentBg: "bg-violet-50",
  accentBorder: "border-violet-100",
  focusBorder: "focus:border-violet-500",
  focusRing: "focus:ring-violet-500/15",
  buttonBg: "bg-violet-600 hover:bg-violet-700 hover:shadow-violet-600/20",
  hoverBorder: "hover:border-violet-500/30"
};

function presentationFor(type: string) {
  return STEP_PRESENTATION[type] || DEFAULT_PRESENTATION;
}

function activityUrl(activity: PrimaryPlannerActivity, sectionId?: string) {
  const params = new URLSearchParams({ date: activity.date });
  if (sectionId) params.set("section_id", sectionId);
  return `/primary/today/activity/${activity.id}?${params.toString()}`;
}

function resourceEmoji(resource: PrimaryResource) {
  const category = resource.category.toLowerCase();
  if (category.includes("worksheet") || category.includes("tracing")) return "📝";
  if (category.includes("flashcard") || category.includes("vocabulary")) return "🃏";
  if (category.includes("story") || category.includes("book")) return "📖";
  if (category.includes("song") || category.includes("rhyme")) return "🎵";
  if (category.includes("craft")) return "✂️";
  if (category.includes("assessment")) return "✅";
  return "📚";
}

function contextString(activity: PrimaryPlannerActivity, key: string, fallback = "—") {
  const value = activity.context[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function BlockDetailsSection({ activity, resourceMap }: { activity: PrimaryPlannerActivity; resourceMap: Map<string, PrimaryResource> }) {
  const presentation = presentationFor(activity.activity_type);
  const rawDetails = activity.context.details;
  const details = rawDetails && typeof rawDetails === "object" ? (rawDetails as Record<string, unknown>) : undefined;

  const fields = useMemo(() => {
    if (!details) return [];
    
    const predefined = stepDetailFields(activity.activity_type);
    const predefinedKeys = new Set(predefined.map((f) => f.key));
    const list: StepDetailField[] = [...predefined];
    
    const toTitleCase = (str: string) => {
      if (str.toLowerCase() === "youtube_url") return "YouTube Video Link";
      return str
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    };

    const inferType = (key: string, val: unknown): StepDetailFieldType => {
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === "string" && val[0].length === 36 && resourceMap.has(val[0])) {
          return "resource_multi";
        }
        return "list";
      }
      if (typeof val === "string") {
        const lowerKey = key.toLowerCase();
        if (/^https?:\/\//.test(val)) {
          if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(val) || lowerKey.includes("image") || lowerKey.includes("cover")) {
            return "image";
          }
          return "text";
        }
        if (val.length === 36 && resourceMap.has(val)) {
          return "resource";
        }
        if (val.length > 60 || val.includes("\n")) {
          return "textarea";
        }
      }
      return "text";
    };

    for (const key of Object.keys(details)) {
      if (predefinedKeys.has(key)) continue;
      const val = details[key];
      if (val === null || val === undefined || (typeof val === "string" && !val.trim())) continue;
      if (Array.isArray(val) && val.length === 0) continue;
      
      list.push({
        key,
        label: toTitleCase(key),
        type: inferType(key, val),
      });
    }
    
    return list;
  }, [details, activity.activity_type, resourceMap]);

  const filledFields = details
     ? fields.filter((field) => {
        const value = details[field.key];
        if (value === null || value === undefined) return false;
        if (Array.isArray(value)) return value.length > 0;
        return String(value).trim() !== "";
      })
    : [];

  if (filledFields.length === 0) return null;

  const fieldLabel = (field: StepDetailField) => (
    <small className={cn("font-black uppercase tracking-wider", presentation.accentText)}>{field.label}</small>
  );

  const textNode = (field: StepDetailField, value: string) => (
    /^https?:\/\//.test(value) ? (
      <a href={value} target="_blank" rel="noreferrer" className={cn("text-xs font-bold underline underline-offset-2 break-all", presentation.accentText)}>{value}</a>
    ) : (
      <p className="text-xs font-semibold leading-5 text-[#4f5680] whitespace-pre-line">{value}</p>
    )
  );

  return (
    <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
      <header>
        <p className={cn("text-[10px] font-black uppercase tracking-[0.14em]", presentation.accentText)}>Block Details</p>
        <h2 className="mt-1 text-xl font-black">What was planned for this block</h2>
      </header>
      <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {filledFields.map((field) => {
          const value = details![field.key];
          if (field.type === "image") {
            const src = typeof value === "string" ? value : "";
            return (
              <div key={field.key} className="sm:col-span-2">
                {fieldLabel(field)}
                <img src={src} alt={field.label} className="mt-2 max-h-64 w-full rounded-2xl border border-[#ecebf7] object-cover" />
              </div>
            );
          }
          if (field.type === "resource" || field.type === "resource_multi") {
            const ids = field.type === "resource_multi" && Array.isArray(value)
              ? value.filter((item): item is string => typeof item === "string")
              : typeof value === "string" && value ? [value] : [];
            if (ids.length === 0) return null;
            return (
              <div key={field.key} className="sm:col-span-2">
                {fieldLabel(field)}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {ids.map((id) => {
                    const resource = resourceMap.get(id);
                    if (!resource) return <div key={id} className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2 text-[11px] font-bold text-amber-700">A linked printable was removed from the catalog — ask your admin to re-link it.</div>;
                    return (
                      <div key={id} className={cn("flex items-center gap-3 rounded-xl border border-[#ecebf7] p-3 bg-opacity-30", presentation.accentBg)}>
                        {resource.thumbnailUrl ? (
                          <img src={resource.thumbnailUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-white text-2xl shadow-sm">{resourceEmoji(resource)}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <small className={cn("font-black uppercase tracking-wider", presentation.accentText)}>{resource.category}</small>
                          <h4 className="truncate text-xs font-black">{resource.title}</h4>
                        </div>
                        <a href={resource.fileUrl} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-white transition", presentation.buttonBg)}><ExternalLink className="h-3 w-3" /> Open</a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          if (field.type === "list") {
            const items = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
            if (items.length === 0) return null;
            return (
              <div key={field.key} className="sm:col-span-2">
                {fieldLabel(field)}
                <div className="mt-2 flex flex-wrap gap-2">
                  {items.map((item, index) => (
                    <span key={`${item}-${index}`} className={cn("rounded-full border px-3 py-1.5 text-[11px] font-bold transition", presentation.accentBorder, presentation.accentBg, presentation.accentText)}>{item}</span>
                  ))}
                </div>
              </div>
            );
          }
          const strValue = String(value);
          if (!strValue.trim()) return null;
          const fullWidth = field.type === "textarea";
          return (
            <div key={field.key} className={fullWidth ? "sm:col-span-2" : ""}>
              {fieldLabel(field)}
              <div className="mt-1.5">{textNode(field, strValue)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const STEP_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500"
];

function getInstructionStepImage(text: string, index: number): string {
  const lower = text.toLowerCase();
  if (lower.includes("rhyme") || lower.includes("song") || lower.includes("sing")) {
    return "/assets/primary/steps/song.webp";
  }
  if (lower.includes("routine") || lower.includes("calendar") || lower.includes("circle time") || lower.includes("board")) {
    return "/assets/primary/steps/routine.webp";
  }
  if (lower.includes("hygiene") || lower.includes("nails") || lower.includes("hands")) {
    if (lower.includes("attendance")) {
      return "/assets/primary/steps/classroom-activity.webp";
    }
    return "/assets/primary/steps/circle-time.webp";
  }
  if (lower.includes("weather") || lower.includes("calendar")) {
    return "/assets/primary/steps/warm-up.webp";
  }
  if (lower.includes("attendance") || lower.includes("names")) {
    return "/assets/primary/steps/classroom-activity.webp";
  }
  if (lower.includes("introduce") || lower.includes("topic")) {
    return "/assets/primary/steps/introduction.webp";
  }
  if (lower.includes("encourage") || lower.includes("touch") || lower.includes("repeat") || lower.includes("closing") || lower.includes("bye")) {
    return "/assets/primary/steps/movement.webp";
  }
  
  const fallbacks = [
    "/assets/primary/steps/song.webp",
    "/assets/primary/steps/routine.webp",
    "/assets/primary/steps/circle-time.webp",
    "/assets/primary/steps/warm-up.webp",
    "/assets/primary/steps/classroom-activity.webp",
    "/assets/primary/steps/song.webp",
    "/assets/primary/steps/introduction.webp",
    "/assets/primary/steps/movement.webp"
  ];
  return fallbacks[index % fallbacks.length];
}

function getMaterialImage(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("children") || lower.includes("kids") || lower.includes("student")) {
    return "/assets/primary/library/lib_rhymes.webp";
  }
  if (lower.includes("calendar") || lower.includes("weather") || lower.includes("date")) {
    return "/assets/primary/library/lib_calendar_activities.webp";
  }
  if (lower.includes("music") || lower.includes("song") || lower.includes("sing")) {
    return "/assets/primary/steps/song.webp";
  }
  if (lower.includes("sanitizer") || lower.includes("soap") || lower.includes("hygiene") || lower.includes("wash")) {
    return "/assets/primary/library/lib_sanitizer.webp";
  }
  if (lower.includes("flashcard") || lower.includes("card")) {
    return "/assets/primary/library/lib_flashcards.webp";
  }
  if (lower.includes("book") || lower.includes("story")) {
    return "/assets/primary/library/lib_story_cards.webp";
  }
  if (lower.includes("crayon") || lower.includes("pencil") || lower.includes("paint") || lower.includes("color")) {
    return "/assets/primary/library/lib_creative_corner.webp";
  }
  return "/assets/primary/library/lib_circle_time_prompts.webp";
}

function formattedTime(activity: PrimaryPlannerActivity) {
  if (!activity.start_time) return "Flexible";
  const [hours, minutes] = activity.start_time.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export default function PrimaryActivityDetailPage({ activityId }: { activityId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { sectionId: storedSectionId } = usePrimarySection();
  const { context: teachingContext } = usePrimaryTeachingContext();
  const sectionId = searchParams.get("section_id") || storedSectionId || undefined;
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(10);
  const [startTime, setStartTime] = useState("");
  const [activityType, setActivityType] = useState("");
  const [instructionsText, setInstructionsText] = useState("");
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [observation, setObservation] = useState("");
  const [resourceModal, setResourceModal] = useState<{ title: string; fileUrl: string; thumbnailUrl?: string; fileType: string } | null>(null);

  // Cross-origin safe download — fetch the file as a blob then trigger save-as
  const downloadResource = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab so the browser handles it
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const activityQuery = useQuery({
    queryKey: ["primary-planner-activity", activityId],
    queryFn: () => backendApi.plannerActivity(activityId),
  });
  const activity = activityQuery.data;

  useEffect(() => {
    // Activity links are often clicked low down the schedule page. Always
    // begin the dedicated teaching workspace at its hero, like a new screen.
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activityId]);

  useEffect(() => {
    if (!activity) return;
    const instructionLines = Array.isArray(activity.context.instructions)
      ? activity.context.instructions.filter((line): line is string => typeof line === "string")
      : [];
    setTitle(activity.title);
    setDuration(activity.duration_minutes || 10);
    setStartTime(activity.start_time?.slice(0, 5) || "");
    setActivityType(activity.activity_type);
    setInstructionsText(instructionLines.join("\n"));
    setResourceIds(activity.resource_ids || []);
    setNotes(localStorage.getItem(`draft-notes-${activity.id}-${activity.date}`) ?? activity.notes ?? "");
    setObservation(localStorage.getItem(`draft-obs-${activity.id}-${activity.date}`) ?? activity.observation ?? "");
  }, [activity]);

  const dayQuery = useQuery({
    queryKey: ["primary-today-workspace", activity?.date, sectionId],
    queryFn: () => backendApi.getTodayWorkspace(activity!.date, sectionId),
    enabled: Boolean(activity),
  });
  const dayActivities = dayQuery.data?.planner_activities || [];
  const currentIndex = dayActivities.findIndex((item) => item.id === activityId);
  const previousActivity = currentIndex > 0 ? dayActivities[currentIndex - 1] : undefined;
  const nextActivity = currentIndex >= 0 ? dayActivities[currentIndex + 1] : undefined;

  const requiredIds = useMemo(() => {
    return Array.isArray(activity?.context?.required_resource_ids)
      ? activity.context.required_resource_ids
      : activity?.resource_ids || [];
  }, [activity]);

  const optionalIds = useMemo(() => {
    return Array.isArray(activity?.context?.optional_resource_ids)
      ? activity.context.optional_resource_ids
      : [];
  }, [activity]);

  const detailResourceIds = useMemo(() => {
    const details = activity?.context?.details;
    if (!details || typeof details !== "object") return [] as string[];
    const ids: string[] = [];
    for (const field of stepDetailFields(activity!.activity_type)) {
      if (field.type !== "resource" && field.type !== "resource_multi") continue;
      const value = (details as Record<string, unknown>)[field.key];
      if (typeof value === "string" && value.trim()) ids.push(value);
      else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string" && item.trim()) ids.push(item);
        });
      }
    }
    return ids;
  }, [activity]);

  const allResourceIds = useMemo(() => {
    const set = new Set([...requiredIds, ...optionalIds, ...detailResourceIds]);
    return Array.from(set);
  }, [requiredIds, optionalIds, detailResourceIds]);

  const linkedResourceQueries = useQueries({
    queries: allResourceIds.map((id) => ({
      queryKey: ["primary-resource", id],
      queryFn: async () => {
        try {
          return adaptApiResource(await backendApi.primaryResource(id));
        } catch {
          return null;
        }
      },
      staleTime: 60_000,
      retry: 0,
    })),
  });

  const resourceMap = useMemo(() => {
    const map = new Map<string, PrimaryResource>();
    linkedResourceQueries.forEach((q) => {
      if (q.data) map.set(q.data.id, q.data);
    });
    return map;
  }, [linkedResourceQueries]);

  const requiredResources = useMemo(() => {
    return requiredIds.map((id) => resourceMap.get(id)).filter((r): r is PrimaryResource => Boolean(r));
  }, [requiredIds, resourceMap]);

  const optionalResources = useMemo(() => {
    return optionalIds.map((id) => resourceMap.get(id)).filter((r): r is PrimaryResource => Boolean(r));
  }, [optionalIds, resourceMap]);

  const missingResourceCount = useMemo(() => {
    if (linkedResourceQueries.some((q) => q.isPending)) return 0;
    const missing = allResourceIds.filter((id) => !resourceMap.has(id));
    return missing.length;
  }, [allResourceIds, resourceMap, linkedResourceQueries]);

  const contextSubject = activity ? contextString(activity, "subject", "") : "";
  const resourceCandidatesQuery = useQuery({
    queryKey: ["primary-resources-candidates", contextSubject],
    queryFn: () => backendApi.primaryResources({ subject: contextSubject || undefined, page_size: 30 }),
    enabled: Boolean(activity),
    staleTime: 60_000,
  });
  const resourceCandidates = useMemo(
    () => (resourceCandidatesQuery.data?.items || []).map(adaptApiResource),
    [resourceCandidatesQuery.data],
  );

  const students = useQuery({
    queryKey: ["primary-students", sectionId, false],
    queryFn: () => backendApi.primaryStudents({ sectionId }),
    enabled: Boolean(sectionId),
  });
  const observations = useQuery({
    queryKey: ["primary-observations", activity?.teaching_day_id, activityId],
    queryFn: () => backendApi.primaryObservations({
      start: activity!.date,
      end: activity!.date,
      teachingDayId: activity!.teaching_day_id,
    }),
    enabled: Boolean(sectionId && activity),
  });
  const ratingByStudent = useMemo(() => {
    const result: Record<string, ObservationRating> = {};
    for (const item of observations.data || []) {
      if (item.planner_activity_id === activityId) result[item.student_id] = item.rating;
    }
    return result;
  }, [activityId, observations.data]);
  const rateChild = useMutation({
    mutationFn: ({ studentId, rating }: { studentId: string; rating: ObservationRating }) =>
      backendApi.upsertPrimaryObservation({
        student_id: studentId,
        teaching_day_id: activity!.teaching_day_id,
        planner_activity_id: activityId,
        skill: teachingContext.skill || null,
        rating,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["primary-observations"] });
      void queryClient.invalidateQueries({ queryKey: ["primary-student-profile"] });
      notify("Child observation saved");
    },
    onError: (error) => notify(getErrorMessage(error, "Could not save that observation.")),
  });

  const refreshActivity = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["primary-planner-activity", activityId] }),
      queryClient.invalidateQueries({ queryKey: ["primary-today-workspace"] }),
      queryClient.invalidateQueries({ queryKey: ["primary-planner-activities"] }),
    ]);
  };

  const saveMetadata = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activity) return;
    setSavingMetadata(true);
    try {
      await backendApi.updatePlannerActivity(activity.id, {
        title: title.trim(),
        duration_minutes: duration,
        start_time: startTime || null,
        activity_type: activityType.trim(),
        resource_ids: resourceIds,
        instructions: instructionsText.split("\n").map((line) => line.trim()).filter(Boolean),
      });
      setEditing(false);
      await refreshActivity();
      notify("Activity updated");
    } catch (error) {
      notify(getErrorMessage(error, "Could not update this activity."));
    } finally {
      setSavingMetadata(false);
    }
  };

  const saveNotes = async () => {
    if (!activity) return;
    setSavingNotes(true);
    try {
      await backendApi.updatePlannerActivity(activity.id, { notes: notes || undefined, observation: observation || undefined });
      localStorage.removeItem(`draft-notes-${activity.id}-${activity.date}`);
      localStorage.removeItem(`draft-obs-${activity.id}-${activity.date}`);
      await refreshActivity();
      notify("Notes and observations saved");
    } catch (error) {
      notify(getErrorMessage(error, "Could not save your notes."));
    } finally {
      setSavingNotes(false);
    }
  };

  const updateStatus = async (status: PrimaryPlannerActivityStatus) => {
    if (!activity) return;
    setSavingStatus(true);
    try {
      await backendApi.updatePlannerActivity(activity.id, { status });
      await refreshActivity();
      notify(`Activity marked as ${status}`);
      if (status === "skipped") {
        if (nextActivity) {
          router.push(activityUrl(nextActivity, sectionId));
        } else {
          router.push(`/primary/today?date=${activity.date}${sectionId ? `&section_id=${sectionId}` : ""}`);
        }
      }
    } catch (error) {
      notify(getErrorMessage(error, "Could not update the activity status."));
    } finally {
      setSavingStatus(false);
    }
  };

  const rescheduleActivity = async () => {
    if (!activity || !rescheduleDate) return;
    setSavingStatus(true);
    try {
      // The current backend records a reschedule intent on the activity. It
      // does not yet support moving an activity between teaching-day rows.
      await backendApi.updatePlannerActivity(activity.id, {
        status: "rescheduled",
        rescheduled_from_date: activity.date,
      });
      await refreshActivity();
      notify(`Activity marked to reschedule for ${rescheduleDate}`);
      setRescheduleDate("");
    } catch (error) {
      notify(getErrorMessage(error, "Could not reschedule this activity."));
    } finally {
      setSavingStatus(false);
    }
  };

  const deleteActivity = async () => {
    if (!activity || !window.confirm(`Delete “${activity.title}”? This cannot be undone.`)) return;
    setSavingStatus(true);
    try {
      await backendApi.deletePlannerActivity(activity.id);
      await queryClient.invalidateQueries({ queryKey: ["primary-today-workspace"] });
      router.replace(`/primary/today?date=${activity.date}`);
    } catch (error) {
      notify(getErrorMessage(error, "Could not delete this activity."));
      setSavingStatus(false);
    }
  };

  if (activityQuery.isLoading) {
    return <div className="grid min-h-[70vh] place-items-center"><div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-sm font-bold text-[#29317c] shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /> Preparing the activity…</div></div>;
  }
  if (!activity || activityQuery.isError) {
    return <div className="mx-auto max-w-xl py-20 text-center"><div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm"><h1 className="text-2xl font-black text-[#171747]">Activity not found</h1><p className="mt-2 text-sm text-slate-500">This activity may have been removed or is no longer available.</p><Link href="/primary/today" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white"><ArrowLeft className="h-4 w-4" /> Back to Today’s Plan</Link></div></div>;
  }

  const presentation = presentationFor(activity.activity_type);
  const stepArt = primaryStepImage(activity.activity_type);
  const instructions = Array.isArray(activity.context.instructions)
    ? activity.context.instructions.filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
    : [];
  const theme = contextString(activity, "theme", teachingContext.theme || "Classroom theme");
  const topic = contextString(activity, "topic", teachingContext.topic || theme);
  const level = contextString(activity, "level", teachingContext.level || "Primary");
  const subject = contextString(activity, "subject", teachingContext.subject || presentation.learningArea);
  const rawDetails = activity.context.details;
  const details = rawDetails && typeof rawDetails === "object" ? (rawDetails as Record<string, unknown>) : undefined;

  const conversationText = (details?.theme_conversation as string) || (details?.story_text as string) || (details?.corner_instructions as string) || "";
  const conversationLines = conversationText.split("\n").map(l => l.trim()).filter(Boolean);
  const questionsList = conversationLines.filter(l => l.startsWith("•") || l.startsWith("-") || l.startsWith("*") || l.endsWith("?"));
  const mainInstruction = conversationLines.filter(l => !questionsList.includes(l)).join("\n");

  const rawVocab = activity.context.vocabulary_list || details?.vocabulary_list;
  const vocab = Array.isArray(rawVocab) && rawVocab.length > 0 ? rawVocab as string[] : [];

  const videoUrl = (details?.youtube_url as string) || "";

  const themeImgSrc = (details?.theme_image as string) || (details?.story_cover_image as string) || (details?.reference_image as string) || "";

  const hasRightColumnContent = Boolean(
    conversationText.trim() ||
    allResourceIds.length > 0 ||
    themeImgSrc.trim() ||
    vocab.length > 0 ||
    videoUrl.trim()
  );

  const renderDisplayMode = () => {
    interface DashboardCard {
      element: React.ReactNode;
      height: number;
    }
    const activeCards: DashboardCard[] = [];

    // 1. Teach this step
    const rawMaterials = details?.materials_required || details?.props || details?.manipulatives_required;
    const materials = Array.isArray(rawMaterials)
      ? rawMaterials.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [];

    const teachStepHeight = 150 + (instructions.length * 60) + (details?.teacher_notes ? 80 : 0);
    activeCards.push({
      element: (
        <section key="teach-step" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
          <header className="flex items-center justify-between gap-4 border-b border-slate-100/60 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 text-sm">
                <ListTodo className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#171747]">Teach this step</h2>
                <p className="text-[10px] font-semibold text-violet-600 mt-0.5">Activity guide (Teacher Speech)</p>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ecebf7] bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition">
              <Edit3 className="h-3.5 w-3.5" /> Edit
            </button>
          </header>

          <div className="mt-5 space-y-5">
            {instructions.length > 0 ? (
              instructions.map((text, index) => {
                const stepColor = STEP_COLORS[index % STEP_COLORS.length];
                return (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b border-dashed border-slate-100 last:border-0 last:pb-0">
                    {/* Step number */}
                    <span className={cn("grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-white shrink-0 shadow-2xs", stepColor)}>
                      {index + 1}
                    </span>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-relaxed text-slate-700/90">{text}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-[#e8e7fb] rounded-2xl bg-white">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-sm font-black text-[#171747]">No steps added yet</p>
                <p className="text-xs text-slate-400 mt-1">Edit this activity to add teaching steps.</p>
                <button onClick={() => setEditing(true)} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-black text-blue-500 shadow-sm ring-1 ring-[#e8e7fb]">
                  Add steps
                </button>
              </div>
            )}
          </div>

          {/* Teacher tip banner */}
          {(() => {
            const tipText = (details?.teacher_notes as string) || (details?.observation_notes as string) || "";
            if (!tipText.trim()) return null;
            return (
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f8f6ff] p-4 border border-[#e8e0f8]/30 shadow-2xs">
                <Lightbulb className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-violet-600">Teacher tip</h4>
                  <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">{tipText}</p>
                </div>
              </div>
            );
          })()}
        </section>
      ),
      height: teachStepHeight,
    });

    // 2. Key items list
    if (materials.length > 0) {
      activeCards.push({
        element: (
          <section key="materials" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5 border-b border-slate-100/60 pb-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600 text-sm">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-black text-[#171747]">Key items list</h2>
            </header>
            <div className="flex flex-wrap gap-2 mt-4">
              {materials.map((mat, idx) => (
                <span key={idx} className="rounded-lg border border-emerald-100 bg-[#f4fbf7] px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs transition hover:bg-[#eafbf2] cursor-default">{mat}</span>
              ))}
            </div>
          </section>
        ),
        height: 120,
      });
    }

    // 3. Theme Conversation
    if (conversationText.trim()) {
      const convHeight = 120 + (questionsList.length * 20);
      activeCards.push({
        element: (
          <section key="conversation" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5 mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-50 text-violet-600 text-sm">
                <MessageSquare className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-black text-[#171747]">Theme Conversation</h2>
            </header>
            
            {mainInstruction && (
              <p className="text-xs font-semibold leading-relaxed text-slate-600 whitespace-pre-line mb-4">{mainInstruction}</p>
            )}

            <div className="p-4 rounded-2xl bg-[#f8f7ff] border border-[#f0edff] flex items-center justify-between gap-4 shadow-2xs">
              <div className="min-w-0 flex-1">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-violet-700">Questions & Prompts</h4>
                <ul className="mt-2.5 space-y-2 text-xs font-semibold text-slate-600 list-disc pl-5 leading-relaxed">
                  {questionsList.map((q, idx) => {
                    const cleanQ = q.replace(/^([•\-*]\s*)/, "");
                    return <li key={idx} className="marker:text-violet-500">{cleanQ}</li>;
                  })}
                </ul>
              </div>
              <img src="/assets/illustrations/thinking_boy.webp" alt="Thinking Boy" className="w-20 h-24 object-contain shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]" />
            </div>
          </section>
        ),
        height: convHeight,
      });
    }

    // 4. Attached resources
    if (allResourceIds.length > 0) {
      const hasThumbs = allResourceIds.some(id => {
        const res = resourceMap.get(id);
        return !!(res?.thumbnailUrl);
      });
      const itemHeight = hasThumbs ? 170 : 110;
      const resHeight = 100 + (Math.ceil(allResourceIds.length / 3) * itemHeight);

      activeCards.push({
        element: (
          <section key="resources" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-50 text-teal-600 text-sm">
                <BookOpen className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-black text-[#171747]">Attached resources</h2>
              <span className="ml-auto text-[10px] font-bold text-slate-400">Click to preview</span>
            </header>
            
            <div className="grid grid-cols-3 gap-3">
              {allResourceIds.map(id => {
                const res = resourceMap.get(id);
                if (!res) return null;
                
                const thumbnail = res.thumbnailUrl || "";
                const isPdf = res.fileType?.toLowerCase().includes("pdf") || res.fileUrl?.toLowerCase().endsWith(".pdf");

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setResourceModal({ title: res.title, fileUrl: res.fileUrl, thumbnailUrl: res.thumbnailUrl, fileType: res.fileType })}
                    className={cn("border border-slate-100 rounded-2xl bg-white p-2.5 shadow-2xs flex flex-col items-center justify-between text-center hover:border-teal-300 hover:shadow-sm hover:-translate-y-0.5 transition duration-200 cursor-pointer group w-full", thumbnail ? "min-h-[170px]" : "min-h-[110px]")}
                  >
                    {thumbnail ? (
                      <div className="w-full h-24 bg-slate-50/50 rounded-xl flex items-center justify-center p-1 overflow-hidden border border-slate-50 group-hover:border-teal-100 transition">
                        <img src={thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-16 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-teal-50/30 transition">
                        {isPdf ? <FileText className="h-6 w-6 text-slate-300 group-hover:text-teal-400 transition" /> : <BookOpen className="h-6 w-6 text-slate-300 group-hover:text-teal-400 transition" />}
                      </div>
                    )}
                    <h4 className="text-[10px] font-black text-slate-700 leading-tight mt-2 line-clamp-2 w-full text-left">{res.title}</h4>
                    <div className="mt-2 w-full py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-teal-600 bg-teal-50/0 group-hover:bg-teal-50 flex items-center justify-center gap-1 transition">
                      Preview
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ),
        height: resHeight,
      });
    }

    // 5. Theme Image
    if (themeImgSrc.trim()) {
      activeCards.push({
        element: (
          <section key="theme-image" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5 mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-50 text-amber-600 text-sm">
                <Image className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-black text-[#171747]">Theme Image</h2>
            </header>
            <div className="w-full rounded-2xl overflow-hidden border border-slate-100/50 shadow-2xs mt-2">
              <img 
                src={themeImgSrc} 
                alt="Theme Visual Reference" 
                className="w-full h-auto object-cover" 
              />
            </div>
          </section>
        ),
        height: 250,
      });
    }

    // 6. Vocabulary list
    if (vocab.length > 0) {
      activeCards.push({
        element: (
          <section key="vocabulary" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5 mb-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600 text-sm">
                <FileText className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-black text-[#171747]">Vocabulary List</h2>
            </header>
            <div className="flex flex-wrap gap-2 mt-2">
              {vocab.map((word, idx) => (
                <span key={idx} className="rounded-lg border border-blue-100 bg-[#f4f8ff] px-3 py-1.5 text-xs font-semibold text-[#3b82f6] shadow-2xs transition hover:bg-[#eaf2ff] cursor-default">{word}</span>
              ))}
            </div>
          </section>
        ),
        height: 100,
      });
    }

    // 7. Video resource
    if (videoUrl.trim()) {
      const ytId = getYouTubeVideoId(videoUrl);
      activeCards.push({
        element: (
          <section key="video" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5 mb-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-600 text-sm">
                <Play className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-black text-[#171747]">Video resource</h2>
            </header>
            
            <div className="space-y-3">
              {ytId ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-100/50 shadow-2xs">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title="YouTube video player"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-3 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-center justify-between gap-3">
                  <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-2xs flex items-center justify-center">
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center"><Play className="h-6 w-6 text-slate-300" /></div>
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <span className="h-7 w-7 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                        <Play className="h-3 w-3 text-[#171747] fill-current ml-0.5" />
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-[#171747] leading-snug line-clamp-2">
                      {activity.title}
                    </h4>
                  </div>
                  <a href={videoUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 shrink-0 shadow-2xs transition">
                    Watch Video <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 px-1 mt-2">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-[#171747] leading-snug line-clamp-2">
                    {(() => {
                      const isMyBody = activity.title?.toLowerCase().includes("body") || topic.toLowerCase().includes("body");
                      return isMyBody 
                        ? "My Body Song for Kids | Body Parts Song | Nursery Rhymes" 
                        : `${activity.title} Song | Nursery Rhymes & Activities`;
                    })()}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">YouTube player · Play inline or fullscreen</p>
                </div>
              </div>
            </div>
          </section>
        ),
        height: ytId ? 350 : 150,
      });
    }

    // 8. Observations & notes
    if (!nextActivity) {
      activeCards.push({
        element: (
          <section key="observations" className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
            <header className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black shadow-xs bg-[#fff1f2] text-rose-500">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Classroom observations &amp; Teacher notes</p>
                <h2 className="text-sm font-black text-[#171747]">Write observations &amp; notes</h2>
              </div>
            </header>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-xs font-black text-slate-700 flex flex-col gap-1.5">
                <span className="flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5 text-rose-500" /> Classroom observations</span>
                <textarea
                  value={observation}
                  onChange={(event) => {
                    setObservation(event.target.value);
                    localStorage.setItem(`draft-obs-${activity.id}-${activity.date}`, event.target.value);
                  }}
                  rows={4}
                  placeholder="What did you notice about learning?"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-medium leading-5 outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-500/10 transition duration-150 resize-none"
                />
              </label>
              <label className="text-xs font-black text-slate-700 flex flex-col gap-1.5">
                <span className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Teacher notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => {
                    setNotes(event.target.value);
                    localStorage.setItem(`draft-notes-${activity.id}-${activity.date}`, event.target.value);
                  }}
                  rows={4}
                  placeholder="What should you remember for next time?"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-medium leading-5 outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-500/10 transition duration-150 resize-none"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={saveNotes} disabled={savingNotes} className="inline-flex items-center gap-2 rounded-xl bg-[#171747] px-5 py-3 text-xs font-black text-white shadow-xs hover:bg-[#111136] hover:-translate-y-0.5 transition duration-150 disabled:opacity-50 disabled:translate-y-0">
                <Save className="h-3.5 w-3.5" /> {savingNotes ? "Saving..." : "Save notes & observations"}
              </button>
            </div>
          </section>
        ),
        height: 220,
      });
    }

    const fallbackSection = (
      <div className="hidden" key="fallback">
        <BlockDetailsSection activity={activity} resourceMap={resourceMap} />
      </div>
    );

    const paginationRow = (
      <div className="grid gap-3 sm:grid-cols-2 w-full mt-4" key="pagination">
        {/* Previous Activity */}
        {previousActivity ? (
          <Link
            href={activityUrl(previousActivity, sectionId)}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-[#e8e7fb] bg-white hover:bg-[#faf9ff] hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-sm transition duration-200"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-200 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition duration-200">
              <ArrowLeft className="h-5 w-5 transition duration-200 group-hover:-translate-x-0.5" />
            </span>
            <div className="min-w-0 flex-1">
              <small className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Previous activity</small>
              <h4 className="text-sm font-black text-[#171747] truncate mt-0.5">{previousActivity.title}</h4>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-dashed border-slate-200">
              <ArrowLeft className="h-5 w-5 opacity-40" />
            </span>
            <div className="min-w-0 flex-1">
              <small className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Previous activity</small>
              <h4 className="text-sm font-bold italic truncate mt-0.5">First activity of today</h4>
            </div>
          </div>
        )}

        {/* Next Activity */}
        {nextActivity ? (
          <Link
            href={activityUrl(nextActivity, sectionId)}
            className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50/60 hover:border-blue-300 hover:-translate-y-1 hover:shadow-sm transition duration-200"
          >
            <div className="min-w-0 flex-1">
              <small className="block text-[9px] font-black uppercase tracking-wider text-blue-500">Next activity</small>
              <h4 className="text-sm font-black text-[#171747] truncate mt-0.5">{nextActivity.title}</h4>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-blue-100 text-blue-500 transition duration-200 group-hover:bg-blue-500 group-hover:text-white">
              <ArrowRight className="h-5 w-5 transition duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <Link
            href={`/primary/today?date=${activity.date}${sectionId ? `&section_id=${sectionId}` : ""}`}
            className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50/60 hover:border-blue-300 transition duration-200"
          >
            <div className="min-w-0 flex-1">
              <small className="block text-[9px] font-black uppercase tracking-wider text-blue-500">Next activity</small>
              <h4 className="text-sm font-black text-[#171747] truncate mt-0.5">End of today&apos;s plan · Return Home</h4>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-blue-100 text-blue-500 transition duration-200 group-hover:bg-blue-500 group-hover:text-white">
              <ArrowRight className="h-5 w-5 transition duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}
      </div>
    );

    if (!hasRightColumnContent) {
      return (
        <div className="space-y-6">
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            {activeCards.map((card, idx) => <div key={idx}>{card.element}</div>)}
            {fallbackSection}
          </div>
          {paginationRow}
        </div>
      );
    }

    // Always anchor the first card (Teach Step) in Column A.
    // Then greedily fill remaining cards starting from Column B so gaps are always filled.
    const [anchorCard, ...restCards] = activeCards;

    const colA: React.ReactNode[] = anchorCard ? [anchorCard.element] : [];
    const colB: React.ReactNode[] = [];
    let heightA = anchorCard ? anchorCard.height : 0;
    let heightB = 0;

    restCards.forEach((card) => {
      if (heightB <= heightA) {
        colB.push(card.element);
        heightB += card.height;
      } else {
        colA.push(card.element);
        heightA += card.height;
      }
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start w-full">
          <div className="space-y-6 w-full">
            {colA}
          </div>
          <div className="space-y-6 w-full">
            {colB}
          </div>
        </div>
        {fallbackSection}
        {paginationRow}
      </div>
    );
  };

  return (
    <div className="primary-shell min-h-screen text-[#171747]">
      <main className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 lg:px-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link href={`/primary/today?date=${activity.date}${sectionId ? `&section_id=${sectionId}` : ""}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#e8e7fb] bg-white px-4 py-2 text-xs font-extrabold text-[#29317c] shadow-sm transition hover:border-blue-500/30 hover:text-blue-500"><ArrowLeft className="h-4 w-4" /> Back to Today’s Plan</Link>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={savingStatus}
              onClick={() => updateStatus("skipped")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e7fb] bg-white px-4 py-2 text-xs font-extrabold text-slate-500 shadow-sm transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
            >
              <ChevronsRight className="h-3.5 w-3.5" /> Skip Activity
            </button>
            <div className="inline-flex max-w-full items-center gap-2 truncate rounded-full bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-500"><Sparkles className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{level} • {subject} • {theme}</span></div>
          </div>
        </div>

        <section className={cn("relative overflow-hidden rounded-[20px] border border-[#e9e8f7] bg-gradient-to-r shadow-xs", presentation.gradient)}>
          <div className="relative z-10 p-4 sm:p-5 sm:max-w-[68%]">
            <div className="flex items-start gap-2.5">
              <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">{presentation.emoji}</span>
              <div className="min-w-0">
                <p className={cn("text-[10px] font-black uppercase tracking-[0.14em]", presentation.accentText)}>{presentation.label}</p>
                <h1 className="mt-0.5 text-lg font-black tracking-tight text-[#11143e] sm:text-xl lg:text-2xl leading-tight">{activity.title}</h1>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#4f5680] line-clamp-2 sm:line-clamp-none">{presentation.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/80 bg-white/85 px-2 py-0.5 text-[10px] font-extrabold text-[#171747] shadow-xs">
                <Clock3 className={cn("h-3.5 w-3.5", presentation.accentText)} />
                <span>{activity.duration_minutes || 10} min</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/80 bg-white/85 px-2 py-0.5 text-[10px] font-extrabold text-[#171747] shadow-xs">
                <CalendarDays className={cn("h-3.5 w-3.5", presentation.accentText)} />
                <span>{formattedTime(activity)}</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/80 bg-white/85 px-2 py-0.5 text-[10px] font-extrabold text-[#171747] shadow-xs">
                <BookOpen className={cn("h-3.5 w-3.5", presentation.accentText)} />
                <span className="truncate max-w-[120px]">{topic}</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-white/80 bg-white/85 px-2 py-0.5 text-[10px] font-extrabold text-[#171747] shadow-xs">
                <GraduationCap className={cn("h-3.5 w-3.5", presentation.accentText)} />
                <span className="truncate max-w-[150px]">{presentation.learningArea}</span>
              </span>
            </div>
          </div>
          {stepArt && <div className="hidden sm:block absolute inset-y-0 right-0 w-[32%]"><div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/20 to-transparent" /><img src={stepArt} alt={`${presentation.label} classroom illustration`} className="h-full w-full object-cover object-top" /></div>}
        </section>

        <div className="mt-5">
          {editing ? (
            <div className="space-y-5">
              <form onSubmit={saveMetadata} className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-black">Edit activity</h2><p className="text-xs font-semibold text-slate-400">Changes update this planned classroom step.</p></div><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">Cancel</button></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-black text-slate-600 sm:col-span-2">Activity title<input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500" /></label>
                  <label className="text-xs font-black text-slate-600">Start time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                  <label className="text-xs font-black text-slate-600">Duration (minutes)<input type="number" min={1} max={120} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                  <label className="text-xs font-black text-slate-600 sm:col-span-2">Step type<input value={activityType} onChange={(event) => setActivityType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /></label>
                  <label className="text-xs font-black text-slate-600 sm:col-span-2">Instructions <span className="font-semibold text-slate-400">— one step per line</span><textarea value={instructionsText} onChange={(event) => setInstructionsText(event.target.value)} rows={6} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500" /></label>
                </div>
                <fieldset className="mt-4"><legend className="text-xs font-black text-slate-600">Linked resources</legend><div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">{resourceCandidates.map((resource) => { const selected = resourceIds.includes(resource.id); return <button type="button" key={resource.id} onClick={() => setResourceIds((current) => selected ? current.filter((id) => id !== resource.id) : [...current, resource.id])} className={cn("rounded-full border px-3 py-1.5 text-[11px] font-bold transition", selected ? "border-transparent bg-blue-500 text-white" : "border-[#e8e7fb] bg-white text-blue-500 hover:bg-[#faf9ff]")}>{selected ? "✓ " : ""}{resource.title}</button>; })}</div></fieldset>
                <button disabled={savingMetadata} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-blue-600 disabled:opacity-50 transition duration-150"><Save className="h-4 w-4" />{savingMetadata ? "Saving…" : "Save activity"}</button>
              </form>
              <BlockDetailsSection activity={activity} resourceMap={resourceMap} />
              {activity.context.child_action && activity.context.child_action.length > 0 && (
                <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                  <header className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Child Action</p>
                      <h2 className="mt-1 text-xl font-black">What children do</h2>
                    </div>
                  </header>
                  <ul className="mt-5 list-disc pl-5 space-y-2.5 text-sm font-semibold text-slate-700 leading-relaxed">
                    {activity.context.child_action.map((act: string, idx: number) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </section>
              )}
              {activity.context.transition && (
                <section className="rounded-[24px] border border-amber-100 bg-amber-50/20 p-5 shadow-sm sm:p-6">
                  <header className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">Transition Guidance</p>
                      <h2 className="text-sm font-black text-amber-900 mt-0.5">Moving to the next block</h2>
                    </div>
                  </header>
                  <p className="mt-3 text-xs font-semibold text-[#4f5680] leading-normal">{activity.context.transition}</p>
                </section>
              )}

              {sectionId && (students.data || []).length > 0 && <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6"><header className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><UsersRound className="h-5 w-5" /></span><div><h2 className="text-lg font-black">How did each child do?</h2><p className="text-xs font-semibold text-slate-400">Tap a rating to capture progress for this activity.</p></div></header><ul className="mt-5 grid gap-2 sm:grid-cols-2">{(students.data || []).map((student: PrimaryStudent) => <li key={student.id} className="rounded-xl border border-[#ecebf7] p-3"><b className="text-xs">{student.code}</b><div className="mt-2 flex flex-wrap gap-1.5">{OBSERVATION_RATINGS.map((rating) => { const active = ratingByStudent[student.id] === rating; const tone = ratingTone(rating); return <button key={rating} type="button" disabled={rateChild.isPending} onClick={() => rateChild.mutate({ studentId: student.id, rating })} className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", active ? `${tone.chip} ${tone.text}` : "border-[#e8e7fb] bg-white text-[#596083]")}>{RATING_LABELS[rating]}</button>; })}</div></li>)}</ul></section>}
              {!nextActivity && (
                <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                  {activity.context.observation_point && (
                    <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                      <span className="flex items-center gap-1.5 text-xs font-black text-amber-800">🧐 Observation Focus</span>
                      <p className="mt-1 text-xs font-semibold text-slate-700 leading-normal">{activity.context.observation_point}</p>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-black text-slate-700">
                      <span className="mb-2 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-rose-500" /> Classroom observations
                      </span>
                      <textarea
                        value={observation}
                        onChange={(event) => {
                          setObservation(event.target.value);
                          localStorage.setItem(`draft-obs-${activity.id}-${activity.date}`, event.target.value);
                        }}
                        rows={5}
                        placeholder="What did you notice about learning?"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium leading-5 outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-500/10 transition duration-150 resize-none"
                      />
                    </label>
                    <label className="text-xs font-black text-slate-700">
                      <span className="mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" /> Teacher notes
                      </span>
                      <textarea
                        value={notes}
                        onChange={(event) => {
                          setNotes(event.target.value);
                          localStorage.setItem(`draft-notes-${activity.id}-${activity.date}`, event.target.value);
                        }}
                        rows={5}
                        placeholder="What should you remember for next time?"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium leading-5 outline-none focus:ring-2 focus:border-rose-400 focus:ring-rose-500/10 transition duration-150 resize-none"
                      />
                    </label>
                  </div>
                  <button onClick={saveNotes} disabled={savingNotes} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#171747] px-5 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#111136] transition duration-150 disabled:opacity-50">
                    <Save className="h-4 w-4" /> {savingNotes ? "Saving…" : "Save notes & observations"}
                  </button>
                </section>
              )}
              <div className="grid gap-4 sm:grid-cols-2 w-full mt-4">
                {/* Previous Activity */}
                {previousActivity ? (
                  <Link
                    href={activityUrl(previousActivity, sectionId)}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-[#e8e7fb] bg-white hover:bg-[#faf9ff] hover:border-blue-500/30 hover:-translate-y-1 hover:shadow-sm transition duration-200"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-200 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition duration-200">
                      <ArrowLeft className="h-5 w-5 transition duration-200 group-hover:-translate-x-0.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <small className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Previous activity</small>
                      <h4 className="text-sm font-black text-[#171747] truncate mt-0.5">{previousActivity.title}</h4>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-dashed border-slate-200">
                      <ArrowLeft className="h-5 w-5 opacity-40" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <small className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Previous activity</small>
                      <h4 className="text-sm font-bold italic truncate mt-0.5">First activity of today</h4>
                    </div>
                  </div>
                )}

                {/* Next Activity */}
                {nextActivity ? (
                  <Link
                    href={activityUrl(nextActivity, sectionId)}
                    className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50/60 hover:border-blue-300 hover:-translate-y-1 hover:shadow-sm transition duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <small className="block text-[9px] font-black uppercase tracking-wider text-blue-500">Next activity</small>
                      <h4 className="text-sm font-black text-[#171747] truncate mt-0.5">{nextActivity.title}</h4>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-blue-100 text-blue-500 transition duration-200 group-hover:bg-blue-500 group-hover:text-white">
                      <ArrowRight className="h-5 w-5 transition duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ) : (
                  <Link
                    href={`/primary/today?date=${activity.date}${sectionId ? `&section_id=${sectionId}` : ""}`}
                    className="group flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50/60 hover:border-blue-300 transition duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <small className="block text-[9px] font-black uppercase tracking-wider text-blue-500">Next activity</small>
                      <h4 className="text-sm font-black text-[#171747] truncate mt-0.5">End of today&apos;s plan · Return Home</h4>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-blue-100 text-blue-500 transition duration-200 group-hover:bg-blue-500 group-hover:text-white">
                      <ArrowRight className="h-5 w-5 transition duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            renderDisplayMode()
          )}
        </div>
      </main>
      {/* Resource Preview Modal */}
      {resourceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setResourceModal(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-50 text-teal-600 shrink-0">
                  <BookOpen className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-black text-[#171747] truncate">{resourceModal.title}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Download — fetch→blob to work cross-origin (Cloudinary) */}
                <button
                  type="button"
                  onClick={() => {
                    const ext = resourceModal.fileUrl.split(".").pop()?.split("?")[0] || "file";
                    const filename = `${resourceModal.title.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
                    downloadResource(resourceModal.fileUrl, filename);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-2xs transition"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                {/* Fullscreen — open raw URL in new tab */}
                <button
                  type="button"
                  onClick={() => window.open(resourceModal.fileUrl, "_blank", "noopener,noreferrer")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-2xs transition"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
                </button>
                <button
                  type="button"
                  onClick={() => setResourceModal(null)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition shadow-2xs"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden bg-slate-50" style={{ minHeight: "60vh" }}>
              {(() => {
                const url = resourceModal.fileUrl;
                const type = resourceModal.fileType?.toLowerCase() || "";
                const isImage = type.includes("image") || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);

                if (isImage) {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-6" style={{ minHeight: "60vh" }}>
                      <img
                        src={url}
                        alt={resourceModal.title}
                        className="max-w-full object-contain rounded-xl shadow-sm"
                        style={{ maxHeight: "70vh" }}
                      />
                    </div>
                  );
                }

                // For PDFs and all other file types from Cloudinary:
                // Use Google Docs viewer — it handles cross-origin files reliably
                // without CORS issues and renders PDFs, Word docs, spreadsheets, etc.
                const docsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
                return (
                  <iframe
                    key={url}
                    src={docsViewerUrl}
                    title={resourceModal.title}
                    className="w-full border-0"
                    style={{ height: "70vh" }}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#171747] px-5 py-3 text-xs font-black text-white shadow-xl">{toast}</div>}
    </div>
  );
}
