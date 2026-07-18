import Link from "next/link";
import { BookOpen, Check, ClipboardCheck, Loader2, Plus, Presentation, Sparkles, StickyNote, type LucideIcon } from "lucide-react";
import type { WorkspaceResource, WorkspaceResourceType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { resourceLabels, relativeTime } from "@/lib/workspace/formatters";
import { ensureWorkspaceGeneratorContext } from "@/lib/workspace/routes";

const visuals: Record<WorkspaceResourceType, { icon: LucideIcon; iconTone: string; preview: string }> = {
  lesson_plan: { icon: BookOpen, iconTone: "bg-blue-50 text-blue-600", preview: "/assets/illustrations/lesson-plan-output-preview-v2.png" },
  worksheet: { icon: ClipboardCheck, iconTone: "bg-emerald-50 text-emerald-600", preview: "/assets/illustrations/worksheet-output-preview.png" },
  presentation: { icon: Presentation, iconTone: "bg-violet-50 text-violet-600", preview: "/assets/illustrations/presentation-output-preview.png" },
  notes: { icon: StickyNote, iconTone: "bg-purple-50 text-purple-600", preview: "/assets/illustrations/notes-output-preview.png" },
  activity: { icon: Sparkles, iconTone: "bg-amber-50 text-amber-600", preview: "/assets/illustrations/activity-output-preview.png" },
};

export function ResourceCard({ resource, workspaceId, topicId }: { resource: WorkspaceResource; workspaceId: string; topicId: string }) {
  const visual = visuals[resource.type];
  const Icon = visual.icon;
  const ready = resource.status === "ready";
  const generating = resource.status === "generating";
  const retry = resource.status === "failed";
  const stale = resource.status === "stale";
  const skipped = resource.status === "skipped";
  const openHref = ensureWorkspaceGeneratorContext(resource.href, workspaceId, topicId);
  const generateHref = ensureWorkspaceGeneratorContext(resource.generate_href || resource.href, workspaceId, topicId);

  return (
    <article className={cn(
      "workspace-resource-enter group relative flex min-h-[288px] flex-col rounded-2xl border p-4 shadow-[0_8px_24px_rgba(30,50,80,0.05)] transition hover:-translate-y-1 hover:shadow-[0_15px_32px_rgba(30,70,150,0.10)]",
      ready ? "border-emerald-300 bg-gradient-to-b from-emerald-50/70 to-white" : generating ? "workspace-resource-generating border-blue-300 bg-gradient-to-b from-violet-50/80 to-white" : "border-amber-200 bg-gradient-to-b from-amber-50/60 to-white",
    )}>
      <div className="flex items-start justify-between">
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl", visual.iconTone)}>{generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}</span>
        {ready ? <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white"><Check className="h-3.5 w-3.5" /></span> : !generating ? <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500"><Plus className="h-3.5 w-3.5" /></span> : <Sparkles className="h-5 w-5 text-blue-500" />}
      </div>

      <div className="mt-3 text-center"><h3 className="text-xs font-black text-[#171e38]">{resourceLabels[resource.type]}</h3><p className={cn("mt-1 text-[10px] font-bold", ready ? "text-slate-500" : generating ? "text-blue-600" : retry ? "text-rose-600" : stale ? "text-amber-700" : "text-slate-500")}>{ready ? `Created ${resource.generated_at ? relativeTime(resource.generated_at) : "and ready"}` : generating ? "Generating…" : retry ? "Generation failed" : stale ? "Needs update" : skipped ? "Skipped for now" : "Not created yet"}</p></div>

      <div className="mt-4 flex h-[88px] items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white/80 p-2">
        <img src={visual.preview} alt="" className={cn("h-full w-full object-cover", generating && "animate-pulse opacity-70", !ready && !generating && "opacity-45 grayscale-[0.2]")} />
      </div>

      {generating ? <div className="mt-3"><p className="mb-1.5 text-[9px] font-semibold text-slate-500">Generating your resource…</p><div className="h-1.5 overflow-hidden rounded-full bg-blue-100"><div className="workspace-indeterminate h-full w-1/2 rounded-full bg-blue-600" /></div></div> : null}

      <div className="mt-auto pt-3">
        <Link href={ready ? openHref : generating ? openHref : generateHref} className={cn("inline-flex h-9 w-full items-center justify-center rounded-lg text-[11px] font-black transition", ready ? "border border-slate-200 bg-white text-[#151d37] hover:border-blue-300" : generating ? "bg-blue-100 text-blue-600" : "bg-blue-600 text-white hover:bg-blue-700")}>{ready ? "Open" : generating ? "View progress" : retry ? "Try again" : stale ? "Update" : "Generate"}</Link>
      </div>
    </article>
  );
}
