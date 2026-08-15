"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import {
  PRIMARY_FEEDBACK_REASONS,
  backendApi,
  type PrimaryFeedbackReason,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

/**
 * "Report issue" on one teaching block.
 *
 * ⚠ Deliberately small and inline — the existing card style, the existing type
 * scale, no new surface. A teacher who has to leave the block they are teaching
 * to describe a problem with it does not report the problem.
 *
 * ⚠ Only `activity_id` is sent. Which school this reaches, which lesson and
 * version it is about, and which class it came from are all resolved on the
 * server from the authenticated user. That is what routes an organization
 * teacher's report to their school admin and an independent teacher's to the
 * platform — and what stops a client filing into a school it does not belong to.
 */
export function ReportIssueControl({
  activityId,
  notify,
}: {
  activityId: string;
  notify?: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PrimaryFeedbackReason | "">("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!reason) return;
    setSaving(true);
    setError(null);
    try {
      await backendApi.submitPrimaryFeedback({
        activity_id: activityId,
        reason,
        comment: comment.trim() || null,
      });
      setSent(true);
      setOpen(false);
      setReason("");
      setComment("");
      notify?.("Thanks — your feedback was sent.");
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn't send that. Try again."));
    } finally {
      setSaving(false);
    }
  }

  if (sent && !open) {
    return (
      <p className="text-[11px] font-bold text-emerald-700">Feedback sent ✓</p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#6e41f5] transition"
      >
        <Flag className="h-3.5 w-3.5" /> Report issue
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[#e8e7fb] bg-[#fbfbfe]/60 p-4">
      <p className="text-xs font-black text-[#171747]">Report an issue with this block</p>
      <div className="mt-3 space-y-1.5">
        {PRIMARY_FEEDBACK_REASONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="radio"
              name={`feedback-${activityId}`}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Comment (optional)"
        rows={2}
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 placeholder:text-slate-400/70 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition resize-none"
      />
      {error && <p className="mt-2 text-[11px] font-bold text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          disabled={saving}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!reason || saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e41f5] px-3 py-1.5 text-[11px] font-black text-white shadow-sm hover:bg-[#5731d8] transition disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Send feedback
        </button>
      </div>
    </div>
  );
}
