"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderOpen,
  Lightbulb,
  MoreVertical,
  NotebookPen,
  Plus,
  Presentation,
  Settings2,
  Sparkles,
  TrendingUp,
  Search,
  X,
  Mic,
  GraduationCap,
  CalendarDays
} from "lucide-react";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, getToken, type ApiUser } from "@/lib/api";
import { getTeacherFirstName } from "@/lib/profile";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardMyClasses } from "@/components/dashboard/my-classes-section";

const statCards = [
  { label: "Lesson Planner", fallback: "0", sub: "Total Created", icon: BookOpen, tone: "blue", href: "/dashboard/lesson-plans/new" },
  { label: "Worksheet Generator", fallback: "0", sub: "Total Created", icon: ClipboardCheck, tone: "green", href: "/dashboard/worksheets/new" },
  { label: "Notes Generator", fallback: "0", sub: "Total Created", icon: NotebookPen, tone: "yellow", href: "/dashboard/notes-generator" },
  { label: "Presentation Generator", fallback: "0", sub: "Total Created", icon: Presentation, tone: "pink", href: "/dashboard/presentation-generator" }
];

const cardStyles: Record<string, { card: string; hoverCard: string; iconBox: string; iconShadow: string; glow: string }> = {
  blue: {
    card: "bg-gradient-to-br from-[#eff6ff] via-[#eff6ff] to-white",
    hoverCard: "hover:from-[#dbeafe] hover:via-[#eff6ff] hover:to-white",
    iconBox: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100",
    iconShadow: "shadow-[0_14px_30px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-[#bfdbfe]/30"
  },
  green: {
    card: "bg-gradient-to-br from-white via-emerald-50/70 to-white",
    hoverCard: "hover:from-emerald-100 hover:via-emerald-50/80 hover:to-white",
    iconBox: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100",
    iconShadow: "shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-emerald-200/30"
  },
  yellow: {
    card: "bg-gradient-to-br from-[#fffaf0] via-amber-50/80 to-white",
    hoverCard: "hover:from-[#fef3c7] hover:via-amber-50/90 hover:to-white",
    iconBox: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
    iconShadow: "shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-amber-200/30"
  },
  pink: {
    card: "bg-gradient-to-br from-white via-pink-50/70 to-white",
    hoverCard: "hover:from-pink-100 hover:via-pink-50/80 hover:to-white",
    iconBox: "bg-[#fff1f7] text-[#f45f98] ring-pink-100",
    iconShadow: "shadow-[0_14px_30px_rgba(244,95,152,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-pink-200/30"
  },
  red: {
    card: "bg-gradient-to-br from-white via-rose-50/80 to-white",
    hoverCard: "hover:from-rose-100 hover:via-rose-50/90 hover:to-white",
    iconBox: "bg-[#fff7f8] text-[#eb3b5a] ring-[#ffd9de]",
    iconShadow: "shadow-[0_14px_30px_rgba(235,59,90,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-rose-200/30"
  },
  aqua: {
    card: "bg-gradient-to-br from-[#f0fdff] via-cyan-50/70 to-white",
    hoverCard: "hover:from-[#cff7fb] hover:via-cyan-50/80 hover:to-white",
    iconBox: "bg-[#f0fdff] text-[#16a9b6] ring-[#c9f7fb]",
    iconShadow: "shadow-[0_14px_30px_rgba(22,169,182,0.18),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-cyan-200/30"
  },
  orange: {
    card: "bg-gradient-to-br from-white via-amber-50/50 to-white",
    hoverCard: "hover:from-amber-100 hover:via-amber-50/70 hover:to-white",
    iconBox: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
    iconShadow: "shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: "bg-amber-200/30"
  }
};

const ALL_QUICK_ACCESS_OPTIONS = [
  { id: "lesson-planner", title: "Lesson Planner", desc: "Create detailed, curriculum-aligned lesson plans.", href: "/dashboard/lesson-plans/new", icon: BookOpen, tone: "blue" },
  { id: "worksheet-generator", title: "Worksheet Generator", desc: "Generate printable worksheets with answers.", href: "/dashboard/worksheets/new", icon: ClipboardCheck, tone: "green" },
  { id: "notes-generator", title: "Notes Generator", desc: "Create textbook-grounded chapter notes and key terms.", href: "/dashboard/notes-generator", icon: NotebookPen, tone: "red" },
  { id: "saved-resources", title: "Saved Resources", desc: "Access your saved lessons, worksheets, and resources.", href: "/dashboard/resources", icon: FolderOpen, tone: "orange" },
  { id: "classroom-tools", title: "Classroom Tools", desc: "Use tools like notes, worksheets, and more.", href: "/dashboard/classroom-tools", icon: Sparkles, tone: "blue" },
  { id: "explore-resources", title: "Explore Resources", desc: "Find high-quality teaching resources and materials.", href: "/dashboard/resources", icon: FolderOpen, tone: "orange" },
  { id: "presentation-generator", title: "Presentation Generator", desc: "Turn any topic into a clean classroom slide deck.", href: "/dashboard/presentation-generator", icon: Presentation, tone: "pink" },
  { id: "activity-generator", title: "Activity Generator", desc: "Create hands-on activities and group tasks.", href: "/dashboard/activity-generator", icon: Sparkles, tone: "aqua" }
];



const dashboardTools = [
  {
    title: "Lesson Plan Generator",
    description: "Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes.",
    href: "/dashboard/lesson-plans/new",
    icon: FileText,
    tone: "blue",
    status: "ready",
    badge: "Ready",
    buttonLabel: "Create Lesson Plan"
  },
  {
    title: "Worksheet Generator",
    description: "Create printable worksheets, answer keys, and marking schemes from your selected chapter.",
    href: "/dashboard/worksheets/new",
    icon: ClipboardCheck,
    tone: "green",
    status: "ready",
    badge: "Ready",
    buttonLabel: "Create Worksheet"
  },
  {
    title: "Presentation Generator",
    description: "Turn any topic into a clean classroom slide deck with speaker notes and activity prompts.",
    href: "/dashboard/presentation-generator",
    icon: Presentation,
    tone: "orange",
    status: "ready",
    badge: "Ready",
    buttonLabel: "Create Presentation"
  },
  {
    title: "Notes Generator",
    description: "Create textbook-grounded chapter notes with key terms, summaries, and revision questions.",
    href: "/dashboard/notes-generator",
    icon: NotebookPen,
    tone: "pink",
    status: "ready",
    badge: "Ready",
    buttonLabel: "Create Notes"
  },
  {
    title: "Activity Generator",
    description: "Create hands-on classroom activities, group tasks, and quick engagement prompts.",
    href: "/dashboard/activity-generator",
    icon: Sparkles,
    tone: "aqua",
    status: "ready",
    badge: "Ready",
    buttonLabel: "Create Activity"
  },
  {
    title: "AI Chat Assistant",
    description: "Ask anything, draft parent emails, or get instant curriculum advice from your AI helper.",
    href: "/dashboard/classroom-tools",
    icon: Bot,
    tone: "blue",
    status: "ready",
    badge: "Ready",
    buttonLabel: "Chat with AI"
  },
  {
    title: "Rubric Assistant",
    description: "Draft assessment criteria, scoring rubrics, and feedback templates for assignments.",
    href: "#",
    icon: Settings2,
    tone: "aqua",
    status: "soon",
    badge: "Coming soon",
    buttonLabel: "Coming Soon"
  },
  {
    title: "Question Paper Creator",
    description: "Design comprehensive exam question papers matching class blueprints and difficulty scales.",
    href: "#",
    icon: GraduationCap,
    tone: "yellow",
    status: "soon",
    badge: "Coming soon",
    buttonLabel: "Coming Soon"
  }
];

const recentTypeClasses: Record<string, { iconBg: string; pill: string }> = {
  "Lesson Plan": {
    iconBg: "bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] text-[#2563eb]",
    pill: "bg-[#eff6ff] text-[#1d4ed8]"
  },
  Worksheet: {
    iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700"
  },
  Presentation: {
    iconBg: "bg-gradient-to-br from-rose-100 to-pink-50 text-rose-600",
    pill: "bg-rose-50 text-rose-700"
  },
  Notes: {
    iconBg: "bg-gradient-to-br from-violet-100 to-purple-50 text-violet-600",
    pill: "bg-violet-50 text-violet-700"
  },
  Activity: {
    iconBg: "bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-600",
    pill: "bg-amber-50 text-amber-700"
  }
};

export default function DashboardClient() {
  const token = getToken();
  const [sidebarLayout, setSidebarLayout] = useState<"floating" | "expanded">("expanded");
  const [dashboardLayout, setDashboardLayout] = useState<"search-first" | "original">("search-first");
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("Search AI tools...");
  const [selectedQuickAccessIds, setSelectedQuickAccessIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("teachpad_quick_access_ids");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // If the stored list contains the old 'ai-chat-assistant', filter it out
          return parsed.filter((id: string) => id !== "ai-chat-assistant");
        } catch {
          // ignore
        }
      }
    }
    return ["lesson-planner", "worksheet-generator", "notes-generator", "saved-resources", "classroom-tools"];
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);

  const quickAccess = useMemo(() => {
    return ALL_QUICK_ACCESS_OPTIONS.filter((item) => selectedQuickAccessIds.includes(item.id));
  }, [selectedQuickAccessIds]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setPlaceholderText("Search AI tools (e.g. Lesson Planner, Worksheet Generator...)");
      } else {
        setPlaceholderText("Search AI tools...");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const startVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setSearchQuery(text);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return dashboardTools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Focus search input on ⌘K or / key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      const stored = localStorage.getItem("teachpad_sidebar_layout");
      setSidebarLayout(stored === "floating" ? "floating" : "expanded");
      const storedDash = localStorage.getItem("teachpad_dashboard_layout");
      setDashboardLayout(storedDash === "original" ? "original" : "search-first");
    };
    updateLayout();
    window.addEventListener("teachpad_sidebar_layout_changed", updateLayout);
    window.addEventListener("teachpad_dashboard_layout_changed", updateLayout);
    window.addEventListener("storage", updateLayout);
    return () => {
      window.removeEventListener("teachpad_sidebar_layout_changed", updateLayout);
      window.removeEventListener("teachpad_dashboard_layout_changed", updateLayout);
    };
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: backendApi.dashboardSummary,
    enabled: !!token,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const currentUser = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    retry: false,
    staleTime: Infinity
  });
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = getTeacherFirstName({ name: currentUser.data?.full_name || currentUser.data?.name || "", school: "", subjects: "" });
  const statsLoading = dashboardQuery.isLoading;
  const statsError = dashboardQuery.isError;
  const totals = dashboardQuery.data?.totals;
  const monthlyTotals = dashboardQuery.data?.monthly_totals;

  const lessonTotal = totals?.lesson_plans ?? 0;
  const worksheetTotal = totals?.worksheets ?? 0;
  const presentationTotal = totals?.presentations ?? 0;
  const notesTotal = totals?.notes ?? 0;
  const activityTotal = totals?.activities ?? 0;
  const savedResourcesTotal = lessonTotal + worksheetTotal + presentationTotal + notesTotal + activityTotal;

  const lessonMonthlyTotal = monthlyTotals?.lesson_plans ?? 0;
  const worksheetMonthlyTotal = monthlyTotals?.worksheets ?? 0;
  const presentationMonthlyTotal = monthlyTotals?.presentations ?? 0;
  const notesMonthlyTotal = monthlyTotals?.notes ?? 0;
  const activityMonthlyTotal = monthlyTotals?.activities ?? 0;
  const monthlyGenerationsTotal = lessonMonthlyTotal + worksheetMonthlyTotal + presentationMonthlyTotal + notesMonthlyTotal + activityMonthlyTotal;

  const displayRecent = dashboardQuery.data?.recent_generations ?? [];

  const allItems = (dashboardQuery.data?.last_7_days_timestamps || []).map((ts) => ({ created_at: ts }));
  const last7DaysBars = getLast7DaysBars(allItems);
  const maxLast7Days = Math.max(1, ...last7DaysBars.map((bar) => bar.value));
  const estimatedHoursSaved = formatHours(monthlyGenerationsTotal * 0.25);

  function renderCustomizeModal() {
    if (!isCustomizing) return null;

    const handleToggle = (id: string) => {
      setTempSelectedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id);
        }
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, id];
      });
    };

    const handleSave = () => {
      setSelectedQuickAccessIds(tempSelectedIds);
      if (typeof window !== "undefined") {
        localStorage.setItem("teachpad_quick_access_ids", JSON.stringify(tempSelectedIds));
      }
      setIsCustomizing(false);
    };

    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsCustomizing(false)}
      >
        <div 
          className="relative w-full max-w-[540px] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Customize Quick Access</h3>
              <p className={cn("text-xs font-medium mt-0.5 transition-colors", tempSelectedIds.length >= 5 ? "text-amber-600 font-semibold" : "text-slate-500")}>
                Select up to 5 shortcuts. ({tempSelectedIds.length}/5 selected)
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setIsCustomizing(false)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List of shortcuts */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2.5 max-h-[50vh] pr-1">
            {ALL_QUICK_ACCESS_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isChecked = tempSelectedIds.includes(item.id);
              const isDisabled = !isChecked && tempSelectedIds.length >= 5;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleToggle(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3.5 rounded-2xl border p-3 text-left transition-all",
                    isChecked
                      ? "border-blue-200 bg-blue-50/40 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50",
                    isDisabled && "opacity-50 cursor-not-allowed hover:bg-white hover:border-slate-100"
                  )}
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                    isChecked
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  )}>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneClass(item.tone))}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-500 line-clamp-1">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setTempSelectedIds(["lesson-planner", "worksheet-generator", "notes-generator", "saved-resources", "classroom-tools"])}
              className="text-xs font-bold text-[#159565] hover:underline"
            >
              Reset to Defaults
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCustomizing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={tempSelectedIds.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardLayout === "original") {
    const currentMonthName = new Date().toLocaleString("default", { month: "long" });
    const originalStatCards = [
      { label: "Lesson Plans Created", fallback: "0", sub: "Total", icon: BookOpen, tone: "blue", href: "/dashboard/lesson-plans" },
      { label: "Worksheets Created", fallback: "0", sub: "Total", icon: ClipboardCheck, tone: "green", href: "/dashboard/worksheets" },
      { label: "Saved Resources", fallback: "0", sub: "Total", icon: FolderOpen, tone: "orange", href: "/dashboard/resources" },
      { label: "Monthly Generations", fallback: "0", sub: `Used in ${currentMonthName}`, icon: CalendarDays, tone: "pink", href: "/dashboard/billing" }
    ];

    return (
      <div className="mx-auto flex flex-col w-full max-w-[1480px] gap-6 px-0 2xl:px-4">
        {/* Original Greeting Header */}
        <header className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between px-4 mt-6">
          <div className={cn(
            sidebarLayout === "expanded" ? "text-left lg:text-right lg:ml-auto" : "text-left"
          )}>
            <h1 className={cn(
              "flex items-center gap-x-2 whitespace-nowrap text-[23px] font-extrabold tracking-tight text-slate-900 min-w-0 sm:text-3xl",
              sidebarLayout === "expanded" && "lg:justify-end"
            )}>
              <span>{greeting.text}, {firstName}</span>
              {greeting.icon ? (
                <img
                  src={greeting.icon}
                  alt=""
                  aria-hidden="true"
                  className="h-11 w-11 shrink-0 object-contain drop-shadow-[0_7px_10px_rgba(251,191,36,0.24)] sm:h-12 sm:w-12"
                />
              ) : (
                <span className="inline-block text-[2.45rem] leading-none sm:text-[2.7rem]">{greeting.emoji}</span>
              )}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Let&apos;s create something amazing today.</p>
          </div>
          {sidebarLayout !== "expanded" && (
            <div className="hidden h-12 w-[190px] shrink-0 items-center justify-end sm:flex sm:h-14 sm:w-[230px] lg:w-[260px]">
              <img
                src="/assets/teachpad-logo.png"
                alt="Teachpad"
                className="h-auto max-h-10 w-full object-contain object-right sm:max-h-11"
              />
            </div>
          )}
        </header>

        {/* Original Grid of 4 cards (stats-first, launching tools) */}
        <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 px-4">
          {statsError ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex min-h-[116px] items-center gap-3 rounded-[18px] border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 sm:min-h-[126px] sm:gap-4 sm:p-5">
                  <div className="flex h-12 w-12 rounded-xl bg-red-100 items-center justify-center sm:h-14 sm:w-14">
                    <span className="text-red-400 text-xl">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-red-700">Could not load stats</p>
                    <p className="text-[10px] sm:text-xs text-red-500 mt-1">Refresh to try again</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            originalStatCards.map((stat, index) => {
              const numericVal =
                index === 0 ? lessonTotal :
                index === 1 ? worksheetTotal :
                index === 2 ? savedResourcesTotal :
                monthlyGenerationsTotal;

              return (
                <StatCard
                  key={stat.label}
                  {...stat}
                  value={formatNumber(numericVal, stat.fallback)}
                  numericValue={numericVal}
                  isLoading={statsLoading}
                />
              );
            })
          )}
        </section>

        {/* Original Textbook Action Panels (Lesson Plan Generator and Worksheet Generator) */}
        <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-4 xl:grid-cols-2 px-4">
          <ActionPanel
            title="Lesson Plan Generator"
            desc="Generate complete textbook-grounded lesson plans with objectives, timeline, assessment, and notes."
            href="/dashboard/lesson-plans/new"
            button="Create Lesson Plan"
            icon={FileText}
            tone="blue"
            illustrationSrc="/assets/illustrations/lesson-plan-card.png"
          />
          <ActionPanel
            title="Worksheet Generator"
            desc="Create printable worksheets, answer keys, and marking schemes from your selected chapter."
            href="/dashboard/worksheets/new"
            button="Create Worksheet"
            icon={ClipboardCheck}
            tone="green"
            illustrationSrc="/assets/illustrations/worksheet-card.png"
          />
        </section>

        {/* Original Two Column Bottom Layout */}
        <section className="mx-auto grid w-full max-w-[1240px] items-stretch gap-6 lg:grid-cols-[1fr_1.2fr] px-4 mb-16">
          {/* Left Column: Recent Generations */}
          <div className="h-full min-w-0 rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Recent Generations</h2>
              <Link href="/dashboard/recent-generations" className="rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm backdrop-filter transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {statsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 animate-pulse">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                    <div className="h-6 w-16 rounded-lg bg-slate-100" />
                  </div>
                ))
              ) : displayRecent.length ? displayRecent.slice(0, 5).map((item: any, index: number) => (
                <Link
                  key={`${item.type}-${item.id || item.topic}-${index}`}
                  href={item.href}
                  className="clickable-card premium-hover-sm flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 [--clickable-card-hover-bg:#e0f2fe] w-full min-w-0"
                >
                  <div className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    recentTypeClasses[item.type]?.iconBg || "bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] text-[#2563eb]"
                  )}>
                    {item.type === "Worksheet"
                      ? <FileText className="h-5 w-5" />
                      : item.type === "Presentation"
                        ? <Presentation className="h-5 w-5" />
                        : item.type === "Notes"
                          ? <NotebookPen className="h-5 w-5" />
                          : item.type === "Activity"
                            ? <Sparkles className="h-5 w-5" />
                            : <BookOpen className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.topic}</p>
                    <p className="truncate text-xs font-medium text-slate-500">{item.class_name} <span className="mx-1">•</span> {item.subject}</p>
                  </div>
                  <span className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0",
                    recentTypeClasses[item.type]?.pill || "bg-[#eff6ff] text-[#1d4ed8]"
                  )}>
                    {item.type}
                  </span>
                </Link>
              )) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-500">No recent generations yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Your Progress This Month */}
          <div className="flex h-full min-w-0 flex-col rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Your Progress This Month</h2>
            </div>
            {statsLoading ? (
              <div className="grid flex-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col animate-pulse">
                  <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
                  <div className="flex-1 flex items-center justify-center gap-4">
                    <div className="h-[108px] w-[108px] rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid flex-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                  <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col justify-center">
                    <p className="mb-3 text-sm font-bold text-slate-900">Your Usage</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="relative shrink-0" style={{ width: "108px", height: "108px" }}>
                        <UsageDonut
                          lessonCount={lessonMonthlyTotal}
                          worksheetCount={worksheetMonthlyTotal}
                          presentationCount={presentationMonthlyTotal}
                          notesCount={notesMonthlyTotal}
                          activityCount={activityMonthlyTotal}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-extrabold text-slate-900">{monthlyGenerationsTotal}</span>
                        </div>
                      </div>
                      <div className="space-y-3 text-xs font-semibold text-slate-650">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-[#3b82f6]" />
                          <span>Lessons: {lessonMonthlyTotal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-emerald-500" />
                          <span>Worksheets: {worksheetMonthlyTotal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-rose-500" />
                          <span>Slides: {presentationMonthlyTotal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-violet-500" />
                          <span>Notes: {notesMonthlyTotal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-amber-500" />
                          <span>Activities: {activityMonthlyTotal}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col">
                    <p className="mb-3 text-sm font-bold text-slate-900">Daily Generations</p>
                    <div className="flex-1 flex items-end justify-between gap-2 px-1 min-h-[96px]">
                      {last7DaysBars.map((bar, i) => {
                        const pct = bar.value > 0 ? Math.max(25, Math.round((bar.value / maxLast7Days) * 100)) : 10;
                        const isLast = i === last7DaysBars.length - 1;
                        return (
                          <div key={bar.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                            <div
                              className="w-full max-w-[40px] rounded-t-lg"
                              style={{
                                height: `${pct}%`,
                                background: isLast
                                  ? "linear-gradient(180deg, #3b82f6, #1d4ed8)"
                                  : "linear-gradient(180deg, #60a5fa, #60a5fa)",
                                boxShadow: isLast ? "0 4px 16px rgba(37, 99, 235, 0.4)" : "0 2px 8px rgba(59, 130, 246, 0.2)"
                              }}
                            />
                            <span className={`text-[10px] font-semibold ${isLast ? "text-[#2563eb]" : "text-slate-400"}`}>
                              {bar.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="flex min-h-[88px] items-center gap-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-amber-800">Pro Tip</p>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700">Use textbook-based AI for accurate, board-aligned content.</p>
                    </div>
                  </div>
                  <div className="flex min-h-[88px] items-center gap-3 rounded-xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] to-[#e0f2fe] p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe]">
                      <Clock3 className="h-5 w-5 text-[#2563eb]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1e40af]">Time Saved</p>
                      <p className="mt-0.5 text-lg font-extrabold text-slate-900">{estimatedHoursSaved} Hours</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <DashboardMyClasses />

        {/* Original Quick Access */}
        <section className="mx-auto w-full max-w-[1240px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm mb-16">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Quick Access</h2>
            <button 
              onClick={() => {
                setTempSelectedIds(selectedQuickAccessIds);
                setIsCustomizing(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm hover:bg-slate-50 transition active:scale-95"
            >
              Customize <Settings2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {quickAccess.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="clickable-card premium-hover flex min-h-[82px] items-center gap-3 rounded-xl border border-white/70 bg-white/50 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md [--clickable-card-hover-bg:linear-gradient(135deg,#dffafa_0%,#ffffff_74%)]"
                >
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneClass(item.tone))}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </section>
        {renderCustomizeModal()}
      </div>
    );
  }

  return (
    <div className="mx-auto flex flex-col w-full max-w-[1480px] gap-6 px-0 2xl:px-4">
      {sidebarLayout !== "expanded" && (
        <header className="mx-auto hidden lg:flex w-full max-w-[1240px] items-center justify-end px-4 py-2">
          <img
            src="/assets/teachpad-logo.png"
            alt="Teachpad"
            className="h-auto max-h-9 w-auto object-contain"
          />
        </header>
      )}

      {/* Center Stage Greeting */}
      <div className="flex flex-col items-center text-center mt-4 mb-4 px-4 sm:mt-12 sm:mb-8">
        <h1 className="flex items-center justify-center gap-2 whitespace-nowrap text-[25px] font-extrabold tracking-tight text-slate-900 min-w-0 sm:text-4xl">
          <span>{greeting.text}, {firstName}</span>
          {greeting.icon ? (
            <img
              src={greeting.icon}
              alt=""
              aria-hidden="true"
              className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_7px_10px_rgba(251,191,36,0.24)] sm:h-14 sm:w-14"
            />
          ) : (
            <span className="inline-block text-[2.7rem] leading-none sm:text-[3.2rem]">{greeting.emoji}</span>
          )}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">What would you like to create today?</p>
      </div>

      {/* Long Google-like Search Bar */}
      <div className="mx-auto w-full max-w-[680px] mt-1 sm:mt-0 mb-6 sm:mb-10 relative group px-4">
        <Search className="absolute left-7 sm:left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={isListening ? "Listening..." : placeholderText}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-12 sm:pr-28 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white/90 hover:border-slate-300 focus:border-blue-500 focus:bg-white text-[15px] font-medium tracking-wide text-slate-700 placeholder-slate-400/90 outline-none shadow-[0_8px_30px_rgba(15,23,42,0.04)] focus:shadow-[0_12px_36px_rgba(37,99,235,0.08)] focus:ring-4 focus:ring-blue-500/5 transition-all duration-300 ease-in-out"
        />
        
        <div className="absolute right-5 sm:right-7 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-655 hover:scale-110 active:scale-95 transition-all duration-150 focus:outline-none p-1"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
              <button
                type="button"
                onClick={startVoiceSearch}
                className={cn(
                  "transition-all duration-150 p-1",
                  isListening ? "text-red-500 animate-pulse scale-110" : "text-slate-400 hover:text-slate-600"
                )}
                title="Voice search"
              >
                <Mic className="h-4.5 w-4.5" />
              </button>
          )}
        </div>

        {/* Floating Dropdown results */}
        {searchQuery ? (
          <div className="absolute left-4 right-4 top-full mt-2 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-2 shadow-[0_20px_50px_rgba(15,23,42,0.15)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AI Tools ({filteredTools.length})
            </div>
            <div className="mt-1 max-h-[300px] overflow-y-auto space-y-1">
              {filteredTools.length ? (
                filteredTools.map((tool) => (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    onClick={() => setSearchQuery("")}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-slate-50/80 active:bg-slate-100/80 group/item"
                  >
                    <span className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform group-hover/item:scale-105 shadow-sm ring-1 ring-slate-100",
                      tool.tone === "blue" ? "bg-blue-50 text-blue-500" :
                      tool.tone === "green" ? "bg-emerald-50 text-emerald-500" :
                      tool.tone === "red" ? "bg-rose-50 text-rose-500" :
                      tool.tone === "pink" ? "bg-pink-50 text-pink-500" :
                      tool.tone === "aqua" ? "bg-cyan-50 text-cyan-500" :
                      "bg-amber-50 text-amber-500"
                    )}>
                      <tool.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 transition-colors group-hover/item:text-blue-600">{tool.title}</p>
                      <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 line-clamp-2">{tool.description}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center text-xs font-semibold text-slate-400">
                  No matching AI tools found.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Cards Grid */}
      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4 px-4">
        {statsError ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex min-h-[116px] items-center gap-3 rounded-[18px] border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 sm:min-h-[126px] sm:gap-4 sm:p-5">
                <div className="flex h-12 w-12 rounded-xl bg-red-100 items-center justify-center sm:h-14 sm:w-14">
                  <span className="text-red-400 text-xl">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-red-700">Could not load stats</p>
                  <p className="text-[10px] sm:text-xs text-red-500 mt-1">Refresh to try again</p>
                </div>
              </div>
            ))}
          </>
        ) : (
          statCards.map((stat, index) => {
            const numericVal =
              index === 0 ? lessonTotal :
              index === 1 ? worksheetTotal :
              index === 2 ? notesTotal :
              presentationTotal;

            return (
              <StatCard
                key={stat.label}
                {...stat}
                value={formatNumber(numericVal, stat.fallback)}
                numericValue={numericVal}
                hoverLift={true}
                isLoading={statsLoading}
              />
            );
          })
        )}
      </section>

      {/* View All Button below Cards */}
      <div className="mx-auto flex w-full max-w-[1240px] justify-center mt-4 mb-10 px-4">
        <Link href="/dashboard/classroom-tools" className="rounded-xl border border-white/70 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm backdrop-filter transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
          View All Tools
        </Link>
      </div>

      {/* Full-width Layout: Recent Generations */}
      <section className="mx-auto w-full max-w-[1240px] px-4 mb-16">
        <div className="w-full rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Generations</h2>
            <Link href="/dashboard/recent-generations" className="rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm backdrop-filter transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 animate-pulse">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                  <div className="h-6 w-16 rounded-lg bg-slate-100" />
                </div>
              ))
            ) : displayRecent.length ? displayRecent.slice(0, 5).map((item: any, index: number) => (
              <Link
                key={`${item.type}-${item.id || item.topic}-${index}`}
                href={item.href}
                className="clickable-card premium-hover-sm flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 [--clickable-card-hover-bg:#e0f2fe] w-full min-w-0"
              >
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  recentTypeClasses[item.type]?.iconBg || "bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] text-[#2563eb]"
                )}>
                  {item.type === "Worksheet"
                    ? <FileText className="h-5 w-5" />
                    : item.type === "Presentation"
                      ? <Presentation className="h-5 w-5" />
                      : item.type === "Notes"
                        ? <NotebookPen className="h-5 w-5" />
                        : item.type === "Activity"
                          ? <Sparkles className="h-5 w-5" />
                          : <BookOpen className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.topic}</p>
                  <p className="truncate text-xs font-medium text-slate-500">{item.class_name} <span className="mx-1">•</span> {item.subject}</p>
                </div>
                <span className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0",
                  recentTypeClasses[item.type]?.pill || "bg-[#eff6ff] text-[#1d4ed8]"
                )}>
                  {item.type}
                </span>
              </Link>
            )) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">No recent generations yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <DashboardMyClasses />

      <section className="mx-auto w-full max-w-[1240px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Quick Access</h2>
          <button 
            onClick={() => {
              setTempSelectedIds(selectedQuickAccessIds);
              setIsCustomizing(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm hover:bg-slate-50 transition active:scale-95"
          >
            Customize <Settings2 className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="clickable-card premium-hover flex min-h-[82px] items-center gap-3 rounded-xl border border-white/70 bg-white/50 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md [--clickable-card-hover-bg:linear-gradient(135deg,#dffafa_0%,#ffffff_74%)]"
              >
                <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneClass(item.tone))}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            );
          })}
        </div>
      </section>
      {renderCustomizeModal()}
    </div>
  );
}

function StatsErrorCard() {
  return (
    <div className="flex min-h-[116px] items-center gap-3 rounded-[18px] border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 sm:min-h-[126px] sm:gap-4 sm:p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 sm:h-14 sm:w-14">
        <span className="text-xl text-red-400">!</span>
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-red-700 sm:text-sm">Could not load stats</p>
        <p className="mt-1 text-[10px] text-red-500 sm:text-xs">Refresh to try again</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, numericValue, icon: Icon, tone, href, hoverLift, showOnlyLabel, desc, isLoading }: { label: string; value: string; sub: string; numericValue: number; trend?: string; icon: any; tone: string; href?: string; hoverLift?: boolean; showOnlyLabel?: boolean; desc?: string; isLoading?: boolean }) {
  const gradients = {
    pink: {
      card: "bg-gradient-to-br from-white via-pink-50/70 to-white",
      iconBox: "bg-[#fff1f7] text-[#f45f98] ring-pink-100",
      iconShadow: "shadow-[0_14px_30px_rgba(244,95,152,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
      glow: "bg-pink-200/30"
    },
    green: {
      card: "bg-gradient-to-br from-white via-emerald-50/70 to-white",
      iconBox: "bg-[#ecfff6] text-[#24b77a] ring-emerald-100",
      iconShadow: "shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)]",
      glow: "bg-emerald-200/30"
    },
    orange: {
      card: "bg-gradient-to-br from-white via-amber-50/80 to-white",
      iconBox: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
      iconShadow: "shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
      glow: "bg-amber-200/30"
    },
    blue: {
      card: "bg-gradient-to-br from-white via-[#eff6ff] to-white",
      iconBox: "bg-[#eef6ff] text-[#3b82f6] ring-blue-100",
      iconShadow: "shadow-[0_14px_30px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
      glow: "bg-[#bfdbfe]/30"
    },
    yellow: {
      card: "bg-gradient-to-br from-[#fffaf0] via-amber-50/80 to-white",
      iconBox: "bg-[#fff6df] text-[#f0a22f] ring-amber-100",
      iconShadow: "shadow-[0_14px_30px_rgba(240,162,47,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
      glow: "bg-amber-200/30"
    }
  };
  const g = gradients[tone as keyof typeof gradients] || gradients.pink;

  const content = (
    <>
      <div className={cn("absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl", g.glow)} />

      <div className={cn(
        "shrink-0 transition-transform duration-300 group-hover/card:scale-105",
        "h-14 w-14 sm:h-[64px] sm:w-[64px]",
        "rounded-[22px]",
        "flex items-center justify-center",
        "ring-1",
        g.iconBox,
        g.iconShadow
      )}>
        <Icon className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
      </div>

      <div className="min-w-0 flex-1">
        {showOnlyLabel ? (
          <>
            <p className="text-[14.5px] font-extrabold leading-snug text-slate-900 sm:text-[16.5px] transition-colors group-hover/card:text-blue-600">
              {label}
            </p>
            {desc && (
              <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
                {desc}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-[13px] font-bold leading-snug text-slate-900 sm:text-[15.5px] transition-colors group-hover/card:text-blue-600">{label}</p>
            {isLoading ? (
              <>
                <div className="h-7 w-12 rounded-lg bg-slate-200/80 animate-pulse my-1.5" />
                <div className="h-3 w-16 rounded bg-slate-100/80 animate-pulse" />
              </>
            ) : (
              <>
                <p className="mt-1.5 text-2xl font-extrabold leading-none text-slate-950 sm:text-3xl">
                  <CountUpNumber value={numericValue} />
                </p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-slate-600 sm:text-xs">{sub}</p>
              </>
            )}
          </>
        )}
      </div>
    </>
  );

  const containerClasses = cn(
    "relative overflow-hidden min-w-0 w-full group/card",
    "rounded-[18px]",
    "border border-white/70",
    "p-4 sm:p-5",
    "min-h-[116px] sm:min-h-[126px]",
    "flex items-center gap-3 sm:gap-4",
    "shadow-[0_14px_34px_rgba(15,23,42,0.07)]",
    g.card
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className={cn(
          containerClasses, 
          "transition-all duration-300 ease-in-out hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)]",
          hoverLift && "hover:-translate-y-0.5"
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  );
}

function CountUpNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const displayValueRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      displayValueRef.current = value;
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    const startValue = displayValueRef.current;
    let frameId = 0;

    function easeOutQuart(t: number): number {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.round(startValue + (value - startValue) * easedProgress);

      setDisplayValue(currentValue);
      displayValueRef.current = currentValue;

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        displayValueRef.current = value;
      }
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{displayValue}</>;
}

function UsageDonut({
  lessonCount,
  worksheetCount,
  presentationCount,
  notesCount,
  activityCount
}: {
  lessonCount: number;
  worksheetCount: number;
  presentationCount: number;
  notesCount: number;
  activityCount: number;
}) {
  const total = lessonCount + worksheetCount + presentationCount + notesCount + activityCount;
  const radius = 40;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const segments = total
    ? [
        { value: lessonCount, color: "#3b82f6" },
        { value: worksheetCount, color: "#0db986" },
        { value: presentationCount, color: "#f43f5e" },
        { value: notesCount, color: "#8b5cf6" },
        { value: activityCount, color: "#f59e0b" }
      ]
    : [{ value: 1, color: "#d7dae4" }];
  let offset = 0;

  return (
    <svg className="h-full w-full" viewBox="0 0 108 108" aria-hidden="true">
      <defs>
        <mask id="usage-donut-reveal">
          <circle cx="54" cy="54" r={radius} fill="none" stroke="white" strokeWidth={strokeWidth} pathLength="100" className="animate-usage-stroke-reveal" />
        </mask>
        <filter id="usage-donut-soft-shadow" x="-18%" y="-12%" width="136%" height="136%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#64748b" floodOpacity="0.18" />
        </filter>
      </defs>
      <circle cx="54" cy="54" r={radius} fill="none" stroke="#eef2f7" strokeWidth={strokeWidth} />
      <g className="animate-usage-rotate-once origin-center" filter="url(#usage-donut-soft-shadow)" mask="url(#usage-donut-reveal)">
        {segments.map((segment, index) => {
          const length = total ? (segment.value / total) * circumference : circumference;
          const dashOffset = -offset;
          offset += length;
          return (
            <circle
              key={`${segment.color}-${index}`}
              cx="54"
              cy="54"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 54 54)"
            />
          );
        })}
      </g>
      <circle cx="54" cy="54" r={28} fill="white" />
    </svg>
  );
}

function ActionPanel({ title, desc, href, button, icon: Icon, tone, illustrationSrc }: { title: string; desc: string; href: string; button: string; icon: any; tone: "blue" | "green"; illustrationSrc?: string }) {
  const isGreen = tone === "green";
  const gradients = {
    card: isGreen
      ? "bg-gradient-to-br from-emerald-50 via-green-50 to-white"
      : "bg-gradient-to-br from-[#eff6ff] via-[#eff6ff] to-white",
    iconBox: isGreen
      ? "bg-[#ecfff6] text-[#24b77a] ring-emerald-100"
      : "bg-[#eef6ff] text-[#3b82f6] ring-blue-100",
    iconShadow: isGreen
      ? "shadow-[0_14px_30px_rgba(36,183,122,0.23),inset_0_1px_0_rgba(255,255,255,0.92)]"
      : "shadow-[0_14px_30px_rgba(59,130,246,0.24),inset_0_1px_0_rgba(255,255,255,0.92)]",
    glow: isGreen ? "bg-emerald-200/30" : "bg-[#bfdbfe]/30",
    button: isGreen
      ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
      : "bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8]",
    accent: isGreen ? "#10b981" : "#3b82f6"
  };

  return (
    <Link href={href} className={cn(
      "clickable-card group block",
      "relative overflow-hidden min-w-0 w-full",
      "rounded-[20px]",
      "border border-white/60",
      "p-4 sm:p-5",
      "min-h-[190px] sm:min-h-[210px]",
      "shadow-[0_14px_34px_rgba(15,23,42,0.07)]",
      "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_var(--teachpad-shadowToolCard)]",
      isGreen
        ? "[--clickable-card-hover-bg:linear-gradient(135deg,#bbf7d0_0%,#ffffff_74%)]"
        : "[--clickable-card-hover-bg:linear-gradient(135deg,#bfdbfe_0%,#ffffff_74%)]",
      gradients.card
    )}>
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl", gradients.glow)} />
      <div className={cn("absolute -right-4 bottom-4 h-16 w-16 rounded-full blur-2xl", gradients.glow)} />

      <div className="relative z-10 flex h-full min-w-0 w-full flex-col justify-between sm:max-w-none">
        <div className="min-w-0 w-full">
          <div className={cn(
            "inline-flex",
            "h-14 w-14 sm:h-[64px] sm:w-[64px]",
            "rounded-[22px]",
            "items-center justify-center",
            "mb-3 ring-1",
            gradients.iconBox,
            gradients.iconShadow
          )}>
            <Icon className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.3]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{title}</h2>
          <p className="mt-1.5 text-sm font-medium text-slate-600 leading-5 line-clamp-2">{desc}</p>
        </div>

        <span
          className={cn(
            "premium-hover-sm mt-4 inline-flex",
            "h-10",
            "w-fit",
            "items-center justify-center gap-2",
            "rounded-xl",
            "px-4",
            "text-sm font-bold text-white",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-300",
            gradients.button
          )}
        >
          <Plus className="h-4 w-4" />
          {button}
        </span>
      </div>

      {illustrationSrc ? (
        <img
          src={illustrationSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 hidden h-[170px] w-[170px] translate-x-5 translate-y-5 object-contain drop-shadow-[0_16px_24px_rgba(37,99,235,0.24)] sm:block lg:h-[190px] lg:w-[190px]"
        />
      ) : (
        <div className="absolute bottom-4 right-4 hidden sm:block">
          <div className={cn(
            "relative h-[96px] w-[118px]",
            "rotate-6"
          )}>
            <div className={cn(
              "absolute inset-0",
              "rounded-2xl border border-white/60 bg-white/70",
              "shadow-lg backdrop-blur-sm",
              "flex flex-col items-center justify-center gap-1.5 p-3"
            )}>
              <div className={cn("w-8 h-8 rounded-lg", isGreen ? "bg-emerald-100" : "bg-[#dbeafe]")}>
                <Icon className={cn("h-8 w-8 p-1.5", isGreen ? "text-emerald-600" : "text-[#2563eb]")} />
              </div>
              <div className={cn("w-12 h-2 rounded-full", isGreen ? "bg-emerald-200" : "bg-[#bfdbfe]")} />
              <div className={cn("w-10 h-2 rounded-full", isGreen ? "bg-emerald-100" : "bg-[#dbeafe]")} />
              <div className={cn("w-14 h-2 rounded-full", isGreen ? "bg-emerald-200" : "bg-[#bfdbfe]")} />
            </div>
            <div className={cn(
              "absolute -top-3 -right-3",
              "h-9 w-9",
              "rounded-xl border border-white/60 bg-white/80",
              "shadow-md backdrop-blur-sm",
              "flex items-center justify-center"
            )}>
              <Check className={cn("h-5 w-5", isGreen ? "text-emerald-500" : "text-[#3b82f6]")} />
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}

function formatNumber(value: number | undefined, fallback: string) {
  if (typeof value !== "number") return fallback;
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    blue: "bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-lg",
    pink: "bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg",
    green: "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg",
    orange: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg",
    red: "bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-lg"
  };
  return tones[tone] || tones.blue;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️", icon: "" };
  if (hour >= 17) return { text: "Good evening", emoji: "", icon: "/assets/icons/greeting-evening.png" };
  return { text: "Good afternoon", emoji: "", icon: "/assets/icons/greeting-afternoon.png" };
}

function getLast7DaysBars(items: Array<{ created_at?: string; updated_at?: string }>) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const monthLabel = now.toLocaleString("en-US", { month: "short" });

  return Array.from({ length: 7 }, (_, index) => {
    let dayOfMonth = today - (6 - index);
    let labelYear = year;
    let labelMonth = month;
    let labelDay = dayOfMonth;

    if (dayOfMonth < 1) {
      const prevMonth = new Date(year, month, 0);
      const daysInPrevMonth = prevMonth.getDate();
      labelDay = daysInPrevMonth + dayOfMonth;
      if (month === 0) {
        labelYear = year - 1;
        labelMonth = 11;
      } else {
        labelMonth = month - 1;
      }
    }

    const value = items.filter((item) => {
      const created = parseItemDate(item);
      if (!created) return false;
      return created.getFullYear() === labelYear && created.getMonth() === labelMonth && created.getDate() === labelDay;
    }).length;

    return { day: labelDay, label: `${labelDay}`, value };
  });
}

function parseItemDate(item: { created_at?: string; updated_at?: string }) {
  const raw = item.created_at || item.updated_at;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
