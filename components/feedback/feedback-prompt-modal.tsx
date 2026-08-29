"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import {
  CURRENT_USER_QUERY_KEY,
  GENERATION_COMPLETED_EVENT,
  backendApi,
  getCurrentUser,
  type ApiUser
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { claimGlobalCard, releaseGlobalCard } from "@/lib/global-card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const TOOL_LABELS: Record<string, string> = {
  lesson_plan: "lesson plan",
  worksheet: "worksheet",
  presentation: "presentation",
  notes: "notes",
  activity: "activity"
};

/** Wait this long after a generation completes so the user can review it before we ask. */
const FEEDBACK_PROMPT_DELAY_MS = 30_000;

/**
 * Fires a one-time star + comment popup the first time a user completes a
 * generation with each tool. Listens for the GENERATION_COMPLETED_EVENT
 * dispatched by lib/api.ts, and shows only for tools not already in the
 * user's `feedback_tools` (from GET /auth/me). Admins are excluded so QA runs
 * don't pollute the data. Mounted once, globally, in the dashboard shell.
 */
export function FeedbackPromptModal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useQuery<ApiUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser({ redirectOnUnauthorized: false }),
    staleTime: Infinity,
    retry: false
  });

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Read inside the (once-registered) event listener to avoid stale closures.
  const activeToolRef = useRef<string | null>(null);
  activeToolRef.current = activeTool;
  const pendingTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    function onGenerationCompleted(event: Event) {
      const tool = (event as CustomEvent<{ tool?: string }>).detail?.tool;
      if (!tool) return;
      // Re-check everything when the timer fires, not now — by then the user
      // may have generated a second thing, opened another modal, or already
      // been prompted for this tool.
      const timeoutId = window.setTimeout(() => {
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((id) => id !== timeoutId);
        if (activeToolRef.current) return;
        const current = queryClient.getQueryData<ApiUser>(CURRENT_USER_QUERY_KEY);
        if (!current || current.role === "admin") return;
        if (current.feedback_tools?.includes(tool)) return;
        // Yields to the phone ask: one card at a time, and that one comes first.
        if (!claimGlobalCard("feedback")) return;
        setActiveTool(tool);
        setRating(0);
        setHover(0);
        setComment("");
      }, FEEDBACK_PROMPT_DELAY_MS);
      pendingTimeoutsRef.current.push(timeoutId);
    }
    window.addEventListener(GENERATION_COMPLETED_EVENT, onGenerationCompleted);
    return () => {
      window.removeEventListener(GENERATION_COMPLETED_EVENT, onGenerationCompleted);
      pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimeoutsRef.current = [];
      releaseGlobalCard("feedback");
    };
  }, [queryClient]);

  if (!activeTool) return null;

  const label = TOOL_LABELS[activeTool] ?? "lesson";

  function close() {
    setActiveTool(null);
    releaseGlobalCard("feedback");
  }

  function markHandled(tool: string) {
    queryClient.setQueryData<ApiUser>(CURRENT_USER_QUERY_KEY, (old) =>
      old ? { ...old, feedback_tools: [...(old.feedback_tools ?? []), tool] } : old
    );
  }

  async function submit() {
    if (!activeTool || rating < 1) return;
    setSubmitting(true);
    try {
      await backendApi.submitFeedback({
        tool: activeTool,
        rating,
        comment: comment.trim() || null,
        dismissed: false
      });
      markHandled(activeTool);
      toast({ title: "Thanks for the feedback!", variant: "success" });
      close();
    } catch (err) {
      toast({
        title: "Could not send feedback",
        description: getErrorMessage(err, "Please try again."),
        variant: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  function skip() {
    const tool = activeTool;
    if (!tool) return;
    // Best-effort: record the dismissal so it isn't shown again, then close
    // immediately regardless of the request outcome.
    markHandled(tool);
    close();
    void backendApi.submitFeedback({ tool, dismissed: true }).catch(() => {});
  }

  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next) skip();
      }}
      title={`How was your first ${label}?`}
      description="Your feedback helps us make TeachPad better."
      showClose={false}
      className="gap-4 p-6"
    >
      <div className="flex items-center gap-1 pt-2" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="p-1.5 transition-transform hover:scale-110"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={cn(
                "h-8 w-8",
                (hover || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>

      <label className="grid gap-1.5">
        <span className="text-sm font-black text-slate-900">Anything we can improve? (optional)</span>
        <Textarea
          className="min-h-[80px]"
          placeholder="Tell us what worked or what didn't…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
        />
      </label>

      <div className="mt-2 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={skip} disabled={submitting}>
          Skip
        </Button>
        <Button onClick={submit} loading={submitting} disabled={rating < 1}>
          {submitting ? "Sending…" : "Submit"}
        </Button>
      </div>
    </Modal>
  );
}
