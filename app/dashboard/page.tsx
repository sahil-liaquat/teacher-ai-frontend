"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderOpen,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  Settings2,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { backendApi, CURRENT_USER_QUERY_KEY, getCurrentUser, type ApiUser } from "@/lib/api";
import { getTeacherFirstName } from "@/lib/profile";
import { cn } from "@/lib/utils";

const statCards = [
  { label: "Lesson Plans Created", fallback: "0", sub: "This Month", icon: BookOpen, tone: "pink" },
  { label: "Worksheets Created", fallback: "0", sub: "This Month", icon: FileText, tone: "green" },
  { label: "Saved Resources", fallback: "0", sub: "Total", icon: FolderOpen, tone: "orange" },
  { label: "Monthly Generations", fallback: "0", sub: "Used This Month", icon: ClipboardCheck, tone: "blue" }
];

const quickAccess = [
  { title: "Lesson Planner", desc: "Create detailed, curriculum-aligned lesson plans.", href: "/dashboard/lesson-plans/new", icon: BookOpen, tone: "purple" },
  { title: "Worksheet Generator", desc: "Generate printable worksheets with answers.", href: "/dashboard/worksheets/new", icon: ClipboardCheck, tone: "green" },
  { title: "Explore Resources", desc: "Find high-quality teaching resources and materials.", href: "/dashboard/resources", icon: FolderOpen, tone: "orange" },
  { title: "AI Chat Assistant", desc: "Ask anything and get instant help from AI.", href: "/dashboard/classroom-tools", icon: Bot, tone: "red" },
  { title: "Classroom Tools", desc: "Use tools like quiz maker and more.", href: "/dashboard/classroom-tools", icon: Sparkles, tone: "blue" }
];

export default function TeacherDashboard() {
  const plans = useQuery({ queryKey: ["lesson-plans-summary"], queryFn: () => backendApi.lessonPlans(0, 50), retry: false });
  const worksheets = useQuery({ queryKey: ["worksheets-summary"], queryFn: () => backendApi.worksheets(0, 50), retry: false });
  const currentUser = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    retry: false,
    staleTime: Infinity
  });
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = getTeacherFirstName({ name: currentUser.data?.full_name || currentUser.data?.name || "", school: "", subjects: "" });
  const lessonTotal = plans.data?.total;
  const lessonRecent = plans.data?.items?.length
    ? plans.data.items.map((item: any) => ({
        ...item,
        topic: item.topic || item.chapter_name || "Generated Lesson Plan",
        class_name: item.class_name || "8th Grade",
        subject: item.subject || "Science",
        type: "Lesson Plan",
        href: `/dashboard/lesson-plans/${item.id}`,
        created_at: item.created_at || item.updated_at || ""
      }))
    : [];
  const worksheetItems = worksheets.data?.items || [];
  const worksheetRecent = worksheetItems.map((item: any) => {
    const output = item.output_json || {};
    const metadata = output.metadata || {};
    return {
      id: item.id,
      topic: output.title || metadata.topic || "Generated Worksheet",
      class_name: metadata.grade ? `Grade ${metadata.grade}` : metadata.class || "Class",
      subject: metadata.subject || "Science",
      type: "Worksheet",
      href: `/dashboard/worksheets/${item.id}`,
      created_at: item.created_at || ""
    };
  });
  const recent = [...worksheetRecent, ...lessonRecent]
    .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  const displayRecent = recent;
  const worksheetTotal = worksheets.data?.total;
  const savedResourcesTotal = (lessonTotal || 0) + (worksheetTotal || 0);
  const lessonMonthlyTotal = countItemsThisMonth(plans.data?.items || []);
  const worksheetMonthlyTotal = countItemsThisMonth(worksheetItems);
  const monthlyGenerationsTotal = lessonMonthlyTotal + worksheetMonthlyTotal;
  const generationBars = getDailyGenerationBars([...(plans.data?.items || []), ...worksheetItems]);
  const maxGenerationBar = Math.max(1, ...generationBars.map((bar) => bar.value));
  const generationTicks = getDailyGenerationTicks(generationBars);
  const usageGradient = getUsageGradient(lessonMonthlyTotal, worksheetMonthlyTotal);
  const estimatedHoursSaved = formatHours(monthlyGenerationsTotal * 0.25);

  return (
    <div className="grid gap-5 sm:gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900">
            {greeting.text}, {firstName} <span className="inline-block">{greeting.emoji}</span>
          </h1>
          <p className="mt-1.5 text-sm sm:text-base font-medium text-slate-500">Let&apos;s create something amazing today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="premium-hover-sm relative block w-full sm:w-[300px] lg:w-[360px]">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-2xl border border-white/70 bg-white/80 px-11 pr-16 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur-sm outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100/50 hover:border-slate-200"
              placeholder="Search anything..."
            />
            <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
              <span>⌘</span><span>K</span>
            </span>
          </label>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.label}
            {...stat}
            value={
              index === 0
                ? formatNumber(lessonMonthlyTotal, stat.fallback)
                : index === 1
                  ? formatNumber(worksheetMonthlyTotal, stat.fallback)
                  : index === 2
                    ? formatNumber(savedResourcesTotal, stat.fallback)
                    : formatNumber(monthlyGenerationsTotal, stat.fallback)
            }
            numericValue={
              index === 0
                ? lessonMonthlyTotal || 0
                : index === 1
                  ? worksheetMonthlyTotal || 0
                  : index === 2
                    ? savedResourcesTotal || 0
                    : monthlyGenerationsTotal || 0
            }
          />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <ActionPanel
          title="Create Lesson Plan"
          desc="Generate curriculum-aligned lesson plans in seconds."
          href="/dashboard/lesson-plans/new"
          button="Create Lesson Plan"
          icon={FileText}
          tone="purple"
        />
        <ActionPanel
          title="Create Worksheet"
          desc="Generate printable worksheets with answers and marking schemes."
          href="/dashboard/worksheets/new"
          button="Create Worksheet"
          icon={Sparkles}
          tone="green"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Generations</h2>
            <Link href="/dashboard/resources" className="rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {displayRecent.length ? displayRecent.slice(0, 5).map((item: any, index: number) => (
              <Link
                key={`${item.type}-${item.id || item.topic}-${index}`}
                href={item.href}
                className="premium-hover-sm flex items-center gap-3 rounded-2xl p-3 transition-all duration-200 hover:bg-slate-50"
              >
                <div className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                  item.type === "Worksheet" ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600" : "bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600"
                )}>
                  {item.type === "Worksheet" ? <FileText className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.topic}</p>
                  <p className="truncate text-xs font-medium text-slate-500">{item.class_name} <span className="mx-1">•</span> {item.subject}</p>
                </div>
                <span className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold",
                  item.type === "Worksheet" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"
                )}>
                  {item.type}
                </span>
              </Link>
            )) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">No recent generations yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Progress This Month</h2>
            <Link href="/dashboard/reports" className="rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
              View Report
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="mb-3 text-sm font-bold text-slate-900">Your Usage</p>
              <div className="relative mx-auto grid h-32 w-32 place-items-center rounded-full" style={{ background: usageGradient }}>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-extrabold text-slate-900">{monthlyGenerationsTotal}</div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs font-medium text-slate-600">
                <Legend color="#8b5cf6" label={`Lesson plans (${lessonMonthlyTotal})`} />
                <Legend color="#10b981" label={`Worksheets (${worksheetMonthlyTotal})`} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="mb-4 text-sm font-bold text-slate-900">Daily Generations</p>
              <div
                className="grid h-[130px] items-end gap-1 overflow-hidden border-b border-l border-slate-200 px-2 pt-2"
                style={{ gridTemplateColumns: `repeat(${generationBars.length}, minmax(0, 1fr))` }}
              >
                {generationBars.map((bar) => (
                  <div key={bar.label} className="flex h-full min-w-0 items-end justify-center">
                    <div
                      className="w-2 rounded-t-full bg-gradient-to-t from-violet-500 to-blue-500 shadow-lg"
                      style={{ height: bar.value ? `${Math.max(8, Math.round((bar.value / maxGenerationBar) * 100))}%` : 0 }}
                      aria-label={`${bar.label}: ${bar.value} generations`}
                    />
                  </div>
                ))}
              </div>
              <div
                className="mt-2 grid px-2 text-center text-xs font-medium text-slate-500"
                style={{ gridTemplateColumns: `repeat(${generationBars.length}, minmax(0, 1fr))` }}
              >
                {generationTicks.map((tick) => (
                  <span key={tick.label} className="min-w-max whitespace-nowrap" style={{ gridColumn: `${tick.day} / span 1` }}>{tick.label}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 backdrop-blur-sm">
              <div className="flex gap-3">
                <Lightbulb className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Pro Tip</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-amber-700">Use textbook-based AI to get more accurate and board-aligned content.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Clock3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-800">Time Saved</p>
                  <p className="text-xl font-extrabold text-slate-900">{estimatedHoursSaved} Hours</p>
                  <p className="text-xs font-medium text-slate-500">This Month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Quick Access</h2>
          <button className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
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
                className="premium-hover flex min-h-[100px] items-center gap-3 rounded-2xl border border-white/70 bg-white/50 p-3 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg"
              >
                <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", toneClass(item.tone))}>
                  <Icon className="h-6 w-6" />
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
    </div>
  );
}

function StatCard({ label, value, sub, numericValue, icon: Icon, tone }: { label: string; value: string; sub: string; numericValue: number; trend?: string; icon: any; tone: string }) {
  const gradients = {
    pink: {
      card: "bg-gradient-to-br from-pink-50 via-rose-50 to-white",
      iconBox: "bg-gradient-to-br from-pink-400 to-rose-500",
      iconShadow: "shadow-pink-300/40",
      glow: "bg-pink-200/30"
    },
    green: {
      card: "bg-gradient-to-br from-emerald-50 via-green-50 to-white",
      iconBox: "bg-gradient-to-br from-emerald-400 to-green-600",
      iconShadow: "shadow-emerald-300/40",
      glow: "bg-emerald-200/30"
    },
    orange: {
      card: "bg-gradient-to-br from-orange-50 via-amber-50 to-white",
      iconBox: "bg-gradient-to-br from-amber-400 to-orange-500",
      iconShadow: "shadow-orange-300/40",
      glow: "bg-amber-200/30"
    },
    blue: {
      card: "bg-gradient-to-br from-sky-50 via-blue-50 to-white",
      iconBox: "bg-gradient-to-br from-sky-400 to-blue-600",
      iconShadow: "shadow-blue-300/40",
      glow: "bg-blue-200/30"
    }
  };
  const g = gradients[tone as keyof typeof gradients] || gradients.pink;

  return (
    <div className={cn(
      "premium-hover relative overflow-hidden min-w-0 w-full",
      "rounded-[22px] sm:rounded-[28px]",
      "border border-white/70",
      "p-3 sm:p-5 lg:p-6",
      "min-h-[105px] sm:min-h-[140px]",
      "flex items-center gap-3 sm:gap-5",
      "shadow-[0_18px_45px_rgba(15,23,42,0.08)]",
      "transition-all duration-300 ease-out",
      "hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]",
      g.card
    )}>
      <div className={cn("absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl", g.glow)} />

      <div className={cn(
        "shrink-0",
        "w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20",
        "rounded-2xl",
        "flex items-center justify-center",
        "shadow-lg",
        g.iconBox,
        g.iconShadow
      )}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[11px] sm:text-sm lg:text-base font-bold text-slate-900 leading-tight truncate">{label}</p>
        <p className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 leading-none">
          <CountUpNumber value={numericValue} />
        </p>
        <p className="mt-1 text-[11px] sm:text-sm font-medium text-slate-600 truncate">{sub}</p>
      </div>
    </div>
  );
}

function CountUpNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    if (hasAnimated) return;

    const duration = 1200;
    const startTime = performance.now();
    const startValue = 0;

    function easeOutQuart(t: number): number {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const currentValue = Math.round(startValue + (value - startValue) * easedProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    }

    requestAnimationFrame(animate);
  }, [value, hasAnimated]);

  return <>{displayValue}</>;
}

function ActionPanel({ title, desc, href, button, icon: Icon, tone }: { title: string; desc: string; href: string; button: string; icon: any; tone: "purple" | "green" }) {
  const isGreen = tone === "green";
  const gradients = {
    card: isGreen
      ? "bg-gradient-to-br from-emerald-50 via-green-50 to-white"
      : "bg-gradient-to-br from-violet-50 via-purple-50 to-white",
    iconBox: isGreen
      ? "bg-gradient-to-br from-emerald-500 to-green-600"
      : "bg-gradient-to-br from-violet-500 to-purple-600",
    iconShadow: isGreen ? "shadow-emerald-300/40" : "shadow-violet-300/40",
    glow: isGreen ? "bg-emerald-200/30" : "bg-violet-200/30",
    button: isGreen
      ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
      : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
    accent: isGreen ? "#10b981" : "#8b5cf6"
  };

  return (
    <div className={cn(
      "premium-hover relative overflow-hidden min-w-0 w-full",
      "rounded-[28px] sm:rounded-[32px]",
      "border border-white/60",
      "p-5 sm:p-6 lg:p-8",
      "min-h-[260px] sm:min-h-[280px]",
      "shadow-[0_18px_45px_rgba(15,23,42,0.08)]",
      "transition-all duration-300 ease-out",
      "hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]",
      gradients.card
    )}>
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl", gradients.glow)} />
      <div className={cn("absolute -right-4 bottom-4 h-20 w-20 rounded-full blur-2xl", gradients.glow)} />

      <div className="relative z-10 flex h-full min-w-0 w-full flex-col justify-between sm:max-w-none">
        <div>
          <div className={cn(
            "inline-flex",
            "w-14 h-14 sm:w-16 sm:h-16",
            "rounded-2xl",
            "items-center justify-center",
            "shadow-lg mb-4",
            gradients.iconBox,
            gradients.iconShadow
          )}>
            <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{title}</h2>
          <p className="mt-2 text-sm sm:text-base font-medium text-slate-600 leading-relaxed line-clamp-2">{desc}</p>
        </div>

        <Link
          href={href}
          className={cn(
            "premium-hover-sm mt-6 inline-flex",
            "h-12 sm:h-14",
            "w-fit",
            "items-center justify-center gap-2",
            "rounded-xl sm:rounded-2xl",
            "px-6 sm:px-8",
            "text-sm sm:text-base font-bold text-white",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-300",
            gradients.button
          )}
        >
          <Plus className="h-5 w-5" />
          {button}
        </Link>
      </div>

      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 hidden sm:block">
        <div className={cn(
          "relative w-[120px] h-[100px] sm:w-[160px] sm:h-[130px]",
          "rotate-6"
        )}>
          <div className={cn(
            "absolute inset-0",
            "rounded-2xl border border-white/60 bg-white/70",
            "shadow-lg backdrop-blur-sm",
            "flex flex-col items-center justify-center gap-2 p-3"
          )}>
            <div className={cn("w-8 h-8 rounded-lg", isGreen ? "bg-emerald-100" : "bg-violet-100")}>
              <Icon className={cn("h-8 w-8 p-1.5", isGreen ? "text-emerald-600" : "text-violet-600")} />
            </div>
            <div className={cn("w-12 h-2 rounded-full", isGreen ? "bg-emerald-200" : "bg-violet-200")} />
            <div className={cn("w-10 h-2 rounded-full", isGreen ? "bg-emerald-100" : "bg-violet-100")} />
            <div className={cn("w-14 h-2 rounded-full", isGreen ? "bg-emerald-200" : "bg-violet-200")} />
          </div>
          <div className={cn(
            "absolute -top-3 -right-3",
            "w-10 h-10 sm:w-12 sm:h-12",
            "rounded-xl border border-white/60 bg-white/80",
            "shadow-md backdrop-blur-sm",
            "flex items-center justify-center"
          )}>
            <Check className={cn("h-5 w-5 sm:h-6 sm:w-6", isGreen ? "text-emerald-500" : "text-violet-500")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function formatNumber(value: number | undefined, fallback: string) {
  if (typeof value !== "number") return fallback;
  return new Intl.NumberFormat("en-IN").format(value);
}

function countItemsThisMonth(items: Array<{ created_at?: string; updated_at?: string }>) {
  const now = new Date();
  return items.filter((item) => {
    const created = new Date(item.created_at || item.updated_at || 0);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;
}

const dailyGenerationTickDays = [1, 5, 15, 22, 29];

function getDailyGenerationBars(items: Array<{ created_at?: string; updated_at?: string }>) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = now.toLocaleString("en-US", { month: "short" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayOfMonth = index + 1;
    const value = items.filter((item) => {
      const created = new Date(item.created_at || item.updated_at || 0);
      return created.getFullYear() === year && created.getMonth() === month && created.getDate() === dayOfMonth;
    }).length;
    return { day: dayOfMonth, label: `${monthLabel} ${dayOfMonth}`, value };
  });
}

function getDailyGenerationTicks(bars: Array<{ day: number; label: string; value: number }>) {
  const availableDays = new Set(bars.map((bar) => bar.day));
  return dailyGenerationTickDays
    .filter((day) => availableDays.has(day))
    .map((day) => bars[day - 1]);
}

function getUsageGradient(lessonCount: number, worksheetCount: number) {
  const total = lessonCount + worksheetCount;
  if (!total) return "conic-gradient(#d7dae4 0 100%)";
  const lessonEnd = Math.round((lessonCount / total) * 100);
  return `conic-gradient(#8d57f6 0 ${lessonEnd}%, #0db986 ${lessonEnd}% 100%)`;
}

function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function toneClass(tone: string) {
  const tones: Record<string, string> = {
    purple: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg",
    pink: "bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-lg",
    green: "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg",
    orange: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg",
    blue: "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg",
    red: "bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-lg"
  };
  return tones[tone] || tones.purple;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour >= 17) return { text: "Good evening", emoji: "🌙" };
  return { text: "Good afternoon", emoji: "☀️" };
}
