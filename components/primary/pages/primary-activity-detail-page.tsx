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
  const statusLabel = activity.status === "partially completed" ? "Partially completed" : activity.status.charAt(0).toUpperCase() + activity.status.slice(1);


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
            <div className="grid gap-5 lg:grid-cols-12 items-start">
              <div className="lg:col-span-7 space-y-5">
                <section className="rounded-[24px] border border-[#e8e7fb] bg-[#fbfbfe] p-5 shadow-sm sm:p-6">
                  <header className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">Teach this step</p>
                      <h2 className="mt-1 text-xl font-black text-[#171747]">Activity guide <span className="text-slate-400 font-semibold text-sm">(Teacher Speech)</span></h2>
                    </div>
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#ecebf7] bg-white px-3 py-2 text-xs font-black text-blue-500 shadow-xs hover:bg-blue-50/30 transition duration-155">
                      <Edit3 className="h-4 w-4" /> Edit
                    </button>
                  </header>

                  <div className="relative mt-6 pl-10 sm:pl-12 space-y-6">
                    <div className="absolute left-[18px] sm:left-[23px] top-6 bottom-6 w-[2px] bg-[#e8e7fb] border-l border-dashed border-slate-200" />
                    
                    {instructions.length > 0 ? (
                      instructions.map((text, index) => (
                        <div key={index} className="relative flex items-center justify-between gap-4 rounded-2xl border border-[#ecebf7] bg-white p-4 shadow-xs hover:border-blue-500/30 hover:shadow-sm transition duration-200">
                          <div className="absolute left-[-36px] sm:left-[-40px] top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white border-4 border-[#fbfbfe] shadow-xs transition duration-150 bg-blue-500">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium leading-5 text-[#596083]">{text}</p>
                          </div>
                        </div>
                      ))
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
                </section>

                {!nextActivity && (
                  <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-xs sm:p-6">
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
                )}
              </div>

              <div className="lg:col-span-5 space-y-5">



                {/* Block Details — data-driven from API */}
                <BlockDetailsSection activity={activity} resourceMap={resourceMap} />




                {/* Vocabulary List — data-driven from API context */}
                {(() => {
                  const rawVocab = activity.context.vocabulary_list;
                  const vocab = Array.isArray(rawVocab) && rawVocab.length > 0 ? rawVocab as string[] : [];
                  if (vocab.length === 0) return null;
                  return (
                    <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                      <header className="flex items-center gap-2.5 mb-4">
                        <span className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black shadow-xs bg-sky-50 text-sky-600">Aa</span>
                        <h2 className="text-sm font-black text-[#171747]">Vocabulary List</h2>
                      </header>
                      <div className="flex flex-wrap gap-1.5">
                        {vocab.map((word, idx) => (
                          <span key={idx} className="rounded-full border border-sky-100 bg-sky-50/30 px-3 py-1.5 text-[11px] font-bold transition duration-150 cursor-default hover:bg-sky-50/80 text-sky-700">{word}</span>
                        ))}
                      </div>
                    </section>
                  );
                })()}

              </div>

              <div className="lg:col-span-12 mt-4">
                <div className="grid gap-3 sm:grid-cols-2 w-full">
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
            </div>
          )}
        </div>
      </main>
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#171747] px-5 py-3 text-xs font-black text-white shadow-xl">{toast}</div>}
    </div>
  );
}
