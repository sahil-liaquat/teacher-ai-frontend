"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Clipboard,
  Download,
  FileDown,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Languages,
  Mail,
  MessageCircle,
  PenLine,
  Printer,
  RefreshCw,
  Save,
  Send,
  SlidersHorizontal,
  Sparkles,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { DashboardBannerHeader } from "@/components/dashboard-banner-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  backendApi,
  type WritingAction,
  type WritingDocument,
  type WritingGeneratePayload,
  type WritingWorkflow,
} from "@/lib/api";
import { downloadGeneratedTextPdf } from "@/lib/generated-text-pdf";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Screen = "home" | "form" | "editor";
type FormState = Record<string, string | boolean>;

type WorkflowConfig = {
  id: WritingWorkflow;
  title: string;
  description: string;
  icon: typeof MessageCircle;
  tint: string;
  formats: string[];
  fields: Array<{
    key: string;
    label: string;
    type?: "text" | "textarea";
    required?: boolean;
    placeholder?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
};

const WORKFLOWS: WorkflowConfig[] = [
  {
    id: "parent_communication",
    title: "Parent Communication",
    description: "WhatsApp, SMS, diary notes and parent emails.",
    icon: MessageCircle,
    tint: "blue",
    formats: ["WhatsApp Message", "Diary Note", "SMS", "Parent Email", "PTM Follow-up"],
    fields: [
      { key: "student_or_group", label: "Student / group", placeholder: "Class 7B parents, Ayaan's parent", icon: UserRoundCheck, color: "blue" },
      { key: "purpose", label: "Purpose", required: true, placeholder: "Homework reminder, absence note, fee reminder", icon: Sparkles, color: "orange" },
      { key: "provided_details", label: "Details to include", type: "textarea", required: true, icon: FileText, color: "green" },
    ],
  },
  {
    id: "report_card_remarks",
    title: "Report-Card Remarks",
    description: "Grounded remarks from teacher-provided details only.",
    icon: UserRoundCheck,
    tint: "green",
    formats: ["Report Card Remark", "Term-end Comment", "Progress Note"],
    fields: [
      { key: "student_name", label: "Student name", required: true, icon: UserRoundCheck, color: "blue" },
      { key: "class_section", label: "Class / section", icon: SlidersHorizontal, color: "purple" },
      { key: "provided_details", label: "Teacher-provided academic, behaviour or attendance details", type: "textarea", required: true, icon: FileText, color: "green" },
      { key: "next_step", label: "Suggested next step", icon: Sparkles, color: "amber" },
    ],
  },
  {
    id: "student_feedback",
    title: "Student Feedback",
    description: "Feedback for notebooks, assignments and classroom work.",
    icon: PenLine,
    tint: "pink",
    formats: ["Notebook Feedback", "Assignment Feedback", "Project Feedback", "Exam Feedback"],
    fields: [
      { key: "student_name", label: "Student name", required: true, icon: UserRoundCheck, color: "blue" },
      { key: "work_context", label: "Work / activity", required: true, placeholder: "Science notebook, essay, maths assignment", icon: SlidersHorizontal, color: "purple" },
      { key: "provided_details", label: "Teacher-provided observations", type: "textarea", required: true, icon: FileText, color: "green" },
      { key: "next_step", label: "Next step for student", icon: Sparkles, color: "amber" },
    ],
  },
  {
    id: "notice_circular",
    title: "Notice & Circular",
    description: "PTM notices, circulars and school announcements.",
    icon: FileText,
    tint: "amber",
    formats: ["Circular", "PTM Notice", "School Notice", "Event Announcement"],
    fields: [
      { key: "audience", label: "Audience", required: true, placeholder: "Parents of Class 8, all students", icon: UserRoundCheck, color: "blue" },
      { key: "subject", label: "Subject", required: true, icon: SlidersHorizontal, color: "purple" },
      { key: "venue", label: "Venue", icon: Globe, color: "pink" },
      { key: "provided_details", label: "Details to include", type: "textarea", required: true, icon: FileText, color: "green" },
    ],
  },
  {
    id: "official_letter_email",
    title: "Official Letter & Email",
    description: "Applications, school letters and professional emails.",
    icon: Mail,
    tint: "cyan",
    formats: ["Official Email", "Application", "Formal Letter", "Request Letter"],
    fields: [
      { key: "recipient", label: "Recipient", required: true, placeholder: "Principal, parent, education officer", icon: UserRoundCheck, color: "blue" },
      { key: "subject", label: "Subject", required: true, icon: SlidersHorizontal, color: "purple" },
      { key: "purpose", label: "Purpose", required: true, icon: Sparkles, color: "orange" },
      { key: "provided_details", label: "Details to include", type: "textarea", required: true, icon: FileText, color: "green" },
    ],
  },
  {
    id: "rewrite_translate",
    title: "Rewrite, Simplify & Translate",
    description: "Improve existing text in English, Hindi and more.",
    icon: Languages,
    tint: "violet",
    formats: ["Rewrite", "Simplify", "Translate", "Bilingual Version", "Grammar Correction"],
    fields: [
      { key: "source_text", label: "Text to work on", type: "textarea", required: true, icon: FileText, color: "green" },
      { key: "instructions", label: "Specific instruction", placeholder: "Make it shorter for WhatsApp", icon: Sparkles, color: "amber" },
    ],
  },
];

const LANGUAGES = ["English", "Hindi", "Urdu", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi"];

const TONES_CONFIG = [
  { id: "Polite", label: "Polite", emoji: "🤝", desc: "Respectful & kind" },
  { id: "Professional", label: "Professional", emoji: "💼", desc: "Clear & official" },
  { id: "Warm", label: "Warm", emoji: "😊", desc: "Friendly & open" },
  { id: "Simple", label: "Simple", emoji: "✏️", desc: "Plain & accessible" },
  { id: "Formal", label: "Formal", emoji: "👔", desc: "Polished & elegant" },
  { id: "Encouraging", label: "Encouraging", emoji: "✨", desc: "Positive & inspiring" },
];

const ACTIONS: Array<{ id: WritingAction; label: string }> = [
  { id: "rewrite", label: "Rewrite" },
  { id: "shorten", label: "Shorten" },
  { id: "expand", label: "Expand" },
  { id: "make_polite", label: "Make polite" },
  { id: "make_professional", label: "Make professional" },
  { id: "simplify", label: "Simplify" },
  { id: "translate", label: "Translate" },
  { id: "correct_grammar", label: "Correct grammar" },
  { id: "another_version", label: "Generate another version" },
];

const cardBase = "group/card relative overflow-hidden flex items-center gap-3 sm:gap-4 p-4 sm:p-5 min-h-[116px] sm:min-h-[126px] rounded-[18px] border border-white/70 bg-gradient-to-br shadow-[0_14px_34px_rgba(15,23,42,0.07)] transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] hover:-translate-y-0.5 text-left outline-none focus:outline-none focus:ring-0 focus:border-white/70 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0 active:border-white/70";
const panelBase = "rounded-[18px] border border-white/70 bg-white/80 p-4 sm:p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm";

const tintClasses: Record<string, { card: string; glow: string; icon: string; text: string }> = {
  blue: { card: "from-[#eff6ff] via-[#eff6ff] to-white", glow: "bg-[#bfdbfe]/30", icon: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100", text: "group-hover/card:text-blue-600" },
  green: { card: "from-white via-emerald-50/70 to-white", glow: "bg-emerald-200/30", icon: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100", text: "group-hover/card:text-emerald-600" },
  pink: { card: "from-white via-pink-50/70 to-white", glow: "bg-pink-200/30", icon: "bg-[#fff1f7] text-[#f45f98] ring-pink-100", text: "group-hover/card:text-pink-600" },
  amber: { card: "from-[#fffaf0] via-amber-50/80 to-white", glow: "bg-amber-200/30", icon: "bg-[#fff6df] text-[#f0a22f] ring-amber-100", text: "group-hover/card:text-amber-600" },
  cyan: { card: "from-[#f0fdff] via-cyan-50/70 to-white", glow: "bg-cyan-200/30", icon: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb]", text: "group-hover/card:text-cyan-600" },
  violet: { card: "from-white via-violet-50/70 to-white", glow: "bg-violet-200/30", icon: "bg-violet-50 text-violet-600 ring-violet-100", text: "group-hover/card:text-violet-600" },
};

// Influencer page layout style mappings
const stylesMap: Record<string, { card: string; glow: string; icon: string; badge: string; text: string; button: string }> = {
  blue: {
    card: "from-[#eff6ff] via-white to-[#f8fbff]",
    glow: "bg-[#bfdbfe]/35",
    icon: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100 shadow-[0_14px_30px_rgba(59,130,246,0.18)]",
    badge: "text-blue-600 bg-white/80",
    text: "text-[#3b82f6]",
    button: "from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200/40",
  },
  green: {
    card: "from-[#ecfff6] via-white to-[#f4fdf8]",
    glow: "bg-[#24b77a]/15",
    icon: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100 shadow-[0_14px_30px_rgba(36,183,122,0.18)]",
    badge: "text-emerald-600 bg-white/80",
    text: "text-[#24b77a]",
    button: "from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-200/40",
  },
  pink: {
    card: "from-[#fff1f7] via-white to-[#fffbfd]",
    glow: "bg-[#f45f98]/15",
    icon: "bg-[#fff1f7] text-[#f45f98] ring-pink-100 shadow-[0_14px_30px_rgba(244,95,152,0.18)]",
    badge: "text-pink-600 bg-white/80",
    text: "text-[#f45f98]",
    button: "from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 shadow-pink-200/40",
  },
  amber: {
    card: "from-[#fffaf0] via-white to-[#fffdf9]",
    glow: "bg-[#f0a22f]/15",
    icon: "bg-[#fff6df] text-[#f0a22f] ring-amber-100 shadow-[0_14px_30px_rgba(240,162,47,0.18)]",
    badge: "text-amber-600 bg-white/80",
    text: "text-[#f0a22f]",
    button: "from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-amber-200/40",
  },
  cyan: {
    card: "from-[#f0fdff] via-white to-[#f4fdfe]",
    glow: "bg-[#16a9b6]/15",
    icon: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb] shadow-[0_14px_30px_rgba(22,169,182,0.15)]",
    badge: "text-cyan-600 bg-white/80",
    text: "text-[#16a9b6]",
    button: "from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 shadow-cyan-200/40",
  },
  violet: {
    card: "from-[#f6f1ff] via-white to-[#faf8ff]",
    glow: "bg-[#8b5cf6]/15",
    icon: "bg-violet-50 text-violet-600 ring-violet-100 shadow-[0_14px_30px_rgba(139,92,246,0.18)]",
    badge: "text-violet-600 bg-white/80",
    text: "text-violet-600",
    button: "from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 shadow-violet-200/40",
  },
};

function initialForm(config: WorkflowConfig): FormState {
  return {
    document_type: config.formats[0],
    language: "English",
    tone: "Polite",
    bilingual: false,
  };
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "teachpad-document";
}

export default function WritingAssistantPage() {
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("home");
  const [workflowId, setWorkflowId] = useState<WritingWorkflow>("parent_communication");
  const [form, setForm] = useState<FormState>(() => initialForm(WORKFLOWS[0]));
  const [document, setDocument] = useState<WritingDocument | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const workflow = useMemo(() => WORKFLOWS.find((item) => item.id === workflowId) || WORKFLOWS[0], [workflowId]);

  const activeStyles = useMemo(() => stylesMap[workflow.tint] || stylesMap.blue, [workflow.tint]);

  function openWorkflow(next: WorkflowConfig) {
    setWorkflowId(next.id);
    setForm(initialForm(next));
    setScreen("form");
  }

  function updateField(key: string, value: string | boolean) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openDocument(next: WritingDocument) {
    setDocument(next);
    setTitle(next.title);
    setContent(next.content);
    setScreen("editor");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = workflow.fields.find((field) => field.required && !String(form[field.key] || "").trim());
    if (missing) {
      toast({ title: `${missing.label} is required`, description: "Add the required detail before generating." });
      return;
    }

    const sourceText = workflow.id === "rewrite_translate" ? String(form.source_text || "") : null;
    const details = Object.fromEntries(
      workflow.fields
        .filter((field) => field.key !== "source_text")
        .map((field) => [field.key, form[field.key] || ""])
    );
    const payload: WritingGeneratePayload = {
      workflow: workflow.id,
      document_type: String(form.document_type || workflow.formats[0]),
      language: String(form.language || "English"),
      tone: String(form.tone || "Polite"),
      audience: String(form.audience || form.recipient || form.student_or_group || ""),
      title: String(form.subject || form.purpose || form.document_type || workflow.title),
      details,
      source_text: sourceText,
      bilingual: Boolean(form.bilingual),
    };

    setBusy("generate");
    try {
      const created = await backendApi.createWritingDocument(payload);
      openDocument(created);
      toast({ title: "Document generated", description: "You can edit or transform it now.", variant: "success" });
    } catch (error) {
      toast({ title: "Could not generate", description: getErrorMessage(error, "Please try again."), variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function transform(action: WritingAction) {
    if (!document) return;
    setBusy(action);
    try {
      const updated = await backendApi.transformWritingDocument(document.id, {
        action,
        language: String(form.language || document.language || "English"),
        content,
      });
      openDocument(updated);
      toast({ title: "Document updated", description: ACTIONS.find((item) => item.id === action)?.label || "Done", variant: "success" });
    } catch (error) {
      toast({ title: "Could not update", description: getErrorMessage(error, "Please try again."), variant: "error" });
    } finally {
      setBusy(null);
    }
  }



  async function copyContent() {
    await navigator.clipboard?.writeText(content).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    toast({ title: "Copied", description: "Document copied to clipboard.", variant: "success" });
  }

  async function downloadPdf() {
    await downloadGeneratedTextPdf({ title, text: content, filenamePrefix: "teachpad-writing" });
  }

  function printDocument() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Print blocked", description: "Please allow popups to print.", variant: "error" });
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 {
              font-size: 24px;
              font-weight: 800;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 16px;
              margin-bottom: 24px;
              color: #0f172a;
            }
            p {
              font-size: 15px;
              white-space: pre-wrap;
              margin-bottom: 16px;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>${content}</p>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function exportWord() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${content.split("\n").map((line) => `<p>${line || "&nbsp;"}</p>`).join("")}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(title)}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-4">
      {screen === "home" && (
        <DashboardBannerHeader
          titleTop="Teacher"
          titleHighlight="writing assistant"
          imageSrc="/assets/illustrations/writing-assistant-header.png"
          imageClassName="scale-[0.85] origin-bottom-right"
        />
      )}

      {screen !== "home" && (
        <button
          type="button"
          onClick={() => setScreen("home")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-200 hover:bg-slate-55 hover:-translate-y-0.5 active:scale-95 focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Writing Assistant
        </button>
      )}

      {screen === "home" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:gap-4">
            {WORKFLOWS.map((item) => {
              const tint = tintClasses[item.tint];
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openWorkflow(item)}
                  className={cn(cardBase, tint.card)}
                >
                  <div className={cn("absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl", tint.glow)} />
                  <div className={cn("shrink-0 h-14 w-14 sm:h-[64px] sm:w-[64px] rounded-[22px] flex items-center justify-center ring-1 shadow-[0_14px_30px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/card:scale-105", tint.icon)}>
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors", tint.text)}>{item.title}</p>
                    <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover/card:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>


        </>
      )}

      {screen === "form" && (
        <div className="animate-fade-in">
          {/* Unified minimal container card matching InfluencerPortalOption card style */}
          <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-white via-slate-50/20 to-white p-6 sm:p-8 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm w-full">
            <div className={cn("absolute -left-12 -top-12 h-32 w-32 rounded-full blur-3xl", activeStyles.glow)} />
            
            {/* Minimal Header */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <span className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-[22px] ring-1 shadow-[0_14px_30px_rgba(15,23,42,0.08)]", activeStyles.icon)}>
                  {(() => {
                    const Icon = workflow.icon;
                    return <Icon className="h-7 w-7 stroke-[2.3]" />;
                  })()}
                </span>
                <div className="min-w-0">
                  <h1 className="text-lg font-extrabold text-slate-900 leading-none">{workflow.title}</h1>
                  <p className="mt-2 text-xs font-semibold text-slate-500 leading-normal">{workflow.description}</p>
                </div>
              </div>
              <div className="hidden sm:flex shrink-0">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm", activeStyles.badge)}>
                  <Sparkles className="h-3.5 w-3.5" /> AI Workspace
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={submit} className="space-y-6 relative z-10">
              
              {/* Document Style Controls (Format, Language, Tone in a clean 3-column selector grid) */}
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldCard icon={SlidersHorizontal} label="Format" required color="blue">
                  <Select value={String(form.document_type || "")} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => updateField("document_type", event.target.value)}>
                    {workflow.formats.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </FieldCard>
                
                <FieldCard icon={Globe} label="Language" required color="pink">
                  <Select value={String(form.language || "English")} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => updateField("language", event.target.value)}>
                    {LANGUAGES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </FieldCard>

                <FieldCard icon={MessageCircle} label="Tone" required color="purple">
                  <Select value={String(form.tone || "Polite")} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => updateField("tone", event.target.value)}>
                    {TONES_CONFIG.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </Select>
                </FieldCard>
              </div>

              {/* Dynamic input fields matching standard dashboard styles */}
              <div className="grid gap-4 md:grid-cols-2 pt-2">
                {workflow.fields.map((field) => {
                  const isTextarea = field.type === "textarea";
                  return (
                    <div key={field.key} className={cn(isTextarea ? "md:col-span-2" : "")}>
                      <FieldCard icon={field.icon} label={field.label} required={field.required} color={field.color}>
                        {isTextarea ? (
                          <Textarea
                            value={String(form[field.key] || "")}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={field.placeholder || "Enter details here..."}
                            className="min-h-[120px] rounded-xl border-slate-200 bg-[#f7f8fb]/80 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                          />
                        ) : (
                          <Input
                            value={String(form[field.key] || "")}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={field.placeholder}
                            className="rounded-xl border-slate-200 bg-[#f7f8fb]/80 text-sm font-semibold text-slate-800 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/50"
                          />
                        )}
                      </FieldCard>
                    </div>
                  );
                })}
              </div>


              {/* Form Action Controls */}
              <div className="flex items-center justify-between pt-5 mt-6">
                <button
                  type="button"
                  onClick={() => setScreen("home")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 shadow-sm transition-all duration-200 hover:bg-slate-55 hover:-translate-y-0.5 active:scale-95 focus:outline-none"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                
                <button
                  type="submit"
                  disabled={busy === "generate"}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r px-6 text-xs font-black text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
                    activeStyles.button
                  )}
                >
                  {busy === "generate" ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Output
                    </>
                  )}
                </button>
              </div>
              
            </form>
          </div>
        </div>
      )}

      {screen === "editor" && document && (
        <section className={cn(panelBase, "space-y-6")}>
          {/* Top Header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeading icon={FileText} title="Document Editor" description={document.document_type} tint="blue" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyContent}>
                <Clipboard className="h-3.5 w-3.5 mr-1 text-slate-500" />
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>

              <Button type="button" variant="outline" size="sm" onClick={downloadPdf}>
                <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Download PDF
              </Button>

              <Button type="button" variant="outline" size="sm" onClick={printDocument}>
                <Printer className="h-3.5 w-3.5 mr-1 text-slate-550" />
                Print
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = `${title}\n\n${content}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                className="bg-[#ecfff6] hover:bg-emerald-100 border-emerald-100 text-emerald-700 font-bold"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1 text-[#24b77a]" /> Send via WhatsApp
              </Button>
            </div>
          </div>

          {/* AI Refinement / Transformations Toolbar */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">AI Refinement Toolbar</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5">
              {ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => transform(action.id)}
                  disabled={Boolean(busy)}
                  className="h-8 rounded-xl px-3 text-[11px] font-bold shadow-none hover:bg-white"
                >
                  {busy === action.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 text-blue-500 mr-1" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Paper Document Body */}
          <div className="mx-auto w-full max-w-[820px] rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.03)] sm:p-12 relative overflow-hidden transition-all duration-300 hover:shadow-[0_24px_58px_rgba(15,23,42,0.05)]">
            {/* Top decorative binder strip / sheet alignment */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-100 via-indigo-50 to-blue-100" />

            {/* Document Title (Letterhead Subject Line) */}
            <div className="mb-6 border-b border-slate-100 pb-6 mt-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Subject / Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1.5 w-full border-none bg-transparent p-0 text-xl font-black text-slate-900 outline-none placeholder:text-slate-350 focus:ring-0 focus-visible:outline-none"
                placeholder="Document Subject"
              />
            </div>

            {/* Document Content */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Body Content</label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="mt-2 min-h-[460px] w-full resize-y border-none bg-transparent p-0 text-[15px] leading-8 text-slate-800 outline-none focus:ring-0 focus-visible:outline-none font-medium"
                placeholder="Write your document content here..."
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description, tint }: { icon: typeof MessageCircle; title: string; description: string; tint: string }) {
  const tone = tintClasses[tint] || tintClasses.blue;
  return (
    <div className="flex items-center gap-3">
      <div className={cn("shrink-0 h-10 w-10 rounded-[14px] flex items-center justify-center ring-1 shadow-[0_10px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.92)]", tone.icon)}>
        <Icon className="h-5 w-5 stroke-[2.3]" />
      </div>
      <div>
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function NumberedSection({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-teachpad-blue">{number}</span>
        <h3 className="text-base font-bold text-teachpad-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function GeneratorFieldCard({
  icon: Icon,
  label,
  required,
  color = "blue",
  className,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  required?: boolean;
  color?: string;
  className?: string;
  children: ReactNode;
}) {
  const toneMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-[#eef6ff]", text: "text-[#3b82f6]" },
    green: { bg: "bg-[#ecfff6]", text: "text-[#24b77a]" },
    orange: { bg: "bg-[#fff6df]", text: "text-[#f0a22f]" },
    pink: { bg: "bg-[#fff1f7]", text: "text-[#f45f98]" },
    aqua: { bg: "bg-[#f0fdff]", text: "text-[#16a9b6]" },
    purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]" },
    amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]" },
    teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]" },
    sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]" },
    indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]" },
    rose: { bg: "bg-[#fff1f2]", text: "text-[#e11d48]" },
  };
  const tone = toneMap[color] || toneMap.blue;
  return (
    <div className={cn("min-w-0 rounded-2xl border border-teachpad-cardBorder bg-white p-4 shadow-sm sm:p-5", className)}>
      <div className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9", tone.bg, tone.text)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-xs font-bold text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </div>
      {children}
    </div>
  );
}

function DocumentList({ title, items, loading, onOpen }: { title: string; items: WritingDocument[]; loading: boolean; onOpen: (item: WritingDocument) => void }) {
  return (
    <section className={cn(panelBase, "space-y-4")}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <span className="text-[11px] font-bold text-slate-400">{items.length}</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-xl border border-slate-100 bg-slate-50/70 animate-pulse" />
          <div className="h-16 rounded-xl border border-slate-100 bg-slate-50/70 animate-pulse" />
        </div>
      ) : items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0B73FF]">
                <Send className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-extrabold text-slate-800">{item.title}</span>
                <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">{item.document_type} · {formatDate(item.updated_at || item.created_at)}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
            <Check className="h-4 w-4" />
          </div>
          <p className="mt-3 text-xs font-bold text-slate-650">No documents yet</p>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Generated writing will appear here.</p>
        </div>
      )}
    </section>
  );
}

function FieldCard({ icon: Icon, label, required, color = "blue", children }: { icon: React.ComponentType<{ className?: string }>; label: string; required?: boolean; color?: string; children: ReactNode }) {
  const toneMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-[#eef6ff]", text: "text-[#3b82f6]" },
    green: { bg: "bg-[#ecfff6]", text: "text-[#24b77a]" },
    orange: { bg: "bg-[#fff6df]", text: "text-[#f0a22f]" },
    pink: { bg: "bg-[#fff1f7]", text: "text-[#f45f98]" },
    aqua: { bg: "bg-[#f0fdff]", text: "text-[#16a9b6]" },
    purple: { bg: "bg-[#f6f1ff]", text: "text-[#8b5cf6]" },
    amber: { bg: "bg-[#fffbeb]", text: "text-[#d97706]" },
    teal: { bg: "bg-[#f0fdfa]", text: "text-[#0d9488]" },
    sky: { bg: "bg-[#f0fdff]", text: "text-[#0ea5e9]" },
    indigo: { bg: "bg-[#eef2ff]", text: "text-[#6366f1]" },
    rose: { bg: "bg-[#fff1f2]", text: "text-[#e11d48]" },
  };
  const tone = toneMap[color] || toneMap.blue;
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2.5 sm:gap-3 sm:mb-4">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${tone.bg} ${tone.text}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="text-xs font-bold text-slate-500 sm:text-sm">{label} {required && <span className="text-red-500">*</span>}</span>
      </div>
      {children}
    </div>
  );
}
