"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, BookOpen, Bot, Download, Search, ShieldCheck, Upload, UserPlus, Users, Wand2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const kpis = [
  ["total_users", "Total users", Users, "from-blue-500 to-blue-600"],
  ["active_users", "Active users", ShieldCheck, "from-emerald-500 to-green-600"],
  ["lesson_plans_generated", "Lesson plans", Wand2, "from-purple-500 to-indigo-600"],
  ["worksheets_generated", "Worksheets", Bot, "from-cyan-500 to-blue-600"],
  ["books_in_library", "Books", BookOpen, "from-orange-500 to-amber-500"],
  ["total_ai_calls", "AI calls", Activity, "from-rose-500 to-pink-600"]
] as const;

export default function AdminDashboard() {
  const summary = useQuery({ queryKey: ["admin-summary"], queryFn: () => apiFetch<any>("/admin/summary") });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Center"
        description="Manage users, textbook indexing, AI generations, activity logs, and system health from one dense workspace."
        actions={
          <>
            <Link href="/admin/users">
              <Button variant="outline">
                <UserPlus className="h-4 w-4" />
                Add user
              </Button>
            </Link>
            <Link href="/admin/textbooks">
              <Button>
                <Upload className="h-4 w-4" />
                Upload book
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="relative p-5">
          <Search className="absolute left-8 top-8 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Global search users, generations, books, activity logs" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([key, label, Icon, color], index) => (
          <Card key={key} className="reveal-card" style={{ animationDelay: `${index * 55}ms` }}>
            <CardContent className="p-5">
              <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-r ${color} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-950">{summary.data?.[key] ?? 0}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-950">Recent Generations</CardTitle>
              <CardDescription>Latest outputs across teachers and tools.</CardDescription>
            </div>
            <Link href="/admin/generations"><Button variant="outline" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent><AdminList items={summary.data?.recent_generations || []} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-950">System Status</CardTitle>
            <CardDescription>Operational health snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {Object.entries(summary.data?.system_status || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between rounded-xl bg-emerald-50 p-3">
                <span className="font-semibold capitalize text-slate-700">{key.replaceAll("_", " ")}</span>
                <Badge className="bg-white text-emerald-700">{String(value)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xl text-slate-950">Top Books by Usage</CardTitle></CardHeader>
          <CardContent><AdminList items={summary.data?.top_books || []} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-xl text-slate-950">Top Active Users</CardTitle></CardHeader>
          <CardContent><AdminList items={summary.data?.top_users || []} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-slate-950">Tool Usage Overview</CardTitle>
            <CardDescription>Tracked per user and month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">Lesson plan and worksheet counts are measured per teacher.</div>
              <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">Token usage is reserved as a provider placeholder.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminList({ items }: { items: any[] }) {
  return (
    <div className="grid gap-3">
      {items.length ? (
        items.map((item, index) => (
          <div key={item.id || index} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 text-sm shadow-sm">
            <span className="min-w-0 truncate font-semibold text-slate-800">{item.title || item.name || item.tool || item.subject || "Record"}</span>
            <span className="ml-4 shrink-0 text-slate-500">{item.count ?? item.created_at ?? ""}</span>
          </div>
        ))
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-muted-foreground">No data yet.</p>
      )}
    </div>
  );
}
