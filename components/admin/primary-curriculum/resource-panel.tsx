"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Upload, FileText, Check, Trash2, X, Download } from "lucide-react";
import { backendApi } from "@/lib/api";
import type { PrimaryResource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LEVEL_OPTIONS } from "./theme-list";

export function ResourcePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Search states
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  
  // Import states
  const [isBulkOpen, setIsBulkOpen] = useState<boolean>(false);
  const [bulkCsvText, setBulkCsvText] = useState<string>("");
  const [isSingleOpen, setIsSingleOpen] = useState<boolean>(false);
  
  // Single Resource form
  const [formId, setFormId] = useState<string>("");
  const [formTitle, setFormTitle] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("worksheet");
  const [formFileUrl, setFormFileUrl] = useState<string>("");
  const [formFileType, setFormFileType] = useState<string>("webp");
  const [formLevels, setFormLevels] = useState<string>("");
  const [formThemes, setFormThemes] = useState<string>("");
  const [formKeywords, setFormKeywords] = useState<string>("");
  const [formLanguages, setFormLanguages] = useState<string>("English");
  
  // Fetch Resources list
  const { data, isLoading } = useQuery({
    queryKey: ["admin-primary-resources", search, category, level, page],
    queryFn: () => backendApi.adminResources({
      search, category: category || undefined, level: level || undefined, page, page_size: 20
    })
  });

  const resources = data?.items || [];
  const total = data?.total || 0;
  const hasMore = data?.has_more || false;

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !formTitle || !formFileUrl) {
      toast({ title: "Validation error", description: "Please fill in ID, Title, and File URL.", variant: "error" });
      return;
    }

    try {
      await backendApi.adminCreateResource({
        id: formId.trim(),
        title: formTitle.trim(),
        category: formCategory,
        file_url: formFileUrl.trim(),
        file_type: formFileType,
        levels: formLevels.split(",").map(x => x.trim()).filter(Boolean),
        themes: formThemes.split(",").map(x => x.trim()).filter(Boolean),
        keywords: formKeywords.split(",").map(x => x.trim()).filter(Boolean),
        languages: formLanguages.split(",").map(x => x.trim()).filter(Boolean),
        skills: []
      });
      
      toast({ title: "Resource added successfully" });
      setIsSingleOpen(false);
      // Reset form
      setFormId(""); setFormTitle(""); setFormFileUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin-primary-resources"] });
    } catch (err: any) {
      toast({ title: "Failed to create resource", description: err.message, variant: "error" });
    }
  };

  const handleBulkImport = async () => {
    if (!bulkCsvText.trim()) return;
    
    // Parse CSV simple parser
    const lines = bulkCsvText.split("\n");
    const parsedResources: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple comma splitting, handling basics
      const parts = line.split(",").map(x => x.replace(/^["']|["']$/g, "").trim());
      if (parts.length < 4) continue;
      
      parsedResources.push({
        id: parts[0],
        title: parts[1],
        category: parts[2],
        file_url: parts[3],
        file_type: parts[4] || "webp",
        levels: parts[5] ? parts[5].split(";").map(x => x.trim()).filter(Boolean) : [],
        themes: parts[6] ? parts[6].split(";").map(x => x.trim()).filter(Boolean) : [],
        keywords: parts[7] ? parts[7].split(";").map(x => x.trim()).filter(Boolean) : [],
        languages: parts[8] ? parts[8].split(";").map(x => x.trim()).filter(Boolean) : ["English"]
      });
    }

    if (parsedResources.length === 0) {
      toast({ title: "No valid rows found", description: "Check columns format.", variant: "error" });
      return;
    }

    try {
      const res = await backendApi.adminBulkCreateResources({ resources: parsedResources });
      toast({ title: "Bulk creation complete", description: `Added ${res.added_count} resources. Skipped ${res.skipped_count} existing.` });
      setIsBulkOpen(false);
      setBulkCsvText("");
      queryClient.invalidateQueries({ queryKey: ["admin-primary-resources"] });
    } catch (err: any) {
      toast({ title: "Failed bulk import", description: err.message, variant: "error" });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm(`Are you sure you want to archive resource: ${id}?`)) return;
    try {
      await backendApi.adminDeleteResource(id);
      toast({ title: "Resource archived successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-primary-resources"] });
    } catch (err: any) {
      toast({ title: "Failed to delete resource", description: err.message, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search filters & actions panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-100 bg-white p-4 shadow-sm rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search resource catalog..."
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {["worksheet", "flashcards", "story", "craft_guide", "song_lyrics", "game_rules", "assessment"].map(cat => (
              <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="">All levels</option>
            {LEVEL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBulkOpen(true)}
            className="rounded-xl font-bold text-xs"
          >
            <Upload className="h-4 w-4 mr-1 text-slate-500" />
            CSV Bulk Import
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsSingleOpen(true)}
            className="rounded-xl font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Grid of printables */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold">Loading printables library...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {resources.map((res) => (
              <div 
                key={res.id} 
                className={`border border-slate-100 bg-white p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-sm transition-all ${
                  res.is_active === false ? "opacity-40" : ""
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full uppercase">
                      {res.category.replace("_", " ")}
                    </span>
                    <span className="text-[9px] text-slate-400 font-black">{res.file_type.toUpperCase()}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 leading-snug mt-2 truncate" title={res.title}>{res.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{res.id}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {res.levels?.map((l: string) => (
                      <span key={l} className="text-[8px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase">{l}</span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 mt-4 pt-3">
                  <a 
                    href={res.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                  <button 
                    onClick={() => handleDeleteResource(res.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {resources.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-4 border border-dashed border-slate-200 bg-white p-12 rounded-2xl text-center text-slate-400">
                No resources found matching filters.
              </div>
            )}
          </div>

          {/* Simple Pagination */}
          <div className="flex justify-between items-center text-xs text-slate-400 border-t pt-4">
            <span>Showing {resources.length} of {total} total resources</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="rounded-xl font-bold"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!hasMore} 
                onClick={() => setPage(page + 1)}
                className="rounded-xl font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Bulk Import modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">CSV Bulk Import</h3>
              <button onClick={() => setIsBulkOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 border rounded-xl space-y-1 font-mono">
                <div className="font-bold text-slate-700">Format: ID, Title, Category, FileUrl, FileType, Levels;Themes;Keywords</div>
                <div>nursery_worksheet_1, My Trace Page, worksheet, https://example.com/pdf.pdf, pdf, nursery;lkg, animals;farm, trace;write</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Paste CSV Content</label>
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

      {/* Add Single Resource Modal */}
      {isSingleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateSingle} className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-black text-slate-800">Add Single Resource</h3>
              <button type="button" onClick={() => setIsSingleOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Resource ID (Unique)</label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. nursery_worksheet_farm_1"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Resource Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Farm Animals Matching Worksheet"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="border border-slate-200 bg-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  >
                    {["worksheet", "flashcards", "story", "craft_guide", "song_lyrics", "game_rules", "assessment"].map(cat => (
                      <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">File Type</label>
                  <input
                    type="text"
                    value={formFileType}
                    onChange={(e) => setFormFileType(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Download File URL</label>
                <input
                  type="text"
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  placeholder="https://example.com/file.pdf"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Target Levels (comma-separated)</label>
                <input
                  type="text"
                  value={formLevels}
                  onChange={(e) => setFormLevels(e.target.value)}
                  placeholder="nursery, lkg"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Target Themes (comma-separated)</label>
                <input
                  type="text"
                  value={formThemes}
                  onChange={(e) => setFormThemes(e.target.value)}
                  placeholder="Animals, Farm"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Search Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="cow, dog, sound"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsSingleOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" variant="default" className="rounded-xl font-bold">Create Resource</Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
