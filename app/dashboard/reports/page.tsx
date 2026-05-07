"use client";

import { BarChart3, BookOpen, CalendarDays, ClipboardCheck, Download, FileText, Filter, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const kpis = [
  { label: "Total Generations", value: "158", icon: Sparkles, tone: "bg-[#f1edff] text-[#6d38f2]" },
  { label: "Lesson Plans", value: "64", icon: BookOpen, tone: "bg-[#eaf4ff] text-[#1684f6]" },
  { label: "Worksheets", value: "56", icon: ClipboardCheck, tone: "bg-[#eafff3] text-emerald-700" },
  { label: "Exports", value: "38", icon: Download, tone: "bg-[#fff4df] text-orange-700" }
];

const usageBars = [34, 52, 46, 70, 62, 86, 74, 96, 78, 68, 88, 72];
const books = [
  ["Science Class 8", 42, "bg-[#6d38f2]"],
  ["Mathematics Class 7", 31, "bg-emerald-500"],
  ["English Reader", 24, "bg-blue-500"],
  ["Social Science", 18, "bg-orange-400"]
];

export default function ReportsPage() {
  return (
    <div className="space-y-5 2xl:space-y-7">
      <header className="rounded-[20px] border border-[#dfe6f5] bg-white p-5 shadow-[0_18px_45px_-35px_rgba(29,43,77,0.5)] 2xl:rounded-[28px] 2xl:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d8def0] bg-[#f6f2ff] px-4 py-2 text-sm font-black text-[#6d38f2]">
              <BarChart3 className="h-4 w-4" />
              Reports & Analytics
            </div>
            <h1 className="text-[30px] font-black tracking-tight text-[#071343] 2xl:text-4xl">Teaching workflow insights</h1>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[#52617d]">
              Track generation usage, popular books, classroom trends, and resource activity.
            </p>
          </div>
          <Button><Download className="h-4 w-4" /> Export Report</Button>
        </div>
      </header>

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_160px_160px_auto]">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-3.5 h-4 w-4 text-[#6d38f2]" />
            <Input type="date" className="pl-9" />
          </div>
          <Select><option>All classes</option><option>8th Grade</option><option>9th Grade</option></Select>
          <Select><option>All subjects</option><option>Science</option><option>Mathematics</option></Select>
          <Button variant="outline"><Filter className="h-4 w-4" /> Apply Filters</Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="reveal-card" style={{ animationDelay: `${index * 60}ms` }}>
              <CardContent className="flex items-center gap-5 p-5">
                <div className={`grid h-14 w-14 place-items-center rounded-2xl ${kpi.tone}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-[#071343]">{kpi.value}</p>
                  <p className="mt-1 text-sm font-bold text-[#52617d]">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#071343]"><TrendingUp className="h-5 w-5 text-[#6d38f2]" /> Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-4 rounded-2xl border border-[#e3e8f5] bg-[#fbfcff] px-6 pb-6 pt-10">
              {usageBars.map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-3">
                  <div
                    className="w-full max-w-7 rounded-t-full bg-gradient-to-t from-[#6d38f2] to-[#a78bfa] shadow-lg shadow-purple-500/20 transition-all duration-500 hover:scale-y-105"
                    style={{ height: `${height * 2}px` }}
                  />
                  <span className="text-[10px] font-bold text-[#52617d]">{index + 1}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#071343]"><FileText className="h-5 w-5 text-emerald-600" /> Popular Books</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {books.map(([title, count, color]) => (
              <div key={String(title)} className="rounded-2xl border border-[#e3e8f5] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-black text-[#071343]">{title}</p>
                  <span className="text-sm font-black text-[#52617d]">{count}</span>
                </div>
                <div className="h-3 rounded-full bg-[#eef2fb]">
                  <div className={`h-3 rounded-full ${color}`} style={{ width: `${Number(count) * 2}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
