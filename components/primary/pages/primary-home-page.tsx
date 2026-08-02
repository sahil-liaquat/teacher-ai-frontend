"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { backendApi, CURRENT_USER_QUERY_KEY, type ApiUser } from "@/lib/api";
import { learningAreaForSubject, themesForSubject, subjectsForClass, PRIMARY_LEVELS } from "@/lib/primary-theme-content";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import type { PrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { PRIMARY_RESOURCES } from "@/lib/primary-resource-catalog";
import { libraryPathForCatalogCategory } from "@/lib/primary-library-taxonomy";
import {
  Calendar,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Download,
  ChevronDown,
  Loader2
} from "lucide-react";

// Journey items definition
const JOURNEY = [
  {
    name: "Plan",
    sub: "Prepare your lesson",
    href: "/primary/today",
    image: "/assets/primary/dashboard-plan.webp",
    badgeBg: "bg-blue-50 text-blue-700",
    arrowColor: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  {
    name: "Today's plan",
    sub: "See your schedule",
    href: "/primary/today",
    image: "/assets/primary/dashboard-teach.webp",
    badgeBg: "bg-emerald-50 text-emerald-700",
    arrowColor: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  },
  {
    name: "Practice",
    sub: "Reinforce learning",
    href: "/primary/library?category=printable-activities&type=worksheets",
    image: "/assets/primary/dashboard-practice.webp",
    badgeBg: "bg-amber-50 text-amber-700",
    arrowColor: "bg-amber-50 text-amber-600 hover:bg-amber-100",
  },
  {
    name: "Engage",
    sub: "Hands-on activities",
    href: "/primary/create?category=activities",
    image: "/assets/primary/dashboard-engage.webp",
    badgeBg: "bg-pink-50 text-pink-700",
    arrowColor: "bg-pink-50 text-pink-600 hover:bg-pink-100",
  },
  {
    name: "Sing & Move",
    sub: "Rhymes & movement",
    href: "/primary/create?category=movement",
    image: "/assets/primary/dashboard-sing-move.webp",
    badgeBg: "bg-violet-50 text-violet-700",
    arrowColor: "bg-violet-50 text-violet-600 hover:bg-violet-100",
  },
];

// Resolves a flat catalogue category (e.g. "Flashcards") to its place in the
// Library's category/type navigation, falling back to the Library home if the
// taxonomy ever falls out of sync with the catalogue.
function quickAccessHref(catalogCategory: string): string {
  const path = libraryPathForCatalogCategory(catalogCategory);
  return path ? `/primary/library?category=${path.category}&type=${path.type}` : "/primary/library";
}

// Quick-access categories are resolved against the resource catalogue at runtime.
const QUICK_ACCESS = [
  {
    name: "Flashcards",
    category: "Flashcards",
    bg: "from-rose-50/60 to-red-100/20 hover:border-red-200",
    emoji: "🍎",
    iconBg: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  {
    name: "Picture Talk",
    category: "Picture Talk Cards",
    bg: "from-sky-50/60 to-blue-100/20 hover:border-blue-200",
    emoji: "🌳",
    iconBg: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    name: "Worksheets",
    category: "Worksheets",
    bg: "from-indigo-50/60 to-purple-100/20 hover:border-purple-200",
    emoji: "📝",
    iconBg: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  },
  {
    name: "Activity",
    category: "Calendar Activities",
    bg: "from-amber-50/60 to-orange-100/20 hover:border-orange-200",
    emoji: "✂️",
    iconBg: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    name: "Rhymes",
    category: "Circle Time Prompts",
    bg: "from-violet-50/60 to-purple-100/20 hover:border-purple-200",
    emoji: "🎵",
    iconBg: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    name: "Manipulatives",
    category: "Matching Activities",
    bg: "from-emerald-50/60 to-teal-100/20 hover:border-teal-200",
    emoji: "🧱",
    iconBg: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
];

export default function PrimaryHomePage({ notify }: { notify: (s: string) => void }) {
  const { context, updateContext } = usePrimaryTeachingContext();
  const router = useRouter();

  // Fetch current user info
  const { data: currentUser } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    staleTime: Infinity,
  });

  const teacherName = useMemo(() => {
    if (!currentUser) return "Meena";
    const name = currentUser.full_name || currentUser.name || "Meena";
    return name.split(" ")[0];
  }, [currentUser]);

  const todayISOStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  // Local selections — initialise from current context
  const [selectedLevel, setSelectedLevel] = useState<string>(context.level || "");
  const [selectedSubject, setSelectedSubject] = useState(context.subject || "");
  const [selectedTheme, setSelectedTheme] = useState(context.theme || "");
  const [savingContext, setSavingContext] = useState(false);

  const todayQuery = useQuery({
    queryKey: ["primary-today-workspace", todayISOStr],
    queryFn: () => backendApi.getTodayWorkspace(todayISOStr),
    retry: 1,
  });
  const todayActivities = todayQuery.data?.planner_activities ?? [];

  useEffect(() => {
    setSelectedLevel(context.level || "");
    setSelectedSubject(context.subject || "");
    setSelectedTheme(context.theme || "");
  }, [context.level, context.subject, context.theme]);

  const subjectOptions = useMemo(() => {
    if (!selectedLevel) return [];
    return subjectsForClass(selectedLevel as any);
  }, [selectedLevel]);

  const themeOptions = useMemo(() => {
    if (!selectedSubject) return [];
    return themesForSubject(selectedSubject);
  }, [selectedSubject]);

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setSelectedSubject("");
    setSelectedTheme("");
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTheme("");
  };

  // A full plan can only be viewed once class, subject and theme are all chosen.
  const canViewPlan = !!(selectedLevel && selectedSubject && selectedTheme);

  const handleViewFullPlan = async () => {
    if (!canViewPlan) return;
    setSavingContext(true);
    try {
      await updateContext({
        level: selectedLevel as PrimaryTeachingContext["level"],
        subject: selectedSubject,
        theme: selectedTheme,
        topic: selectedTheme,
      });
      router.push("/primary/today");
    } finally {
      setSavingContext(false);
    }
  };

  const learningArea = useMemo(() => learningAreaForSubject(selectedSubject || context.subject), [selectedSubject, context.subject]);

  const isReady = !!(selectedLevel || context.level);
  const isWeekend = useMemo(() => {
    const day = new Date(`${todayISOStr}T12:00:00`).getDay();
    return day === 0 || day === 6;
  }, [todayISOStr]);
  const quickAccess = useMemo(() => QUICK_ACCESS.map((item) => {
    const matchingResources = PRIMARY_RESOURCES.filter((resource) => {
      if (resource.category !== item.category) return false;
      if (selectedLevel && resource.levels.length > 0 && !resource.levels.includes(selectedLevel)) return false;
      if (selectedSubject && resource.subjects.length > 0 && !resource.subjects.includes(selectedSubject)) return false;
      if (selectedTheme && resource.themes.length > 0 && !resource.themes.includes(selectedTheme)) return false;
      return true;
    });
    return { ...item, resources: matchingResources };
  }), [selectedLevel, selectedSubject, selectedTheme]);

  const downloadResource = (item: typeof quickAccess[number]) => {
    const resource = item.resources[0];
    if (!resource) {
      notify(`No ${item.name.toLowerCase()} match your current selections.`);
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = resource.fileUrl;
    anchor.download = resource.fileUrl.split("/").pop() || `${resource.title}.${resource.fileType}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    notify(`Downloading ${resource.title}`);
  };

  return (
    <div className="space-y-7">
      
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white px-6 py-8 shadow-sm ring-1 ring-purple-100/50 md:py-10">
        <div className="relative z-10 max-w-xl space-y-1">
          <p className="text-sm font-bold text-slate-500 md:text-base">
            Good morning, {teacherName}! 👋
          </p>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl md:text-[34px] md:leading-tight">
            Let's make today amazing for our little learners! 🌈
          </h2>
          <p className="text-xs font-semibold text-slate-400 sm:text-sm pt-1">
            {isWeekend
              ? "It’s the weekend — plan ahead or take a well-earned break."
              : todayActivities.length > 0
                ? `Your plan has ${todayActivities.length} ${todayActivities.length === 1 ? "activity" : "activities"} ready for today.`
                : "Choose a theme to prepare something wonderful for today."}
          </p>
        </div>
        
        {/* Sun, Cloud, and Mascot background elements */}
        <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-6 lg:flex">
          <div className="relative flex items-center justify-center">
            <span className="absolute -left-12 -top-6 text-4xl animate-bounce duration-1000">☀️</span>
            <span className="absolute -left-20 top-4 text-3xl opacity-80">☁️</span>
          </div>
          <Image 
            src="/assets/sidebar-mascot.png" 
            alt="Elif Mascot" 
            width={180} 
            height={280} 
            className="h-[210px] w-auto object-contain"
            priority 
          />
        </div>
      </div>

      {/* 2. Today's Theme Selector Card */}
      <div className="rounded-[22px] border border-white/70 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.04)] ring-1 ring-slate-100">
        
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c5dff] to-[#5a39eb] text-white shadow-md shadow-indigo-100">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">TODAY'S PLAN</p>
              <p className="text-xs font-bold text-slate-400">{todayDateStr}</p>
            </div>
          </div>
        </div>

        {/* Selection dropdowns + CTA, all in one row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

          {/* Class */}
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Class</label>
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition"
              >
                <option value="">Select class…</option>
                {PRIMARY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Subject */}
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Subject</label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={subjectOptions.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition disabled:opacity-50"
              >
                <option value="">{subjectOptions.length === 0 ? "Pick class first" : "Select subject…"}</option>
                {subjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Theme */}
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Theme / Topic</label>
            <div className="relative">
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                disabled={themeOptions.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 pr-8 text-sm font-bold text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 transition disabled:opacity-50"
              >
                <option value="">{themeOptions.length === 0 ? "Pick subject first" : "Select theme…"}</option>
                {themeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* CTA — same row as the inputs */}
          <button
            onClick={handleViewFullPlan}
            disabled={!canViewPlan || savingContext}
            title={canViewPlan ? undefined : "Select a class, subject and theme first"}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#6e41f5] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-violet-100 transition hover:bg-[#5b32d3] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingContext ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Opening…
              </>
            ) : (
              <>
                {todayActivities.length > 0 ? "Open today's plan" : "View full plan"} <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. My Teaching Journey */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">
            My Teaching Journey ✨
          </h3>
          <Link 
            href="/primary/settings" 
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            Customize ✎
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {JOURNEY.map((item, idx) => (
            <Link 
              href={item.href} 
              key={item.name} 
              className="group relative flex flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-md shadow-slate-100/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100/20"
            >
              <div className="relative aspect-[1.15/1] w-full overflow-hidden bg-slate-50">
                <Image 
                  src={item.image} 
                  alt={item.name} 
                  fill 
                  sizes="(min-width: 1280px) 16vw, (min-width: 768px) 30vw, 45vw" 
                  className="object-cover transition duration-300 group-hover:scale-105" 
                  onError={(event) => {
                    event.currentTarget.src = "/assets/sidebar-mascot.png";
                  }}
                />
              </div>
              <div className="flex flex-col p-3 bg-white">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black", item.badgeBg)}>
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px]">{idx + 1}</span>
                    {item.name}
                  </span>
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-sm ring-1 ring-slate-100 transition duration-300 group-hover:-translate-y-0.5", item.arrowColor)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  {item.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Quick Access - Resources for Today */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">
            Quick Access – Resources for Today
          </h3>
          <Link 
            href="/primary/library" 
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {quickAccess.map((item) => (
            <div
              key={item.name} 
              className={cn(
                "group relative flex flex-col items-center rounded-[22px] border border-white/60 bg-gradient-to-br p-4 text-center shadow-sm shadow-slate-100/50 transition duration-300 hover:-translate-y-1 hover:shadow-md",
                item.bg
              )}
              role="link"
              tabIndex={0}
              onClick={() => router.push(quickAccessHref(item.category))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(quickAccessHref(item.category));
                }
              }}
              aria-label={`Browse ${item.name}`}
            >
              {/* 3D Box for Emoji */}
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-[18px] text-2xl shadow-sm ring-1",
                item.iconBg
              )}>
                {item.emoji}
              </div>

              <b className="mt-3 block text-xs font-black text-slate-800">
                {item.name}
              </b>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                {item.resources.length} {item.resources.length === 1 ? "resource" : "resources"}
              </span>

              {/* Download Icon Wrapper */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  downloadResource(item);
                }}
                className="mt-3 flex h-7 w-7 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50 active:scale-95"
                aria-label={`Download a ${item.name} resource`}
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
