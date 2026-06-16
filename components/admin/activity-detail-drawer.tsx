"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { backendApi, type ActivityKind } from "@/lib/api";
import { LoadingState, EmptyState, StatusPill } from "@/components/admin/admin-ui";
import { getErrorMessage } from "@/lib/errors";

export function ActivityDetailDrawer({
  generationId,
  kind,
  open,
  onClose,
}: {
  generationId: string;
  kind: ActivityKind;
  open: boolean;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ["admin-activity-detail", generationId, kind],
    queryFn: () => backendApi.adminActivityDetail(generationId, kind),
    enabled: open,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;
  const d = detail.data;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-teachpad-ink/30 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-gray-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{kind.replace("_", " ")}</p>
            <h2 className="text-lg font-bold text-gray-900">Generation detail</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">
          {detail.isLoading ? (
            <LoadingState label="Loading detail" />
          ) : detail.isError || !d ? (
            <EmptyState title="Could not load detail" description={getErrorMessage(detail.error, "Try again in a moment.")} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Meta label="Teacher" value={d.user_name || d.user_email || d.user_id} />
                <Meta label="Topic" value={d.topic || "—"} />
                <Meta label="Book" value={d.book_title || "—"} />
                <Meta label="Cost (₹)" value={d.cost_inr != null ? d.cost_inr.toFixed(4) : "—"} />
              </div>

              <Section title="Input">
                {d.input_json
                  ? <JsonBlock value={d.input_json} />
                  : <StatusPill status="neutral">input not recorded (pre-tracking)</StatusPill>}
              </Section>

              <Section title="Output">
                {d.output_json ? <JsonBlock value={d.output_json} /> : <span className="text-sm text-gray-500">—</span>}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-0.5 break-words font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function JsonBlock({ value }: { value: Record<string, unknown> }) {
  return (
    <pre className="max-h-[40vh] overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
