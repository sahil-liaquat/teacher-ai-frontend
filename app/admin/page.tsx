"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, BookOpen, Download, FileText, LibraryBig, Search, ShieldCheck, Upload, Users, Wand2 } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, HealthIndicator, MetricCard, StatusPill, compactNumber, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const kpis = [
  { key: "total_users", label: "Total users", detail: "All accounts", icon: Users, tone: "blue" },
  { key: "active_users", label: "Active users", detail: "Can sign in", icon: ShieldCheck, tone: "green" },
  { key: "lesson_plans_generated", label: "Lesson plans", detail: "Saved generations", icon: FileText, tone: "violet" },
  { key: "worksheets_generated", label: "Worksheets", detail: "Worksheet records", icon: Wand2, tone: "amber" },
  { key: "books_in_library", label: "Books", detail: "Indexed library", icon: LibraryBig, tone: "rose" },
  { key: "total_ai_calls", label: "AI calls", detail: "Tracked requests", icon: Activity, tone: "slate" }
] as const;

export default function AdminDashboard() {
  const summary = useQuery({ queryKey: ["admin-summary"], queryFn: loadAdminSummary });
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const data = summary.data;

  const filteredGenerations = useMemo(() => filterItems(data?.recent_generations || [], normalizedSearch), [data?.recent_generations, normalizedSearch]);
  const filteredBooks = useMemo(() => filterItems(data?.top_books || [], normalizedSearch), [data?.top_books, normalizedSearch]);
  const filteredUsers = useMemo(() => filterItems(data?.top_users || [], normalizedSearch), [data?.top_users, normalizedSearch]);

  async function exportUsersCsv() {
    setExporting(true);
    try {
      const firstPage = await backendApi.users(0, 100);
      const users = firstPage.total > firstPage.items.length
        ? (await backendApi.users(0, firstPage.total)).items
        : firstPage.items;
      const csv = toCsv(
        ["Name", "Email", "Role", "Active", "Created at"],
        users.map((user: any) => [
          user.full_name || user.name || "",
          user.email || "",
          user.role || "",
          user.is_active ? "Yes" : "No",
          user.created_at || ""
        ])
      );
      downloadCsv(csv, `admin-users-${new Date().toISOString().slice(0, 10)}.csv`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Admin control center"
        title="Operate the teaching platform with confidence"
        description="Monitor adoption, manage access, maintain curriculum data, and keep the content library healthy from one responsive workspace."
        meta={<HealthIndicator status={data?.system_status?.backend_api} />}
        actions={
          <>
            <Button variant="outline" onClick={exportUsersCsv} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Exporting" : "Export users"}
            </Button>
            <Link href="/admin/textbooks">
              <Button>
                <Upload className="h-4 w-4" />
                Upload book
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map(({ key, label, detail, icon: Icon, tone }) => (
          <MetricCard
            key={key}
            label={label}
            value={summary.isLoading ? "..." : compactNumber(Number(data?.[key] ?? 0))}
            detail={detail}
            icon={<Icon className="h-5 w-5" />}
            tone={tone}
          />
        ))}
      </div>

      <AdminPanel contentClassName="p-3 sm:p-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <Input
            className="h-9 border-0 bg-transparent px-0 shadow-none focus:ring-0"
            placeholder="Filter recent generations, books, and users"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </AdminPanel>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <AdminPanel
          title="Recent generations"
          description="Latest saved lesson-plan activity from the backend."
          actions={<Link href="/admin/generations" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700">View all <ArrowRight className="h-4 w-4" /></Link>}
        >
          <div className="space-y-3">
            {filteredGenerations.length ? filteredGenerations.map((item: any, index) => (
              <Link key={item.id || index} href={item.id ? `/admin/generations/${item.id}` : "/admin/generations"} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{item.name || item.title || "Lesson plan"}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.tool || "Lesson plan"} · {formatDateTime(item.created_at)}</p>
                </div>
                <StatusPill status="info">Open</StatusPill>
              </Link>
            )) : <MiniEmpty label="No matching generations" />}
          </div>
        </AdminPanel>

        <AdminPanel title="System snapshot" description="Live values exposed by the current API.">
          <div className="space-y-3">
            {Object.entries(data?.system_status || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
                <span className="text-sm font-bold capitalize text-slate-700">{key.replaceAll("_", " ")}</span>
                <StatusPill status={String(value) === "ok" ? "success" : "neutral"}>{String(value)}</StatusPill>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel title="Library focus" description="Books currently visible through the curriculum hierarchy.">
          <CompactList
            items={filteredBooks}
            emptyLabel="No matching books"
            render={(item: any) => ({
              title: item.title || "Untitled book",
              detail: item.subject || "No subject",
              href: item.id ? `/admin/textbooks/${item.id}` : "/admin/textbooks",
              icon: <BookOpen className="h-4 w-4" />
            })}
          />
        </AdminPanel>

        <AdminPanel title="Active users" description="Recent accounts returned by the users endpoint.">
          <CompactList
            items={filteredUsers}
            emptyLabel="No matching users"
            render={(item: any) => ({
              title: item.name || item.email || "User",
              detail: formatDateTime(item.created_at),
              href: "/admin/users",
              icon: <Users className="h-4 w-4" />
            })}
          />
        </AdminPanel>
      </div>
    </>
  );
}

async function loadAdminSummary() {
  return backendApi.adminSummary().catch(loadAdminSummaryFromExistingApis);
}

async function loadAdminSummaryFromExistingApis() {
  const [users, boards, health, lessonPlans, worksheets] = await Promise.all([
    backendApi.users(0, 100).catch(() => ({ items: [], total: 0 })),
    backendApi.boards(0, 100).catch(() => ({ items: [], total: 0 })),
    backendApi.health().catch(() => ({ status: "unavailable" })),
    backendApi.lessonPlans(0, 100).catch(() => ({ items: [], total: 0 })),
    backendApi.worksheets(0, 100).catch(() => ({ items: [], total: 0 }))
  ]);
  const classesByBoard = await Promise.all(
    boards.items.map((board: any) =>
      backendApi.classesByBoard(board.id, 0, 100).catch(() => ({ items: [] as any[] }))
    )
  );
  const allClasses = classesByBoard.flatMap((classes) => classes.items);
  const booksByClass = await Promise.all(
    allClasses.map((cls: any) =>
      backendApi.booksByClass(cls.id, 0, 100).catch(() => ({ items: [] as any[] }))
    )
  );
  const allBooks = booksByClass.flatMap((books) => books.items);

  return {
    total_users: users.total,
    active_users: users.items.filter((user: any) => user.is_active).length,
    lesson_plans_generated: lessonPlans.total,
    worksheets_generated: worksheets.total,
    books_in_library: allBooks.length,
    total_ai_calls: lessonPlans.total + worksheets.total,
    recent_generations: lessonPlans.items.slice(0, 6).map((item: any) => ({
      id: item.id,
      name: item.topic || item.chapter_name || "Lesson plan",
      tool: "Lesson plan",
      created_at: item.created_at
    })),
    system_status: {
      backend_api: health.status || "ok",
      boards: boards.total,
      classes: allClasses.length,
      books: allBooks.length
    },
    top_books: allBooks.slice(0, 6).map((book: any) => ({ id: book.id, title: book.title, subject: book.subject })),
    top_users: users.items.slice(0, 6).map((user: any) => ({ id: user.id, name: user.full_name || user.name || user.email, created_at: user.created_at }))
  };
}

function filterItems(items: any[], search: string) {
  if (!search) return items;
  return items.filter((item) =>
    [item.title, item.name, item.tool, item.subject, item.created_at, item.count]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  );
}

function CompactList({ items, emptyLabel, render }: { items: any[]; emptyLabel: string; render: (item: any) => { title: string; detail: string; href: string; icon: React.ReactNode } }) {
  if (!items.length) return <MiniEmpty label={emptyLabel} />;
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const row = render(item);
        return (
          <Link key={item.id || index} href={row.href} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 hover:bg-slate-50">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">{row.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-slate-950">{row.title}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{row.detail}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        );
      })}
    </div>
  );
}

function MiniEmpty({ label }: { label: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">{label}</div>;
}

function toCsv(headers: string[], rows: Array<Array<string | number | boolean>>) {
  return [headers, ...rows]
    .map((row) => row.map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
    }).join(","))
    .join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
