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

  const linkedResourceQueries = useQueries({
    queries: resourceIds.map((id) => ({
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
  const linkedResources = useMemo(
    () => linkedResourceQueries.map((query) => query.data).filter((item): item is PrimaryResource => Boolean(item)),
    [linkedResourceQueries],
  );
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/primary/today?date=${activity.date}${sectionId ? `&section_id=${sectionId}` : ""}`} className="inline-flex items-center gap-2 rounded-full border border-[#e8e7fb] bg-white px-4 py-2 text-xs font-extrabold text-[#29317c] shadow-sm transition hover:border-[#6e41f5]/30 hover:text-[#6e41f5]"><ArrowLeft className="h-4 w-4" /> Back to Today’s Plan</Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f1ff] px-4 py-2 text-xs font-extrabold text-[#5731d8]"><Sparkles className="h-3.5 w-3.5" /> {level} • {subject} • {theme}</div>
        </div>

        <section className={cn("relative min-h-[220px] overflow-hidden rounded-[28px] border border-[#e9e8f7] bg-gradient-to-r shadow-sm", presentation.gradient)}>
          <div className="relative z-10 max-w-[62%] p-6 sm:p-8">
            <div className="flex items-start gap-3"><span className="text-3xl" aria-hidden="true">{presentation.emoji}</span><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#6e41f5]">{presentation.label}</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#11143e] sm:text-4xl">{activity.title}</h1></div></div>
            <p className="mt-3 max-w-lg text-sm font-semibold text-[#4f5680]">{presentation.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold shadow-sm"><Clock3 className="h-4 w-4 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Duration</small>{activity.duration_minutes || 10} min</span></span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold shadow-sm"><CalendarDays className="h-4 w-4 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Time</small>{formattedTime(activity)}</span></span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold shadow-sm"><BookOpen className="h-4 w-4 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Topic</small>{topic}</span></span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-bold shadow-sm"><GraduationCap className="h-4 w-4 text-[#6e41f5]" /><span><small className="block text-[9px] uppercase text-slate-400">Learning area</small>{presentation.learningArea}</span></span>
            </div>
          </div>
          {stepArt && <div className="absolute inset-y-0 right-0 w-[43%] min-w-[260px]"><div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/20 to-transparent" /><img src={stepArt} alt={`${presentation.label} classroom illustration`} className="h-full w-full object-cover" /></div>}
        </section>

        <div className="mx-auto mt-5 max-w-4xl space-y-5">
          {editing ? (
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
          ) : (
            <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
              <header className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#6e41f5]">Teach this step</p><h2 className="mt-1 text-xl font-black">Activity guide</h2></div><button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#e8e7fb] bg-[#faf9ff] px-3 py-2 text-xs font-black text-[#5731d8]"><Edit3 className="h-4 w-4" /> Edit</button></header>
              {instructions.length ? <ol className="mt-5 grid gap-3 sm:grid-cols-2">{instructions.map((line, index) => <li key={`${line}-${index}`} className="flex min-h-[94px] gap-3 rounded-2xl border border-[#ecebf7] bg-gradient-to-br from-white to-[#faf9ff] p-4"><span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black", presentation.numberTone)}>{index + 1}</span><div><b className="text-sm text-[#171747]">{index === 0 ? "Let’s begin" : `Step ${index + 1}`}</b><p className="mt-1 text-xs font-medium leading-5 text-[#596083]">{line}</p></div></li>)}</ol> : <button onClick={() => setEditing(true)} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#cfc8ef] bg-[#faf9ff] p-5 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl shadow-sm">✍️</span><span><b className="block text-sm">Add teaching instructions</b><small className="mt-1 block font-semibold text-slate-500">Write the sequence once; it will be ready each time this activity opens.</small></span></button>}
            </section>
          )}

          <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
            <header><p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-500">Ready to use</p><h2 className="mt-1 text-xl font-black">Learning resources</h2></header>
            {linkedResources.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{linkedResources.map((resource, index) => <article key={resource.id} className={cn("overflow-hidden rounded-2xl border border-[#e8e7fb] bg-[#fafcff]", index === 0 && "sm:col-span-2")}><div className="flex items-center gap-4 p-4">{resource.thumbnailUrl ? <img src={resource.thumbnailUrl} alt="" className={cn("rounded-xl object-cover", index === 0 ? "h-24 w-32" : "h-16 w-20")} /> : <span className="grid h-16 w-20 shrink-0 place-items-center rounded-xl bg-[#f1edff] text-3xl">{resourceEmoji(resource)}</span>}<div className="min-w-0 flex-1"><small className="font-black uppercase tracking-wider text-[#6e41f5]">{resource.category}</small><h3 className="mt-1 truncate text-sm font-black">{resource.title}</h3><p className="mt-1 text-xs font-semibold text-slate-400">{resource.fileType || "Classroom resource"}</p><div className="mt-3 flex gap-2"><a href={resource.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#6e41f5] px-3 py-1.5 text-[11px] font-black text-white"><ExternalLink className="h-3.5 w-3.5" /> Open</a><a href={resource.fileUrl} download className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e7fb] bg-white px-3 py-1.5 text-[11px] font-black text-[#4b3e8d]"><Download className="h-3.5 w-3.5" /> Download</a></div></div></div></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[#d8d3ef] bg-[#faf9ff] p-6 text-center"><span className="text-3xl">📚</span><h3 className="mt-2 text-sm font-black">No resources attached yet</h3><p className="mt-1 text-xs font-semibold text-slate-500">Edit the activity to link items from the Primary resource catalogue.</p><button onClick={() => setEditing(true)} className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-black text-[#6e41f5] shadow-sm ring-1 ring-[#e8e7fb]">Choose resources</button></div>}
          </section>

          {sectionId && (students.data || []).length > 0 && <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6"><header className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><UsersRound className="h-5 w-5" /></span><div><h2 className="text-lg font-black">How did each child do?</h2><p className="text-xs font-semibold text-slate-400">Tap a rating to capture progress for this activity.</p></div></header><ul className="mt-5 grid gap-2 sm:grid-cols-2">{(students.data || []).map((student: PrimaryStudent) => <li key={student.id} className="rounded-xl border border-[#ecebf7] p-3"><b className="text-xs">{student.code}</b><div className="mt-2 flex flex-wrap gap-1.5">{OBSERVATION_RATINGS.map((rating) => { const active = ratingByStudent[student.id] === rating; const tone = ratingTone(rating); return <button key={rating} type="button" disabled={rateChild.isPending} onClick={() => rateChild.mutate({ studentId: student.id, rating })} className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", active ? `${tone.chip} ${tone.text}` : "border-[#e8e7fb] bg-white text-[#596083]")}>{RATING_LABELS[rating]}</button>; })}</div></li>)}</ul></section>}

          <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-4 md:grid-cols-2"><label className="text-xs font-black text-slate-700"><span className="mb-2 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#6e41f5]" /> Classroom observations</span><textarea value={observation} onChange={(event) => { setObservation(event.target.value); localStorage.setItem(`draft-obs-${activity.id}-${activity.date}`, event.target.value); }} rows={5} placeholder="What did you notice about learning?" className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium leading-5 outline-none focus:border-[#6e41f5]" /></label><label className="text-xs font-black text-slate-700"><span className="mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Teacher notes</span><textarea value={notes} onChange={(event) => { setNotes(event.target.value); localStorage.setItem(`draft-notes-${activity.id}-${activity.date}`, event.target.value); }} rows={5} placeholder="What should you remember for next time?" className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium leading-5 outline-none focus:border-[#6e41f5]" /></label></div><button onClick={saveNotes} disabled={savingNotes} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#171747] px-5 py-2.5 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />{savingNotes ? "Saving…" : "Save notes & observations"}</button>
          </section>

          <section className="rounded-[24px] border border-[#e8e7fb] bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-2"><span className="mr-2 text-xs font-black text-slate-500">Activity status:</span><button onClick={() => updateStatus("completed")} disabled={savingStatus} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black", activity.status === "completed" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700")}><Check className="h-4 w-4" /> Complete</button><button onClick={() => updateStatus("partially completed")} disabled={savingStatus} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black", activity.status === "partially completed" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700")}><CheckSquare className="h-4 w-4" /> Partial</button><button onClick={() => updateStatus("skipped")} disabled={savingStatus} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black", activity.status === "skipped" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700")}><Ban className="h-4 w-4" /> Skip</button>{rescheduleDate ? <><input type="date" min={activity.date} value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} className="rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold" aria-label="New activity date" /><button onClick={rescheduleActivity} disabled={savingStatus} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Confirm reschedule</button><button onClick={() => setRescheduleDate("")} className="rounded-xl px-2 py-2 text-xs font-bold text-slate-500">Cancel</button></> : <button onClick={() => { const date = new Date(`${activity.date}T12:00:00`); date.setDate(date.getDate() + 1); setRescheduleDate(date.toISOString().slice(0, 10)); }} className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black", activity.status === "rescheduled" ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700")}><CalendarDays className="h-4 w-4" /> Reschedule</button>}<button onClick={deleteActivity} disabled={savingStatus} className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-rose-100 px-3 py-2 text-xs font-black text-rose-600"><Trash2 className="h-4 w-4" /> Delete</button></div></section>

          <nav className="grid gap-3 sm:grid-cols-2">{previousActivity ? <Link href={activityUrl(previousActivity, sectionId)} className="flex items-center gap-3 rounded-2xl border border-[#e8e7fb] bg-white p-4 shadow-sm"><ArrowLeft className="h-5 w-5 text-[#6e41f5]" /><span><small className="block font-bold text-slate-400">Previous activity</small><b className="text-sm">{previousActivity.title}</b></span></Link> : <div className="rounded-2xl border border-dashed border-[#e8e7fb] p-4 text-xs font-bold text-slate-400">This is the first activity.</div>}{nextActivity ? <Link href={activityUrl(nextActivity, sectionId)} className="flex items-center justify-end gap-3 rounded-2xl bg-[#6e41f5] p-4 text-right text-white shadow-lg"><span><small className="block font-bold text-white/70">Next activity</small><b className="text-sm">{nextActivity.title}</b></span><ArrowRight className="h-5 w-5" /></Link> : <div className="rounded-2xl border border-dashed border-[#e8e7fb] p-4 text-right text-xs font-bold text-slate-400">You’ve reached the end of today’s plan.</div>}</nav>
        </div>
      </main>
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#171747] px-5 py-3 text-xs font-black text-white shadow-xl">{toast}</div>}
    </div>
  );
}
