"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, RefreshCw, Sparkles } from "lucide-react";
import { type PrimaryAIProposal, type PrimaryAIProposalRequest } from "@/lib/api";
import { curriculumAdminAdapter, type CurriculumAdminScope } from "@/lib/curriculum-admin-adapter";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionDialog } from "@/components/school-admin/shared/action-dialog";

function preview(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  const entries = Object.entries(value).filter(([, item]) => item != null && item !== "");
  if (!entries.length) return null;
  return entries.slice(0, 5).map(([key, item]) => (
    <div key={key} className="grid gap-1 sm:grid-cols-[150px_1fr]">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{key.replaceAll("_", " ")}</dt>
      <dd className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{Array.isArray(item) ? item.join(" · ") : typeof item === "object" ? JSON.stringify(item) : String(item)}</dd>
    </div>
  ));
}

export function AIProposalDialog({
  open, onOpenChange, request, title, onApplied, scope = "school",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PrimaryAIProposalRequest | null;
  title: string;
  scope?: CurriculumAdminScope;
  onApplied: (draftLessonIds: string[]) => void | Promise<void>;
}) {
  const adapter = curriculumAdminAdapter(scope);
  const [proposal, setProposal] = useState<PrimaryAIProposal | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);

  const generate = useCallback(async () => {
    if (!request) return;
    setLoading(true);
    setError("");
    setStale(false);
    setProposal(null);
    try {
      const next = await adapter.generateProposal(request);
      setProposal(next);
      setSelected(new Set(next.changes.filter((change) => change.selected_by_default).map((change) => change.id)));
    } catch (cause) {
      setError(getErrorMessage(cause, "TeachPad AI could not prepare this proposal."));
    } finally {
      setLoading(false);
    }
  }, [request, scope]);

  useEffect(() => {
    if (open && request) void generate();
  }, [open, request, generate]);

  async function apply() {
    if (!proposal || applying) return;
    setApplying(true);
    setError("");
    try {
      const result = await adapter.applyProposal(proposal.id, Array.from(selected));
      await onApplied(result.draft_lesson_ids);
      onOpenChange(false);
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      setStale(code === "PRIMARY_AI_PROPOSAL_STALE");
      setError(getErrorMessage(cause, "The proposal could not be applied."));
    } finally {
      setApplying(false);
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={(next) => { if (!applying) onOpenChange(next); }}
      title={title}
      description="Review exactly what will change. Nothing is written or published until you apply the selected proposal."
      size="lg"
      footer={proposal && !loading ? (
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>Cancel</Button>
          <Button variant="outline" onClick={() => void generate()} disabled={applying}><RefreshCw className="h-4 w-4" /> Generate again</Button>
          <Button onClick={() => void apply()} disabled={applying || selected.size === 0}>{applying ? "Applying to draft…" : `Apply ${selected.size} selected`}</Button>
        </>
      ) : undefined}
    >
      {loading ? (
        <div aria-live="polite" className="space-y-3"><div className="flex items-center gap-2 text-sm font-semibold text-violet-700"><Sparkles className="h-4 w-4 animate-pulse" /> Inspecting existing curriculum…</div><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-16" /></div>
      ) : error ? (
        <div className={`rounded-2xl border p-4 ${stale ? "border-amber-200 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-900"}`} role="alert">
          <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">{stale ? "This proposal is out of date" : "Proposal unavailable"}</p><p className="mt-1 text-sm leading-6">{error}</p><Button className="mt-3" variant="outline" onClick={() => void generate()}>Try again</Button></div></div>
        </div>
      ) : proposal ? (
        <div>
          <div className="rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-950">{proposal.summary}</div>
          {!proposal.changes.length ? <p className="py-10 text-center text-sm text-slate-500">There is nothing to apply in this scope.</p> : (
            <div className="mt-4 space-y-3">
              {proposal.changes.map((change) => {
                const checked = selected.has(change.id);
                return (
                  <label key={change.id} className={`block cursor-pointer rounded-2xl border p-4 transition ${checked ? "border-violet-300 bg-violet-50/40" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>{checked ? <Check className="h-3.5 w-3.5" /> : null}</span>
                      <input className="sr-only" type="checkbox" checked={checked} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(change.id)) next.delete(change.id); else next.add(change.id); return next; })} />
                      <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-950">{change.title}</span><span className="mt-1 block text-sm text-slate-500">{change.description}</span></span>
                    </div>
                    <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3">{preview(change.proposed)}</dl>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </ActionDialog>
  );
}
