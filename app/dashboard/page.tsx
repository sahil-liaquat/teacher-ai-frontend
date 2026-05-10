"use client";

import Link from "next/link";
import { useMemo } from "react";
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
  { label: "Lesson Plans Created", fallback: "0", sub: "This Month", icon: BookOpen, tone: "purple" },
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
    <div className="grid gap-4 2xl:gap-7">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between 2xl:gap-4">
        <div>
          <h1 className="text-[clamp(1.55rem,2.25vw,2.05rem)] font-black tracking-tight text-[#101039] 2xl:text-[40px]">{greeting.text}, {firstName} <span className="inline-block">{greeting.emoji}</span></h1>
          <p className="mt-1.5 text-sm font-medium text-[#77728e] 2xl:mt-2 2xl:text-lg">Let&apos;s create something amazing today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 2xl:gap-6">
          <label className="premium-hover-sm relative block w-full sm:w-[320px] 2xl:w-[420px]">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#77728e] 2xl:left-5 2xl:h-5 2xl:w-5" />
            <input className="h-11 w-full rounded-[13px] border border-[#e5e1f1] bg-white px-11 pr-16 text-base font-semibold text-[#101039] shadow-[0_12px_28px_rgba(39,30,91,0.07)] outline-none focus:border-[#b998f6] focus:ring-4 focus:ring-[#8d57f6]/10 sm:text-sm 2xl:h-[58px] 2xl:rounded-[14px] 2xl:px-14 2xl:pr-24" placeholder="Search anything..." />
            <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-[8px] border border-[#ebe7f4] bg-[#fbfaff] px-2 py-1 text-[11px] font-black text-[#706b84] 2xl:right-5 2xl:gap-2 2xl:text-xs"><span>⌘</span><span>K</span></span>
          </label>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
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
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:gap-6">
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

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr] 2xl:gap-6">
        <div className="premium-hover rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:rounded-[24px] 2xl:p-7">
          <div className="mb-4 flex items-center justify-between 2xl:mb-5">
            <h2 className="text-lg font-black text-[#101039] 2xl:text-2xl">Recent Generations</h2>
            <Link href="/dashboard/resources" className="premium-hover-sm rounded-[11px] border border-[#ebe7f4] bg-white px-3 py-1.5 text-xs font-bold text-[#55516e] shadow-sm 2xl:rounded-[12px] 2xl:px-4 2xl:py-2 2xl:text-sm">View All</Link>
          </div>
          <div className="divide-y divide-[#eeeaf7]">
            {displayRecent.length ? displayRecent.slice(0, 5).map((item: any, index: number) => (
              <Link key={`${item.type}-${item.id || item.topic}-${index}`} href={item.href} className="premium-hover-sm grid grid-cols-[44px_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[13px] px-2 py-3 2xl:grid-cols-[54px_minmax(0,1fr)_auto_auto] 2xl:gap-4 2xl:rounded-[14px] 2xl:py-4">
                <div className={cn("grid h-10 w-10 place-items-center rounded-[11px] 2xl:h-12 2xl:w-12 2xl:rounded-[12px]", item.type === "Worksheet" ? "bg-[#dbfae6] text-[#28ae64]" : "bg-[#eee0ff] text-[#8d57f6]")}>
                  {item.type === "Worksheet" ? <FileText className="h-5 w-5 2xl:h-6 2xl:w-6" /> : <BookOpen className="h-5 w-5 2xl:h-6 2xl:w-6" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#201a3d] 2xl:text-base">{item.topic}</p>
                  <p className="mt-0.5 truncate text-xs font-medium text-[#67627d] 2xl:mt-1 2xl:text-sm">{item.class_name} <span className="mx-1.5 2xl:mx-2">•</span> {item.subject}</p>
                </div>
                <span className={cn("hidden rounded-[8px] px-3 py-1.5 text-xs font-black sm:inline-flex 2xl:px-4 2xl:py-2 2xl:text-sm", item.type === "Worksheet" ? "bg-[#dbfae6] text-[#218e55]" : "bg-[#f0e5ff] text-[#7c3ee4]")}>{item.type}</span>
                <MoreVertical className="h-5 w-5 text-[#8f89a1]" />
              </Link>
            )) : (
              <div className="rounded-[13px] border border-dashed border-[#d8def0] bg-[#fbfcff] p-5 text-sm font-semibold text-[#67627d]">
                No recent generations yet.
              </div>
            )}
          </div>
        </div>

        <div className="premium-hover rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:rounded-[24px] 2xl:p-6">
          <div className="mb-4 flex items-center justify-between 2xl:mb-5">
            <h2 className="text-lg font-black text-[#101039] 2xl:text-2xl">Your Progress This Month</h2>
            <Link href="/dashboard/reports" className="premium-hover-sm rounded-[11px] border border-[#ebe7f4] bg-white px-3 py-1.5 text-xs font-bold text-[#55516e] shadow-sm 2xl:rounded-[12px] 2xl:px-4 2xl:py-2 2xl:text-sm">View Report</Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr] 2xl:gap-5">
            <div className="premium-hover rounded-[16px] border border-[#eeeaf7] bg-white p-4 shadow-[0_10px_28px_rgba(39,30,91,0.05)] 2xl:rounded-[18px] 2xl:p-5">
              <p className="mb-3 text-base font-black text-[#101039] 2xl:mb-4 2xl:text-lg">Your Usage</p>
              <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full 2xl:h-44 2xl:w-44" style={{ background: usageGradient }}>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-black text-[#101039] 2xl:h-24 2xl:w-24 2xl:text-3xl">{monthlyGenerationsTotal}</div>
              </div>
              <div className="mt-3 grid gap-1 text-xs font-medium text-[#67627d] 2xl:mt-4 2xl:gap-1.5 2xl:text-sm">
                <Legend color="#8d57f6" label={`Lesson plans (${lessonMonthlyTotal})`} />
                <Legend color="#0db986" label={`Worksheets (${worksheetMonthlyTotal})`} />
              </div>
            </div>
            <div className="premium-hover rounded-[16px] border border-[#eeeaf7] bg-white p-4 shadow-[0_10px_28px_rgba(39,30,91,0.05)] 2xl:rounded-[18px] 2xl:p-5">
              <p className="mb-4 text-base font-black text-[#101039] 2xl:mb-5 2xl:text-lg">Daily Generations</p>
              <div
                className="grid h-[130px] items-end gap-1 overflow-hidden border-b border-l border-[#e5e1f1] px-2 pt-2 sm:gap-1.5 2xl:h-[190px] 2xl:gap-2 2xl:px-3"
                style={{ gridTemplateColumns: `repeat(${generationBars.length}, minmax(0, 1fr))` }}
              >
                {generationBars.map((bar) => (
                  <div key={bar.label} className="flex h-full min-w-0 items-end justify-center">
                    <div
                      className="w-[7px] rounded-t-full bg-gradient-to-t from-[#6b35df] to-[#b06cff] shadow-[0_8px_18px_rgba(116,65,230,0.22)] sm:w-2.5 2xl:w-3.5"
                      style={{ height: bar.value ? `${Math.max(8, Math.round((bar.value / maxGenerationBar) * 100))}%` : 0 }}
                      aria-label={`${bar.label}: ${bar.value} generations`}
                    />
                  </div>
                ))}
              </div>
              <div
                className="mt-2 grid px-2 text-center text-[11px] font-semibold text-[#77728e] 2xl:mt-3 2xl:px-3 2xl:text-xs"
                style={{ gridTemplateColumns: `repeat(${generationBars.length}, minmax(0, 1fr))` }}
              >
                {generationTicks.map((tick) => (
                  <span key={tick.label} className="min-w-max whitespace-nowrap" style={{ gridColumn: `${tick.day} / span 1` }}>{tick.label}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2 2xl:mt-5 2xl:gap-5">
            <div className="premium-hover-sm rounded-[14px] border border-[#ffdca8] bg-[#fff4de] p-4 2xl:rounded-[16px] 2xl:p-5">
              <div className="flex gap-3 2xl:gap-4">
                <Lightbulb className="h-6 w-6 text-[#e19016] 2xl:h-7 2xl:w-7" />
                <div>
                  <p className="text-sm font-black text-[#b56d0a] 2xl:text-base">Pro Tip</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-[#785f39] 2xl:text-sm 2xl:leading-6">Use textbook-based AI to get more accurate and board-aligned content.</p>
                </div>
              </div>
            </div>
            <div className="premium-hover-sm rounded-[14px] border border-[#d8e4ff] bg-[#eff5ff] p-4 2xl:rounded-[16px] 2xl:p-5">
              <div className="flex items-center gap-3 2xl:gap-4">
                <Clock3 className="h-8 w-8 text-[#326fd4] 2xl:h-9 2xl:w-9" />
                <div>
                  <p className="text-sm font-black text-[#3262b6] 2xl:text-base">Time Saved</p>
                  <p className="text-xl font-black text-[#101039] 2xl:text-2xl">{estimatedHoursSaved} Hours</p>
                  <p className="text-xs font-medium text-[#67627d] 2xl:text-sm">This Month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-hover rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:rounded-[24px] 2xl:p-6">
        <div className="mb-4 flex items-center justify-between 2xl:mb-5">
          <h2 className="text-lg font-black text-[#101039] 2xl:text-xl">Quick Access</h2>
          <button className="premium-hover-sm flex items-center gap-2 rounded-[11px] px-3 py-1.5 text-xs font-bold text-[#55516e] 2xl:rounded-[12px] 2xl:py-2 2xl:text-sm">Customise <Settings2 className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 2xl:gap-5">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className="premium-hover grid min-h-[96px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border border-[#ebe7f4] bg-white p-3 2xl:min-h-[118px] 2xl:grid-cols-[56px_minmax(0,1fr)_auto] 2xl:gap-4 2xl:rounded-[16px] 2xl:p-4">
                <div className={cn("grid h-11 w-11 place-items-center rounded-[12px] 2xl:h-14 2xl:w-14 2xl:rounded-[14px]", toneClass(item.tone))}>
                  <Icon className="h-5 w-5 2xl:h-7 2xl:w-7" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#201a3d]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-[#67627d] 2xl:text-xs 2xl:leading-5">{item.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#77728e]" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, trend, icon: Icon, tone }: { label: string; value: string; sub: string; trend?: string; icon: any; tone: string }) {
  return (
    <div className="premium-hover rounded-[18px] border border-[#ebe7f4] bg-white p-4 shadow-[0_14px_38px_rgba(39,30,91,0.06)] 2xl:rounded-[24px] 2xl:p-7">
      <div className="flex items-center gap-3 2xl:gap-6">
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[13px] shadow-[0_12px_24px_rgba(39,30,91,0.07)] 2xl:h-[72px] 2xl:w-[72px] 2xl:rounded-[18px]", toneClass(tone))}>
          <Icon className="h-5 w-5 2xl:h-9 2xl:w-9" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#201a3d] 2xl:text-base">{label}</p>
          <p className="mt-0.5 text-xl font-black tracking-tight text-[#101039] 2xl:mt-2 2xl:text-3xl">{value}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2 2xl:mt-2 2xl:gap-3">
            <p className="text-xs font-medium text-[#55516e] 2xl:text-sm">{sub}</p>
            {trend ? <span className="inline-flex items-center gap-1 rounded-full bg-[#dff5e9] px-2 py-0.5 text-[11px] font-black text-[#26a660] 2xl:px-3 2xl:py-1 2xl:text-xs"><TrendingUp className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" /> {trend}</span> : null}
          </div>
          {!trend ? <div className="mt-2 h-1.5 rounded-full bg-[#d7dae4] 2xl:mt-3 2xl:h-2"><div className="h-full w-[74%] rounded-full bg-[#228ad4]" /></div> : null}
        </div>
      </div>
    </div>
  );
}

function ActionPanel({ title, desc, href, button, icon: Icon, tone }: { title: string; desc: string; href: string; button: string; icon: any; tone: "purple" | "green" }) {
  const isGreen = tone === "green";
  return (
    <div className={cn("premium-hover relative min-h-[176px] overflow-hidden rounded-[18px] border p-4 shadow-[0_14px_38px_rgba(39,30,91,0.07)] 2xl:min-h-[245px] 2xl:rounded-[24px] 2xl:p-8", isGreen ? "border-[#bdebd7] bg-gradient-to-br from-[#ecfff7] to-[#dff8f0]" : "border-[#dac6f6] bg-gradient-to-br from-[#fbf6ff] to-[#eee1ff]")}>
      <Sparkles className={cn("absolute right-[34%] top-12 h-5 w-5 2xl:top-16 2xl:h-6 2xl:w-6", isGreen ? "text-[#76cfad]" : "text-[#b591ef]")} />
      <div className="relative z-10 max-w-[390px] 2xl:max-w-[430px]">
        <div className={cn("grid h-14 w-14 place-items-center rounded-[14px] text-white shadow-[0_14px_28px_rgba(39,30,91,0.14)] 2xl:h-[82px] 2xl:w-[82px] 2xl:rounded-[18px]", isGreen ? "bg-gradient-to-br from-[#3ed987] to-[#0c9d63]" : "bg-gradient-to-br from-[#9250f7] to-[#4e35dd]")}>
          <Icon className="h-7 w-7 2xl:h-10 2xl:w-10" />
        </div>
        <h2 className={cn("mt-[-50px] pl-[72px] text-xl font-black 2xl:mt-[-70px] 2xl:pl-[106px] 2xl:text-[26px]", isGreen ? "text-[#159565]" : "text-[#101039]")}>{title}</h2>
        <p className="mt-1 pl-[72px] text-sm font-medium leading-6 text-[#55516e] 2xl:mt-2 2xl:pl-[106px] 2xl:text-lg 2xl:leading-8">{desc}</p>
        <Link href={href} className={cn("premium-hover-sm mt-5 inline-flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-black text-white shadow-[0_14px_26px_rgba(39,30,91,0.16)] 2xl:mt-9 2xl:h-[58px] 2xl:min-w-[240px] 2xl:gap-3 2xl:rounded-[14px] 2xl:px-7 2xl:text-base", isGreen ? "bg-gradient-to-r from-[#1fbc79] to-[#069462]" : "bg-gradient-to-r from-[#8a4df7] to-[#4e35dd]")}>
          <Plus className="h-5 w-5 2xl:h-6 2xl:w-6" />
          {button}
        </Link>
      </div>
      <div className="absolute bottom-[-34px] right-2 hidden h-[142px] w-[158px] rotate-6 rounded-[18px] border border-white/80 bg-white/80 shadow-[0_18px_36px_rgba(39,30,91,0.12)] xl:block 2xl:bottom-[-28px] 2xl:right-5 2xl:h-[205px] 2xl:w-[230px] 2xl:rounded-[22px]">
        <div className="m-5 grid gap-3 2xl:m-6 2xl:gap-5">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <span className={cn("grid h-5 w-5 place-items-center rounded-full text-white 2xl:h-6 2xl:w-6", isGreen ? "bg-[#30c978]" : "bg-[#9b62ff]")}><Check className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" /></span>
              <span className="h-2.5 flex-1 rounded-full bg-[#dedce8] 2xl:h-3" />
            </div>
          ))}
        </div>
      </div>
      {isGreen ? <div className="absolute bottom-5 right-10 hidden rounded-[12px] bg-[#39c973] px-3 py-1.5 text-xl font-black text-white shadow-lg xl:block 2xl:bottom-8 2xl:right-16 2xl:rounded-[14px] 2xl:px-5 2xl:py-3 2xl:text-3xl">A+</div> : <div className="absolute bottom-5 right-32 hidden h-16 w-16 rounded-full bg-[conic-gradient(#8a4df7_0_25%,#b998f6_25%_50%,#6f3ee9_50%_75%,#d9c8ff_75%_100%)] shadow-lg xl:block 2xl:bottom-8 2xl:right-44 2xl:h-24 2xl:w-24" />}
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
    purple: "bg-[#eee0ff] text-[#7a43e8]",
    green: "bg-[#dbfae6] text-[#24a760]",
    orange: "bg-[#fff0d8] text-[#d88920]",
    blue: "bg-[#e3f0ff] text-[#2c75d0]",
    red: "bg-[#ffe0e5] text-[#f24b66]"
  };
  return tones[tone] || tones.purple;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour >= 17) return { text: "Good evening", emoji: "🌙" };
  return { text: "Good afternoon", emoji: "☀️" };
}
