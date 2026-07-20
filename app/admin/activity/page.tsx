"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import {
  backendApi,
  type ActivityKind,
  type ActivityRow,
} from "@/lib/api";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  LoadingState,
  StatusPill,
  formatDateTime,
} from "@/components/admin/admin-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { ActivityDetailDrawer } from "@/components/admin/activity-detail-drawer";

const PAGE_SIZE = 50;
const KINDS: { value: ActivityKind | ""; label: string }[] = [
  { value: "", label: "All tools" },
  { value: "lesson_plan", label: "Lesson plan" },
  { value: "worksheet", label: "Worksheet" },
  { value: "notes", label: "Notes" },
  { value: "activity", label: "Activity" },
  { value: "presentation", label: "Presentation" },
];

const KIND_LABEL: Record<ActivityKind, string> = {
  lesson_plan: "Lesson plan",
  worksheet: "Worksheet",
  notes: "Notes",
  activity: "Activity",
  presentation: "Presentation",
};

export default function AdminActivityPage() {
  const searchParams = useSearchParams();
  // Deep-links (e.g. Task 9's "activity ↗" links from the influencer detail
  // page) pass ?user_id=<uuid> to pre-scope this feed to one teacher. Read it
  // once on mount and thread it through the same state/query-key pattern that
  // already drives `kind`, rather than adding a parallel filtering mechanism.
  const [userId, setUserId] = useState(() => searchParams.get("user_id") || "");
  const [kind, setKind] = useState<ActivityKind | "">("");
  const [userEmail, setUserEmail] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ActivityRow | null>(null);

  const activity = useQuery({
    queryKey: ["admin-activity", kind, userId, page],
    queryFn: () =>
      backendApi.adminActivity({
        kind: kind || undefined,
        user_id: userId || undefined,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const data = activity.data;
  const search = userEmail.trim().toLowerCase();
  const items = (data?.items || []).filter((row) =>
    !search ||
    [row.user_email, row.user_name, row.topic, row.book_title]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(search))
  );
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        eyebrow="Behavioral audit"
        title="Generation Activity"
        description="Every generation across all teachers — tool, input, output, and ₹ cost. Rows from before input-capture show the output with an 'input not recorded' badge."
        meta={
          userId ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Filtered to one user
              <button onClick={() => { setUserId(""); setPage(0); }} className="underline hover:text-blue-900">Clear</button>
            </span>
          ) : undefined
        }
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tool</span>
              <select
                value={kind}
                onChange={(e) => { setKind(e.target.value as ActivityKind | ""); setPage(0); }}
                className="h-9 rounded-xl border border-teachpad-cardBorder bg-white px-3 text-sm font-semibold"
              >
                {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Search (this page)</span>
              <Input
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user / topic / book"
                className="h-9 w-56"
              />
            </label>
          </div>
        }
      />

      {activity.isError && !data ? (
        <EmptyState title="Could not load activity" description={getErrorMessage(activity.error, "Try again in a moment.")} />
      ) : data ? (
        <AdminPanel
          title={`${data.total} generations`}
          actions={
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          }
        >
          {items.length === 0 ? (
            search ? (
              <EmptyState title="No matches on this page" description="Search only filters the loaded page. Clear the search to page through all results." />
            ) : (
              <EmptyState title="No activity" description="No generations match the current filters." />
            )
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Teacher</th>
                    <th className="py-2 pr-4">Tool</th>
                    <th className="py-2 pr-4">Topic</th>
                    <th className="py-2 pr-4">Book</th>
                    <th className="py-2 pr-4">Input</th>
                    <th className="py-2 pr-4">Cost (₹)</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={`${row.kind}:${row.generation_id}`} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 whitespace-nowrap text-gray-600">{formatDateTime(row.created_at)}</td>
                      <td className="py-2 pr-4">
                        <Link href={`/admin/users/${row.user_id}`} className="font-semibold text-blue-600 hover:underline">
                          {row.user_name || row.user_email || row.user_id}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{KIND_LABEL[row.kind]}</td>
                      <td className="py-2 pr-4 max-w-[220px] truncate">{row.topic || "—"}</td>
                      <td className="py-2 pr-4 max-w-[180px] truncate">{row.book_title || "—"}</td>
                      <td className="py-2 pr-4">
                        {row.has_input
                          ? <StatusPill status="success">captured</StatusPill>
                          : <StatusPill status="neutral">not recorded</StatusPill>}
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">{row.cost_inr != null ? row.cost_inr.toFixed(4) : "—"}</td>
                      <td className="py-2 pr-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      ) : (
        <LoadingState label="Loading activity" />
      )}

      {selected && (
        <ActivityDetailDrawer
          generationId={selected.generation_id}
          kind={selected.kind}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
