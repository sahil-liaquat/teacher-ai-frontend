"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, Check, Edit2, Play, Plus, ArrowUp, ArrowDown, 
  Trash2, AlertTriangle, HelpCircle, Archive, Copy, MoreVertical, X, ChevronDown 
} from "lucide-react";
import { backendApi } from "@/lib/api";
import type { PrimaryCurriculumTheme, PrimaryCurriculumLesson, PrimaryAcademicYear } from "@/lib/api";
import { LEVEL_OPTIONS } from "./theme-list";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { TeachingDayEditor } from "./teaching-day-editor";

const MONTH_OPTIONS = [
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" }
];

const STEPS_TEMPLATES: Record<string, any[]> = {
  "Standard Routine": [
    { position: 0, step_type: "routine", title: "Arrival & Greeting", instructions: ["Welcome children warmly as they arrive.", "Help them store bags and settle in."], duration_minutes: 10, objective_indexes: [0] },
    { position: 1, step_type: "circle_time", title: "Circle Time discussion", instructions: ["Gather children in a circle.", "Take attendance and discuss theme keywords."], duration_minutes: 10, objective_indexes: [0] },
    { position: 2, step_type: "classroom_activity", title: "Exploratory Sensory Activity", instructions: ["Guide children through sensory stations."], duration_minutes: 20, objective_indexes: [0] },
    { position: 3, step_type: "routine", title: "Cleanup & Dismissal", instructions: ["Pack bag and cleanup the classroom.", "Sing goodbye song."], duration_minutes: 10, objective_indexes: [0] }
  ],
  "Story and Activity Day": [
    { position: 0, step_type: "warm_up", title: "Warm-up Song", instructions: ["Perform an interactive movement song to activate body."], duration_minutes: 10, objective_indexes: [0] },
    { position: 1, step_type: "story", title: "Theme Story Telling", instructions: ["Read story aloud using picture cards.", "Ask reflective questions about characters."], duration_minutes: 20, objective_indexes: [0] },
    { position: 2, step_type: "classroom_activity", title: "Sensory Roleplay Activity", instructions: ["Divide children in pairs.", "Act out scenes from the story."], duration_minutes: 25, objective_indexes: [0] },
    { position: 3, step_type: "routine", title: "Goodbye song", instructions: ["Recap story lessons.", "Sing goodbye song."], duration_minutes: 10, objective_indexes: [0] }
  ],
  "Worksheet-focused Day": [
    { position: 0, step_type: "warm_up", title: "Warm-up Recall", instructions: ["Review vocabulary matching from previous lesson."], duration_minutes: 10, objective_indexes: [0] },
    { position: 1, step_type: "introduction", title: "Concept Introduction", instructions: ["Draw concepts on the board.", "Demonstrate tracing strokes."], duration_minutes: 15, objective_indexes: [0] },
    { position: 2, step_type: "worksheet", title: "Printable Worksheet", instructions: ["Hand out worksheets.", "Support individual tracing work."], duration_minutes: 20, objective_indexes: [0] },
    { position: 3, step_type: "routine", title: "Class cleanup", duration_minutes: 15, instructions: ["Gather materials.", "Rate achievements."] }
  ],
  "Assessment and Recap Day": [
    { position: 0, step_type: "circle_time", title: "Weekly review", instructions: ["Ask volunteers to define theme keywords."], duration_minutes: 15, objective_indexes: [0] },
    { position: 1, step_type: "assessment", title: "Individual Checkpoint", instructions: ["Conduct quick 1-on-1 assessment worksheets.", "Mark observations record."], duration_minutes: 25, objective_indexes: [0] },
    { position: 2, step_type: "reflection", title: "Reflective goodbye", instructions: ["Sing matching goodbye song."], duration_minutes: 10, objective_indexes: [0] }
  ],
  "JKSCERT Full Day": [
    { position: 0, step_type: "circle_time", title: "Circle Time (Welcome, prayer, calendar, conversation, rhyme)", instructions: ["Welcome children and open with a short prayer.", "Mark the calendar and date together.", "Discuss theme keywords and let volunteers share."], duration_minutes: 15, objective_indexes: [0] },
    { position: 1, step_type: "free_play", title: "Free Play / Learning Corners", instructions: ["Let children explore learning corners freely.", "Observe and note each child's choices."], duration_minutes: 15, objective_indexes: [0] },
    { position: 2, step_type: "classroom_activity", title: "Theme Activity / Numeracy", instructions: ["Run the day's theme-based numeracy activity.", "Support children at different levels."], duration_minutes: 20, objective_indexes: [0] },
    { position: 3, step_type: "routine", title: "Snack", instructions: ["Wash hands before snack.", "Supervise snack time and table manners."], duration_minutes: 15, objective_indexes: [0] },
    { position: 4, step_type: "movement", title: "Music & Movement", instructions: ["Sing theme rhymes and follow with movement.", "Encourage participation and expression."], duration_minutes: 15, objective_indexes: [0] },
    { position: 5, step_type: "story", title: "Story Time / Emergent Literacy", instructions: ["Read aloud from the theme storybook.", "Ask questions about characters and sequence."], duration_minutes: 20, objective_indexes: [0] },
    { position: 6, step_type: "craft", title: "Art & Craft", instructions: ["Guide children through the theme craft activity.", "Display finished work on the wall."], duration_minutes: 20, objective_indexes: [0] },
    { position: 7, step_type: "practice", title: "Independent Learning Corners", instructions: ["Children practise skills independently at stations.", "Circulate and support where needed."], duration_minutes: 20, objective_indexes: [0] },
    { position: 8, step_type: "routine", title: "Lunch", instructions: ["Wash hands before lunch.", "Supervise lunch and tidy up afterwards."], duration_minutes: 30, objective_indexes: [0] },
    { position: 9, step_type: "movement", title: "Outdoor Play", instructions: ["Supervise outdoor free play.", "Encourage sharing and safe play."], duration_minutes: 20, objective_indexes: [0] },
    { position: 10, step_type: "reflection", title: "Goodbye Circle / Reflection", instructions: ["Recap the day's learning with children.", "Sing the goodbye song and share the parent update."], duration_minutes: 10, objective_indexes: [0] }
  ],
  "Blank Day": []
};

export function CurriculumPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Context states
  const [academicYears, setAcademicYears] = useState<PrimaryAcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>(LEVEL_OPTIONS[0].value);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Default August
  const [selectedThemeId, setSelectedThemeId] = useState<string>(""); // "" = all themes
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Curriculum map states
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState<boolean>(false);
  const [templateSlot, setTemplateSlot] = useState<{ week: number; day: number } | null>(null);
  const [templateDailyFocus, setTemplateDailyFocus] = useState<string>("");
  const [templateSlotRange, setTemplateSlotRange] = useState<{ week: number | null } | null>(null);
  const [monthMenuOpen, setMonthMenuOpen] = useState<boolean>(false);
  
  // Dialog confirmation states
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState<boolean>(false);
  const [batchArchiveRange, setBatchArchiveRange] = useState<{ week: number | null } | null>(null);
  const [replaceRangeConfirm, setReplaceRangeConfirm] = useState<{ templateName: string; range: { week: number | null }; occupiedCount: number } | null>(null);

  // Fetch Academic Years
  useEffect(() => {
    backendApi.adminPrimaryAcademicYears()
      .then((data) => {
        setAcademicYears(data);
        const active = data.find(y => y.is_active);
        if (active) setSelectedYearId(active.id);
        else if (data.length > 0) setSelectedYearId(data[0].id);
      })
      .catch((err) => toast({ title: "Failed to load academic years", description: err.message, variant: "error" }));
  }, [toast]);

  // Fetch Themes for dropdowns
  const { data: themes = [] } = useQuery<PrimaryCurriculumTheme[]>({
    queryKey: ["admin-primary-themes"],
    queryFn: () => backendApi.adminPrimaryThemes(),
  });

  // Fetch Lessons for the selected Class level
  const { data: lessons = [], isLoading: isLoadingLessons } = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["admin-primary-lessons", selectedLevel, selectedYearId],
    queryFn: () => backendApi.adminPrimaryLessons({ level: selectedLevel, academic_year_id: selectedYearId }),
    enabled: !!selectedLevel && !!selectedYearId,
  });

  // Group lessons by Month -> Week -> Day (optionally scoped to the month's theme)
  const filteredLessons = lessons.filter(l => l.month === selectedMonth && l.status !== "archived")
    .filter(l => !selectedThemeId || l.theme_id === selectedThemeId);
  const selectedTheme = themes.find(t => t.id === selectedThemeId) || null;

  // Month overview stats
  const totalSlots = 25;
  const filledCount = filteredLessons.length;
  const emptyCount = totalSlots - filledCount;
  const publishedCount = filteredLessons.filter(l => l.status === "published").length;
  const draftCount = filteredLessons.filter(l => l.status === "draft").length;
  const missingResourceCount = filteredLessons.filter(l => l.steps?.some(s => s.resource_category && (!s.resource_ids || s.resource_ids.length === 0))).length;
  
  // Find selected lesson
  const selectedLesson = filteredLessons.find(l => l.id === selectedLessonId) || filteredLessons[0] || null;
  const selectedTopic = selectedLesson
    ? themes.flatMap(t => t.topics).find(tp => tp.id === selectedLesson.topic_id) || null
    : null;

  // Sync selectedLessonId
  useEffect(() => {
    if (selectedLesson && selectedLessonId !== selectedLesson.id) {
      setSelectedLessonId(selectedLesson.id);
    } else if (!selectedLesson) {
      setSelectedLessonId(null);
    }
  }, [selectedLesson, selectedLessonId]);

  // Reorder teaching days
  const handleMoveDay = async (lesson: PrimaryCurriculumLesson, direction: "up" | "down") => {
    const currentPos = lesson.day || 1;
    const targetPos = direction === "up" ? currentPos - 1 : currentPos + 1;
    if (targetPos < 1 || targetPos > 5) return;

    // Find the lesson currently at targetPos in the same week
    const swapTarget = filteredLessons.find(l => l.week === lesson.week && l.day === targetPos);
    
    try {
      if (swapTarget) {
        await backendApi.adminUpdatePrimaryLesson(swapTarget.id, { day: currentPos });
      }
      await backendApi.adminUpdatePrimaryLesson(lesson.id, { day: targetPos });
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({ title: "Reordered teaching day" });
    } catch (err: any) {
      toast({ title: "Failed to reorder day", description: err.message, variant: "error" });
    }
  };

  const handleCreateFromTemplate = async (templateName: string) => {
    if (!selectedYearId) return;
    setIsTemplateDrawerOpen(false);

    // Batch mode (week or month): delegate to the range handler.
    if (templateSlotRange) {
      setTemplateSlot(null);
      await handleBatchCreateFromTemplate(templateName);
      return;
    }

    if (!templateSlot) return;

    const themeId = selectedThemeId || themes[0]?.id || "";
    const templateSteps = STEPS_TEMPLATES[templateName] || [];

    try {
      const created = await backendApi.adminCreatePrimaryLesson({
        academic_year_id: selectedYearId,
        level: selectedLevel,
        month: selectedMonth,
        week: templateSlot.week,
        day: templateSlot.day,
        theme_id: themeId,
        title: `Day ${templateSlot.day} - ${templateName}`,
        daily_focus: templateDailyFocus.trim() || null,
        objectives: ["Introduce key theme vocabulary"],
        vocabulary: ["cow", "farm"],
        assessment_questions: ["Can you name the animal?"],
        steps: templateSteps
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({ title: "Day added", description: "Created from template successfully." });
      setTemplateSlot(null);
      setTemplateDailyFocus("");
      setEditingLessonId(created.id);
      setIsEditorOpen(true);
    } catch (err: any) {
      toast({ title: "Failed to create day", description: err.message, variant: "error" });
    }
  };

  const handleBatchCreateFromTemplate = async (templateName: string) => {
    if (!templateSlotRange || !selectedYearId) return;
    const range = templateSlotRange;

    const weeks = range.week !== null ? [range.week] : [1, 2, 3, 4, 5];
    const days = [1, 2, 3, 4, 5];
    const allSlots = weeks.flatMap((week) => days.map((day) => ({ week, day })));

    // Identify empty vs occupied slots in the target week or month
    const occupiedSlots = allSlots.filter((slot) => filteredLessons.some(l => l.week === slot.week && l.day === slot.day));
    const emptySlots = allSlots.filter((slot) => !occupiedSlots.includes(slot));

    if (emptySlots.length === 0) {
      setTemplateSlotRange(null);
      setReplaceRangeConfirm({ templateName, range, occupiedCount: occupiedSlots.length });
      return;
    }

    const themeId = selectedThemeId || themes[0]?.id || "";
    const templateSteps = STEPS_TEMPLATES[templateName] || [];

    try {
      await Promise.all(emptySlots.map((slot) =>
        backendApi.adminCreatePrimaryLesson({
          academic_year_id: selectedYearId,
          level: selectedLevel,
          month: selectedMonth,
          week: slot.week,
          day: slot.day,
          theme_id: themeId,
          title: `Day ${slot.day} - ${templateName}`,
          objectives: ["Introduce key theme vocabulary"],
          vocabulary: ["cow", "farm"],
          assessment_questions: ["Can you name the animal?"],
          steps: templateSteps
        })
      ));
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({
        title: "Days added",
        description: occupiedSlots.length > 0
          ? `Prefilled ${emptySlots.length} empty slot(s) with "${templateName}". ${occupiedSlots.length} occupied slot(s) left untouched.`
          : `Prefilled ${emptySlots.length} empty slot(s) with "${templateName}".`
      });
    } catch (err: any) {
      toast({ title: "Failed to create days", description: err.message, variant: "error" });
    }
    setTemplateSlotRange(null);
  };

  const handleReplaceRangeWithTemplate = async () => {
    if (!replaceRangeConfirm || !selectedYearId) return;
    const { templateName, range, occupiedCount } = replaceRangeConfirm;
    setReplaceRangeConfirm(null);

    const weeks = range.week !== null ? [range.week] : [1, 2, 3, 4, 5];
    const days = [1, 2, 3, 4, 5];
    const targets = filteredLessons.filter((l) => weeks.includes(l.week ?? 0) && days.includes(l.day ?? 0));
    const allSlots = weeks.flatMap((week) => days.map((day) => ({ week, day })));

    const themeId = selectedThemeId || themes[0]?.id || "";
    const templateSteps = STEPS_TEMPLATES[templateName] || [];

    try {
      await Promise.all(targets.map((l) => backendApi.adminUpdatePrimaryLesson(l.id, { status: "archived" })));
      await Promise.all(allSlots.map((slot) =>
        backendApi.adminCreatePrimaryLesson({
          academic_year_id: selectedYearId,
          level: selectedLevel,
          month: selectedMonth,
          week: slot.week,
          day: slot.day,
          theme_id: themeId,
          title: `Day ${slot.day} - ${templateName}`,
          objectives: ["Introduce key theme vocabulary"],
          vocabulary: ["cow", "farm"],
          assessment_questions: ["Can you name the animal?"],
          steps: templateSteps
        })
      ));
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({
        title: "Range replaced",
        description: `Archived ${targets.length} existing lesson(s) and recreated ${allSlots.length} slot(s) with "${templateName}".`
      });
      setSelectedLessonId(null);
    } catch (err: any) {
      toast({ title: "Failed to replace range", description: err.message, variant: "error" });
    }
  };

  const handleBatchPublish = async (range: { week: number | null }) => {
    const draftLessons = filteredLessons.filter((l) => {
      if (range.week !== null) return l.week === range.week;
      return true;
    }).filter(l => l.status === "draft");

    // The backend refuses to publish lessons with no steps.
    const publishable = draftLessons.filter(l => l.steps && l.steps.length > 0);
    const skipped = draftLessons.length - publishable.length;

    if (publishable.length === 0) {
      toast({
        title: "Nothing to publish",
        description: skipped > 0
          ? "No draft lessons with classroom activities in this range."
          : "No draft lessons in this range.",
        variant: "error"
      });
      return;
    }

    try {
      await Promise.all(publishable.map(l => backendApi.adminPublishPrimaryLesson(l.id)));
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({
        title: "Published lessons",
        description: skipped > 0
          ? `Published ${publishable.length} lesson(s). Skipped ${skipped} with no activities.`
          : `Published ${publishable.length} lesson(s).`
      });
    } catch (err: any) {
      toast({ title: "Failed to publish", description: err.message, variant: "error" });
    }
  };

  const handleBatchArchive = async () => {
    if (!batchArchiveRange) return;
    const range = batchArchiveRange;
    setBatchArchiveRange(null);

    const targetLessons = filteredLessons.filter((l) => {
      if (range.week !== null) return l.week === range.week;
      return true;
    });

    if (targetLessons.length === 0) {
      toast({ title: "Nothing to archive", description: "No lessons in this range.", variant: "error" });
      return;
    }

    try {
      await Promise.all(targetLessons.map(l => backendApi.adminUpdatePrimaryLesson(l.id, { status: "archived" })));
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({ title: "Lessons archived", description: `Archived ${targetLessons.length} lesson(s).` });
      setSelectedLessonId(null);
    } catch (err: any) {
      toast({ title: "Failed to archive", description: err.message, variant: "error" });
    }
  };

  const handlePublishDay = async (lesson: PrimaryCurriculumLesson) => {
    if (!lesson.steps || lesson.steps.length === 0) {
      toast({ title: "Cannot publish", description: "Add at least one classroom activity before publishing.", variant: "error" });
      return;
    }
    try {
      await backendApi.adminPublishPrimaryLesson(lesson.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({ title: "Published lesson", description: `"${lesson.title}" is now live on Today's Plan.` });
    } catch (err: any) {
      toast({ title: "Failed to publish", description: err.message, variant: "error" });
    }
  };

  const handleArchiveDay = async () => {
    if (!selectedLesson) return;
    setArchiveConfirmOpen(false);
    try {
      await backendApi.adminUpdatePrimaryLesson(selectedLesson.id, { status: "archived" });
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({ title: "Day archived", description: "Lesson moved to history archives." });
      setSelectedLessonId(null);
    } catch (err: any) {
      toast({ title: "Failed to archive", description: err.message, variant: "error" });
    }
  };

  const handleDuplicateDay = async () => {
    if (!selectedLesson) return;
    try {
      const duplicated = await backendApi.adminDuplicatePrimaryLesson(selectedLesson.id);
      await queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
      toast({ title: "Duplicated day", description: `Created new draft draft.` });
      setSelectedLessonId(duplicated.id);
    } catch (err: any) {
      toast({ title: "Failed to duplicate", description: err.message, variant: "error" });
    }
  };

  // Render indicators
  const renderStatusIndicator = (lesson: PrimaryCurriculumLesson | undefined, week: number, day: number) => {
    if (!lesson) {
      return (
        <button 
          onClick={() => {
            setTemplateSlot({ week, day });
            setTemplateSlotRange(null);
            setTemplateDailyFocus("");
            setIsTemplateDrawerOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs text-slate-400 font-bold hover:text-blue-500 transition-colors"
        >
          <span className="h-3.5 w-3.5 rounded-full bg-slate-100 border border-dashed border-slate-300 inline-block" />
          <span>Empty Slot</span>
        </button>
      );
    }

    const hasMissingResource = lesson.steps?.some(s => s.resource_category && (!s.resource_ids || s.resource_ids.length === 0));

    let dotColor = "bg-slate-300";
    let statusLabel = "Draft";
    let pillClass = "bg-amber-50 text-amber-600 border-amber-100";
    if (lesson.status === "published") {
      dotColor = "bg-emerald-500";
      statusLabel = "Published";
      pillClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
    } else if (hasMissingResource) {
      dotColor = "bg-rose-500";
      statusLabel = "Missing Resource";
      pillClass = "bg-rose-50 text-rose-600 border-rose-100";
    } else if (lesson.status === "draft") {
      dotColor = "bg-amber-500";
      statusLabel = "Draft";
    }

    const isActive = selectedLessonId === lesson.id;

    return (
      <div className="flex items-center justify-between w-full gap-2">
        <button 
          onClick={() => setSelectedLessonId(lesson.id)}
          className={`flex items-center gap-2 text-left truncate flex-1 ${isActive ? "text-blue-600 font-extrabold" : "text-slate-700 font-medium"}`}
        >
          <span className={`h-3 w-3 rounded-full shrink-0 ${dotColor}`} />
          <span className="min-w-0">
            <span className="block truncate text-xs">{lesson.title || `Day ${day} Lesson`}</span>
            {lesson.daily_focus ? (
              <span className="block truncate text-[9px] font-medium text-slate-400">{lesson.daily_focus}</span>
            ) : null}
          </span>
        </button>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${pillClass}`}>
          {statusLabel}
        </span>
        <span className="shrink-0 text-[10px] font-bold text-slate-400">{(lesson.steps || []).length} steps</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button 
            disabled={day === 1} 
            onClick={() => handleMoveDay(lesson, "up")}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            title="Move to previous day"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button 
            disabled={day === 5} 
            onClick={() => handleMoveDay(lesson, "down")}
            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
            title="Move to next day"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-100 bg-white p-4 shadow-sm rounded-2xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Academic Year</span>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Class Level</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
            >
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Month</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Theme</span>
            <select
              value={selectedThemeId}
              onChange={(e) => setSelectedThemeId(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
            >
              <option value="">All themes</option>
              {themes.map((t) => (
                <option key={t.id} value={t.id}>{t.emoji ? `${t.emoji} ` : ""}{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMonthMenuOpen(!monthMenuOpen)}
              className="rounded-xl font-bold text-xs"
            >
              <ChevronDown className={`h-3.5 w-3.5 mr-1 transition-transform ${monthMenuOpen ? "rotate-180" : ""}`} />
              Month Actions
            </Button>
            {monthMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg z-20 animate-in fade-in duration-150">
                <button
                  onClick={() => {
                    setMonthMenuOpen(false);
                    setTemplateSlot(null);
                    setTemplateSlotRange({ week: null });
                    setIsTemplateDrawerOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 text-left"
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Quick-Fill Month
                </button>
                <button
                  onClick={() => {
                    setMonthMenuOpen(false);
                    handleBatchPublish({ week: null });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 text-left"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Publish Month
                </button>
                <button
                  onClick={() => {
                    setMonthMenuOpen(false);
                    setBatchArchiveRange({ week: null });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 text-left"
                >
                  <Archive className="h-3.5 w-3.5 text-rose-500" />
                  Archive Month
                </button>
              </div>
            )}
          </div>
          <Button
            variant={previewMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            className="rounded-xl font-bold text-xs"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            {previewMode ? "Exit Teacher View" : "Preview Month"}
          </Button>
        </div>
      </div>

      {/* Monthly theme banner */}
      {selectedTheme ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          {selectedTheme.hero_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedTheme.hero_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="relative bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-slate-900/20 px-5 py-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Theme · {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}</span>
            <h2 className="mt-0.5 text-lg font-black text-white">
              {selectedTheme.emoji ? `${selectedTheme.emoji} ` : ""}{selectedTheme.name}
            </h2>
            <p className="text-xs text-slate-300">Monthly theme with its header image — lessons created here inherit it.</p>
          </div>
        </div>
      ) : null}

      {/* Month overview stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Empty Slots", value: emptyCount, tone: "text-slate-500 bg-slate-50 border-slate-200", hint: "Click any slot to add a day" },
          { label: "Drafts", value: draftCount, tone: "text-amber-600 bg-amber-50 border-amber-100", hint: "Ready to publish" },
          { label: "Published", value: publishedCount, tone: "text-emerald-600 bg-emerald-50 border-emerald-100", hint: "Live for teachers" },
          { label: "Missing Resources", value: missingResourceCount, tone: "text-rose-600 bg-rose-50 border-rose-100", hint: "Attach printables" },
          { label: "Filled Total", value: filledCount, tone: "text-blue-600 bg-blue-50 border-blue-100", hint: "Of 25 slots" }
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border px-4 py-3 ${stat.tone}`}>
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-wider">{stat.label}</div>
            <div className="mt-0.5 text-[10px] opacity-70">{stat.hint}</div>
          </div>
        ))}
      </div>

      {previewMode ? (
        <div className="border border-slate-100 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label} Timeline Preview
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)}>Close Preview</Button>
          </div>
          {filteredLessons.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">No published lessons for this month.</div>
          ) : (
            <div className="space-y-6">
              {filteredLessons.sort((a,b) => ((a.week || 0)*10 + (a.day||0)) - ((b.week || 0)*10 + (b.day||0))).map((l) => (
                <div key={l.id} className="border border-slate-100 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs font-extrabold text-blue-500 uppercase">Week {l.week} · Day {l.day}</span>
                    <span className="text-sm font-bold text-slate-800">{l.title}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Objectives:</span> {l.objectives?.join(", ") || "None"}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {l.steps?.map((s) => (
                      <div key={s.id} className="bg-slate-50 p-2.5 rounded-lg border">
                        <div className="text-xs font-bold text-slate-800">{s.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{s.step_type} · {s.duration_minutes}m</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-12 xl:items-start">
          {/* Left Column: Curriculum Map */}
          <div className="md:col-span-7 xl:col-span-8 border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-md font-extrabold text-slate-800">
                Curriculum Map ({MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label})
              </h2>
              {emptyCount > 0 && (
                <button
                  onClick={() => {
                    setTemplateSlot(null);
                    setTemplateSlotRange({ week: null });
                    setIsTemplateDrawerOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick-Fill {emptyCount} empty slot{emptyCount === 1 ? "" : "s"}
                </button>
              )}
            </div>

            {filledCount === 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-slate-600">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p>
                  <strong className="text-slate-800">This month is empty.</strong> Use <strong>Month Actions → Quick-Fill Month</strong> (top
                  right) to prefill all 25 slots with a routine template, or click any <strong>Empty Slot</strong> below to add a single day.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((weekNum) => (
                <div key={weekNum} className="border border-slate-100 rounded-xl p-3.5 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Week {weekNum}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <button
                        onClick={() => {
                          setTemplateSlot(null);
                          setTemplateSlotRange({ week: weekNum });
                          setIsTemplateDrawerOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Quick-Fill
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => handleBatchPublish({ week: weekNum })}
                        className="text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Publish All
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => setBatchArchiveRange({ week: weekNum })}
                        className="text-rose-500 hover:text-rose-600 hover:underline"
                      >
                        Archive All
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((dayNum) => {
                      const lesson = filteredLessons.find(l => l.week === weekNum && l.day === dayNum);
                      return (
                        <div key={dayNum} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                          <span className="text-[10px] font-black text-slate-400 w-12 shrink-0">Day {dayNum}</span>
                          <div className="flex-1 min-w-0">
                            {renderStatusIndicator(lesson, weekNum, dayNum)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Selected Day Summary */}
          <div className="md:col-span-5 xl:col-span-4 space-y-4">
            {selectedLesson ? (
              <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Week {selectedLesson.week} · Day {selectedLesson.day}</span>
                  <h2 className="text-md font-black text-slate-800 leading-snug mt-1">{selectedLesson.title || "Lesson Summary"}</h2>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Theme</span>
                    <span className="text-slate-800 font-bold">{themes.find(t => t.id === selectedLesson.theme_id)?.name || "Not Specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Topic</span>
                    <span className="text-slate-800 font-bold">{selectedTopic?.name || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Sub Theme</span>
                    <span className="text-slate-800 font-bold">{selectedTopic?.subtheme || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Today's Focus</span>
                    <span className="text-right text-slate-800 font-bold">{selectedLesson.daily_focus || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Total Duration</span>
                    <span className="text-slate-800 font-bold">{selectedLesson.steps?.reduce((a,c) => a + c.duration_minutes, 0)} mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Objectives</span>
                    <span className="text-slate-800 font-bold">{selectedLesson.objectives?.length || 0} objective(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Classroom Activities</span>
                    <span className="text-slate-800 font-bold">{selectedLesson.steps?.length || 0} steps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Resources Attached</span>
                    <span className="text-slate-800 font-bold">
                      {selectedLesson.steps?.reduce((a,c) => a + (c.resource_ids?.length || 0), 0) || 0} file(s)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Status</span>
                    <span className={`font-black ${selectedLesson.status === "published" ? "text-emerald-500" : "text-amber-500"}`}>
                      {selectedLesson.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2 pt-2">
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setEditingLessonId(selectedLesson.id);
                      setIsEditorOpen(true);
                    }}
                    className="w-full rounded-xl font-bold"
                  >
                    <Edit2 className="h-4 w-4 mr-1.5" />
                    Edit Day
                  </Button>

                  {selectedLesson.status !== "published" && (
                    <Button 
                      variant="outline" 
                      onClick={() => handlePublishDay(selectedLesson)}
                      className="w-full rounded-xl font-bold"
                    >
                      <Check className="h-4 w-4 mr-1.5 text-emerald-500" />
                      Publish Day
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      onClick={handleDuplicateDay}
                      className="flex-1 rounded-xl text-slate-500 font-bold"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setArchiveConfirmOpen(true)}
                      className="flex-1 rounded-xl text-rose-500 hover:bg-rose-50 font-bold"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-100 bg-white p-6 rounded-2xl shadow-sm text-center">
                <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-extrabold text-slate-800 mt-3">Select a teaching slot</h3>
                <p className="text-xs text-slate-400 mt-1">Choose any configured day from the map to view its details or add a lesson template to begin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Chooser Modal */}
      {isTemplateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {templateSlotRange
                  ? (templateSlotRange.week !== null ? `Quick-Fill Week ${templateSlotRange.week}` : "Quick-Fill Month")
                  : "Add Teaching Day"}
              </h3>
              <button onClick={() => setIsTemplateDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {templateSlotRange
                ? "Select a lesson template. Every empty slot in the target range will be created and prefilled with it:"
                : "Select a lesson template to prefill the classroom activities and objectives for this slot:"}
            </p>
            {!templateSlotRange && (
              <div className="mt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase">Today's Focus (optional)</label>
                <input
                  type="text"
                  value={templateDailyFocus}
                  onChange={(e) => setTemplateDailyFocus(e.target.value)}
                  placeholder="e.g. Recognise and name farm animals"
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            <div className="mt-4 space-y-2">
              {[
                { name: "Standard Routine", desc: "Prefilled Arrival, Circle Time, Sensory Activity, Cleanup." },
                { name: "Story and Activity Day", desc: "Warm-up, Theme Storytelling, Roleplay Activity." },
                { name: "Worksheet-focused Day", desc: "Introduction, Worksheet Practice, Color/Trace." },
                { name: "Assessment and Recap Day", desc: "Checkpoint Worksheets, reflection discussions." },
                { name: "JKSCERT Full Day", desc: "JKSCERT routine — Circle Time, Free Play, Theme/Numeracy, Snack, Music, Story, Art & Craft, Lunch, Outdoor Play." },
                { name: "Blank Day", desc: "Start with an empty classroom steps editor." }
              ].map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleCreateFromTemplate(tpl.name)}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">{tpl.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tpl.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">Archive Teaching Day?</h3>
            <p className="text-sm leading-relaxed text-slate-500 mt-2">
              Are you sure you want to archive this day? This will remove it from the active map, but preserve its historical record for previous school years.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setArchiveConfirmOpen(false)} className="rounded-xl border font-bold">Cancel</Button>
              <Button onClick={handleArchiveDay} className="rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600">Archive Day</Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Archive Confirmation Modal */}
      {batchArchiveRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">
              {batchArchiveRange.week !== null ? `Archive Week ${batchArchiveRange.week}?` : "Archive Entire Month?"}
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 mt-2">
              Are you sure you want to archive all {batchArchiveRange.week !== null ? `lessons in Week ${batchArchiveRange.week}` : "lessons in this month"}? This will remove them from the active map, but preserve their historical records for previous school years.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setBatchArchiveRange(null)} className="rounded-xl border font-bold">Cancel</Button>
              <Button onClick={handleBatchArchive} className="rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600">Archive All</Button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Range Confirmation Modal */}
      {replaceRangeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800">
              Replace {replaceRangeConfirm.occupiedCount} lesson{replaceRangeConfirm.occupiedCount === 1 ? "" : "s"} with "{replaceRangeConfirm.templateName}"?
            </h3>
            <p className="text-sm leading-relaxed text-slate-500 mt-2">
              Every slot in this {replaceRangeConfirm.range.week !== null ? `week (Week ${replaceRangeConfirm.range.week})` : "month"} already has a lesson. To apply the new template, the existing lesson{replaceRangeConfirm.occupiedCount === 1 ? " is" : "s are"} archived (kept in history for previous school years) and the range is recreated with "{replaceRangeConfirm.templateName}".
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setReplaceRangeConfirm(null)} className="rounded-xl border font-bold">Cancel</Button>
              <Button onClick={handleReplaceRangeWithTemplate} className="rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Replace All</Button>
            </div>
          </div>
        </div>
      )}

      {/* Day Editor overlay */}
      {isEditorOpen && editingLessonId && (
        <TeachingDayEditor 
          lessonId={editingLessonId} 
          onClose={() => {
            setIsEditorOpen(false);
            setEditingLessonId(null);
            queryClient.invalidateQueries({ queryKey: ["admin-primary-lessons", selectedLevel] });
          }}
        />
      )}
    </div>
  );
}
