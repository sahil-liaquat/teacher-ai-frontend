"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Search, Users, Wand2 } from "lucide-react";
import { backendApi } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState, LoadingState, MetricCard, StatusPill, formatDateTime } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminGenerationsPage() {
  const generations = useQuery({ queryKey: ["admin-lesson-plan-generations"], queryFn: () => backendApi.lessonPlans(0, 100) });
  const users = useQuery({ queryKey: ["admin-generation-users"], queryFn: () => backendApi.users(0, 100) });
  const [searchTerm, setSearchTerm] = useState("");
  const userNames = new Map(
    (users.data?.items || []).map((user) => [
      user.id,
      user.full_name || user.name || user.email || user.id
    ])
  );
  const filteredGenerations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const items = generations.data?.items || [];
    if (!search) return items;
    return items.filter((item) =>
      [
        item.user_id ? userNames.get(item.user_id) || item.user_id : "",
        item.class_name,
        item.subject,
        item.chapter_name,
        item.topic,
        item.created_at
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [generations.data?.items, searchTerm, userNames]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Generation audit"
        title="Lesson plan generations"
        description="Review saved lesson-plan outputs, ownership, class context, and generated topics from the existing backend records."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Records" value={generations.data?.total || 0} detail="Lesson plans returned" tone="blue" icon={<FileText className="h-5 w-5" />} />
        <MetricCard label="Known users" value={users.data?.total || 0} detail="Resolved account names" tone="green" icon={<Users className="h-5 w-5" />} />
        <MetricCard label="Filtered" value={filteredGenerations.length} detail="Visible rows" tone="violet" icon={<Wand2 className="h-5 w-5" />} />
      </div>

      <AdminPanel
        title="Generation history"
        description="Search across user, class, subject, chapter, and topic."
        actions={
          <div className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:w-80">
            <Search className="h-4 w-4 text-slate-500" />
            <Input
              className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0"
              placeholder="Search generations"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        }
        contentClassName="p-0"
      >
        {generations.isLoading ? <div className="p-5"><LoadingState label="Loading generations" /></div> : null}
        {!generations.isLoading && !filteredGenerations.length ? <div className="p-5"><EmptyState title="No generations found" description="Try a different search term or check back after teachers create lesson plans." /></div> : null}
        {filteredGenerations.length ? (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>{["User", "Tool", "Class", "Subject", "Chapter", "Topic", "Created", "Action"].map((h) => <th className="px-5 py-3" key={h}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredGenerations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-slate-700">{item.user_id ? userNames.get(item.user_id) || item.user_id : "-"}</td>
                      <td className="px-5 py-4"><StatusPill status="info">Lesson plan</StatusPill></td>
                      <td className="px-5 py-4 text-slate-700">{item.class_name || "-"}</td>
                      <td className="px-5 py-4 text-slate-700">{item.subject || "-"}</td>
                      <td className="max-w-[220px] truncate px-5 py-4 text-slate-700">{item.chapter_name || "-"}</td>
                      <td className="max-w-[260px] truncate px-5 py-4 font-semibold text-slate-950">{item.topic || "-"}</td>
                      <td className="px-5 py-4 text-slate-600">{formatDateTime(item.created_at)}</td>
                      <td className="px-5 py-4">
                        <Link href={`/admin/generations/${item.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 xl:hidden">
              {filteredGenerations.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{item.topic || item.chapter_name || "Lesson plan"}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{item.subject || "-"} · {item.class_name || "-"}</p>
                    </div>
                    <StatusPill status="info">Lesson plan</StatusPill>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.user_id ? userNames.get(item.user_id) || item.user_id : "Unknown user"}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-500">{formatDateTime(item.created_at)}</span>
                    <Link href={`/admin/generations/${item.id}`}><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </AdminPanel>
    </>
  );
}
