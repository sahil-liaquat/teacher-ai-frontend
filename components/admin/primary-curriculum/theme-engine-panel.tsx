"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowDown, ArrowUp, Check, Loader2, Pencil, Plus, RotateCcw, Save, Search, Sparkles, Trash2, X } from "lucide-react";
import { backendApi, type PrimaryCurriculumTheme, type PrimaryLevel } from "@/lib/api";
import { AdminPanel, EmptyState, LoadingState } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { ADMIN_PRIMARY_THEMES_QUERY_KEY, CreateThemeForm, LEVEL_OPTIONS } from "./theme-list";
import { PrimaryHeroImagePicker } from "./hero-image-picker";
import { builtInHeroForThemeName } from "@/lib/primary-hero-library";
import { cn } from "@/lib/utils";

const lines = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);

const PRESETS = {
  Farm: { primary: "#15803d", secondary: "#b45309", accent: "#ca8a04", surface: "#f0fdf4", text: "#14532d" },
  Jungle: { primary: "#047857", secondary: "#065f46", accent: "#854d0e", surface: "#ecfdf5", text: "#064e3b" },
  Nature: { primary: "#0f766e", secondary: "#115e59", accent: "#a16207", surface: "#f0fdfa", text: "#134e4a" },
  Space: { primary: "#1e3a8a", secondary: "#3b82f6", accent: "#6366f1", surface: "#eff6ff", text: "#1e1b4b" },
  School: { primary: "#1d4ed8", secondary: "#f59e0b", accent: "#10b981", surface: "#f8fafc", text: "#0f172a" },
  Home: { primary: "#b45309", secondary: "#db2777", accent: "#4f46e5", surface: "#fffbeb", text: "#451a03" },
  Festival: { primary: "#be123c", secondary: "#d97706", accent: "#701a75", surface: "#fff5f5", text: "#4c0519" },
  Transport: { primary: "#0369a1", secondary: "#475569", accent: "#ea580c", surface: "#f0f9ff", text: "#0c4a6e" },
  Minimal: { primary: "#0f172a", secondary: "#475569", accent: "#94a3b8", surface: "#f8fafc", text: "#0f172a" }
};

type VisualForm = {
  name: string; description: string; emoji: string; hero: string; background: string;
  illustrations: string; keywords: string; aliases: string;
  primary: string; secondary: string; accent: string; surface: string; text: string;
};

function formFromTheme(theme: PrimaryCurriculumTheme): VisualForm {
  return {
    name: theme.name, description: theme.description ?? "", emoji: theme.emoji ?? "",
    hero: theme.hero_image_url || builtInHeroForThemeName(theme.name).src, background: theme.background_image_url ?? "",
    illustrations: theme.illustration_pack.join("\n"), keywords: theme.keywords.join(", "), aliases: theme.aliases.join(", "),
    primary: theme.color_palette.primary ?? "#2563eb", secondary: theme.color_palette.secondary ?? "#8b5cf6",
    accent: theme.color_palette.accent ?? "#f59e0b", surface: theme.color_palette.surface ?? "#eff6ff",
    text: theme.color_palette.text ?? "#172554",
  };
}

export function ThemeEnginePanel({ schoolMode = false }: { schoolMode?: boolean } = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [level, setLevel] = useState<PrimaryLevel>("lkg");
  const [selectedId, setSelectedId] = useState("");
  const [view, setView] = useState<"topics" | "look">("topics");
  const [search, setSearch] = useState("");
  const [showCreateTheme, setShowCreateTheme] = useState(false);
  const [form, setForm] = useState<VisualForm | null>(null);
  const [topicName, setTopicName] = useState("");
  const [topicSubtheme, setTopicSubtheme] = useState("");
  const [editingTopicId, setEditingTopicId] = useState("");
  const [topicDraft, setTopicDraft] = useState({ name: "", subtheme: "", description: "", keywords: "", aliases: "" });
  const [busy, setBusy] = useState<string | null>(null);

  const themes = useQuery({
    queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY, level],
    queryFn: () => backendApi.adminPrimaryThemes(level),
  });
  const selected = useMemo(() => (themes.data ?? []).find((theme) => theme.id === selectedId) ?? null, [themes.data, selectedId]);

  useEffect(() => {
    const first = (themes.data ?? [])[0];
    if (!selectedId && first) setSelectedId(first.id);
  }, [themes.data, selectedId]);
  useEffect(() => { setForm(selected ? formFromTheme(selected) : null); }, [selected]);

  const visibleThemes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return themes.data ?? [];
    return (themes.data ?? []).filter((theme) =>
      [theme.name, theme.description, ...theme.keywords, ...theme.aliases].some((value) => value?.toLowerCase().includes(query))
    );
  }, [themes.data, search]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY] });
  }

  // ── Theme actions ─────────────────────────────────────────────────────────
  async function saveTheme(event: FormEvent) {
    event.preventDefault();
    if (!selected || !form) return;
    setBusy("save");
    try {
      const target = schoolMode && selected.scope === "platform"
        ? await backendApi.adminCustomizePrimaryTheme(selected.id)
        : selected;
      await backendApi.adminUpdatePrimaryTheme(target.id, {
        name: form.name.trim(), description: form.description.trim() || null, emoji: form.emoji.trim() || null,
        hero_image_url: form.hero, background_image_url: form.background.trim() || null,
        illustration_pack: lines(form.illustrations), keywords: lines(form.keywords), aliases: lines(form.aliases),
        color_palette: { primary: form.primary, secondary: form.secondary, accent: form.accent, surface: form.surface, text: form.text },
      });
      await refresh();
      setSelectedId(target.id);
      toast({ title: "Theme saved", description: "The teacher dashboard updates from this configuration." });
    } catch (error) {
      toast({ title: "Couldn't save theme", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(null); }
  }

  async function duplicateTheme() {
    if (!selected) return;
    setBusy("duplicate");
    try {
      const copy = await backendApi.adminDuplicatePrimaryTheme(selected.id);
      await refresh(); setSelectedId(copy.id);
      toast({ title: "Theme duplicated", description: "Visual settings and topics were copied; lesson content stays independent." });
    } catch (error) { toast({ title: "Couldn't duplicate theme", description: getErrorMessage(error, "Try again."), variant: "error" }); }
    finally { setBusy(null); }
  }

  async function archiveTheme() {
    if (!selected || !window.confirm(`Archive ${selected.name}? Teachers will no longer be able to select it.`)) return;
    if (schoolMode && selected.scope === "platform") {
      toast({ title: "Master theme is read-only", description: "Customize it for your school before archiving it.", variant: "error" });
      return;
    }
    setBusy("archive");
    try {
      await backendApi.adminArchivePrimaryTheme(selected.id); setSelectedId(""); await refresh();
      toast({ title: "Theme archived" });
    } catch (error) { toast({ title: "Couldn't archive theme", description: getErrorMessage(error, "Try again."), variant: "error" }); }
    finally { setBusy(null); }
  }

  async function deleteTheme() {
    if (!selected || !window.confirm(`Permanently delete ${selected.name}? This only succeeds when it has no lesson history.`)) return;
    if (schoolMode && selected.scope === "platform") {
      toast({ title: "Master theme is read-only", description: "TeachPad master content cannot be deleted by a school.", variant: "error" });
      return;
    }
    setBusy("delete");
    try {
      await backendApi.adminDeletePrimaryTheme(selected.id); setSelectedId(""); await refresh();
      toast({ title: "Theme deleted permanently" });
    } catch (error) {
      toast({ title: "Couldn't delete theme", description: getErrorMessage(error, "Archive themes that already have lesson history."), variant: "error" });
    } finally { setBusy(null); }
  }

  // ── Topic actions ─────────────────────────────────────────────────────────
  async function addTopic(event: FormEvent) {
    event.preventDefault();
    if (!selected || !topicName.trim()) return;
    setBusy("topic");
    try {
      await backendApi.adminCreatePrimaryTopic(selected.id, {
        name: topicName.trim(), subtheme: topicSubtheme.trim() || null,
        description: null, position: selected.topics.length,
        keywords: [], aliases: [], is_active: true,
      });
      setTopicName(""); setTopicSubtheme(""); await refresh(); toast({ title: "Topic added" });
    } catch (error) { toast({ title: "Couldn't add topic", description: getErrorMessage(error, "Try again."), variant: "error" }); }
    finally { setBusy(null); }
  }

  async function handleMoveTopic(topic: any, direction: "up" | "down") {
    if (!selected) return;
    const currentPos = topic.position || 0;
    const targetPos = direction === "up" ? currentPos - 1 : currentPos + 1;
    if (targetPos < 0 || targetPos >= selected.topics.length) return;
    const swapTarget = selected.topics.find((t: any) => t.position === targetPos);
    setBusy("topic-move");
    try {
      if (swapTarget) await backendApi.adminUpdatePrimaryTopic(swapTarget.id, { position: currentPos });
      await backendApi.adminUpdatePrimaryTopic(topic.id, { position: targetPos });
      await refresh();
      toast({ title: "Topic reordered" });
    } catch (error) {
      toast({ title: "Couldn't reorder topic", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(null); }
  }

  function startEditingTopic(topic: PrimaryCurriculumTheme["topics"][number]) {
    setEditingTopicId(topic.id);
    setTopicDraft({
      name: topic.name,
      subtheme: topic.subtheme ?? "",
      description: topic.description ?? "",
      keywords: topic.keywords.join(", "),
      aliases: topic.aliases.join(", "),
    });
  }

  async function saveTopic(id: string) {
    if (!topicDraft.name.trim()) return;
    setBusy(id);
    try {
      await backendApi.adminUpdatePrimaryTopic(id, {
        name: topicDraft.name.trim(),
        subtheme: topicDraft.subtheme.trim() || null,
        description: topicDraft.description.trim() || null,
        keywords: lines(topicDraft.keywords),
        aliases: lines(topicDraft.aliases),
      });
      setEditingTopicId("");
      await refresh();
      toast({ title: "Topic updated" });
    } catch (error) {
      toast({ title: "Couldn't update topic", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(null); }
  }

  async function archiveTopic(id: string) {
    setBusy(id);
    try { await backendApi.adminArchivePrimaryTopic(id); await refresh(); toast({ title: "Topic archived" }); }
    catch (error) { toast({ title: "Couldn't archive topic", description: getErrorMessage(error, "Try again."), variant: "error" }); }
    finally { setBusy(null); }
  }

  async function restoreTopic(id: string) {
    setBusy(id);
    try {
      await backendApi.adminUpdatePrimaryTopic(id, { is_active: true });
      await refresh();
      toast({ title: "Topic restored" });
    } catch (error) {
      toast({ title: "Couldn't restore topic", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(null); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
      {/* Left: theme library */}
      <AdminPanel
        title="1. Pick a theme"
        description="Each theme gets its own topics and classroom look."
        contentClassName="p-0"
        actions={
          <div className="flex gap-2">
            <Select value={level} onChange={(event) => { setLevel(event.target.value as PrimaryLevel); setSelectedId(""); }} className="w-28">
              {LEVEL_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateTheme((value) => !value)}>
              {showCreateTheme ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreateTheme ? "Close" : "New theme"}
            </Button>
          </div>
        }
      >
        {showCreateTheme ? (
          <div className="border-b border-gray-100 bg-gray-50 p-4">
            <CreateThemeForm
              onCreated={(created) => {
                setShowCreateTheme(false);
                setSelectedId(created.id);
                setView("topics");
              }}
              onCancel={() => setShowCreateTheme(false)}
            />
          </div>
        ) : null}

        <div className="border-b border-gray-100 p-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search themes" className="pl-9" />
          </label>
        </div>

        {themes.isLoading ? <div className="p-4"><LoadingState label="Loading themes" /></div> : null}
        {!themes.isLoading && !(themes.data ?? []).length ? (
          <div className="p-4"><EmptyState title="No themes yet" description="Click 'New theme' above to create the first one." /></div>
        ) : null}
        {!themes.isLoading && (themes.data ?? []).length > 0 && !visibleThemes.length ? (
          <div className="p-4"><EmptyState title="No matching themes" description="Try another search term." /></div>
        ) : null}

        <ul className="max-h-[560px] divide-y divide-gray-100 overflow-y-auto">
          {visibleThemes.map((theme) => {
            const activeTopics = theme.topics.filter((topic) => topic.is_active).length;
            return (
              <li
                key={theme.id}
                className={cn(
                  "flex items-center justify-between gap-2 transition-colors hover:bg-blue-50/40",
                  selectedId === theme.id && "bg-blue-50"
                )}
              >
                <button type="button" onClick={() => setSelectedId(theme.id)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left">
                  <span className="text-xl">{theme.emoji || "🎨"}</span>
                  <span className="min-w-0">
                    <b className="block truncate text-sm text-gray-900">{theme.name}</b>
                    <small className="text-xs text-gray-500">{activeTopics} active topic{activeTopics === 1 ? "" : "s"}</small>
                  </span>
                </button>
                {selectedId === theme.id ? <Check className="mr-4 h-4 w-4 shrink-0 text-teachpad-blue" /> : null}
              </li>
            );
          })}
        </ul>
      </AdminPanel>

      {/* Right: selected theme workbench */}
      {!selected || !form ? (
        <AdminPanel><EmptyState title="Select a theme" description="Choose a theme from the library to add topics and design its look." /></AdminPanel>
      ) : (
        <div className="space-y-6">
          <AdminPanel
            title={`${selected.emoji || "🎨"} ${selected.name}`}
            description={`Class ${LEVEL_OPTIONS.find((item) => item.value === level)?.label ?? level} · presentation only, lesson content is separate`}
            actions={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={duplicateTheme} disabled={!!busy}><Plus className="h-4 w-4" />Duplicate</Button>
                <Button size="sm" variant="ghost" onClick={archiveTheme} disabled={!!busy}><Archive className="h-4 w-4" />Archive</Button>
                <Button size="sm" variant="ghost" onClick={deleteTheme} disabled={!!busy}><Trash2 className="h-4 w-4" />Delete</Button>
              </div>
            }
          >
            {/* Tabs */}
            <div className="-mt-2 mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {([["topics", "Topics & Lessons"], ["look", "Look & Feel"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 transition",
                    view === id ? "bg-white text-teachpad-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === "topics" ? (
              <div className="space-y-4">
                <form onSubmit={addTopic} className="space-y-2">
                  <Input
                    value={topicName}
                    onChange={(event) => setTopicName(event.target.value)}
                    placeholder="Topic, e.g. Cow · Road Safety · Rainy Season"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={topicSubtheme}
                      onChange={(event) => setTopicSubtheme(event.target.value)}
                      placeholder="Sub theme (weekly focus), e.g. Farm Animals"
                    />
                    <Button type="submit" disabled={!topicName.trim() || !!busy}>
                      {busy === "topic" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add topic
                    </Button>
                  </div>
                </form>

                {!selected.topics.length ? (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                    No topics yet. Add the first one above — each topic can later get its own lesson per class.
                  </p>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  {selected.topics.map((topic) => (
                    editingTopicId === topic.id ? (
                      <div key={topic.id} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                        <Field label="Topic name"><Input value={topicDraft.name} onChange={(event) => setTopicDraft({ ...topicDraft, name: event.target.value })} /></Field>
                        <Field label="Sub theme (weekly focus)"><Input value={topicDraft.subtheme} onChange={(event) => setTopicDraft({ ...topicDraft, subtheme: event.target.value })} placeholder="e.g. Farm Animals" /></Field>
                        <Field label="Description"><Textarea rows={2} value={topicDraft.description} onChange={(event) => setTopicDraft({ ...topicDraft, description: event.target.value })} /></Field>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Keywords"><Input value={topicDraft.keywords} onChange={(event) => setTopicDraft({ ...topicDraft, keywords: event.target.value })} /></Field>
                          <Field label="Aliases"><Input value={topicDraft.aliases} onChange={(event) => setTopicDraft({ ...topicDraft, aliases: event.target.value })} /></Field>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={() => void saveTopic(topic.id)} disabled={!topicDraft.name.trim() || busy === topic.id}>
                            <Save className="h-4 w-4" />{busy === topic.id ? "Saving…" : "Save topic"}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTopicId("")}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div key={topic.id} className={cn("flex items-start justify-between gap-2 rounded-xl border px-4 py-3", topic.is_active ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-70")}>
                        <span className="min-w-0">
                          <b className="block truncate text-sm text-gray-900">
                            {topic.name}
                            {topic.is_active && topic.subtheme ? (
                              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-teachpad-blue">
                                Sub: {topic.subtheme}
                              </span>
                            ) : null}
                          </b>
                          <small className="mt-0.5 block truncate text-xs text-gray-500">
                            {topic.is_active ? (topic.description || `Position ${topic.position + 1}`) : "Archived — hidden from teachers"}
                          </small>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          <button type="button" disabled={topic.position === 0} onClick={() => void handleMoveTopic(topic, "up")} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30" title="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button type="button" disabled={topic.position === selected.topics.length - 1} onClick={() => void handleMoveTopic(topic, "down")} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30" title="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => startEditingTopic(topic)} className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-teachpad-blue" aria-label={`Edit ${topic.name}`}><Pencil className="h-4 w-4" /></button>
                          {topic.is_active ? (
                            <button type="button" onClick={() => void archiveTopic(topic.id)} className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Archive ${topic.name}`}>
                              {busy === topic.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                            </button>
                          ) : (
                            <button type="button" onClick={() => void restoreTopic(topic.id)} className="rounded-lg p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600" aria-label={`Restore ${topic.name}`}>
                              {busy === topic.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            </button>
                          )}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={saveTheme} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                  <Field label="Emoji / icon"><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🐄" /></Field>
                  <Field label="Short description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                </div>

                <PrimaryHeroImagePicker value={form.hero} onChange={(hero) => setForm({ ...form, hero })} />

                <div>
                  <span className="text-sm font-semibold text-slate-900">Colour preset</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(PRESETS).map(([key, palette]) => {
                      const activePreset = ["primary", "secondary", "accent", "surface", "text"].every((k) => form[k as keyof VisualForm] === palette[k as keyof typeof palette]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, ...palette })}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition",
                            activePreset ? "border-blue-400 bg-blue-50 text-teachpad-blue" : "border-gray-200 bg-white text-slate-600 hover:border-blue-200"
                          )}
                        >
                          <span className="flex -space-x-1">
                            {(["primary", "secondary", "accent"] as const).map((k) => (
                              <span key={k} className="h-4 w-4 rounded-full border border-white" style={{ backgroundColor: palette[k] }} />
                            ))}
                          </span>
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {(["primary", "secondary", "accent", "surface", "text"] as const).map((key) => (
                    <Field key={key} label={key}>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-gray-200" />
                        <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                      </div>
                    </Field>
                  ))}
                </div>

                <Field label="Keywords (comma separated)">
                  <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="farm, animals" />
                </Field>
                <Field label="Aliases (comma separated)">
                  <Input value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} placeholder="farmyard, animal kingdom" />
                </Field>

                <details className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-600 select-none">Advanced artwork (optional)</summary>
                  <div className="mt-3 space-y-4">
                    <Field label="Background artwork URL">
                      <Input value={form.background} onChange={(e) => setForm({ ...form, background: e.target.value })} placeholder="Optional secondary background URL" />
                    </Field>
                    <Field label="Illustration pack (one URL per line)">
                      <Textarea rows={3} value={form.illustrations} onChange={(e) => setForm({ ...form, illustrations: e.target.value })} />
                    </Field>
                  </div>
                </details>

                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                  <Button type="submit" disabled={!!busy}><Save className="h-4 w-4" />{busy === "save" ? "Saving…" : "Save theme look"}</Button>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500"><Sparkles className="h-3.5 w-3.5 text-teachpad-blue" />Teachers see this look on the classroom dashboard.</span>
                </div>
              </form>
            )}
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
