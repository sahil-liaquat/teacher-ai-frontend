"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  X, Check, ArrowRight, ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, 
  Paperclip, Save, Sparkles, AlertTriangle, FileText, CheckCircle 
} from "lucide-react";
import { backendApi } from "@/lib/api";
import type { PrimaryCurriculumLesson, PrimaryCurriculumTheme, PrimaryResource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const STEP_TYPE_OPTIONS = [
  { value: "circle_time", label: "Circle Time" },
  { value: "story", label: "Story" },
  { value: "flashcards", label: "Flashcards" },
  { value: "worksheet", label: "Worksheet" },
  { value: "craft", label: "Craft" },
  { value: "song", label: "Song" },
  { value: "movement", label: "Movement" },
  { value: "game", label: "Game" },
  { value: "assessment", label: "Assessment" },
  { value: "reflection", label: "Reflection" },
  { value: "parent_note", label: "Parent Note" }
];

interface TeachingDayEditorProps {
  lessonId: string;
  onClose: () => void;
}

export function TeachingDayEditor({ lessonId, onClose }: TeachingDayEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<number>(1); // 1 to 4
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  
  // Lesson form states
  const [title, setTitle] = useState<string>("");
  const [themeId, setThemeId] = useState<string>("");
  const [topicId, setTopicId] = useState<string>("");
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [duration, setDuration] = useState<number>(60);
  const [language, setLanguage] = useState<string>("English");
  
  const [objectives, setObjectives] = useState<string[]>([]);
  const [vocabulary, setVocabulary] = useState<string[]>([]);
  
  const [homework, setHomework] = useState<string>("");
  const [parentUpdate, setParentUpdate] = useState<string>("");
  const [assessmentQuestions, setAssessmentQuestions] = useState<string[]>([]);
  
  // Activities (steps) state
  const [steps, setSteps] = useState<any[]>([]);

  // Resource picker state
  const [isResourceDrawerOpen, setIsResourceDrawerOpen] = useState<boolean>(false);
  const [activeStepIndexForResource, setActiveStepIndexForResource] = useState<number | null>(null);
  const [resourceSearch, setResourceSearch] = useState<string>("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<string>("");
  const [resourcesList, setResourcesList] = useState<PrimaryResource[]>([]);

  // Fetch themes
  const { data: themes = [] } = useQuery<PrimaryCurriculumTheme[]>({
    queryKey: ["admin-primary-themes"],
    queryFn: () => backendApi.adminPrimaryThemes(),
  });

  const selectedTheme = themes.find(t => t.id === themeId) || null;
  const topics = selectedTheme?.topics || [];

  useEffect(() => {
    if (selectedTheme) {
      setLanguage(selectedTheme.language);
    }
  }, [selectedTheme]);

  // Fetch lesson details
  useEffect(() => {
    backendApi.adminPrimaryLesson(lessonId)
      .then((data) => {
        setTitle(data.title || "");
        setThemeId(data.theme_id || "");
        setTopicId(data.topic_id || "");
        setDayNumber(data.day || 1);
        setObjectives(data.objectives || []);
        setVocabulary(data.vocabulary || []);
        setHomework(data.homework || "");
        setParentUpdate(data.parent_update || "");
        setAssessmentQuestions(data.assessment_questions || []);
        
        // Map steps
        const mappedSteps = (data.steps || []).map((s: any) => ({
          id: s.id,
          position: s.position,
          step_type: s.step_type,
          title: s.title,
          instructions: s.instructions || [],
          duration_minutes: s.duration_minutes || 10,
          objective_indexes: s.objective_indexes || [0],
          resource_category: s.resource_category || "",
          resource_ids: s.resource_ids || [],
          isExpanded: false
        }));
        setSteps(mappedSteps.sort((a,b) => a.position - b.position));
        
        const totalStepDuration = mappedSteps.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        setDuration(totalStepDuration || 60);
      })
      .catch((err) => toast({ title: "Failed to load lesson details", description: err.message, variant: "error" }));
  }, [lessonId, toast]);

  // Load Resources for search
  useEffect(() => {
    if (isResourceDrawerOpen) {
      backendApi.adminResources({ search: resourceSearch, category: resourceCategoryFilter })
        .then((res) => setResourcesList(res.items))
        .catch((err) => toast({ title: "Failed to load resources", description: err.message, variant: "error" }));
    }
  }, [isResourceDrawerOpen, resourceSearch, resourceCategoryFilter, toast]);

  // Debounced Autosave effect
  const firstUpdate = useRef(true);
  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await backendApi.adminUpdatePrimaryLesson(lessonId, {
          title,
          theme_id: themeId,
          topic_id: topicId || null,
          day: dayNumber,
          language,
          objectives,
          vocabulary,
          homework,
          parent_update: parentUpdate,
          assessment_questions: assessmentQuestions
        });
        
        // Save steps payload
        const cleanedSteps = steps.map((s, idx) => ({
          position: idx,
          step_type: s.step_type,
          title: s.title,
          instructions: s.instructions,
          duration_minutes: s.duration_minutes,
          objective_indexes: s.objective_indexes,
          resource_category: s.resource_category || null,
          resource_ids: s.resource_ids || []
        }));
        await backendApi.adminReplacePrimarySteps(lessonId, cleanedSteps);
        
        setSaveStatus("saved");
      } catch (err: any) {
        setSaveStatus("unsaved");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    title, themeId, topicId, dayNumber, language, 
    objectives, vocabulary, homework, parentUpdate, 
    assessmentQuestions, steps, lessonId
  ]);

  // Step calculations
  const totalActivitiesDuration = steps.reduce((sum, s) => sum + s.duration_minutes, 0);

  // Field manipulation helpers
  const handleAddObjective = () => setObjectives([...objectives, ""]);
  const handleRemoveObjective = (idx: number) => setObjectives(objectives.filter((_, i) => i !== idx));
  const handleUpdateObjective = (idx: number, val: string) => {
    const updated = [...objectives];
    updated[idx] = val;
    setObjectives(updated);
  };

  const handleAddVocabulary = () => setVocabulary([...vocabulary, ""]);
  const handleRemoveVocabulary = (idx: number) => setVocabulary(vocabulary.filter((_, i) => i !== idx));
  const handleUpdateVocabulary = (idx: number, val: string) => {
    const updated = [...vocabulary];
    updated[idx] = val;
    setVocabulary(updated);
  };

  const handleAddAssessment = () => setAssessmentQuestions([...assessmentQuestions, ""]);
  const handleRemoveAssessment = (idx: number) => setAssessmentQuestions(assessmentQuestions.filter((_, i) => i !== idx));
  const handleUpdateAssessment = (idx: number, val: string) => {
    const updated = [...assessmentQuestions];
    updated[idx] = val;
    setAssessmentQuestions(updated);
  };

  // Activity cards helpers
  const handleAddStep = () => {
    const newStep = {
      position: steps.length,
      step_type: "circle_time",
      title: "New Circle Time Activity",
      instructions: ["Explain core concept."],
      duration_minutes: 10,
      objective_indexes: [0],
      resource_category: "",
      resource_ids: [],
      isExpanded: true
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleUpdateStep = (idx: number, fields: Partial<any>) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], ...fields };
    setSteps(updated);
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    
    const updated = [...steps];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    setSteps(updated.map((s, i) => ({ ...s, position: i })));
  };

  // Resource triggers
  const handleOpenResourceDrawer = (stepIndex: number, category: string) => {
    setActiveStepIndexForResource(stepIndex);
    setResourceCategoryFilter(category);
    setIsResourceDrawerOpen(true);
  };

  const handleAttachResource = (resourceId: string) => {
    if (activeStepIndexForResource === null) return;
    const step = steps[activeStepIndexForResource];
    const attached = step.resource_ids || [];
    if (attached.includes(resourceId)) return;
    
    handleUpdateStep(activeStepIndexForResource, {
      resource_ids: [...attached, resourceId]
    });
    setIsResourceDrawerOpen(false);
    toast({ title: "Resource attached" });
  };

  const handleRemoveResource = (stepIdx: number, resourceId: string) => {
    const step = steps[stepIdx];
    const attached = step.resource_ids || [];
    handleUpdateStep(stepIdx, {
      resource_ids: attached.filter((id: string) => id !== resourceId)
    });
  };

  // Pre-publish validations
  const getValidationIssues = () => {
    const issues: string[] = [];
    if (!title.trim()) issues.push("Day title is required.");
    if (!themeId) issues.push("Theme must be selected.");
    if (objectives.length === 0 || !objectives[0].trim()) issues.push("Add at least one learning objective.");
    if (steps.length === 0) issues.push("Add at least one classroom activity.");
    
    steps.forEach((s, i) => {
      if (!s.title.trim()) issues.push(`Activity ${i + 1} is missing a title.`);
      if (s.duration_minutes <= 0) issues.push(`Activity "${s.title || i+1}" has invalid duration.`);
    });

    if (totalActivitiesDuration !== duration) {
      issues.push(`Duration warning: Total day duration is set to ${duration}m but activities sum to ${totalActivitiesDuration}m.`);
    }
    return issues;
  };

  const handlePublish = async () => {
    const issues = getValidationIssues();
    const errors = issues.filter(x => !x.includes("Duration warning"));
    if (errors.length > 0) {
      toast({ title: "Cannot publish", description: errors[0], variant: "error" });
      return;
    }
    
    try {
      await backendApi.adminUpdatePrimaryLesson(lessonId, { status: "published" });
      toast({ title: "Published Day", description: "Successfully published curriculum map updates." });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to publish", description: err.message, variant: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-50 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Day Plan Editor</span>
              <h2 className="text-md font-black text-slate-800 truncate max-w-md">{title || "Untitled Day"}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span className={`h-2 w-2 rounded-full ${
                saveStatus === "saved" ? "bg-emerald-500" : saveStatus === "saving" ? "bg-blue-500 animate-pulse" : "bg-amber-500"
              }`} />
              {saveStatus === "saved" ? "Autosaved" : saveStatus === "saving" ? "Saving..." : "Unsaved changes"}
            </span>

            <Button 
              variant="outline" 
              onClick={() => {
                toast({ title: "Draft Saved", description: "All edits persisted successfully." });
                onClose();
              }}
              className="rounded-xl font-bold text-xs"
            >
              <Save className="h-4 w-4 mr-1 text-slate-500" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Stages Navigation Tabs */}
        <div className="flex border-b bg-white px-6 py-2 gap-6 text-xs font-bold text-slate-400">
          {[
            { stageNum: 1, label: "Day Details" },
            { stageNum: 2, label: "Learning & Notes" },
            { stageNum: 3, label: "Classroom Flow" },
            { stageNum: 4, label: "Review & Publish" }
          ].map((stg) => (
            <button
              key={stg.stageNum}
              onClick={() => setStage(stg.stageNum)}
              className={`pb-2 border-b-2 transition-all ${
                stage === stg.stageNum ? "border-blue-600 text-blue-600 font-extrabold" : "border-transparent hover:text-slate-600"
              }`}
            >
              {stg.stageNum}. {stg.label}
            </button>
          ))}
        </div>

        {/* Main Content Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Stage 1: Day Details */}
          {stage === 1 && (
            <div className="border border-slate-100 bg-white p-6 rounded-2xl shadow-xs space-y-5">
              <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2">Step 1: Day Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Day Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Welcome to Kindergarten!"
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Theme</label>
                  <select
                    value={themeId}
                    onChange={(e) => {
                      setThemeId(e.target.value);
                      setTopicId("");
                    }}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Theme...</option>
                    {themes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Topic</label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    disabled={!themeId}
                  >
                    <option value="">Select Topic...</option>
                    {topics.map(tp => (
                      <option key={tp.id} value={tp.id}>{tp.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Teaching Day (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Total Day Duration (minutes)</label>
                  <input
                    type="number"
                    min={10}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stage 2: Learning & Notes */}
          {stage === 2 && (
            <div className="space-y-6">
              {/* Objectives */}
              <div className="border border-slate-100 bg-white p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-800">Learning Objectives</h3>
                  <Button variant="ghost" size="sm" onClick={handleAddObjective} className="text-blue-600 font-bold hover:bg-blue-50">
                    <Plus className="h-4 w-4 mr-1" /> Add Objective
                  </Button>
                </div>
                <div className="space-y-2">
                  {objectives.map((obj, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{idx + 1}.</span>
                      <input
                        type="text"
                        value={obj}
                        onChange={(e) => handleUpdateObjective(idx, e.target.value)}
                        placeholder="e.g. Identity common farm animal shapes"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button onClick={() => handleRemoveObjective(idx)} className="text-rose-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {objectives.length === 0 && (
                    <div className="text-xs text-slate-400 italic">No learning objectives added.</div>
                  )}
                </div>
              </div>

              {/* Vocabulary */}
              <div className="border border-slate-100 bg-white p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-800">Key Vocabulary Words</h3>
                  <Button variant="ghost" size="sm" onClick={handleAddVocabulary} className="text-blue-600 font-bold hover:bg-blue-50">
                    <Plus className="h-4 w-4 mr-1" /> Add Word
                  </Button>
                </div>
                <div className="space-y-2">
                  {vocabulary.map((word, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={word}
                        onChange={(e) => handleUpdateVocabulary(idx, e.target.value)}
                        placeholder="e.g. Cow"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button onClick={() => handleRemoveVocabulary(idx)} className="text-rose-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {vocabulary.length === 0 && (
                    <div className="text-xs text-slate-400 italic">No vocabulary words added.</div>
                  )}
                </div>
              </div>

              {/* Notes, Assessments, Homework */}
              <div className="border border-slate-100 bg-white p-6 rounded-2xl shadow-xs space-y-5">
                <h3 className="text-sm font-extrabold text-slate-800 border-b pb-2">Classroom Deliverables & Notes</h3>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Homework Assignment</label>
                  <textarea
                    value={homework}
                    onChange={(e) => setHomework(e.target.value)}
                    placeholder="e.g. Draw and color a cow shape at home."
                    rows={2}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Parent updates summary</label>
                  <textarea
                    value={parentUpdate}
                    onChange={(e) => setParentUpdate(e.target.value)}
                    placeholder="e.g. Today we reviewed farm animals and their sounds."
                    rows={2}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Assessment Questions */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Assessment Questions</label>
                    <Button variant="ghost" size="sm" onClick={handleAddAssessment} className="text-blue-600 font-bold text-[10px] uppercase">
                      + Add Question
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {assessmentQuestions.map((q, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => handleUpdateAssessment(idx, e.target.value)}
                          placeholder="e.g. What does a cow say?"
                          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={() => handleRemoveAssessment(idx)} className="text-rose-400 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: Classroom Flow */}
          {stage === 3 && (
            <div className="space-y-6">
              
              {/* Duration Warning Banner */}
              {totalActivitiesDuration !== duration && (
                <div className="flex items-center justify-between border border-amber-100 bg-amber-50 p-4 rounded-xl text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>
                      Duration Mismatch: Total day is set to <strong>{duration}m</strong> but activities sum to <strong>{totalActivitiesDuration}m</strong>.
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDuration(totalActivitiesDuration)}
                    className="text-amber-900 bg-amber-100 hover:bg-amber-200 font-bold shrink-0 text-[10px]"
                  >
                    Set Total Duration to {totalActivitiesDuration}m
                  </Button>
                </div>
              )}

              {/* Activity Cards List */}
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="border border-slate-100 bg-white rounded-2xl shadow-xs overflow-hidden"
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between bg-slate-50/50 px-4 py-3 border-b">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="text-[10px] font-black text-slate-400 w-8">#{idx+1}</span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleUpdateStep(idx, { title: e.target.value })}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs font-bold text-slate-800 focus:outline-none flex-1 truncate"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase">
                          {step.step_type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{step.duration_minutes}m</span>
                        
                        <button 
                          disabled={idx === 0}
                          onClick={() => handleMoveStep(idx, "up")}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button 
                          disabled={idx === steps.length - 1}
                          onClick={() => handleMoveStep(idx, "down")}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleUpdateStep(idx, { isExpanded: !step.isExpanded })}
                          className="text-xs text-blue-600 font-bold hover:underline px-1.5"
                        >
                          {step.isExpanded ? "Collapse" : "Edit"}
                        </button>
                        
                        <button onClick={() => handleRemoveStep(idx)} className="p-1 text-rose-400 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable details area */}
                    {step.isExpanded && (
                      <div className="p-5 space-y-4 text-xs border-t">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Activity Type</label>
                            <select
                              value={step.step_type}
                              onChange={(e) => handleUpdateStep(idx, { step_type: e.target.value })}
                              className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
                            >
                              {STEP_TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Duration (mins)</label>
                            <input
                              type="number"
                              min={1}
                              value={step.duration_minutes}
                              onChange={(e) => handleUpdateStep(idx, { duration_minutes: Number(e.target.value) })}
                              className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Resource Category</label>
                            <select
                              value={step.resource_category || ""}
                              onChange={(e) => handleUpdateStep(idx, { resource_category: e.target.value })}
                              className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white"
                            >
                              <option value="">None</option>
                              {["worksheet", "flashcards", "story", "craft_guide", "song_lyrics", "game_rules", "assessment"].map(cat => (
                                <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Objectives linking */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Link learning objectives</label>
                          <div className="flex flex-wrap gap-2.5">
                            {objectives.map((obj, oIdx) => {
                              const isChecked = step.objective_indexes?.includes(oIdx);
                              return (
                                <label key={oIdx} className="flex items-center gap-1.5 bg-slate-50 border rounded-lg px-2.5 py-1 hover:bg-slate-100 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = step.objective_indexes || [];
                                      const newChecked = e.target.checked 
                                        ? [...checked, oIdx] 
                                        : checked.filter((x: number) => x !== oIdx);
                                      handleUpdateStep(idx, { objective_indexes: newChecked });
                                    }}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-[10px] font-bold text-slate-600 truncate max-w-xs">{obj || `Objective ${oIdx+1}`}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Repeatable instructions */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Teacher Instructions</label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                const insts = step.instructions || [];
                                handleUpdateStep(idx, { instructions: [...insts, ""] });
                              }}
                              className="text-blue-600 font-bold text-[10px] p-0 hover:bg-transparent"
                            >
                              + Add Row
                            </Button>
                          </div>
                          <div className="space-y-1.5">
                            {(step.instructions || []).map((ins: string, insIdx: number) => (
                              <div key={insIdx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={ins}
                                  onChange={(e) => {
                                    const insts = [...step.instructions];
                                    insts[insIdx] = e.target.value;
                                    handleUpdateStep(idx, { instructions: insts });
                                  }}
                                  placeholder="Step instruction..."
                                  className="flex-1 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                                />
                                <button 
                                  onClick={() => {
                                    const insts = (step.instructions || []).filter((_: any, i: number) => i !== insIdx);
                                    handleUpdateStep(idx, { instructions: insts });
                                  }}
                                  className="text-rose-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explicit Resource attachments */}
                        {step.resource_category && (
                          <div className="space-y-2 border-t pt-3">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-slate-400 uppercase">Attached Resources</label>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenResourceDrawer(idx, step.resource_category)}
                                className="text-blue-600 font-bold text-[10px] p-0 hover:bg-transparent"
                              >
                                <Paperclip className="h-3 w-3 mr-1" /> Attach Resource
                              </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {(step.resource_ids || []).map((rId: string) => (
                                <div key={rId} className="flex items-center gap-1.5 bg-slate-50 border rounded-lg pl-2.5 pr-1.5 py-1 text-[10px]">
                                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                                  <span className="font-bold text-slate-700 truncate max-w-xs">{rId}</span>
                                  <button onClick={() => handleRemoveResource(idx, rId)} className="text-rose-400 hover:text-rose-600 pl-1.5">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              {(!step.resource_ids || step.resource_ids.length === 0) && (
                                <div className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  No resource selected. Matching algorithm will auto-pair at generation time.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={handleAddStep} 
                className="w-full border-dashed border-slate-300 py-6 rounded-2xl font-bold hover:bg-slate-100"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Classroom Activity Card
              </Button>
            </div>
          )}

          {/* Stage 4: Review & Publish */}
          {stage === 4 && (
            <div className="space-y-6">
              {/* Validation panel */}
              <div className="border border-slate-100 bg-white p-5 rounded-2xl shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pre-publish checklist</h4>
                
                <div className="space-y-2">
                  {getValidationIssues().map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      {issue.includes("warning") ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-amber-700 font-medium">{issue}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-rose-700 font-semibold">{issue}</span>
                        </>
                      )}
                    </div>
                  ))}
                  {getValidationIssues().length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                      <CheckCircle className="h-4 w-4" />
                      All validation checks passed! Ready to publish.
                    </div>
                  )}
                </div>
              </div>

              {/* Classroom OS Teacher View Preview */}
              <div className="border border-slate-200 bg-slate-900 text-slate-100 p-6 rounded-3xl space-y-6 shadow-2xl">
                <div className="border-b border-slate-800 pb-4">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Today's Classroom Plan</div>
                  <h2 className="text-lg font-bold mt-1">{title || "Untitled Lesson"}</h2>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Learning Objectives</span>
                  <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
                    {objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Activities Timeline</span>
                  <div className="space-y-3">
                    {steps.map((st, i) => (
                      <div key={i} className="flex gap-4 items-start border-l-2 border-slate-700 pl-4 py-1">
                        <span className="text-xs font-bold text-slate-400 w-10 shrink-0">{st.duration_minutes}m</span>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-100">{st.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-normal">Instructions: {st.instructions?.join(" -> ")}</p>
                          {st.resource_ids?.length > 0 && (
                            <span className="text-[9px] bg-blue-900/50 text-blue-300 font-bold px-2 py-0.5 rounded-full">
                              Attached: {st.resource_ids.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handlePublish} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Publish to Classroom OS
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer buttons */}
        <div className="border-t bg-white px-6 py-4 flex justify-between">
          <Button
            variant="ghost"
            disabled={stage === 1}
            onClick={() => setStage(stage - 1)}
            className="rounded-xl font-bold"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Previous
          </Button>

          <Button
            variant="default"
            disabled={stage === 4}
            onClick={() => setStage(stage + 1)}
            className="rounded-xl font-bold"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>

      </div>

      {/* Resource Picker Drawer Overlay */}
      {isResourceDrawerOpen && (
        <div className="fixed inset-0 z-55 flex bg-slate-900/40 backdrop-blur-xs justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-sm font-black text-slate-800">Attach Resource</h3>
              <button onClick={() => setIsResourceDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search filter */}
            <div className="p-4 border-b space-y-3">
              <input
                type="text"
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                placeholder="Search printables catalog..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              />
              
              <div className="flex gap-2">
                <span className="text-[10px] font-bold text-slate-400 self-center uppercase">Category:</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                  {resourceCategoryFilter}
                </span>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {resourcesList.map((res) => (
                <div 
                  key={res.id} 
                  className="flex items-center justify-between border p-3 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 cursor-pointer"
                  onClick={() => handleAttachResource(res.id)}
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{res.title}</h5>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5 font-semibold">
                      Type: {res.file_type} · Category: {res.category}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-blue-600 font-extrabold">Select</Button>
                </div>
              ))}
              {resourcesList.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 italic">No resources match.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
