"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  SkipForward,
  Star,
} from "lucide-react";
import { backendApi, type AdminFeedbackItem } from "@/lib/api";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  LoadingState,
  MetricCard,
  StatusPill,
  formatDateTime,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

export default function AdminFeedbackPage() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [tool, setTool] = useState("");
  const [status, setStatus] = useState<"" | "submitted" | "dismissed">("");
  const [rating, setRating] = useState("");

  const feedback = useQuery({
    queryKey: ["admin-feedback", page, search, tool, status, rating],
    queryFn: () =>
      backendApi.adminFeedback({
        q: search || undefined,
        tool: tool || undefined,
        status: status || undefined,
        rating: rating ? Number(rating) : undefined,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const summary = feedback.data?.summary;
  const totalPages = Math.max(1, Math.ceil((feedback.data?.total ?? 0) / PAGE_SIZE));
  const hasFilters = Boolean(search || tool || status || rating);

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  function clearFilters() {
    setPage(1);
    setSearchDraft("");
    setSearch("");
    setTool("");
    setStatus("");
    setRating("");
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Teacher insights"
        title="Feedback"
        description="Review every rating, comment, and skipped feedback prompt across TeachPad tools."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Feedback Prompts"
          value={summary?.total ?? "—"}
          detail={`${summary?.with_comments ?? 0} with comments`}
          tone="blue"
          icon={<MessageSquareText className="h-5 w-5" />}
        />
        <MetricCard
          label="Responses"
          value={summary?.submitted ?? "—"}
          detail="Ratings submitted"
          tone="green"
          icon={<Star className="h-5 w-5" />}
        />
        <MetricCard
          label="Skipped"
          value={summary?.dismissed ?? "—"}
          detail="Prompts dismissed"
          tone="slate"
          icon={<SkipForward className="h-5 w-5" />}
        />
        <MetricCard
          label="Average Rating"
          value={summary?.average_rating != null ? `${summary.average_rating}/5` : "—"}
          detail="Across submitted ratings"
          tone="amber"
          icon={<Star className="h-5 w-5 fill-current" />}
        />
      </div>

      <AdminPanel
        title="All feedback"
        description="Newest feedback appears first. Search by teacher, email, tool, or comment."
        contentClassName="p-0"
      >
        <div className="border-b border-gray-100 p-4">
          <form onSubmit={applySearch} className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_160px_140px_auto]">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search feedback..."
                aria-label="Search feedback"
                className="border-0 px-0 shadow-none focus:ring-0"
              />
            </div>
            <FilterSelect
              ariaLabel="Filter by tool"
              value={tool}
              onChange={(value) => { setTool(value); setPage(1); }}
              options={(feedback.data?.tools ?? []).map((value) => ({ value, label: formatTool(value) }))}
              placeholder="All tools"
            />
            <FilterSelect
              ariaLabel="Filter by response status"
              value={status}
              onChange={(value) => { setStatus(value as typeof status); setPage(1); }}
              options={[
                { value: "submitted", label: "Submitted" },
                { value: "dismissed", label: "Skipped" },
              ]}
              placeholder="All responses"
            />
            <FilterSelect
              ariaLabel="Filter by rating"
              value={rating}
              onChange={(value) => { setRating(value); setPage(1); }}
              options={[5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value} stars` }))}
              placeholder="All ratings"
            />
            <div className="flex gap-2">
              <Button type="submit">Search</Button>
              {hasFilters ? <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button> : null}
            </div>
          </form>
        </div>

        {feedback.isLoading ? <div className="p-6"><LoadingState label="Loading feedback" /></div> : null}
        {feedback.isError ? (
          <div className="p-6">
            <EmptyState title="Could not load feedback" description="Refresh the page to try again." />
          </div>
        ) : null}
        {!feedback.isLoading && !feedback.isError && !feedback.data?.items.length ? (
          <div className="p-6">
            <EmptyState
              title={hasFilters ? "No matching feedback" : "No feedback collected yet"}
              description={hasFilters ? "Try clearing or changing the filters." : "Ratings and skipped prompts will appear here after teachers use a generator."}
            />
          </div>
        ) : null}

        {feedback.data?.items.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    {[
                      "Teacher",
                      "Tool",
                      "Rating",
                      "Comment",
                      "Status",
                      "Received",
                    ].map((heading) => <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feedback.data.items.map((item) => <FeedbackTableRow key={item.id} item={item} />)}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {feedback.data.items.map((item) => <FeedbackCard key={item.id} item={item} />)}
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-gray-600">
            {feedback.data?.total ?? 0} matching record{feedback.data?.total === 1 ? "" : "s"} · Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || feedback.isFetching} onClick={() => setPage((current) => current - 1)}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || feedback.isFetching} onClick={() => setPage((current) => current + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AdminPanel>
    </>
  );
}

function FeedbackTableRow({ item }: { item: AdminFeedbackItem }) {
  return (
    <tr className="align-top hover:bg-gray-50/70">
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900">{item.user_name}</p>
        <p className="mt-0.5 text-xs text-gray-500">{item.user_email}</p>
      </td>
      <td className="px-5 py-4"><StatusPill status="info">{formatTool(item.tool)}</StatusPill></td>
      <td className="px-5 py-4"><Rating rating={item.rating} /></td>
      <td className="max-w-md px-5 py-4 text-sm leading-relaxed text-gray-700">
        {item.comment?.trim() || <span className="text-gray-400">No comment</span>}
      </td>
      <td className="px-5 py-4">
        <StatusPill status={item.dismissed ? "neutral" : "success"}>{item.dismissed ? "Skipped" : "Submitted"}</StatusPill>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">{formatDateTime(item.created_at)}</td>
    </tr>
  );
}

function FeedbackCard({ item }: { item: AdminFeedbackItem }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{item.user_name}</p>
          <p className="truncate text-xs text-gray-500">{item.user_email}</p>
        </div>
        <StatusPill status={item.dismissed ? "neutral" : "success"}>{item.dismissed ? "Skipped" : "Submitted"}</StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <StatusPill status="info">{formatTool(item.tool)}</StatusPill>
        <Rating rating={item.rating} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {item.comment?.trim() || <span className="text-gray-400">No comment</span>}
      </p>
      <p className="mt-3 text-xs text-gray-500">{formatDateTime(item.created_at)}</p>
    </article>
  );
}

function Rating({ rating }: { rating: number | null }) {
  if (rating == null) return <span className="text-xs text-gray-400">Not rated</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn("h-4 w-4", star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600">{rating}/5</span>
    </span>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function formatTool(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
