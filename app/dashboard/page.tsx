"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  Plus,
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
  { title: "Lesson Planner", desc: "Create detailed, curriculum-aligned lesson plans.", href: "/dashboard/lesson-plans/new", icon: BookOpen, tone: "blue" },
  { title: "Worksheet Generator", desc: "Generate printable worksheets with answers.", href: "/dashboard/worksheets/new", icon: ClipboardCheck, tone: "green" },
  { title: "Explore Resources", desc: "Find high-quality teaching resources and materials.", href: "/dashboard/resources", icon: FolderOpen, tone: "orange" },
  { title: "AI Chat Assistant", desc: "Ask anything and get instant help from AI.", href: "/dashboard/classroom-tools", icon: Bot, tone: "red" },
  { title: "Classroom Tools", desc: "Use tools like quiz maker and more.", href: "/dashboard/classroom-tools", icon: Sparkles, tone: "blue" }
];

export default function TeacherDashboard() {
  const token = typeof window !== "undefined" ? localStorage.getItem("teacher_ai_access_token") : null;
  const plans = useQuery({
    queryKey: ["lesson-plans-summary"],
    queryFn: () => backendApi.lessonPlans(0, 50),
    enabled: !!token,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const worksheets = useQuery({
    queryKey: ["worksheets-summary"],
    queryFn: () => backendApi.worksheets(0, 50),
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
  const allItems = [...(plans.data?.items || []), ...worksheetItems];
  const last7DaysBars = getLast7DaysBars(allItems);
  const maxLast7Days = Math.max(1, ...last7DaysBars.map((bar) => bar.value));
  const usageGradient = getUsageGradient(lessonMonthlyTotal, worksheetMonthlyTotal);
  const estimatedHoursSaved = formatHours(monthlyGenerationsTotal * 0.25);

  return (
    <div className="mx-auto grid w-full max-w-[1480px] gap-4 px-0 2xl:px-4">
      <header className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-left">
          <h1 className="flex flex-wrap items-center gap-x-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
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
        <div className="hidden h-12 w-[190px] shrink-0 items-center justify-end sm:flex sm:h-14 sm:w-[230px] lg:w-[260px]">
          <img
            src="/assets/teachpad-logo.png"
            alt="Teachpad"
            className="h-auto max-h-10 w-full object-contain object-right sm:max-h-11"
          />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
        {(plans.isLoading || worksheets.isLoading) ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-h-[116px] rounded-[18px] border border-white/70 bg-gradient-to-br from-slate-50 to-white p-4 sm:min-h-[126px] sm:p-5 animate-pulse">
                <div className="flex h-full items-center gap-3 sm:gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-200 sm:h-14 sm:w-14" />
                  <div className="flex-1">
                    <div className="mb-2 h-3 w-24 rounded bg-slate-200 sm:h-4" />
                    <div className="mb-2 h-7 w-14 rounded bg-slate-200" />
                    <div className="h-2 w-16 rounded bg-slate-200 sm:h-3" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (plans.isError || worksheets.isError) ? (
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
          statCards.map((stat, index) => (
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
                  ? lessonMonthlyTotal
                  : index === 1
                    ? worksheetMonthlyTotal
                    : index === 2
                      ? savedResourcesTotal
                      : monthlyGenerationsTotal
              }
            />
          ))
        )}
      </section>

      <section className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-4 xl:grid-cols-2">
        <ActionPanel
          title="Create Lesson Plan"
          desc="Generate curriculum-aligned lesson plans in seconds."
          href="/dashboard/lesson-plans/new"
          button="Create Lesson Plan"
          icon={FileText}
          tone="blue"
          illustrationSrc="/assets/illustrations/lesson-plan-card.png"
        />
        <ActionPanel
          title="Create Worksheet"
          desc="Generate printable worksheets with answers and marking schemes."
          href="/dashboard/worksheets/new"
          button="Create Worksheet"
          icon={Sparkles}
          tone="green"
          illustrationSrc="/assets/illustrations/worksheet-card.png"
        />
      </section>

      <section className="mx-auto grid w-full max-w-[1240px] items-stretch gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="h-full min-w-0 rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Generations</h2>
            <Link href="/dashboard/resources" className="rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {displayRecent.length ? displayRecent.slice(0, 5).map((item: any, index: number) => (
              <Link
                key={`${item.type}-${item.id || item.topic}-${index}`}
                href={item.href}
                className="premium-hover-sm flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-slate-50"
              >
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  item.type === "Worksheet" ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600" : "bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] text-[#2563eb]"
                )}>
                  {item.type === "Worksheet" ? <FileText className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.topic}</p>
                  <p className="truncate text-xs font-medium text-slate-500">{item.class_name} <span className="mx-1">•</span> {item.subject}</p>
                </div>
                <span className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  item.type === "Worksheet" ? "bg-emerald-50 text-emerald-700" : "bg-[#eff6ff] text-[#1d4ed8]"
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

        <div className="flex h-full min-w-0 flex-col rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your Progress This Month</h2>
          </div>

          <div className="grid flex-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col">
              <p className="mb-3 text-sm font-bold text-slate-900">Your Usage</p>
              <div className="flex-1 flex items-center justify-center gap-4">
                <div className="relative" style={{ width: "108px", height: "108px" }}>
                  <div className="absolute inset-0 rounded-full animate-chart-appear" style={{ background: `conic-gradient(#3b82f6 0% ${lessonMonthlyTotal > 0 || worksheetMonthlyTotal > 0 ? Math.round((lessonMonthlyTotal / (monthlyGenerationsTotal || 1)) * 100) : 0}%, #10b981 ${lessonMonthlyTotal > 0 || worksheetMonthlyTotal > 0 ? Math.round((lessonMonthlyTotal / (monthlyGenerationsTotal || 1)) * 100) : 0}%)` }} />
                  <div className="absolute inset-[12px] rounded-full bg-white" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-extrabold text-slate-900 animate-chart-appear">{monthlyGenerationsTotal}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#3b82f6]" />
                    <span className="text-sm font-medium text-slate-700">Lesson Plans</span>
                    <span className="text-sm font-bold text-slate-900">{lessonMonthlyTotal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Worksheets</span>
                    <span className="text-sm font-bold text-slate-900">{worksheetMonthlyTotal}</span>
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
                        className="w-full max-w-[40px] rounded-t-lg transition-all duration-300 hover:-translate-y-1 animate-chart-appear"
                        style={{
                          height: `${pct}%`,
                          background: isLast
                            ? "linear-gradient(180deg, #3b82f6, #1d4ed8)"
                            : "linear-gradient(180deg, #60a5fa, #60a5fa)",
                          boxShadow: isLast ? "0 4px 16px rgba(37, 99, 235, 0.4)" : "0 2px 8px rgba(59, 130, 246, 0.2)",
                          animationDelay: `${i * 80}ms`
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
            <div className="flex min-h-[88px] items-center gap-3 rounded-xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] to-[#f0f9ff] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe]">
                <Clock3 className="h-5 w-5 text-[#2563eb]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#1e40af]">Time Saved</p>
                <p className="mt-0.5 text-lg font-extrabold text-slate-900">{estimatedHoursSaved} Hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Quick Access</h2>
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
                className="premium-hover flex min-h-[82px] items-center gap-3 rounded-xl border border-white/70 bg-white/50 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
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
    </div>
  );
}

function StatCard({ label, value, sub, numericValue, icon: Icon, tone }: { label: string; value: string; sub: string; numericValue: number; trend?: string; icon: any; tone: string }) {
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
    }
  };
  const g = gradients[tone as keyof typeof gradients] || gradients.pink;

  return (
    <div className={cn(
      "premium-hover relative overflow-hidden min-w-0 w-full",
      "rounded-[18px]",
      "border border-white/70",
      "p-4 sm:p-5",
      "min-h-[116px] sm:min-h-[126px]",
      "flex items-center gap-3 sm:gap-4",
      "shadow-[0_14px_34px_rgba(15,23,42,0.07)]",
      "transition-all duration-300 ease-out",
      "hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]",
      g.card
    )}>
      <div className={cn("absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl", g.glow)} />

      <div className={cn(
        "shrink-0",
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
        <p className="text-[11px] font-bold leading-snug text-slate-900 sm:text-sm">{label}</p>
        <p className="mt-1.5 text-2xl font-extrabold leading-none text-slate-950 sm:text-3xl">
          <CountUpNumber value={numericValue} />
        </p>
        <p className="mt-1 text-[11px] font-medium leading-snug text-slate-600 sm:text-xs">{sub}</p>
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
    <div className={cn(
      "premium-hover relative overflow-hidden min-w-0 w-full",
      "rounded-[20px]",
      "border border-white/60",
      "p-4 sm:p-5",
      "min-h-[190px] sm:min-h-[210px]",
      "shadow-[0_14px_34px_rgba(15,23,42,0.07)]",
      "transition-all duration-300 ease-out",
      "hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.10)]",
      gradients.card
    )}>
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl", gradients.glow)} />
      <div className={cn("absolute -right-4 bottom-4 h-16 w-16 rounded-full blur-2xl", gradients.glow)} />

      <div className="relative z-10 flex h-full min-w-0 w-full flex-col justify-between sm:max-w-none">
        <div>
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

        <Link
          href={href}
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
        </Link>
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
  return `conic-gradient(#3b82f6 0 ${lessonEnd}%, #0db986 ${lessonEnd}% 100%)`;
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

function getLast6DaysBars(items: Array<{ created_at?: string; updated_at?: string }>) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  return Array.from({ length: 6 }, (_, index) => {
    const dayOfMonth = today - (5 - index);
    const value = items.filter((item) => {
      const created = new Date(item.created_at || item.updated_at || 0);
      return created.getFullYear() === year && created.getMonth() === month && created.getDate() === dayOfMonth;
    }).length;
    return { day: dayOfMonth, label: `M${index + 1}`, value };
  });
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
    let labelMonthStr = monthLabel;

    if (dayOfMonth < 1) {
      const prevMonth = new Date(year, month, 0);
      const daysInPrevMonth = prevMonth.getDate();
      labelDay = daysInPrevMonth + dayOfMonth;
      if (month === 0) {
        labelYear = year - 1;
        labelMonth = 11;
        labelMonthStr = new Date(labelYear, 11, 1).toLocaleString("en-US", { month: "short" });
      } else {
        labelMonth = month - 1;
        labelMonthStr = new Date(labelYear, labelMonth, 1).toLocaleString("en-US", { month: "short" });
      }
    }

    const value = items.filter((item) => {
      const created = new Date(item.created_at || item.updated_at || 0);
      return created.getFullYear() === labelYear && created.getMonth() === labelMonth && created.getDate() === labelDay;
    }).length;

    return { day: labelDay, label: `${labelDay}`, value };
  });
}
