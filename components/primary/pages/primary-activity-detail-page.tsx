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
};

const STEP_PRESENTATION: Record<string, StepPresentation> = {
  warm_up: { label: "Warm Up", emoji: "☀️", subtitle: "Welcome every learner and get minds and bodies ready.", learningArea: "Classroom Readiness", gradient: "from-sky-50 via-white to-cyan-50", numberTone: "bg-sky-100 text-sky-700" },
  introduction: { label: "Introduction", emoji: "💡", subtitle: "Introduce today’s idea with simple, joyful conversation.", learningArea: "Concept Building", gradient: "from-emerald-50 via-white to-teal-50", numberTone: "bg-emerald-100 text-emerald-700" },
  story_or_rhyme: { label: "Story or Rhyme", emoji: "📖", subtitle: "Build language and imagination through listening together.", learningArea: "Communication", gradient: "from-amber-50 via-white to-orange-50", numberTone: "bg-amber-100 text-amber-700" },
  picture_talk: { label: "Picture Talk", emoji: "🖼️", subtitle: "Look closely, notice details and share ideas together.", learningArea: "Observation & Language", gradient: "from-pink-50 via-white to-rose-50", numberTone: "bg-pink-100 text-pink-700" },
  classroom_activity: { label: "Classroom Activity", emoji: "🎨", subtitle: "Learn together through a guided hands-on experience.", learningArea: "Experiential Learning", gradient: "from-violet-50 via-white to-fuchsia-50", numberTone: "bg-violet-100 text-violet-700" },
  worksheet: { label: "Worksheet", emoji: "📝", subtitle: "Practise today’s learning with clear, focused tasks.", learningArea: "Early Literacy & Practice", gradient: "from-emerald-50 via-white to-lime-50", numberTone: "bg-emerald-100 text-emerald-700" },
  assessment: { label: "Assessment", emoji: "✅", subtitle: "Check understanding gently and celebrate progress.", learningArea: "Learning Check", gradient: "from-amber-50 via-white to-yellow-50", numberTone: "bg-amber-100 text-amber-700" },
  movement: { label: "Movement", emoji: "🏃", subtitle: "Move, stretch and learn through active play.", learningArea: "Physical Development", gradient: "from-sky-50 via-white to-blue-50", numberTone: "bg-sky-100 text-sky-700" },
  routine: { label: "Routine", emoji: "🕐", subtitle: "Build confidence through a familiar classroom rhythm.", learningArea: "Independence & Wellbeing", gradient: "from-emerald-50 via-white to-cyan-50", numberTone: "bg-emerald-100 text-emerald-700" },
  circle_time: { label: "Circle Time", emoji: "🌞", subtitle: "Start with connection, conversation and joy.", learningArea: "Communication", gradient: "from-orange-50 via-white to-amber-50", numberTone: "bg-orange-100 text-orange-700" },
  story: { label: "Story Time", emoji: "📖", subtitle: "Listen to a story and learn together.", learningArea: "Communication", gradient: "from-violet-50 via-white to-blue-50", numberTone: "bg-violet-100 text-violet-700" },
  flashcards: { label: "Flashcards", emoji: "🃏", subtitle: "See it, say it and remember it together.", learningArea: "Vocabulary & Recall", gradient: "from-blue-50 via-white to-indigo-50", numberTone: "bg-blue-100 text-blue-700" },
  craft: { label: "Craft Activity", emoji: "✂️", subtitle: "Get creative and build something meaningful.", learningArea: "Fine Motor Skills", gradient: "from-pink-50 via-white to-orange-50", numberTone: "bg-pink-100 text-pink-700" },
  song: { label: "Song & Movement", emoji: "🎵", subtitle: "Sing, move and have fun together.", learningArea: "Physical Development", gradient: "from-fuchsia-50 via-white to-violet-50", numberTone: "bg-fuchsia-100 text-fuchsia-700" },
  game: { label: "Game", emoji: "🎲", subtitle: "Practise through playful turn-taking and teamwork.", learningArea: "Social Learning", gradient: "from-sky-50 via-white to-indigo-50", numberTone: "bg-sky-100 text-sky-700" },
  reflection: { label: "Reflection", emoji: "💛", subtitle: "Pause, remember and celebrate today’s learning.", learningArea: "Metacognition", gradient: "from-emerald-50 via-white to-teal-50", numberTone: "bg-emerald-100 text-emerald-700" },
  parent_note: { label: "Parent Note", emoji: "💌", subtitle: "Share today’s learning and a simple home connection.", learningArea: "Family Partnership", gradient: "from-amber-50 via-white to-orange-50", numberTone: "bg-amber-100 text-amber-700" },
  arrival_routine: { label: "Arrival and Routine", emoji: "🎒", subtitle: "Welcome learners and establish a smooth start to the day.", learningArea: "Routine & Independence", gradient: "from-sky-50 via-white to-cyan-50", numberTone: "bg-sky-100 text-sky-700" },
  free_play: { label: "Free Play", emoji: "🧸", subtitle: "Encourage self-directed exploration and social interactions.", learningArea: "Social Development", gradient: "from-violet-50 via-white to-fuchsia-50", numberTone: "bg-violet-100 text-violet-700" },
  story_rhyme_picture_talk: { label: "Story, Rhyme or Picture Talk", emoji: "🗣️", subtitle: "Language development, listening skills, and critical thinking.", learningArea: "Communication & Language", gradient: "from-amber-50 via-white to-orange-50", numberTone: "bg-amber-100 text-amber-700" },
  concept_exploration: { label: "Concept Exploration", emoji: "🔍", subtitle: "Explore today's core focus with concrete objects or discussion.", learningArea: "Concept Discovery", gradient: "from-emerald-50 via-white to-teal-50", numberTone: "bg-emerald-100 text-emerald-700" },
  classroom_activity_game: { label: "Classroom Activity or Game", emoji: "🧩", subtitle: "Active, collaborative learning through play and creation.", learningArea: "Collaboration & Application", gradient: "from-pink-50 via-white to-rose-50", numberTone: "bg-pink-100 text-pink-700" },
  practice: { label: "Practice", emoji: "✏️", subtitle: "Reinforce literacy, numeracy or creative skills.", learningArea: "Early Practice", gradient: "from-teal-50 via-white to-emerald-50", numberTone: "bg-teal-100 text-teal-700" },
};

const DEFAULT_PRESENTATION: StepPresentation = {
  label: "Classroom Activity",
  emoji: "✨",
  subtitle: "Guide learners through today’s classroom experience.",
  learningArea: "Holistic Development",
  gradient: "from-violet-50 via-white to-blue-50",
  numberTone: "bg-violet-100 text-violet-700",
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
    <small className="font-black uppercase tracking-wider text-[#5731d8]">{field.label}</small>
  );

  const textNode = (field: StepDetailField, value: string) => (
    /^https?:\/\//.test(value) ? (
      <a href={value} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#6e41f5] underline underline-offset-2 break-all">{value}</a>
    ) : (
      <p className="text-xs font-semibold leading-5 text-[#4f5680] whitespace-pre-line">{value}</p>
    )
  );

  return (
    <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6e41f5]">Block Details</p>
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
                      <div key={id} className="flex items-center gap-3 rounded-xl border border-[#ecebf7] bg-[#faf9ff] p-3">
                        {resource.thumbnailUrl ? (
                          <img src={resource.thumbnailUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-white text-2xl shadow-sm">{resourceEmoji(resource)}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <small className="font-black uppercase tracking-wider text-[#6e41f5]">{resource.category}</small>
                          <h4 className="truncate text-xs font-black">{resource.title}</h4>
                        </div>
                        <a href={resource.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#6e41f5] px-2.5 py-1.5 text-[10px] font-black text-white"><ExternalLink className="h-3 w-3" /> Open</a>
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
                    <span key={`${item}-${index}`} className="rounded-full border border-[#e8e7fb] bg-[#faf9ff] px-3 py-1.5 text-[11px] font-bold text-[#4b3e8d]">{item}</span>
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
    return <div className="grid min-h-[70vh] place-items-center"><div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-sm font-bold text-[#29317c] shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-[#6e41f5]" /> Preparing the activity…</div></div>;
  }
  if (!activity || activityQuery.isError) {
    return <div className="mx-auto max-w-xl py-20 text-center"><div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm"><h1 className="text-2xl font-black text-[#171747]">Activity not found</h1><p className="mt-2 text-sm text-slate-500">This activity may have been removed or is no longer available.</p><Link href="/primary/today" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6e41f5] px-5 py-3 text-sm font-bold text-white"><ArrowLeft className="h-4 w-4" /> Back to Today’s Plan</Link></div></div>;
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
          <Link href={`/primary/today?date=${activity.date}${sectionId ? `&section_id=${sectionId}` : ""}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#e8e7fb] bg-white px-4 py-2 text-xs font-extrabold text-[#29317c] shadow-sm transition hover:border-[#6e41f5]/30 hover:text-[#6e41f5]"><ArrowLeft className="h-4 w-4" /> Back to Today’s Plan</Link>
          <div className="inline-flex max-w-full items-center gap-2 truncate rounded-full bg-[#f5f1ff] px-4 py-2 text-xs font-extrabold text-[#5731d8]"><Sparkles className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{level} • {subject} • {theme}</span></div>
        </div>

        <section className={cn("relative overflow-hidden rounded-[28px] border border-[#e9e8f7] bg-gradient-to-r shadow-sm", presentation.gradient)}>
          <div className="relative z-10 p-5 sm:p-8 sm:max-w-[62%]">
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl shrink-0" aria-hidden="true">{presentation.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6e41f5]">{presentation.label}</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[#11143e] sm:text-3xl lg:text-4xl leading-tight">{activity.title}</h1>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#4f5680] line-clamp-2 sm:line-clamp-none">{presentation.subtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/85 px-2.5 py-1.5 text-xs font-bold shadow-sm"><Clock3 className="h-3.5 w-3.5 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Duration</small>{activity.duration_minutes || 10} min</span></span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/85 px-2.5 py-1.5 text-xs font-bold shadow-sm"><CalendarDays className="h-3.5 w-3.5 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Time</small>{formattedTime(activity)}</span></span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/85 px-2.5 py-1.5 text-xs font-bold shadow-sm"><BookOpen className="h-3.5 w-3.5 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Topic</small>{topic}</span></span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/85 px-2.5 py-1.5 text-xs font-bold shadow-sm"><GraduationCap className="h-3.5 w-3.5 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Learning area</small>{presentation.learningArea}</span></span>
            </div>
          </div>
          {stepArt && <div className="hidden sm:block absolute inset-y-0 right-0 w-[40%]"><div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/20 to-transparent" /><img src={stepArt} alt={`${presentation.label} classroom illustration`} className="h-full w-full object-cover" /></div>}
        </section>

        <div className="mt-5">
          {editing ? (
            <div className="space-y-5">
              <form onSubmit={saveMetadata} className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-black">Edit activity</h2><p className="text-xs font-semibold text-slate-400">Changes update this planned classroom step.</p></div><button type="button" onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">Cancel</button></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-black text-slate-600 sm:col-span-2">Activity title<input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#6e41f5]" /></label>
                  <label className="text-xs font-black text-slate-600">Start time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#6e41f5]" /></label>
                  <label className="text-xs font-black text-slate-600">Duration (minutes)<input type="number" min={1} max={120} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#6e41f5]" /></label>
                  <label className="text-xs font-black text-slate-600 sm:col-span-2">Step type<input value={activityType} onChange={(event) => setActivityType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#6e41f5]" /></label>
                  <label className="text-xs font-black text-slate-600 sm:col-span-2">Instructions <span className="font-semibold text-slate-400">— one step per line</span><textarea value={instructionsText} onChange={(event) => setInstructionsText(event.target.value)} rows={6} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#6e41f5]" /></label>
                </div>
                <fieldset className="mt-4"><legend className="text-xs font-black text-slate-600">Linked resources</legend><div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">{resourceCandidates.map((resource) => { const selected = resourceIds.includes(resource.id); return <button type="button" key={resource.id} onClick={() => setResourceIds((current) => selected ? current.filter((id) => id !== resource.id) : [...current, resource.id])} className={cn("rounded-full border px-3 py-1.5 text-[11px] font-bold", selected ? "border-[#6e41f5] bg-[#6e41f5] text-white" : "border-[#e8e7fb] bg-[#f8f6ff] text-[#4b3e8d]")}>{selected ? "✓ " : ""}{resource.title}</button>; })}</div></fieldset>
                <button disabled={savingMetadata} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white shadow-md disabled:opacity-50"><Save className="h-4 w-4" />{savingMetadata ? "Saving…" : "Save activity"}</button>
              </form>
              <BlockDetailsSection activity={activity} resourceMap={resourceMap} />
              {activity.context.child_action && activity.context.child_action.length > 0 && (
                <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                  <header className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">Child Action</p>
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
                <section className="rounded-[24px] border border-violet-100 bg-violet-50/10 p-5 shadow-sm sm:p-6">
                  <header className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-700">Transition Guidance</p>
                      <h2 className="text-sm font-black text-violet-900 mt-0.5">Moving to the next block</h2>
                    </div>
                  </header>
                  <p className="mt-3 text-xs font-semibold text-[#4f5680] leading-normal">{activity.context.transition}</p>
                </section>
              )}

              {sectionId && (students.data || []).length > 0 && <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6"><header className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><UsersRound className="h-5 w-5" /></span><div><h2 className="text-lg font-black">How did each child do?</h2><p className="text-xs font-semibold text-slate-400">Tap a rating to capture progress for this activity.</p></div></header><ul className="mt-5 grid gap-2 sm:grid-cols-2">{(students.data || []).map((student: PrimaryStudent) => <li key={student.id} className="rounded-xl border border-[#ecebf7] p-3"><b className="text-xs">{student.code}</b><div className="mt-2 flex flex-wrap gap-1.5">{OBSERVATION_RATINGS.map((rating) => { const active = ratingByStudent[student.id] === rating; const tone = ratingTone(rating); return <button key={rating} type="button" disabled={rateChild.isPending} onClick={() => rateChild.mutate({ studentId: student.id, rating })} className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", active ? `${tone.chip} ${tone.text}` : "border-[#e8e7fb] bg-white text-[#596083]")}>{RATING_LABELS[rating]}</button>; })}</div></li>)}</ul></section>}
              <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
                {activity.context.observation_point && (
                  <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                    <span className="flex items-center gap-1.5 text-xs font-black text-amber-800">🧐 Observation Focus</span>
                    <p className="mt-1 text-xs font-semibold text-slate-700 leading-normal">{activity.context.observation_point}</p>
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2"><label className="text-xs font-black text-slate-700"><span className="mb-2 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#6e41f5]" /> Classroom observations</span><textarea value={observation} onChange={(event) => { setObservation(event.target.value); localStorage.setItem(`draft-obs-${activity.id}-${activity.date}`, event.target.value); }} rows={5} placeholder="What did you notice about learning?" className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium leading-5 outline-none focus:border-[#6e41f5]" /></label><label className="text-xs font-black text-slate-700"><span className="mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Teacher notes</span><textarea value={notes} onChange={(event) => { setNotes(event.target.value); localStorage.setItem(`draft-notes-${activity.id}-${activity.date}`, event.target.value); }} rows={5} placeholder="What should you remember for next time?" className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium leading-5 outline-none focus:border-[#6e41f5]" /></label></div><button onClick={saveNotes} disabled={savingNotes} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#171747] px-5 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{savingNotes ? "Saving…" : "Save notes & observations"}</button>
              </section>
              <div className="grid gap-4 sm:grid-cols-2 w-full mt-4">
                {/* Previous Activity */}
                {previousActivity ? (
                  <Link
                    href={activityUrl(previousActivity, sectionId)}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-[#faf9ff]/60 hover:bg-[#f5f1ff]/50 hover:border-[#6e41f5]/30 hover:-translate-y-1 hover:shadow-md transition duration-200"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-200 text-[#6e41f5] group-hover:bg-[#6e41f5] group-hover:text-white transition duration-200">
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
                    className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#6e41f5] hover:bg-[#5731d8] text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-[#6e41f5]/20 transition duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <small className="block text-[9px] font-black uppercase tracking-wider text-white/70">Next activity</small>
                      <h4 className="text-sm font-black truncate mt-0.5">{nextActivity.title}</h4>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 group-hover:bg-white/20 transition duration-200">
                      <ArrowRight className="h-5 w-5 text-white transition duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
                    <div className="min-w-0 flex-1">
                      <small className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Next activity</small>
                      <h4 className="text-sm font-bold italic truncate mt-0.5">End of today's plan</h4>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-dashed border-slate-200">
                      <ArrowRight className="h-5 w-5 opacity-40" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-12 items-start">
              <div className="lg:col-span-7 space-y-5">
                <section className="rounded-[24px] border border-[#e8e7fb] bg-[#fbfbfe] p-5 shadow-sm sm:p-6">
                  <header className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6e41f5]">Teach this step</p>
                      <h2 className="mt-1 text-xl font-black text-[#171747]">Activity guide <span className="text-slate-400 font-semibold text-sm">(Teacher Speech)</span></h2>
                    </div>
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e7fb] bg-white px-3 py-2 text-xs font-black text-[#5731d8] shadow-sm hover:bg-[#faf9ff] transition duration-155">
                      <Edit3 className="h-4 w-4" /> Edit
                    </button>
                  </header>

                  <div className="relative mt-6 pl-12 space-y-6">
                    <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-[#e8e7fb] border-l border-dashed border-[#d2cbfa]" />
                    
                    {instructions.length > 0 ? (
                      instructions.map((text, index) => (
                        <div key={index} className="relative flex items-center justify-between gap-4 rounded-2xl border border-[#ecebf7] bg-white p-4 shadow-sm hover:border-[#6e41f5]/30 hover:shadow transition duration-200">
                          <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-[#6e41f5] text-xs font-black text-white border-4 border-[#fbfbfe] shadow-sm">
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
                        <button onClick={() => setEditing(true)} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-black text-[#6e41f5] shadow-sm ring-1 ring-[#e8e7fb]">
                          Add steps
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#e8e7fb] bg-[#fbfbfe] p-5 shadow-sm sm:p-6">
                  <header className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f1ff] text-[#6e41f5] shadow-sm">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Classroom observations &amp; Teacher notes</p>
                      <h2 className="text-sm font-black text-[#171747]">Write observations &amp; notes</h2>
                    </div>
                  </header>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-black text-slate-700 flex flex-col gap-1.5">
                      <span className="flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5 text-[#6e41f5]" /> Classroom observations</span>
                      <textarea
                        value={observation}
                        onChange={(event) => {
                          setObservation(event.target.value);
                          localStorage.setItem(`draft-obs-${activity.id}-${activity.date}`, event.target.value);
                        }}
                        rows={4}
                        placeholder="What did you notice about learning?"
                        className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-medium leading-5 outline-none focus:border-[#6e41f5] focus:ring-2 focus:ring-[#6e41f5]/15 transition duration-150 resize-none"
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
                        className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-medium leading-5 outline-none focus:border-[#6e41f5] focus:ring-2 focus:ring-[#6e41f5]/15 transition duration-150 resize-none"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={saveNotes} disabled={savingNotes} className="inline-flex items-center gap-2 rounded-xl bg-[#6e41f5] px-5 py-3 text-xs font-black text-white shadow-md shadow-[#6e41f5]/20 hover:bg-[#5731d8] hover:-translate-y-0.5 transition duration-150 disabled:opacity-50 disabled:translate-y-0">
                      <Save className="h-3.5 w-3.5" /> {savingNotes ? "Saving..." : "Save notes & observations"}
                    </button>
                  </div>
                </section>
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
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#f5f1ff] text-[#6e41f5] text-xs font-black shadow-sm">Aa</span>
                        <h2 className="text-sm font-black text-[#171747]">Vocabulary List</h2>
                      </header>
                      <div className="flex flex-wrap gap-1.5">
                        {vocab.map((word, idx) => (
                          <span key={idx} className="rounded-full border border-[#ecebf7] bg-white px-3 py-1.5 text-[11px] font-bold text-[#6e41f5] hover:border-[#6e41f5]/40 hover:bg-[#fbfbfe] transition duration-150 cursor-default">{word}</span>
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
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-[#faf9ff]/60 hover:bg-[#f5f1ff]/50 hover:border-[#6e41f5]/30 hover:-translate-y-1 hover:shadow-md transition duration-200"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-200 text-[#6e41f5] group-hover:bg-[#6e41f5] group-hover:text-white transition duration-200">
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
                      className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#6e41f5] hover:bg-[#5731d8] text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-[#6e41f5]/20 transition duration-200"
                    >
                      <div className="min-w-0 flex-1">
                        <small className="block text-[9px] font-black uppercase tracking-wider text-white/70">Next activity</small>
                        <h4 className="text-sm font-black truncate mt-0.5">{nextActivity.title}</h4>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 group-hover:bg-white/20 transition duration-200">
                        <ArrowRight className="h-5 w-5 text-white transition duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
                      <div className="min-w-0 flex-1">
                        <small className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Next activity</small>
                        <h4 className="text-sm font-bold italic truncate mt-0.5">End of today's plan</h4>
                      </div>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-dashed border-slate-200">
                        <ArrowRight className="h-5 w-5 opacity-40" />
                      </span>
                    </div>
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
