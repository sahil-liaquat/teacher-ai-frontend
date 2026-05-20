"use client";

import { BarChart3, BookOpen, CalendarDays, ClipboardCheck, Download, FileText, Filter, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const kpis = [
  { label: "Total Generations", value: "158", icon: Sparkles, tone: "bg-[#dffafa] text-[#1677ff]" },
  { label: "Lesson Plans", value: "64", icon: BookOpen, tone: "bg-[#eaf4ff] text-[#1684f6]" },
  { label: "Worksheets", value: "56", icon: ClipboardCheck, tone: "bg-[#eafff3] text-emerald-700" },
  { label: "Exports", value: "38", icon: Download, tone: "bg-[#fff4df] text-orange-700" }
];

const usageBars = [34, 52, 46, 70, 62, 86, 74, 96, 78, 68, 88, 72];
const books: [string, number, string][] = [
  ["Science Class 8", 42, "bg-[#1677ff]"],
  ["Mathematics Class 7", 31, "bg-emerald-500"],
  ["English Reader", 24, "bg-blue-500"],
  ["Social Science", 18, "bg-orange-400"]
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 sm:mb-4 sm:px-4 sm:py-2 sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              Reports & Analytics
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">Teaching workflow insights</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
              Track generation usage, popular books, classroom trends, and resource activity.
            </p>
          </div>
          <Button className="w-full sm:w-auto"><Download className="h-4 w-4" /> Export Report</Button>
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-4">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
            <Input type="date" className="pl-9 w-full" />
          </div>
          <Select className="w-full"><option>All classes</option><option>8th Grade</option><option>9th Grade</option></Select>
          <Select className="w-full"><option>All subjects</option><option>Science</option><option>Mathematics</option></Select>
          <Button variant="outline" className="w-full sm:w-auto col-span-1 sm:col-span-2 lg:col-span-2"><Filter className="h-4 w-4" /> Apply Filters</Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="reveal-card" style={{ animationDelay: `${index * 60}ms` }}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className={`grid h-10 w-10 sm:h-14 sm:w-14 place-items-center rounded-xl sm:rounded-2xl ${kpi.tone}`}>
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-3xl font-extrabold text-slate-900 truncate">{kpi.value}</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 truncate">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900"><TrendingUp className="h-5 w-5 text-blue-600" /> Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 sm:h-72 items-end gap-2 sm:gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 sm:px-6 pb-4 sm:pb-6 pt-6 sm:pt-10 overflow-x-auto">
              {usageBars.map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2 sm:gap-3 min-w-[20px]">
                  <div
                    className="w-full min-w-[8px] sm:min-w-[12px] max-w-[24px] sm:max-w-[32px] rounded-t-full bg-gradient-to-t from-blue-500 to-blue-500 shadow-lg transition-all duration-500 hover:scale-y-105"
                    style={{ height: `${Math.max(8, height * (index < 5 ? 1.5 : 2))}px` }}
                  />
                  <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">{index + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900"><FileText className="h-5 w-5 text-emerald-600" /> Popular Books</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:gap-4">
            {books.map(([title, count, color]) => (
              <div key={String(title)} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{title}</p>
                  <span className="text-sm font-bold text-slate-600 shrink-0">{count}</span>
                </div>
                <div className="h-2 sm:h-3 rounded-full bg-slate-100">
                  <div className={`h-2 sm:h-3 rounded-full ${color}`} style={{ width: `${Math.min(100, Number(count) * 2.5)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
