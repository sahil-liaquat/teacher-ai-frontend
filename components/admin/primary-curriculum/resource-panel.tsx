"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Upload, FileText, Trash2, X, ExternalLink, Loader2, Palette } from "lucide-react";
import { backendApi } from "@/lib/api";
import type { PrimaryResource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

// The catalog's only categories and level display strings — the backend matches
// these EXACT strings (PrimaryResource.category == value and levels.contains),
// so passing enum-style values like "worksheet" or "lkg" silently returns zero rows.
export const RESOURCE_CATEGORY_OPTIONS = [
  "Flashcards", "Colouring Pages", "Worksheets", "Tracing Sheets",
  "Matching Activities", "Picture Talk Cards", "Vocabulary Cards",
  "Story Cards", "Circle Time Prompts", "Calendar Activities",
];
export const RESOURCE_LEVEL_OPTIONS = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5"];

const FILE_TYPE_OPTIONS = ["webp", "pdf", "png", "jpg", "jpeg", "svg", "mp3", "mp4"];

type ResourceForm = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  levels: string[];
  themes: string[];
  keywords: string;
  languages: string;
};

const emptyForm: ResourceForm = {
  id: "", title: "", category: RESOURCE_CATEGORY_OPTIONS[2], fileUrl: "", fileType: "webp",
  levels: [], themes: [], keywords: "", languages: "English",
};

function filePreviewUrl(resource: PrimaryResource): string {
  return resource.thumbnail_url || resource.file_url;
}

export function ResourcePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [isSingleOpen, setIsSingleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ResourceForm>(emptyForm);

  // Upload-from-device state (Cloudinary-backed)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Theme names for the form's theme picker
  const { data: themes = [] } = useQuery({
    queryKey: ["admin-primary-themes"],
    queryFn: () => backendApi.adminPrimaryThemes(),
  });
  const themeNames = useMemo(
    () => themes.map((t) => t.name).filter((name, idx, all) => all.indexOf(name) === idx),
    [themes]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin-primary-resources", search, category, level, page],
    queryFn: () => backendApi.adminResources({
      search, category: category || undefined, level: level || undefined, page, page_size: 24,
    }),
  });

  const resources = data?.items || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;

  function toggleLevel(lvl: string) {
    setForm((prev) => ({
      ...prev,
      levels: prev.levels.includes(lvl) ? prev.levels.filter((x) => x !== lvl) : [...prev.levels, lvl],
    }));
  }

  function toggleTheme(name: string) {
    setForm((prev) => ({
      ...prev,
      themes: prev.themes.includes(name) ? prev.themes.filter((x) => x !== name) : [...prev.themes, name],
    }));
  }

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id.trim() || !form.title.trim() || !form.fileUrl.trim()) {
      toast({ title: "Missing details", description: "Please fill in ID, Title, and File URL.", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await backendApi.adminCreateResource({
        id: form.id.trim(),
        title: form.title.trim(),
        category: form.category,
        file_url: form.fileUrl.trim(),
        file_type: form.fileType,
        levels: form.levels,
        themes: form.themes,
        keywords: form.keywords.split(",").map((x) => x.trim()).filter(Boolean),
        languages: form.languages.split(",").map((x) => x.trim()).filter(Boolean),
        skills: [],
      });
      toast({ title: "Resource added", description: `"${form.title.trim()}" is now in the catalog.` });
      setIsSingleOpen(false);
      setForm(emptyForm);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-primary-resources"] });
    } catch (err: any) {
      toast({ title: "Failed to create resource", description: err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadFile = async () => {
    if (!uploadFile) return;
    setIsUploadingFile(true);
    try {
      const uploaded = await backendApi.adminUploadPrimaryResource(
        uploadFile,
        form.category,
        form.title.trim() || undefined,
      );
      setForm((prev) => ({
        ...prev,
        id: prev.id.trim() || uploaded.id,
        title: prev.title.trim() || uploadFile.name.replace(/\.[^.]+$/, ""),
        fileUrl: uploaded.file_url,
        fileType: uploaded.file_type || prev.fileType,
      }));
      setUploadFile(null);
      toast({ title: "Uploaded to Cloudinary", description: "Link filled in below — set ID, classes and themes, then Add Resource." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "error" });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) return;
    const lines = bulkCsvText.split("\n");
    const parsedResources: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",").map((x) => x.replace(/^["']|["']$/g, "").trim());
      if (parts.length < 4) continue;
      parsedResources.push({
        id: parts[0],
        title: parts[1],
        category: parts[2],
        file_url: parts[3],
        file_type: parts[4] || "webp",
        levels: parts[5] ? parts[5].split(";").map((x) => x.trim()).filter(Boolean) : [],
        themes: parts[6] ? parts[6].split(";").map((x) => x.trim()).filter(Boolean) : [],
        keywords: parts[7] ? parts[7].split(";").map((x) => x.trim()).filter(Boolean) : [],
        languages: parts[8] ? parts[8].split(";").map((x) => x.trim()).filter(Boolean) : ["English"],
      });
    }

    if (parsedResources.length === 0) {
      toast({ title: "No valid rows found", description: "Check the column format.", variant: "error" });
      return;
    }

    try {
      const res = await backendApi.adminBulkCreateResources({ resources: parsedResources });
      toast({ title: "Bulk import complete", description: `Added ${res.added_count} resources. Skipped ${res.skipped_count} existing.` });
      setIsBulkOpen(false);
      setBulkCsvText("");
      queryClient.invalidateQueries({ queryKey: ["admin-primary-resources"] });
    } catch (err: any) {
      toast({ title: "Bulk import failed", description: err.message, variant: "error" });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm(`Archive resource "${id}"? It will no longer be attachable to lesson steps.`)) return;
    try {
      await backendApi.adminDeleteResource(id);
      toast({ title: "Resource archived" });
      queryClient.invalidateQueries({ queryKey: ["admin-primary-resources"] });
    } catch (err: any) {
      toast({ title: "Failed to archive resource", description: err.message, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-100 bg-white p-4 shadow-sm rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search the printable catalog..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All categories</option>
            {RESOURCE_CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All classes</option>
            {RESOURCE_LEVEL_OPTIONS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(true)} className="rounded-xl font-bold text-xs">
            <Upload className="h-4 w-4 mr-1 text-slate-500" />
            CSV Import
          </Button>
          <Button variant="default" size="sm" onClick={() => setIsSingleOpen(true)} className="rounded-xl font-bold text-xs">
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Catalog grid */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold">Loading printable library...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {resources.map((res) => (
              <div
                key={res.id}
                className={`border border-slate-100 bg-white overflow-hidden rounded-2xl shadow-xs flex flex-col hover:shadow-sm transition-all ${res.is_active === false ? "opacity-40" : ""}`}
              >
                <div className="relative aspect-[4/3] bg-slate-50">
                  {filePreviewUrl(res) ? (
                    <img src={filePreviewUrl(res)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-300"><FileText className="h-8 w-8" /></div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur">
                    {res.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <h4 className="text-xs font-black text-slate-800 leading-snug line-clamp-2" title={res.title}>{res.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{res.id} · {res.file_type.toUpperCase()}</p>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {res.levels?.slice(0, 3).map((l: string) => (
                      <span key={l} className="text-[8px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded uppercase">{l}</span>
                    ))}
                    {(res.levels?.length || 0) > 3 ? <span className="text-[8px] text-slate-400 font-bold px-1 py-0.5">+{(res.levels?.length || 0) - 3}</span> : null}
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-50 mt-3 pt-2.5">
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                    <button onClick={() => handleDeleteResource(res.id)} className="text-slate-400 hover:text-rose-600 p-1" title="Archive resource">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {resources.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-4 border border-dashed border-slate-200 bg-white p-12 rounded-2xl text-center text-slate-400">
                No resources match. Try clearing the filters, or add the first resource above.
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 border-t pt-4">
            <span>Showing {resources.length} of {total} resources</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-xl font-bold">Previous</Button>
              <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(page + 1)} className="rounded-xl font-bold">Next</Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV bulk import */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">CSV Bulk Import</h3>
              <button onClick={() => setIsBulkOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 border rounded-xl space-y-1 font-mono">
                <div className="font-bold text-slate-700">Format: ID, Title, Category, FileUrl, FileType, Levels;Themes;Keywords</div>
                <div>nursery_worksheet_1, My Trace Page, Worksheets, https://example.com/pdf.pdf, pdf, Nursery;LKG, Animals;Farm, trace;write</div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Paste CSV content (skip header)</label>
                <textarea
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  placeholder="ID, Title, Category, FileUrl, FileType, Levels;Themes;Keywords"
                  rows={8}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsBulkOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button variant="default" onClick={handleBulkImport} className="rounded-xl font-bold">Import CSV</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add single resource */}
      {isSingleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateSingle} className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="text-sm font-black text-slate-800">Add Resource</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">The file URL is shared with teachers when a step matches this resource.</p>
              </div>
              <button type="button" onClick={() => { setIsSingleOpen(false); setUploadFile(null); }} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-3">
              {/* Upload from device (Cloudinary) */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">Upload from device (Cloudinary)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="flex-1 min-w-0 text-[10px] text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-[10px] file:font-black file:text-blue-600 file:shadow-sm file:cursor-pointer"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingFile || !uploadFile}
                    onClick={handleUploadFile}
                    className="rounded-xl font-bold text-[11px] shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    {isUploadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {isUploadingFile ? "Uploading…" : "Upload"}
                  </Button>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                  Uploads to Cloudinary and fills the File URL / Title / File Type below. Then set the ID, classes and themes and click Add Resource.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Unique ID</label>
                  <input type="text" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="nursery_worksheet_farm_1" className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Farm Animals Matching Worksheet" className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                    {RESOURCE_CATEGORY_OPTIONS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">File Type</label>
                  <select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })} className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                    {FILE_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">File URL</label>
                <input type="text" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Target classes</label>
                <div className="flex flex-wrap gap-1.5">
                  {RESOURCE_LEVEL_OPTIONS.map((lvl) => {
                    const checked = form.levels.includes(lvl);
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => toggleLevel(lvl)}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${checked ? "border-blue-400 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"}`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Palette className="h-3 w-3" /> Target themes</label>
                <div className="flex flex-wrap gap-1.5">
                  {themeNames.length === 0 ? <span className="text-[10px] text-slate-400 italic">No themes created yet — skip or create themes in Step 1.</span> : themeNames.map((name) => {
                    const checked = form.themes.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleTheme(name)}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${checked ? "border-blue-400 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"}`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Keywords (comma)</label>
                  <input type="text" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="cow, dog, sound" className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Languages (comma)</label>
                  <input type="text" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English" className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => { setIsSingleOpen(false); setUploadFile(null); }} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" variant="default" disabled={saving} className="rounded-xl font-bold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {saving ? "Adding..." : "Add Resource"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
