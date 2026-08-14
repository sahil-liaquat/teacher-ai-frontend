"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, FileText, Search, Upload, X } from "lucide-react";
import { type PrimaryResource } from "@/lib/api";
import { curriculumAdminAdapter, type CurriculumAdminScope } from "@/lib/curriculum-admin-adapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type ResourceTab = "recommended" | "school" | "teachpad" | "upload";

export function ResourcePicker({
  blockType,
  selectedIds,
  onSelect,
  onClose,
  scope = "school",
}: {
  blockType: string;
  selectedIds: string[];
  onSelect: (resource: PrimaryResource) => void;
  onClose: () => void;
  scope?: CurriculumAdminScope;
}) {
  const adapter = curriculumAdminAdapter(scope);
  const { toast } = useToast();
  const [tab, setTab] = useState<ResourceTab>("recommended");
  const [search, setSearch] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const resourcesQuery = useQuery({
    queryKey: [adapter.queryRoot, "resource-picker", search],
    queryFn: () => adapter.resources({ search, page_size: 100 }),
  });

  const resources = useMemo(() => {
    const items = resourcesQuery.data?.items ?? [];
    if (tab === "school") return items.filter((item) => item.scope === "school");
    if (tab === "teachpad") return items.filter((item) => item.scope === "platform");
    if (tab === "recommended") {
      const exact = items.filter((item) => item.suitable_block === blockType || item.keywords?.includes(blockType));
      return exact.length ? exact : items;
    }
    return [];
  }, [blockType, resourcesQuery.data, tab]);

  async function uploadResource() {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const resource = await adapter.uploadResource(uploadFile, "Classroom Resource", uploadTitle.trim() || undefined);
      onSelect(resource);
      toast({ title: "Resource uploaded and attached" });
      onClose();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message, variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="resource-picker-title">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Classroom block</p><h2 id="resource-picker-title" className="mt-1 text-xl font-semibold text-slate-950">Add a resource</h2><p className="mt-1 text-sm text-slate-500">Choose from your school or TeachPad library. Attachment stays with this teaching day.</p></div>
          <button type="button" aria-label="Close resource picker" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="border-b border-slate-200 px-5 pt-4 sm:px-7">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Resource sources">
            {([
              ["recommended", "Recommended"],
              ["school", "School Library"],
              ["teachpad", "TeachPad Library"],
              ["upload", "Upload / Add"],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold ${tab === value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{label}</button>
            ))}
          </div>
        </div>
        {tab === "upload" ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 p-6">
              <Upload className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 font-semibold text-slate-950">Upload a school resource</h3>
              <p className="mt-1 text-sm text-slate-500">The uploaded file belongs to your school and will be attached to this block.</p>
              <label className="mt-5 block text-sm font-semibold text-slate-700">Resource title<Input className="mt-2" value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} placeholder="e.g. Body parts flashcards" /></label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Choose file<input className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700" type="file" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /></label>
              <Button className="mt-6" disabled={!uploadFile || uploading} onClick={() => void uploadResource()}>{uploading ? "Uploading…" : "Upload and attach"}</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 sm:px-7">
              <label className="relative block"><span className="sr-only">Search resources</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search resources" /></label>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 sm:px-7">
              {resourcesQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : null}
              {resourcesQuery.isError ? <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">Resources could not be loaded. Try again.</div> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {resources.map((resource) => {
                  const selected = selectedIds.includes(resource.id);
                  return (
                    <button key={resource.id} type="button" disabled={selected} onClick={() => onSelect(resource)} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-blue-300 disabled:bg-slate-50">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-blue-700"><FileText className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-950">{resource.title}</span><span className="mt-1 block text-xs text-slate-500">{resource.category} · {resource.scope === "school" ? "School Library" : "TeachPad Library"}</span></span>
                      {selected ? <Check className="h-4 w-4 text-emerald-600" /> : <span className="text-xs font-bold text-blue-700">Add</span>}
                    </button>
                  );
                })}
              </div>
              {!resourcesQuery.isLoading && !resources.length ? <p className="py-12 text-center text-sm text-slate-500">No matching resources. Try another search or upload a school resource.</p> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
