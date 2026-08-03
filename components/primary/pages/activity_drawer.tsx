"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Check,
  CheckSquare,
  Ban,
  Calendar,
  Edit3,
  Download,
  Clock,
  ClipboardList,
  GraduationCap,
  Lightbulb,
  Trash2
} from "lucide-react";
import {
  backendApi,
  type PrimaryObservation,
  type PrimaryPlannerActivity,
  type PrimaryPlannerActivityStatus,
  type PrimaryStudent,
} from "@/lib/api";
import { adaptApiResource, type PrimaryResource } from "@/lib/primary-resource-adapter";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { OBSERVATION_RATINGS, RATING_LABELS, ratingTone, type ObservationRating } from "@/lib/primary-roster";
import { usePrimarySection } from "@/lib/use-primary-section";
import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";

interface ActivityDrawerProps {
  activity: PrimaryPlannerActivity;
  onClose: () => void;
  notify: (s: string) => void;
}

export default function ActivityDrawer({ activity, onClose, notify }: ActivityDrawerProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const defaultRescheduleDate = useMemo(() => {
    const [year, month, day] = activity.date.split("-").map(Number);
    const next = new Date(year, month - 1, day + 1, 12);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  }, [activity.date]);

  // Form states
  const [title, setTitle] = useState(activity.title);
  const [duration, setDuration] = useState(activity.duration_minutes || 10);
  const [startTime, setStartTime] = useState(activity.start_time?.slice(0, 5) || "");
  const [activityType, setActivityType] = useState(activity.activity_type);
  const [resourceIds, setResourceIds] = useState(activity.resource_ids || []);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Note & Observation states
  const [notes, setNotes] = useState(activity.notes || "");
  const [observation, setObservation] = useState(activity.observation || "");

  const { sectionId } = usePrimarySection();
  const { context: teachingContext } = usePrimaryTeachingContext();

  // Only children of the day's class can be rated on it — the backend rejects
  // the mismatch with a 409, so offering them here would be a dead end.
  const students = useQuery({
    queryKey: ["primary-students", sectionId, false],
    queryFn: () => backendApi.primaryStudents({ sectionId: sectionId as string }),
    enabled: Boolean(sectionId),
  });

  const observations = useQuery({
    queryKey: ["primary-observations", activity.teaching_day_id, activity.id],
    queryFn: () =>
      backendApi.primaryObservations({
        start: activity.date,
        end: activity.date,
        teachingDayId: activity.teaching_day_id,
      }),
    enabled: Boolean(sectionId),
  });

  const rateChild = useMutation({
    mutationFn: (input: { studentId: string; rating: ObservationRating }) =>
      backendApi.upsertPrimaryObservation({
        student_id: input.studentId,
        teaching_day_id: activity.teaching_day_id,
        planner_activity_id: activity.id,
        // The generated activity's own `context` never carries a `skill` key
        // (see primary_planner.py's `generate`, which builds it as exactly
        // {level, subject, language}), so the day's focus skill lives on the
        // teacher's current teaching context instead — that's what a term
        // profile groups by, instead of filing everything under "General".
        skill: teachingContext.skill || null,
        rating: input.rating,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["primary-observations"] });
      void queryClient.invalidateQueries({ queryKey: ["primary-student-profile"] });
      notify("Observation saved");
    },
    onError: (error) => notify(getErrorMessage(error, "Could not save that observation.")),
  });

  const ratingByStudent = useMemo(() => {
    const map: Record<string, ObservationRating> = {};
    for (const observation of observations.data || []) {
      if (observation.planner_activity_id === activity.id) {
        map[observation.student_id] = observation.rating;
      }
    }
    return map;
  }, [observations.data, activity.id]);

  // Local drafts safety
  const draftNotesKey = `draft-notes-${activity.id}-${activity.date}`;
  const draftObsKey = `draft-obs-${activity.id}-${activity.date}`;

  // Restore drafts on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(draftNotesKey);
    if (savedNotes !== null) setNotes(savedNotes);

    const savedObs = localStorage.getItem(draftObsKey);
    if (savedObs !== null) setObservation(savedObs);
  }, [activity.id]);

  useEffect(() => {
    const drawer = drawerRef.current;
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])') ?? []);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const first = focusable()[0];
    first?.focus();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Save drafts on change
  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem(draftNotesKey, val);
  };

  const handleObsChange = (val: string) => {
    setObservation(val);
    localStorage.setItem(draftObsKey, val);
  };

  // Resolve linked resources from the backend catalog (resourceIds are legacy
  // catalog ids stored on the activity).
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
  const linkedResources = useMemo(() => {
    return linkedResourceQueries
      .map((q) => q.data)
      .filter((item): item is PrimaryResource => item !== null && item !== undefined);
  }, [linkedResourceQueries]);
  // activity.context is a freeform backend JSON dict (Record<string, unknown>) —
  // no schema guarantees these fields exist or are strings, so read defensively.
  const contextSubject = typeof activity.context.subject === "string" ? activity.context.subject : "";
  const resourceCandidatesQuery = useQuery({
    queryKey: ["primary-resources-candidates", contextSubject],
    queryFn: () => backendApi.primaryResources({ subject: contextSubject || undefined, page_size: 30 }),
    staleTime: 60_000,
  });
  const resourceCandidates = useMemo(() => {
    return (resourceCandidatesQuery.data?.items ?? []).map((item) => adaptApiResource(item));
  }, [resourceCandidatesQuery.data]);
  const resourceEmoji = (resource: PrimaryResource) => {
    const category = resource.category.toLowerCase();
    if (category.includes("worksheet") || category.includes("tracing") || category.includes("colouring")) return "📝";
    if (category.includes("flashcard") || category.includes("vocabulary")) return "🍎";
    if (category.includes("picture")) return "🖼️";
    if (category.includes("story")) return "📖";
    if (category.includes("circle") || category.includes("rhyme")) return "🎵";
    if (category.includes("matching")) return "🧩";
    return "📚";
  };

  // Clean local drafts
  const clearDrafts = () => {
    localStorage.removeItem(draftNotesKey);
    localStorage.removeItem(draftObsKey);
  };

  // Save notes and observations
  const handleSaveNotesAndObs = async () => {
    setSavingNotes(true);
    try {
      await backendApi.updatePlannerActivity(activity.id, {
        notes: notes || undefined,
        observation: observation || undefined,
      });
      clearDrafts();
      notify("Notes and observations saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["primary-planner-activities"] });
      queryClient.invalidateQueries({ queryKey: ["primary-today-workspace"] });
    } catch (err) {
      notify("Failed to save changes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Status transitions
  const handleUpdateStatus = async (status: PrimaryPlannerActivityStatus) => {
    setSavingStatus(true);
    try {
      await backendApi.updatePlannerActivity(activity.id, { status });
      notify(`Activity marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ["primary-planner-activities"] });
      queryClient.invalidateQueries({ queryKey: ["primary-today-workspace"] });
    } catch (err) {
      notify("Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate) return;
    setSavingStatus(true);
    try {
      // `date` is deliberately NOT part of PrimaryPlannerActivityUpdate
      // (extra="forbid"), so sending it 422'd this call every time. Moving an
      // activity across days is not just a column write either: the row's
      // teaching_day_id would still point at the old day, and regenerating
      // that day would delete the moved activity. So this marks the activity
      // as rescheduled and records where it came from; a real move needs
      // backend support that does not exist yet.
      await backendApi.updatePlannerActivity(activity.id, {
        status: "rescheduled",
        rescheduled_from_date: activity.date,
      });
      notify(`Marked as rescheduled for ${rescheduleDate}`);
      onClose();
    } catch {
      notify("Failed to reschedule activity.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${activity.title}"? This cannot be undone.`)) return;
    setSavingStatus(true);
    try {
      await backendApi.deletePlannerActivity(activity.id);
      queryClient.invalidateQueries({ queryKey: ["primary-planner-activities"] });
      queryClient.invalidateQueries({ queryKey: ["primary-today-workspace"] });
      notify("Activity deleted");
      onClose();
    } catch {
      notify("Failed to delete activity.");
    } finally {
      setSavingStatus(false);
    }
  };

  // Edit metadata
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMetadata(true);
    try {
      await backendApi.updatePlannerActivity(activity.id, {
        title,
        duration_minutes: duration,
        start_time: startTime || null,
        activity_type: activityType,
        resource_ids: resourceIds,
      });
      setEditing(false);
      notify("Activity metadata updated!");
      queryClient.invalidateQueries({ queryKey: ["primary-planner-activities"] });
      queryClient.invalidateQueries({ queryKey: ["primary-today-workspace"] });
    } catch (err) {
      notify("Failed to update activity details.");
    } finally {
      setSavingMetadata(false);
    }
  };

  const statusLabel =
    activity.status === "completed" ? "Completed" :
    activity.status === "partially completed" ? "Partially Completed" :
    activity.status === "skipped" ? "Skipped" :
    activity.status === "rescheduled" ? "Rescheduled" : "Planned";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
      <div
        ref={drawerRef}
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 sm:rounded-l-[28px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <div>
            <h2 id="drawer-title" className="text-lg font-black text-slate-900">
              Activity Details
            </h2>
            <p className="text-xs font-semibold text-slate-400 capitalize">
              Type: {activity.activity_type} • {statusLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-950 transition"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Metadata Form / Viewer */}
          {editing ? (
            <form onSubmit={handleSaveMetadata} className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <label className="block text-xs font-black text-slate-600">
                Activity Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </label>
              <label className="block text-xs font-black text-slate-600">
                Duration (minutes)
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  min="1"
                  max="120"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-black text-slate-600">Start time
                  <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
                <label className="block text-xs font-black text-slate-600">Activity type
                  <input value={activityType} onChange={(event) => setActivityType(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </label>
              </div>
              <fieldset>
                <legend className="text-xs font-black text-slate-600">Linked resources</legend>
                <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                  {resourceCandidates.map((resource) => {
                    const selected = resourceIds.includes(resource.id);
                    return <button type="button" key={resource.id} onClick={() => setResourceIds((current) => selected ? current.filter((id) => id !== resource.id) : [...current, resource.id])} className={cn("rounded-full px-2 py-1 text-[10px] font-bold", selected ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 ring-1 ring-indigo-100")}>{selected ? "✓ " : ""}{resource.title}</button>;
                  })}
                </div>
              </fieldset>
              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" disabled={savingMetadata} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm disabled:opacity-50">
                  {savingMetadata ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-lg bg-white border px-3 py-1.5 text-xs font-bold text-slate-600">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-extrabold text-indigo-950">{activity.title}</h3>
                <button onClick={() => setEditing(true)} className="rounded-xl border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-950 transition" aria-label="Edit details">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{activity.duration_minutes || 10} minutes</span>
                {activity.start_time && <span className="ml-2 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black text-[9px]">{activity.start_time.slice(0, 5)}</span>}
              </div>
            </div>
          )}

          {/* Quick Context Reference */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Teaching Context
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              <p><strong>Grade level:</strong> {typeof activity.context.level === "string" ? activity.context.level : "—"}</p>
              <p><strong>Learning area:</strong> {contextSubject || "—"}</p>
              <p><strong>Theme:</strong> {typeof activity.context.theme === "string" && activity.context.theme ? activity.context.theme : "Generic"}</p>
              {typeof activity.context.topic === "string" && activity.context.topic && <p><strong>Topic:</strong> {activity.context.topic}</p>}
            </div>
          </div>

          {/* Direct Resource Access */}
          <div>
            <h4 className="text-xs font-black text-slate-900 mb-3">Resource Attachments</h4>
            {linkedResources.length > 0 ? (
              <div className="space-y-2">
                {linkedResources.map((res) => (
                  <div key={res.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 shadow-sm bg-white hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 text-sm">
                        {resourceEmoji(res)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-800 truncate">{res.title}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{res.category}</p>
                      </div>
                    </div>
                    <a
                      href={res.fileUrl}
                      download
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
                      title="Download Resource"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <p className="text-xs text-slate-400 font-semibold">No resource files attached to this activity.</p>
              </div>
            )}
          </div>

          {sectionId && (students.data || []).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-extrabold text-slate-900">How did each child do?</h3>
              <p className="mt-1 text-[11px] font-medium text-[#454c86]">
                One rating per child for this activity. Tap again to change it.
              </p>
              <ul className="mt-3 space-y-2">
                {(students.data || []).map((student: PrimaryStudent) => (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e8e7fb] bg-white px-3 py-2"
                  >
                    <b className="text-xs text-slate-900">{student.code}</b>
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {OBSERVATION_RATINGS.map((rating) => {
                        const active = ratingByStudent[student.id] === rating;
                        const tone = ratingTone(rating);
                        return (
                          <button
                            key={rating}
                            type="button"
                            disabled={rateChild.isPending}
                            aria-pressed={active}
                            onClick={() => rateChild.mutate({ studentId: student.id, rating })}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50",
                              active
                                ? `${tone.chip} ${tone.text}`
                                : "border-[#e8e7fb] bg-white text-[#454c86] hover:bg-[#f7f4ff]",
                            )}
                          >
                            {RATING_LABELS[rating]}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes & Observations inputs */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="obs-input" className="text-xs font-black text-slate-700 flex items-center gap-1">
                <ClipboardList className="h-4 w-4 text-indigo-500" /> Classroom Observations
              </label>
              <textarea
                id="obs-input"
                value={observation}
                onChange={(e) => handleObsChange(e.target.value)}
                placeholder="What did you notice about student learning? e.g. Group B needed extra help identifying quantity 6."
                className="w-full min-h-[90px] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="notes-input" className="text-xs font-black text-slate-700 flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Teacher Operational Notes
              </label>
              <textarea
                id="notes-input"
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Operational notes, e.g. Print bigger counting flashcards tomorrow."
                className="w-full min-h-[90px] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleSaveNotesAndObs}
              disabled={savingNotes}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {savingNotes ? "Saving Changes..." : "Save Notes & Observations"}
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleUpdateStatus("completed")}
            disabled={savingStatus}
            aria-pressed={activity.status === "completed"}
            className={cn("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black shadow-sm transition disabled:opacity-50", activity.status === "completed" ? "bg-emerald-600 text-white ring-2 ring-emerald-300" : "border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")}
          >
            <Check className="h-3.5 w-3.5" /> Complete
          </button>
          <button
            onClick={() => handleUpdateStatus("partially completed")}
            disabled={savingStatus}
            aria-pressed={activity.status === "partially completed"}
            className={cn("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black shadow-sm transition disabled:opacity-50", activity.status === "partially completed" ? "bg-amber-500 text-white ring-2 ring-amber-300" : "border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100")}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Partial
          </button>
          <button
            onClick={() => handleUpdateStatus("skipped")}
            disabled={savingStatus}
            aria-pressed={activity.status === "skipped"}
            className={cn("flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black shadow-sm transition disabled:opacity-50", activity.status === "skipped" ? "bg-rose-600 text-white ring-2 ring-rose-300" : "border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100")}
          >
            <Ban className="h-3.5 w-3.5" /> Skip
          </button>
          {rescheduleDate ? <>
            <input type="date" value={rescheduleDate} min={activity.date} onChange={(event) => setRescheduleDate(event.target.value)} className="rounded-xl border border-violet-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700" aria-label="New activity date" />
            <button onClick={handleReschedule} disabled={savingStatus} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-black text-white disabled:opacity-50"><Calendar className="h-3.5 w-3.5" /> Confirm move</button>
          </> : <button onClick={() => setRescheduleDate(defaultRescheduleDate)} className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3.5 py-2 text-xs font-black text-violet-700 hover:bg-violet-100 border border-violet-100 shadow-sm transition"><Calendar className="h-3.5 w-3.5" /> Reschedule</button>}
          <button onClick={handleDelete} disabled={savingStatus} className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        </div>

      </div>
    </div>
  );
}
