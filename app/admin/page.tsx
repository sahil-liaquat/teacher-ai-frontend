"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, BookOpen, Download, FileText, LibraryBig, ShieldCheck, Users, Wand2, TrendingUp, Clock } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, HealthIndicator, MetricCard, StatusPill, compactNumber, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const kpis = [
  { key: "total_users", label: "Total Users", detail: "All accounts", icon: Users, tone: "blue" as const },
  { key: "active_users", label: "Active Users", detail: "Can sign in", icon: ShieldCheck, tone: "green" as const },
  { key: "lesson_plans_generated", label: "Lesson Plans", detail: "Generated outputs", icon: FileText, tone: "blue" as const },
  { key: "worksheets_generated", label: "Worksheets", detail: "Worksheet records", icon: Wand2, tone: "amber" as const },
  { key: "books_in_library", label: "Books", detail: "Content library", icon: LibraryBig, tone: "rose" as const },
  { key: "total_ai_calls", label: "AI Calls", detail: "Total requests", icon: Activity, tone: "slate" as const }
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
        eyebrow="Control center"
        title="Dashboard Overview"
        description="Monitor platform activity, manage users, and maintain the content library."
        meta={<HealthIndicator status={data?.system_status?.backend_api} />}
        actions={
          <>
            <Button variant="outline" onClick={exportUsersCsv} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Exporting..." : "Export Users"}
            </Button>
            <Link href="/admin/textbooks">
              <Button>
                <BookOpen className="h-4 w-4" />
                Upload Book
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Recent Generations"
          description="Latest lesson plan activity"
          actions={<Link href="/admin/generations" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">View all <ArrowRight className="h-4 w-4" /></Link>}
        >
          {filteredGenerations.length === 0 ? (
            <Empty label="No recent generations" />
          ) : (
            <div className="space-y-3">
              {filteredGenerations.map((item: any, index) => (
                <Link 
                  key={item.id || index} 
                  href={item.id ? `/admin/generations/${item.id}` : "/admin/generations"} 
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{item.name || item.title || "Lesson plan"}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateTime(item.created_at)}</span>
                    </div>
                  </div>
                  <StatusPill status="info">Lesson plan</StatusPill>
                </Link>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="System Status" description="Current platform health">
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(data?.system_status || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <span className="text-sm font-medium text-gray-700 capitalize">{key.replaceAll("_", " ")}</span>
                <StatusPill status={String(value) === "ok" ? "success" : "neutral"}>{String(value)}</StatusPill>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel 
          title="Top Books" 
          description="Most active content"
          actions={<Link href="/admin/textbooks" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">View all <ArrowRight className="h-4 w-4" /></Link>}
        >
          {filteredBooks.length === 0 ? (
            <Empty label="No books found" />
          ) : (
            <div className="space-y-3">
              {filteredBooks.map((item: any, index) => (
                <Link 
                  key={item.id || index} 
                  href={item.id ? `/admin/textbooks/${item.id}` : "/admin/textbooks"} 
                  className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">{item.title || "Untitled book"}</span>
                    <span className="block truncate text-xs text-gray-500">{item.subject || "No subject"}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel 
          title="Recent Users" 
          description="Latest account activity"
          actions={<Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">View all <ArrowRight className="h-4 w-4" /></Link>}
        >
          {filteredUsers.length === 0 ? (
            <Empty label="No users found" />
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((item: any, index) => (
                <Link 
                  key={item.id || index} 
                  href="/admin/users" 
                  className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">{item.name || item.email || "User"}</span>
                    <span className="block truncate text-xs text-gray-500">{formatDateTime(item.created_at)}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm font-medium text-gray-500">{label}</div>;
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
    recent_generations: lessonPlans.items.slice(0, 5).map((item: any) => ({
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
    top_books: allBooks.slice(0, 5).map((book: any) => ({ id: book.id, title: book.title, subject: book.subject })),
    top_users: users.items.slice(0, 5).map((user: any) => ({ id: user.id, name: user.full_name || user.name || user.email, created_at: user.created_at }))
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