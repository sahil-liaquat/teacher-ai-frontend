"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  HelpCircle,
  Loader2,
  MessageCircle,
  Minus,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import {
  backendApi,
  type ElifAnalysis,
  type ElifIssue,
  type ElifProposedChange,
  type LessonPlan,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const ELIF_AVATAR_SRC = "/assets/avatars/elif-chatbot-avatar.png";

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposedChanges?: ElifProposedChange[];
};

type Props = {
  lessonPlanId: string;
  className?: string;
  currentPlan?: Record<string, any>;
  onTweakSuccess?: (updatedPlan: any) => void;
  onApplyChanges?: (updatedLesson: any, changedSectionKeys: string[]) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onBeforeOpen?: () => Promise<void>;
};

function ElifAvatar({ size = "sm" }: { size?: "sm" | "fab" }) {
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-white shadow-md", size === "sm" ? "h-10 w-10" : "h-16 w-16")}>
      <img src={ELIF_AVATAR_SRC} alt="Elif" className="h-full w-full object-cover" />
    </span>
  );
}

function trackElif(event: string, metadata: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  (window as any).gtag?.("event", event, { assistant: "elif", ...metadata });
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sectionLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function outputSectionKeys(fields: string[]) {
  const mapping: Record<string, string> = {
    learning_objectives: "objectives",
    previous_knowledge: "previous_knowledge",
    key_concepts: "key_points",
    physical_properties_key_features: "key_points",
    materials_needed: "materials",
    introduction_warm_up: "introduction",
    explanation_of_concept: "explanation",
    lesson_flow: "lesson_flow",
    classroom_activity: "activity",
    activity: "activity",
    chemical_properties_main_concept_details: "main_details",
    uses_daily_life_connection: "daily_life",
    differentiation: "differentiation",
    assessment_questions: "assessment",
    board_work: "board_work",
    homework: "homework",
    learning_outcome: "learning_outcome",
    teacher_notes: "teacher_notes",
  };
  return Array.from(new Set(fields.map((field) => mapping[field]).filter(Boolean)));
}

function issueAsSuggestion(issue: ElifIssue) {
  return { id: issue.id, action_type: issue.action_type, recommended_change: issue.recommended_change };
}

export function LessonPlanChatbotPanel({
  lessonPlanId,
  className,
  currentPlan,
  onTweakSuccess,
  onApplyChanges,
  onOpenChange,
  onBeforeOpen,
}: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<ElifAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});
  const [lastRevision, setLastRevision] = useState<{ id: string; summary: string } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const visibleIssues = useMemo(() => analysis?.issues.filter((issue) => !dismissed.has(issue.id)) ?? [], [analysis, dismissed]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const frame = window.requestAnimationFrame(() => {
      scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, sending, busyId]);

  useEffect(() => {
    if (!isOpen || analysis || analysisLoading || analysisError) return;
    void loadAnalysis(false);
  }, [isOpen, analysis, analysisLoading, analysisError]);

  async function loadAnalysis(force: boolean) {
    setAnalysisLoading(true);
    setAnalysisError("");
    try {
      const result = await backendApi.analyseLessonPlanWithElif(lessonPlanId, force);
      setAnalysis(result);
      result.issues.forEach((issue) => trackElif("elif_suggestion_viewed", { suggestion_id: issue.id, priority: issue.priority }));
      trackElif("elif_automatic_analysis_completed", { cached: result.cached, issue_count: result.issues.length });
    } catch (error) {
      setAnalysisError(getErrorMessage(error, "Elif could not analyse this lesson plan. Try again."));
      trackElif("elif_ai_error", { operation: "analyse" });
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function openPanel() {
    try {
      await onBeforeOpen?.();
      setIsOpen(true);
      onOpenChange?.(true);
      trackElif("elif_opened");
    } catch (error) {
      toast({ title: "Save your latest edits", description: getErrorMessage(error, "Elif needs the latest saved lesson plan before reviewing it."), variant: "error" });
    }
  }

  function updateCachedLesson(plan: Record<string, any>) {
    queryClient.setQueryData<LessonPlan>(["lesson-plan", lessonPlanId], (existing) => existing ? { ...existing, plan } : existing);
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    onTweakSuccess?.(plan);
  }

  async function applyChange(args: {
    uiId: string;
    suggestion: { id: string; action_type: string; recommended_change: string };
    affectedSections: string[];
    teacherInstruction?: string;
  }) {
    if (busyId) return;
    setBusyId(args.uiId);
    try {
      const result = await backendApi.applyElifSuggestion(lessonPlanId, {
        suggestion: args.suggestion,
        affected_sections: args.affectedSections,
        teacher_instruction: args.teacherInstruction?.trim() || undefined,
      });
      updateCachedLesson(result.lesson_plan);
      onApplyChanges?.(result.lesson_plan, outputSectionKeys(result.revision.affected_sections));
      setLastRevision({ id: result.revision.revision_id, summary: result.change_summary });
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: `${result.change_summary} The changed section is highlighted in the lesson plan.` }]);
      setEditingId(null);
      setAnalysis(null);
      trackElif("elif_suggestion_applied", { action_type: args.suggestion.action_type });
      trackElif("elif_teacher_accepted_change", { action_type: args.suggestion.action_type });
      if (args.teacherInstruction?.trim() && args.teacherInstruction.trim() !== args.suggestion.recommended_change) {
        trackElif("elif_teacher_manually_edited_change", { action_type: args.suggestion.action_type });
      }
      toast({ title: "Elif updated the lesson plan", description: result.change_summary, variant: "success" });
    } catch (error) {
      const message = getErrorMessage(error, "The suggested update could not be applied safely.");
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: message }]);
      trackElif("elif_ai_error", { operation: "apply" });
      toast({ title: "Update not applied", description: message, variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function explain(issue: ElifIssue) {
    const key = `why-${issue.id}`;
    if (busyId) return;
    setBusyId(key);
    trackElif("elif_why_explanation_opened", { suggestion_id: issue.id });
    try {
      const result = await backendApi.explainElifSuggestion(lessonPlanId, issue);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: `Why “${issue.title}” matters (${result.criticality}): ${result.message}` }]);
    } catch (error) {
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: getErrorMessage(error, "Elif could not explain this suggestion. Try again.") }]);
    } finally {
      setBusyId(null);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const userMessage: ConversationMessage = { id: uid(), role: "user", content: trimmed };
    const prior = messages.slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);
    trackElif("elif_teacher_message_sent");
    if (/improve (everything|the full|the whole)|full lesson/i.test(trimmed)) trackElif("elif_full_plan_improvement_requested");
    try {
      const result = await backendApi.chatWithElif(lessonPlanId, trimmed, prior);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: result.message, proposedChanges: result.proposed_changes }]);
    } catch (error) {
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: getErrorMessage(error, "Elif could not respond just now. Try again.") }]);
      trackElif("elif_ai_error", { operation: "chat" });
    } finally {
      setSending(false);
    }
  }

  async function undo() {
    if (busyId) return;
    setBusyId("undo");
    try {
      const result = await backendApi.undoLatestElifChange(lessonPlanId);
      updateCachedLesson(result.lesson_plan);
      onApplyChanges?.(result.lesson_plan, outputSectionKeys(result.affected_sections));
      setLastRevision(null);
      setAnalysis(null);
      setMessages((current) => [...current, { id: uid(), role: "assistant", content: result.change_summary }]);
      trackElif("elif_change_undone");
      toast({ title: "Elif change undone", description: result.change_summary, variant: "success" });
    } catch (error) {
      toast({ title: "Undo failed", description: getErrorMessage(error, "There is no Elif change to undo."), variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <AnimatePresence initial={false}>
      {!isOpen ? (
        <motion.button
          key="launcher"
          type="button"
          onClick={() => void openPanel()}
          style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
          initial={{ opacity: 0, scale: 0.72, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 32 }}
          transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.8 }}
          whileHover={{ y: -5, scale: 1.025 }}
          whileTap={{ scale: 0.96, y: 0 }}
          className={cn("group fixed bottom-[104px] right-5 z-50 grid h-[76px] w-[76px] place-items-center rounded-full border border-white/90 bg-white/75 p-1.5 shadow-[0_18px_52px_rgba(99,102,241,0.24),0_4px_15px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl transition-[border-color,background-color,box-shadow] duration-300 hover:border-violet-100 hover:bg-white/90 hover:shadow-[0_25px_65px_rgba(99,102,241,0.32)] print:hidden lg:bottom-5", className)}
          aria-label="Open Elif lesson-plan assistant"
          title="Ask Elif"
        >
          <span className="relative">
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-400/35 via-violet-400/25 to-pink-300/35 blur-lg transition-all duration-500 group-hover:-inset-2" />
            <ElifAvatar size="fab" />
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-400" />
          </span>
        </motion.button>
      ) : (
      <motion.aside
        key="panel"
        style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
        initial={{ opacity: 0, x: 96 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 96 }}
        transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
        className="elif-chat-panel fixed bottom-3 right-3 z-50 flex h-[min(790px,calc(100vh-24px))] w-[calc(100vw-24px)] origin-bottom-right flex-col overflow-clip rounded-[30px] border border-white/90 bg-gradient-to-br from-[#eef6ff]/95 via-[#fdf6ff]/95 to-white/95 shadow-[0_34px_100px_rgba(76,81,191,0.24),0_10px_34px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl print:hidden sm:bottom-5 sm:right-5 sm:w-[448px] xl:sticky xl:bottom-auto xl:right-auto xl:top-0 xl:h-full xl:max-h-[calc(100vh-40px)] xl:w-full"
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-10 h-52 w-52 rounded-full bg-fuchsia-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl" />

        <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-white/70 bg-white/55 px-5 py-4 backdrop-blur-xl">
          <ElifAvatar />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-[15px] font-extrabold tracking-tight text-slate-900">Elif</h2><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/90 px-2 py-0.5 text-[9px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Context ready</span></div>
            <p className="mt-0.5 text-[10.5px] font-semibold text-slate-500">Your AI teaching assistant</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-white/80 bg-white/45 p-1 shadow-sm">
            <button type="button" onClick={() => { setIsOpen(false); onOpenChange?.(false); }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-blue-600 hover:shadow-sm" aria-label="Minimise Elif"><Minus className="h-4 w-4" /></button>
            <span className="h-4 w-px bg-slate-200/70" />
            <button type="button" onClick={() => { setIsOpen(false); onOpenChange?.(false); }} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-500 hover:shadow-sm" aria-label="Close Elif"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <div ref={scrollAreaRef} className="relative z-10 min-h-0 flex-1 overflow-y-auto bg-white/15 px-4 py-5 [scrollbar-color:rgba(148,163,184,0.35)_transparent] [scrollbar-width:thin]">
          {analysisLoading ? <ReviewLoading /> : null}
          {analysisError ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] border border-red-100 bg-white/80 p-4 text-[11px] text-red-700 shadow-[0_10px_28px_rgba(239,68,68,0.08)] backdrop-blur-md">
              <p className="font-bold">{analysisError}</p>
              <button type="button" onClick={() => void loadAnalysis(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 font-extrabold text-red-600 transition hover:bg-red-100"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
            </motion.div>
          ) : null}

          {analysis ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} className="space-y-5">
              <section className="relative overflow-hidden rounded-[22px] border border-white/90 bg-white/75 p-4 shadow-[0_12px_35px_rgba(37,99,235,0.08)] backdrop-blur-md">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-blue-100/90 to-violet-100/80 blur-2xl" />
                <div className="flex items-start justify-between gap-3">
                  <div className="relative"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-blue-500">Overall review</p><p className="mt-1.5 text-[11.5px] font-medium leading-[1.7] text-slate-600">{analysis.overall_summary}</p></div>
                  <motion.span initial={{ rotate: -8, scale: 0.85 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.12 }} className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-100 text-[13px] font-extrabold text-blue-700 shadow-inner" title="Prioritisation score, not an academic rating">{analysis.quality_score.overall}</motion.span>
                </div>
                {analysis.cached ? <p className="mt-2 text-[9px] font-medium text-slate-400">Review reused because this lesson plan has not changed.</p> : null}
              </section>

              {analysis.strengths.length ? (
                <section>
                  <h3 className="mb-2.5 flex items-center gap-2 px-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-600"><span className="grid h-7 w-7 place-items-center rounded-lg border border-emerald-100 bg-emerald-50"><ThumbsUp className="h-3.5 w-3.5" /></span> What is working <span className="h-px flex-1 bg-emerald-100/80" /></h3>
                  <div className="space-y-2.5">{analysis.strengths.map((strength, index) => <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} key={strength.title} className="rounded-[18px] border border-white/90 bg-white/65 p-3.5 shadow-[0_7px_22px_rgba(16,185,129,0.06)] backdrop-blur-sm"><p className="text-[11px] font-bold text-slate-800">{strength.title}</p><p className="mt-1 text-[9.5px] font-medium leading-[1.65] text-slate-500">{strength.evidence}</p></motion.div>)}</div>
                </section>
              ) : null}

              <section>
                <h3 className="mb-2.5 flex items-center gap-2 px-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-violet-600"><span className="grid h-7 w-7 place-items-center rounded-lg border border-violet-100 bg-violet-50"><Sparkles className="h-3.5 w-3.5" /></span> Important improvements <span className="h-px flex-1 bg-violet-100/80" /></h3>
                <div className="space-y-3">
                  {visibleIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      busyId={busyId}
                      editing={editingId === issue.id}
                      instruction={instructions[issue.id] ?? issue.recommended_change}
                      onInstruction={(value) => setInstructions((current) => ({ ...current, [issue.id]: value }))}
                      onEdit={() => setEditingId((current) => current === issue.id ? null : issue.id)}
                      onApply={() => void applyChange({ uiId: issue.id, suggestion: issueAsSuggestion(issue), affectedSections: issue.affected_sections, teacherInstruction: instructions[issue.id] })}
                      onWhy={() => void explain(issue)}
                      onDismiss={() => { setDismissed((current) => new Set(current).add(issue.id)); trackElif("elif_suggestion_dismissed", { suggestion_id: issue.id }); }}
                    />
                  ))}
                </div>
              </section>

              {analysis.quick_actions.length ? (
                <section>
                  <h3 className="mb-2.5 px-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Quick actions for this plan</h3>
                  <div className="flex flex-wrap gap-2">{analysis.quick_actions.map((action) => <motion.button whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.96 }} key={action.id} type="button" disabled={sending} onClick={() => void sendMessage(action.instruction)} className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/75 px-3 py-2 text-[9.5px] font-bold text-blue-600 shadow-[0_5px_15px_rgba(37,99,235,0.07)] backdrop-blur-sm transition-colors hover:border-blue-100 hover:bg-white"><ChevronRight className="h-3.5 w-3.5" />{action.label}</motion.button>)}</div>
                </section>
              ) : null}
            </motion.div>
          ) : null}

          {messages.length ? <div className="mt-6 space-y-3.5 border-t border-white/70 pt-5">{messages.map((message) => <ChatBubble key={message.id} message={message} busyId={busyId} onApply={(change) => void applyChange({ uiId: change.id, suggestion: { id: change.id, action_type: change.action_type, recommended_change: change.instruction }, affectedSections: change.affected_sections })} />)}</div> : null}
          {sending ? <ThinkingState /> : null}
        </div>

        {lastRevision ? <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-emerald-100/60 bg-emerald-50/70 px-4 py-2.5 text-[9.5px] text-emerald-800 backdrop-blur-xl"><span className="min-w-0 truncate font-semibold"><Check className="mr-1 inline h-3.5 w-3.5" />{lastRevision.summary}</span><motion.button whileTap={{ scale: 0.94 }} type="button" disabled={busyId === "undo"} onClick={() => void undo()} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/90 bg-white/75 px-2.5 py-1.5 font-extrabold shadow-sm transition hover:bg-white"><RotateCcw className="h-3.5 w-3.5" /> Undo</motion.button></motion.div> : null}

        <form onSubmit={submit} className="relative z-10 shrink-0 border-t border-white/70 bg-white/50 p-3.5 backdrop-blur-2xl">
          <div className="flex items-end gap-2 rounded-[18px] border border-white bg-white/80 p-2 shadow-[0_9px_28px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] transition-all duration-300 focus-within:border-blue-200 focus-within:bg-white/95 focus-within:shadow-[0_12px_34px_rgba(37,99,235,0.13)]">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(input); } }} rows={1} maxLength={2000} placeholder="Ask Elif to improve this lesson plan…" className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2.5 py-2 text-[10.5px] font-medium leading-5 text-slate-700 outline-none placeholder:text-slate-400" disabled={sending} />
            <motion.button whileHover={{ y: -2, scale: 1.04 }} whileTap={{ y: 0, scale: 0.92 }} type="submit" disabled={!input.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-white shadow-[0_7px_18px_rgba(79,70,229,0.3)] transition-opacity disabled:opacity-40" aria-label="Send to Elif">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</motion.button>
          </div>
          <p className="mt-2 text-center text-[8px] font-medium tracking-wide text-slate-400">Elif uses this lesson plan and its original teaching inputs.</p>
        </form>
      </motion.aside>
      )}
      </AnimatePresence>
    </>
  );
}

function ReviewLoading() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[22px] border border-white/90 bg-white/70 p-5 shadow-[0_12px_35px_rgba(37,99,235,0.09)] backdrop-blur-md">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
      <div className="flex items-center gap-3.5"><motion.span animate={{ y: [0, -4, 0], rotate: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-violet-100 shadow-inner"><Sparkles className="h-5 w-5 text-indigo-500" /></motion.span><div><p className="text-[11px] font-extrabold text-slate-800">Elif is reviewing your lesson</p><p className="mt-1 text-[9px] font-medium text-slate-500">Looking for the most useful improvements…</p></div></div>
      <div className="mt-5 space-y-2.5"><div className="elif-shimmer h-3 w-[88%] rounded-full" /><div className="elif-shimmer h-3 w-[72%] rounded-full" /><div className="elif-shimmer h-16 w-full rounded-[16px]" /><div className="grid grid-cols-3 gap-2"><div className="elif-shimmer h-7 rounded-full" /><div className="elif-shimmer h-7 rounded-full" /><div className="elif-shimmer h-7 rounded-full" /></div></div>
    </motion.div>
  );
}

function ThinkingState() {
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 inline-flex items-center gap-2.5 rounded-full border border-white bg-white/65 px-3.5 py-2 text-[9px] font-semibold text-slate-500 shadow-sm backdrop-blur-md"><span className="flex items-center gap-1"><motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="h-1.5 w-1.5 rounded-full bg-blue-400" /><motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.12 }} className="h-1.5 w-1.5 rounded-full bg-indigo-400" /><motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.24 }} className="h-1.5 w-1.5 rounded-full bg-violet-400" /></span>Elif is thinking with this lesson in mind</motion.div>;
}

function IssueCard({ issue, busyId, editing, instruction, onInstruction, onEdit, onApply, onWhy, onDismiss }: {
  issue: ElifIssue;
  busyId: string | null;
  editing: boolean;
  instruction: string;
  onInstruction: (value: string) => void;
  onEdit: () => void;
  onApply: () => void;
  onWhy: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} className="group/card relative overflow-hidden rounded-[20px] border border-white/90 bg-white/70 p-4 shadow-[0_9px_28px_rgba(99,102,241,0.07)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_15px_38px_rgba(99,102,241,0.13)]">
      <div className={cn("absolute inset-y-0 left-0 w-1", issue.priority === "high" ? "bg-gradient-to-b from-rose-400 to-orange-300" : issue.priority === "medium" ? "bg-gradient-to-b from-amber-400 to-yellow-300" : "bg-gradient-to-b from-blue-400 to-cyan-300")} />
      <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><h4 className="text-[11px] font-extrabold leading-5 text-slate-800">{issue.title}</h4><span className={cn("rounded-full border px-2 py-0.5 text-[7.5px] font-extrabold uppercase tracking-wider", issue.priority === "high" ? "border-rose-100 bg-rose-50 text-rose-600" : issue.priority === "medium" ? "border-amber-100 bg-amber-50 text-amber-600" : "border-slate-100 bg-slate-50 text-slate-500")}>{issue.priority}</span></div><p className="mt-1.5 text-[9.5px] font-medium leading-[1.65] text-slate-500">{issue.problem}</p></div><motion.button whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.9 }} type="button" onClick={onDismiss} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500" aria-label={`Dismiss ${issue.title}`}><Trash2 className="h-3.5 w-3.5" /></motion.button></div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">{issue.affected_sections.map((section) => <span key={section} className="rounded-md border border-blue-100/70 bg-blue-50/60 px-1.5 py-1 text-[7.5px] font-bold text-blue-600">{sectionLabel(section)}</span>)}</div>
      <details className="mt-2.5 text-[9px] text-slate-500"><summary className="cursor-pointer font-bold transition hover:text-blue-600">Evidence from this plan</summary><p className="mt-1.5 rounded-xl bg-slate-50/70 p-2.5 leading-[1.65]">{issue.evidence}</p></details>
      {editing ? <motion.textarea initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} value={instruction} onChange={(event) => onInstruction(event.target.value)} rows={3} maxLength={2000} className="mt-3 w-full resize-y rounded-[14px] border border-blue-100 bg-blue-50/35 p-3 text-[9.5px] font-medium leading-5 text-slate-600 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50" aria-label="Modify instruction before applying" /> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }} type="button" disabled={Boolean(busyId)} onClick={onApply} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-3.5 py-2 text-[8.5px] font-extrabold text-white shadow-[0_5px_14px_rgba(59,130,246,0.25)] disabled:opacity-50">{busyId === issue.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Apply</motion.button>
        <motion.button whileTap={{ scale: 0.94 }} type="button" disabled={Boolean(busyId)} onClick={onWhy} className="inline-flex items-center gap-1.5 rounded-xl border border-white bg-white/75 px-3 py-2 text-[8.5px] font-bold text-slate-500 shadow-sm transition-colors hover:text-violet-600"><HelpCircle className="h-3.5 w-3.5" /> Why?</motion.button>
        <motion.button whileTap={{ scale: 0.94 }} type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-xl border border-white bg-white/75 px-3 py-2 text-[8.5px] font-bold text-slate-500 shadow-sm transition-colors hover:text-blue-600"><Edit3 className="h-3.5 w-3.5" /> Modify <ChevronDown className={cn("h-3 w-3 transition", editing && "rotate-180")} /></motion.button>
      </div>
    </motion.article>
  );
}

function ChatBubble({ message, busyId, onApply }: { message: ConversationMessage; busyId: string | null; onApply: (change: ElifProposedChange) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, x: message.role === "user" ? 10 : -10 }} animate={{ opacity: 1, y: 0, x: 0 }} transition={{ type: "spring", stiffness: 340, damping: 26 }} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[90%] rounded-[18px] px-3.5 py-3 text-[10px] font-medium leading-[1.7]", message.role === "user" ? "rounded-br-[6px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_22px_rgba(59,130,246,0.22)]" : "rounded-bl-[6px] border border-white bg-white/75 text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.05)] backdrop-blur-sm")}>
        <div className="mb-1.5 flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.12em] opacity-70">{message.role === "user" ? <MessageCircle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}{message.role === "user" ? "You" : "Elif"}</div>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.proposedChanges?.length ? <div className="mt-3 space-y-2">{message.proposedChanges.map((change) => <div key={change.id} className="rounded-[14px] border border-blue-100/70 bg-blue-50/55 p-3"><p className="text-[9.5px] font-extrabold text-blue-800">{change.title}</p><p className="mt-1 text-[8.5px] leading-5 text-blue-700">{change.instruction}</p><motion.button whileTap={{ scale: 0.94 }} type="button" disabled={Boolean(busyId)} onClick={() => onApply(change)} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-2.5 py-1.5 text-[8px] font-extrabold text-white shadow-sm disabled:opacity-50">{busyId === change.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Apply change</motion.button></div>)}</div> : null}
      </div>
    </motion.div>
  );
}
