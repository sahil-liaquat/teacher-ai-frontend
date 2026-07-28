"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Search, UserMinus, X } from "lucide-react";
import {
  backendApi,
  type ActivityKind,
  type ActivityRow,
  type ApiUser,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";

const EXPORT_PAGE_SIZE = 200;

const KIND_LABEL: Record<ActivityKind, string> = {
  lesson_plan: "Lesson plan",
  worksheet: "Worksheet",
  notes: "Notes",
  activity: "Activity",
  presentation: "Presentation",
};

export function ActivityExportDialog({
  open,
  onClose,
  kind,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  kind?: ActivityKind;
  userId?: string;
}) {
  const [search, setSearch] = useState("");
  const [excludedUsers, setExcludedUsers] = useState<ApiUser[]>([]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [exportedCount, setExportedCount] = useState<number | null>(null);

  const users = useQuery({
    queryKey: ["admin-activity-export-users"],
    queryFn: async () => {
      const firstPage = await backendApi.users(0, 100);
      return firstPage.total > firstPage.items.length
        ? (await backendApi.users(0, firstPage.total)).items
        : firstPage.items;
    },
    enabled: open,
    staleTime: 5 * 60_000,
  });

  if (!open) return null;

  const query = search.trim().toLowerCase();
  const excludedIds = new Set(excludedUsers.map((user) => user.id).filter(Boolean));
  const matches = query
    ? (users.data || []).filter((user) => {
        if (!user.id || excludedIds.has(user.id)) return false;
        return [user.full_name, user.name, user.email]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }).slice(0, 8)
    : [];

  function addExcludedUser(user: ApiUser) {
    if (!user.id) return;
    setExcludedUsers((current) => current.some((item) => item.id === user.id) ? current : [...current, user]);
    setSearch("");
    setExportedCount(null);
  }

  function removeExcludedUser(userIdToRemove?: string) {
    setExcludedUsers((current) => current.filter((user) => user.id !== userIdToRemove));
    setExportedCount(null);
  }

  async function exportActivities() {
    setExporting(true);
    setError("");
    setExportedCount(null);
    setProgress("Loading activities…");
    try {
      const params = { kind, user_id: userId, limit: EXPORT_PAGE_SIZE };
      const firstPage = await backendApi.adminActivity({ ...params, skip: 0 });
      const rows = [...firstPage.items];
      setProgress(`Loaded ${rows.length} of ${firstPage.total}`);

      for (let skip = EXPORT_PAGE_SIZE; skip < firstPage.total; skip += EXPORT_PAGE_SIZE) {
        const page = await backendApi.adminActivity({ ...params, skip });
        rows.push(...page.items);
        setProgress(`Loaded ${Math.min(rows.length, firstPage.total)} of ${firstPage.total}`);
      }

      const idsToExclude = new Set(excludedUsers.map((user) => user.id).filter(Boolean));
      const includedRows = rows.filter((row) => !idsToExclude.has(row.user_id));
      downloadCsv(activityRowsToCsv(includedRows), `teachpad-activities-${new Date().toISOString().slice(0, 10)}.csv`);
      setExportedCount(includedRows.length);
      setProgress("");
    } catch (exportError) {
      setError(getErrorMessage(exportError, "Could not export activities. Try again."));
      setProgress("");
    } finally {
      setExporting(false);
    }
  }

  const scope = [kind ? KIND_LABEL[kind] : "All tools", userId ? "one filtered user" : "all users"].join(" · ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !exporting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-export-title"
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-white px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">CSV export</p>
            <h2 id="activity-export-title" className="mt-1 text-xl font-black text-slate-900">Export activities</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Scope: {scope}. Every matching page will be included.</p>
          </div>
          <button
            type="button"
            aria-label="Close export dialog"
            disabled={exporting}
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label htmlFor="excluded-user-search" className="text-sm font-bold text-slate-800">
              Exclude users <span className="font-medium text-slate-400">(optional)</span>
            </label>
            <p className="mt-1 text-xs font-medium text-slate-500">Type a teacher’s name or email, then select the matching account. Press Enter to choose the first match.</p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="excluded-user-search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setExportedCount(null); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && matches[0]) {
                    event.preventDefault();
                    addExcludedUser(matches[0]);
                  }
                }}
                disabled={users.isPending || exporting}
                placeholder={users.isPending ? "Loading users…" : "Enter name or email"}
                className="pl-10"
                autoComplete="off"
              />
            </div>

            {query ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                {users.isError ? (
                  <p className="px-4 py-3 text-sm font-medium text-rose-600">Could not load the user list.</p>
                ) : matches.length ? (
                  <div className="max-h-56 overflow-y-auto py-1">
                    {matches.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addExcludedUser(user)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-blue-50"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
                          {userInitials(user)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-900">{userDisplayName(user)}</span>
                          <span className="block truncate text-xs font-medium text-slate-500">{user.email || "No email"}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm font-medium text-slate-500">No matching users.</p>
                )}
              </div>
            ) : null}
          </div>

          {excludedUsers.length ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Excluding {excludedUsers.length} user{excludedUsers.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-wrap gap-2">
                {excludedUsers.map((user) => (
                  <span key={user.id} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 py-1.5 pl-3 pr-1.5 text-xs font-bold text-rose-700">
                    <UserMinus className="h-3.5 w-3.5" />
                    {userDisplayName(user)}
                    <button
                      type="button"
                      aria-label={`Include ${userDisplayName(user)} again`}
                      disabled={exporting}
                      onClick={() => removeExcludedUser(user.id)}
                      className="grid h-5 w-5 place-items-center rounded-full hover:bg-rose-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
          {exportedCount != null ? (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Exported {exportedCount} activit{exportedCount === 1 ? "y" : "ies"}.
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <Button type="button" variant="ghost" onClick={onClose} disabled={exporting}>Cancel</Button>
            <Button type="button" onClick={() => void exportActivities()} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? progress || "Exporting…" : "Export CSV"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function userDisplayName(user: ApiUser) {
  return user.full_name || user.name || user.email || "Unnamed user";
}

function userInitials(user: ApiUser) {
  return userDisplayName(user)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function activityRowsToCsv(rows: ActivityRow[]) {
  return toCsv(
    ["Created at", "Teacher", "Email", "User ID", "Tool", "Topic", "Book", "Input captured", "Cost INR", "Total tokens", "Generation ID"],
    rows.map((row) => [
      row.created_at,
      row.user_name || "",
      row.user_email || "",
      row.user_id,
      KIND_LABEL[row.kind],
      row.topic || "",
      row.book_title || "",
      row.has_input ? "Yes" : "No",
      row.cost_inr ?? "",
      row.total_tokens ?? "",
      row.generation_id,
    ])
  );
}

function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [headers, ...rows]
    .map((row) => row.map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
    }).join(","))
    .join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
