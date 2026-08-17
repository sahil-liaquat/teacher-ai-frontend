"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Layers, MoreHorizontal, Palette, Plus, Search, Trash2 } from "lucide-react";
import { backendApi, type PrimaryAcademicYear, type PrimaryCurriculumLesson, type PrimaryCurriculumTheme, type PrimaryCurriculumTopic } from "@/lib/api";
import { curriculumHref, monthLabel } from "@/lib/school-admin-curriculum";
import { defaultLevel, useSchoolLevels } from "@/lib/use-school-levels";
import { useCurriculumContext } from "@/lib/use-curriculum-context";
import { ownershipLabel, ownershipOf, themeLessons } from "@/lib/school-admin-support";
import { primaryThemeVisuals } from "@/lib/primary-theme-engine";
import { builtInHeroForThemeName } from "@/lib/primary-hero-library";
import { PrimaryHeroImagePicker } from "@/components/shared/primary-hero-image-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ActionDialog, ConfirmDialog } from "@/components/school-admin/shared/action-dialog";
import { PageError, PageHeading, SchoolAdminPage } from "@/components/school-admin/shared/page-primitives";
import { SectionSubnav } from "@/components/school-admin/shared/section-subnav";
import { getErrorMessage } from "@/lib/errors";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";
import { cn } from "@/lib/utils";

type ConfirmAction = { kind: "customize" | "archive" | "delete"; theme: PrimaryCurriculumTheme } | null;

export function ThemesWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);
  const { curriculumLevels, labelFor: levelLabel } = useSchoolLevels();
  const level = params.get("level") ?? defaultLevel(curriculumLevels);
  // ⚠ Labels come from the programme definition, not from literals. A
  // subject-based programme renders "Subjects" here through this same code.
  const { vocabulary } = useCurriculumContext(level);
  const nodeLabel = vocabulary.labelFor(vocabulary.nodes[0]?.key ?? "theme");
  const childLabel = vocabulary.labelFor(vocabulary.nodes[1]?.key ?? "topic");
  const selectedId = params.get("theme");

  const years = useQuery<PrimaryAcademicYear[]>({ queryKey: ["school-admin", "academic-years"], queryFn: backendApi.schoolAdminAcademicYears });
  const yearId = years.data?.find((year) => year.is_active)?.id ?? years.data?.[0]?.id ?? "";
  const themes = useQuery<PrimaryCurriculumTheme[]>({ queryKey: ["school-admin", "themes", level], queryFn: () => backendApi.schoolAdminThemes(level) });
  const lessons = useQuery<PrimaryCurriculumLesson[]>({
    queryKey: ["school-admin", "lessons", yearId, level],
    queryFn: () => backendApi.schoolAdminCurriculum({ academic_year_id: yearId, level }),
    enabled: Boolean(yearId),
  });
  const visible = useMemo(() => (themes.data ?? []).filter((theme) => theme.is_active && (!search || `${theme.name} ${theme.description ?? ""}`.toLowerCase().includes(search.toLowerCase()))), [search, themes.data]);
  const selected = themes.data?.find((theme) => theme.id === selectedId);

  function updateUrl(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) value ? next.set(key, value) : next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["school-admin", "themes"] });
    await queryClient.invalidateQueries({ queryKey: ["school-admin", "lessons"] });
  }

  async function runConfirmed() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === "customize") {
        const copy = await backendApi.schoolAdminCustomizeTheme(confirm.theme.id);
        await refresh();
        updateUrl({ theme: copy.id });
        toast({ title: "School copy created", description: "You can now edit the topics without changing TeachPad's master theme." });
      } else if (confirm.kind === "archive") {
        await backendApi.schoolAdminArchiveTheme(confirm.theme.id);
        await refresh();
        updateUrl({ theme: null });
        toast({ title: "Theme archived" });
      } else {
        await backendApi.schoolAdminDeleteTheme(confirm.theme.id);
        await refresh();
        updateUrl({ theme: null });
        toast({ title: "Unused theme deleted" });
      }
      setConfirm(null);
    } catch (error: any) {
      toast({ title: "The theme could not be changed", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally { setBusy(false); }
  }

  if (selected) return <ThemeDetail theme={selected} lessons={themeLessons(selected, lessons.data ?? [])} yearId={yearId} level={level} onBack={() => updateUrl({ theme: null })} onRefresh={refresh} onConfirm={setConfirm} confirm={confirm} busy={busy} runConfirmed={runConfirmed} />;

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <PageHeading eyebrow="Curriculum" title="Structure" description={`The ${nodeLabel.toLowerCase()}s and ${childLabel.toLowerCase()} sequences your school curriculum is built from.`} actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create {nodeLabel.toLowerCase()}</Button>} />
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><span className="sr-only">Search {nodeLabel.toLowerCase()}s</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${nodeLabel.toLowerCase()}s`} className="h-11 pl-9" /></label>
        <label className="relative sm:w-48"><span className="sr-only">Level</span><select value={level} onChange={(event) => updateUrl({ level: event.target.value, theme: null })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold">{curriculumLevels.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      {themes.isError || lessons.isError || years.isError ? <PageError description="Themes and their curriculum usage could not be loaded." onRetry={() => { void themes.refetch(); void lessons.refetch(); void years.refetch(); }} /> : themes.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-64 rounded-3xl" />)}</div> : visible.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((theme) => <ThemeCard key={theme.id} theme={theme} count={themeLessons(theme, lessons.data ?? []).length} onOpen={() => updateUrl({ theme: theme.id })} onConfirm={setConfirm} onDuplicate={async () => {
            try { const copy = await backendApi.schoolAdminDuplicateTheme(theme.id); await refresh(); updateUrl({ theme: copy.id }); } catch (error: any) { toast({ title: "Could not duplicate theme", description: getErrorMessage(error, "Try again."), variant: "error" }); }
          }} />)}
        </div>
      ) : <EmptyThemes filtered={Boolean(search)} onCreate={() => setCreateOpen(true)} />}
      <CreateThemeDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={async (theme) => { await refresh(); updateUrl({ theme: theme.id }); }} />
      <ConfirmDialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open) setConfirm(null); }} busy={busy} onConfirm={runConfirmed}
        title={confirm?.kind === "customize" ? "Create a school copy?" : confirm?.kind === "delete" ? "Delete this unused theme?" : "Archive this theme?"}
        description={confirm?.kind === "customize" ? "TeachPad's master stays unchanged. Your school gets an editable copy of the theme and its topics." : confirm?.kind === "delete" ? "This permanently removes the theme. Themes with lesson history can only be archived." : "The theme will leave active planning lists, while existing curriculum history remains available."}
        confirmLabel={confirm?.kind === "customize" ? "Create school copy" : confirm?.kind === "delete" ? "Delete theme" : "Archive theme"} destructive={confirm?.kind !== "customize"} />
    </SchoolAdminPage>
  );
}

function ThemeCard({ theme, count, onOpen, onConfirm, onDuplicate }: { theme: PrimaryCurriculumTheme; count: number; onOpen: () => void; onConfirm: (action: ConfirmAction) => void; onDuplicate: () => void }) {
  const ownership = ownershipOf(theme);
  // Same resolver the teacher classroom uses: explicit hero_image_url, then the
  // built-in library matched on theme name, then the default. Master themes and
  // school copies both carry hero_image_url, so both resolve identically.
  const { heroImage } = primaryThemeVisuals(theme);
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* The gradient stays underneath: if the image 404s the band still reads
          as a header rather than collapsing to a white gap. */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-blue-50 via-violet-50 to-amber-50 p-5">{heroImage ? <img src={heroImage} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : null}<span className="relative text-4xl drop-shadow-[0_1px_2px_rgba(15,23,42,0.35)]" aria-hidden="true">{theme.emoji || "🎨"}</span><span className={cn("absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", ownership === "teachpad" ? "bg-white text-blue-700" : ownership === "customized" ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700")}>{ownershipLabel(ownership)}</span></div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{theme.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{theme.description || "A curriculum theme ready for topic planning."}</p></div>
          <ActionMenu label={`Actions for ${theme.name}`}>{ownership === "teachpad" ? <ActionMenuItem onSelect={() => onConfirm({ kind: "customize", theme })}>Customize</ActionMenuItem> : <><ActionMenuItem onSelect={onDuplicate}>Duplicate</ActionMenuItem><ActionMenuItem destructive onSelect={() => onConfirm({ kind: count ? "archive" : "delete", theme })}>{count ? "Archive" : "Delete"}</ActionMenuItem></>}</ActionMenu>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs font-semibold text-slate-500">{theme.topics.filter((topic) => topic.is_active).length} topics · {count ? `${count} ${count === 1 ? "day" : "days"}` : "Not used"}</span><Button variant="outline" size="sm" onClick={onOpen}>Open</Button></div>
      </div>
    </article>
  );
}

function ThemeDetail({ theme, lessons, yearId, level, onBack, onRefresh, onConfirm, confirm, busy, runConfirmed }: { theme: PrimaryCurriculumTheme; lessons: PrimaryCurriculumLesson[]; yearId: string; level: string; onBack: () => void; onRefresh: () => Promise<void>; onConfirm: (action: ConfirmAction) => void; confirm: ConfirmAction; busy: boolean; runConfirmed: () => Promise<void> }) {
  const { toast } = useToast();
  const { labelFor: levelLabel } = useSchoolLevels();
  const [newTopic, setNewTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const schoolOwned = theme.scope === "school";
  const topics = (theme.topics ?? []).filter((topic) => topic.is_active).slice().sort((a, b) => a.position - b.position);
  // Theme → [Sub-theme] → Topic. A sub-theme is simply a topic other topics
  // point at, so a theme with no nesting renders as a flat list and invents
  // nothing: "Plants → Parts of a Plant" and "Animals → Farm Animals → Cow"
  // are the same data shape at different depths.
  const childrenOf = useMemo(() => {
    const map = new Map<string, PrimaryCurriculumTopic[]>();
    for (const topic of topics) {
      if (!topic.parent_topic_id) continue;
      map.set(topic.parent_topic_id, [...(map.get(topic.parent_topic_id) ?? []), topic]);
    }
    return map;
  }, [topics]);
  const roots = useMemo(() => topics.filter((topic) => !topic.parent_topic_id), [topics]);
  const [subthemeFor, setSubthemeFor] = useState<PrimaryCurriculumTopic | null>(null);
  const [childName, setChildName] = useState("");
  const usage = useMemo(() => {
    const map = new Map<number, PrimaryCurriculumLesson[]>();
    for (const lesson of lessons) if (lesson.month) map.set(lesson.month, [...(map.get(lesson.month) ?? []), lesson]);
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [lessons]);

  async function addTopic() {
    if (!newTopic.trim()) return;
    setSaving(true);
    try { await backendApi.schoolAdminCreateTopic(theme.id, { name: newTopic.trim(), parent_topic_id: null, subtheme: null, description: null, position: roots.length, keywords: [], aliases: [], is_active: true }); setNewTopic(""); await onRefresh(); }
    catch (error: any) { toast({ title: "Could not add topic", description: getErrorMessage(error, "Try a different name."), variant: "error" }); } finally { setSaving(false); }
  }

  // Nesting a topic under an existing one turns that one into a sub-theme.
  // The service caps the tree at one level, so its 400 is the explanation.
  async function addTopicUnder(parent: PrimaryCurriculumTopic) {
    if (!childName.trim()) return;
    setSaving(true);
    try {
      await backendApi.schoolAdminCreateTopic(theme.id, { name: childName.trim(), parent_topic_id: parent.id, subtheme: null, description: null, position: (childrenOf.get(parent.id) ?? []).length, keywords: [], aliases: [], is_active: true });
      setChildName(""); setSubthemeFor(null); await onRefresh();
    } catch (error: any) { toast({ title: "Could not add topic", description: getErrorMessage(error, "Try a different name."), variant: "error" }); }
    finally { setSaving(false); }
  }

  async function moveTopic(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= topics.length) return;
    try { await Promise.all([backendApi.schoolAdminUpdateTopic(topics[index].id, { position: target }), backendApi.schoolAdminUpdateTopic(topics[target].id, { position: index })]); await onRefresh(); }
    catch (error: any) { toast({ title: "Could not reorder topics", description: getErrorMessage(error, "Try again."), variant: "error" }); }
  }

  return (
    <SchoolAdminPage>
      <SectionSubnav />
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> All themes</button>
      <PageHeading eyebrow={`${ownershipLabel(ownershipOf(theme))} Theme ➔ Sub-theme ➔ Topic flow`} title={`${theme.emoji || "🎨"} ${theme.name}`} description={theme.description || `Topic sequence and curriculum use for ${levelLabel(level)}.`} actions={schoolOwned ? <Button variant="outline" onClick={() => onConfirm({ kind: "archive", theme })}>Archive theme</Button> : <Button onClick={() => onConfirm({ kind: "customize", theme })}>Customize for your school</Button>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-950">Topic sequence</h2><p className="mt-1 text-sm text-slate-500">The order teachers encounter within this theme.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{topics.length} topics</span></div>
          <div className="mt-5 space-y-2">{roots.length ? roots.map((topic, index) => { const children = childrenOf.get(topic.id) ?? []; return <div key={topic.id} className="space-y-2">
            <TopicRow topic={topic} index={index} count={roots.length} editable={schoolOwned} onMove={moveTopic} onRefresh={onRefresh} isSubtheme={children.length > 0} onAddChild={schoolOwned ? () => { setSubthemeFor(topic); setChildName(""); } : undefined} />
            {children.length ? <div className="ml-9 space-y-2 border-l border-slate-200 pl-4">{children.slice().sort((a, b) => a.position - b.position).map((child, childIndex) => <TopicRow key={child.id} topic={child} index={childIndex} count={children.length} editable={schoolOwned} onMove={moveTopic} onRefresh={onRefresh} />)}</div> : null}
            {subthemeFor?.id === topic.id ? <div className="ml-9 flex gap-2 border-l border-slate-200 pl-4"><Input autoFocus value={childName} onChange={(event) => setChildName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addTopicUnder(topic); if (event.key === "Escape") setSubthemeFor(null); }} placeholder={`Topic under ${topic.name}`} /><Button size="sm" disabled={saving || !childName.trim()} onClick={() => void addTopicUnder(topic)}>Add</Button><Button size="sm" variant="outline" onClick={() => setSubthemeFor(null)}>Cancel</Button></div> : null}
          </div>; }) : <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">No topics yet.</div>}</div>
          {schoolOwned ? <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><Input value={newTopic} onChange={(event) => setNewTopic(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addTopic(); }} placeholder="Add a topic" /><Button disabled={saving || !newTopic.trim()} onClick={() => void addTopic()}><Plus className="h-4 w-4" /> Add</Button></div> : <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Create a school copy to add, rename, reorder, or archive topics.</p>}
        </section>
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold text-slate-950">Used in curriculum</h2><p className="mt-1 text-sm text-slate-500">{lessons.length ? `${lessons.length} teaching days in ${levelLabel(level)}` : `Not used in ${levelLabel(level)} yet`}</p><div className="mt-5 space-y-2">{usage.map(([month, monthLessons]) => <Link key={month} href={curriculumHref({ year: yearId, level, month })} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50/40"><span><span className="block text-sm font-semibold text-slate-900">{monthLabel(month)}</span><span className="text-xs text-slate-500">{monthLessons.length} teaching days</span></span><BookOpen className="h-4 w-4 text-blue-600" /></Link>)}{!usage.length ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center"><Palette className="mx-auto h-5 w-5 text-slate-400" /><p className="mt-2 text-sm text-slate-500">This theme is ready to use when planning a teaching day.</p><Link href={curriculumHref({ year: yearId, level })} className="mt-3 inline-block text-sm font-semibold text-blue-700">Open curriculum</Link></div> : null}</div></aside>
      </div>
      <ConfirmDialog open={Boolean(confirm)} onOpenChange={(open) => { if (!open) onConfirm(null); }} busy={busy} onConfirm={runConfirmed} title={confirm?.kind === "customize" ? "Create a school copy?" : "Archive this theme?"} description={confirm?.kind === "customize" ? "TeachPad's master stays unchanged. Your school gets an editable copy of the theme and its topics." : "Existing lesson history remains available, but the theme leaves active planning lists."} confirmLabel={confirm?.kind === "customize" ? "Create school copy" : "Archive theme"} destructive={confirm?.kind !== "customize"} />
    </SchoolAdminPage>
  );
}

function TopicRow({ topic, index, count, editable, onMove, onRefresh, isSubtheme = false, onAddChild }: { topic: PrimaryCurriculumTopic; index: number; count: number; editable: boolean; onMove: (index: number, direction: -1 | 1) => Promise<void>; onRefresh: () => Promise<void>; isSubtheme?: boolean; onAddChild?: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(topic.name);
  const [subtheme, setSubtheme] = useState(topic.subtheme || "");
  async function save() { if (!name.trim()) return; try { await backendApi.schoolAdminUpdateTopic(topic.id, { name: name.trim(), subtheme: subtheme.trim() || null }); setEditing(false); await onRefresh(); } catch (error: any) { toast({ title: "Could not update topic", description: getErrorMessage(error, "Try a different name."), variant: "error" }); } }
  async function archive() { try { await backendApi.schoolAdminArchiveTopic(topic.id); await onRefresh(); } catch (error: any) { toast({ title: "Could not archive topic", description: getErrorMessage(error, "Try again."), variant: "error" }); } }
  return <div className={cn("flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all", isSubtheme ? "bg-[#faf9fe] border-[#e9e6fd] hover:bg-[#f6f3fe]" : "bg-white border-slate-200")}><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold", isSubtheme ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500")}>{index + 1}</span>{isSubtheme ? <Layers className="h-4 w-4 text-violet-600 shrink-0" /> : null}{editing ? <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Topic name" className="flex-1" onKeyDown={(event) => { if (event.key === "Enter") void save(); if (event.key === "Escape") setEditing(false); }} /><Input value={subtheme} onChange={(event) => setSubtheme(event.target.value)} placeholder="Subtheme (optional)" className="w-full sm:w-48" onKeyDown={(event) => { if (event.key === "Enter") void save(); if (event.key === "Escape") setEditing(false); }} /><div className="flex gap-2"><Button size="sm" onClick={() => void save()}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div></div> : <><button type="button" disabled={!editable} onClick={() => { setEditing(true); setName(topic.name); setSubtheme(topic.subtheme || ""); }} className="min-w-0 flex-1 text-left text-sm font-semibold text-slate-900 disabled:cursor-default">{topic.name}{topic.subtheme ? <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">{topic.subtheme}</span> : null}{isSubtheme ? <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">Sub-theme</span> : null}</button>{editable ? <div className="flex items-center">{onAddChild ? <button type="button" aria-label={`Add a topic under ${topic.name}`} title="Add a topic under this one" onClick={onAddChild} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Plus className="h-4 w-4" /></button> : null}<button type="button" aria-label={`Move ${topic.name} up`} disabled={index === 0} onClick={() => void onMove(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg disabled:opacity-25 hover:bg-slate-100"><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label={`Move ${topic.name} down`} disabled={index === count - 1} onClick={() => void onMove(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg disabled:opacity-25 hover:bg-slate-100"><ArrowDown className="h-4 w-4" /></button><button type="button" aria-label={`Archive ${topic.name}`} onClick={() => void archive()} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div> : null}</>}</div>;
}

function AddInlineTopicForm({ onAdd, placeholder, size = "md" }: { onAdd: (name: string) => void; placeholder: string; size?: "sm" | "md" }) {
  const [val, setVal] = useState("");
  const handleSubmit = () => {
    if (!val.trim()) return;
    onAdd(val.trim());
    setVal("");
  };
  return (
    <div className="flex gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className={size === "sm" ? "h-8 text-xs flex-1" : "h-9 text-sm flex-1"}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        type="button"
        size="sm"
        className={size === "sm" ? "h-8 px-3 font-bold" : "h-9 px-4 font-bold"}
        onClick={handleSubmit}
        disabled={!val.trim()}
      >
        Add
      </Button>
    </div>
  );
}

interface ClientTopic {
  id: string;
  name: string;
}

interface ClientSubtheme {
  id: string;
  name: string;
  topics: ClientTopic[];
}

function CreateThemeDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (theme: PrimaryCurriculumTheme) => Promise<void> }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);
  
  const [subthemes, setSubthemes] = useState<ClientSubtheme[]>([]);
  const [standaloneTopics, setStandaloneTopics] = useState<ClientTopic[]>([]);

  const [hero, setHero] = useState("");
  const resolvedHero = hero || builtInHeroForThemeName(name).src;

  const addSubtheme = () => {
    setSubthemes([...subthemes, { id: Math.random().toString(36).substr(2, 9), name: "", topics: [] }]);
  };

  const updateSubthemeName = (id: string, nextName: string) => {
    setSubthemes(subthemes.map(s => s.id === id ? { ...s, name: nextName } : s));
  };

  const removeSubtheme = (id: string) => {
    setSubthemes(subthemes.filter(s => s.id !== id));
  };

  const addTopicToSubtheme = (subthemeId: string, topicName: string) => {
    if (!topicName.trim()) return;
    setSubthemes(subthemes.map(s => s.id === subthemeId ? {
      ...s,
      topics: [...s.topics, { id: Math.random().toString(36).substr(2, 9), name: topicName.trim() }]
    } : s));
  };

  const removeTopicFromSubtheme = (subthemeId: string, topicId: string) => {
    setSubthemes(subthemes.map(s => s.id === subthemeId ? {
      ...s,
      topics: s.topics.filter(t => t.id !== topicId)
    } : s));
  };

  const addStandaloneTopic = (topicName: string) => {
    if (!topicName.trim()) return;
    setStandaloneTopics([...standaloneTopics, { id: Math.random().toString(36).substr(2, 9), name: topicName.trim() }]);
  };

  const removeStandaloneTopic = (id: string) => {
    setStandaloneTopics(standaloneTopics.filter(t => t.id !== id));
  };

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    // ⚠ This is N+1 sequential writes with no transaction: one theme, then one
    // POST per standalone topic, per sub-theme and per nested topic. A failure
    // at write #4 leaves the theme and three topics already committed, and the
    // old catch reported "Could not create theme" — false, and it left the
    // admin with a half-built theme they were never told about.
    //
    // The theme is tracked separately from the topics so the recovery can be
    // honest: keep what exists, say exactly what did not get made, and still
    // navigate to the theme so the rest can be added by hand.
    let created: PrimaryCurriculumTheme | null = null;
    let topicsMade = 0;
    const topicsWanted =
      standaloneTopics.length +
      subthemes.length +
      subthemes.reduce((total, sub) => total + sub.topics.length, 0);
    try {
      const theme = await backendApi.schoolAdminCreateTheme({
        name: name.trim(),
        description: description.trim() || null,
        emoji: emoji.trim() || null,
        hero_image_url: resolvedHero,
      });
      created = theme;

      let position = 0;

      // 1. Create Standalone Topics
      for (const st of standaloneTopics) {
        await backendApi.schoolAdminCreateTopic(theme.id, {
          name: st.name.trim(),
          parent_topic_id: null,
          subtheme: null,
          description: null,
          position: position++,
          keywords: [],
          aliases: [],
          is_active: true
        });
        topicsMade += 1;
      }

      // 2. Create Sub-themes and nested Topics
      for (const sub of subthemes) {
        const parentTopic = await backendApi.schoolAdminCreateTopic(theme.id, {
          name: sub.name.trim() || "Untitled Sub-theme",
          parent_topic_id: null,
          subtheme: null,
          description: null,
          position: position++,
          keywords: [],
          aliases: [],
          is_active: true
        });
        topicsMade += 1;

        for (let childIndex = 0; childIndex < sub.topics.length; childIndex++) {
          const child = sub.topics[childIndex];
          await backendApi.schoolAdminCreateTopic(theme.id, {
            name: child.name.trim(),
            parent_topic_id: parentTopic.id,
            subtheme: parentTopic.name,
            description: null,
            position: childIndex,
            keywords: [],
            aliases: [],
            is_active: true
          });
          topicsMade += 1;
        }
      }

      onOpenChange(false);
      setName("");
      setDescription("");
      setEmoji("");
      setSubthemes([]);
      setStandaloneTopics([]);
      setHero("");
      await onCreated(theme);
    } catch (error: any) {
      if (created) {
        // The theme exists. Saying otherwise would send the admin to create a
        // duplicate; the topics are what is missing, so name that instead.
        await onCreated(created);
        onOpenChange(false);
        toast({
          title: `${created.name} was created, but not all of its topics`,
          description: `${topicsMade} of ${topicsWanted} topics were added. ${getErrorMessage(error, "Add the rest from the theme.")}`,
          variant: "error",
        });
      } else {
        toast({ title: "Could not create theme", description: getErrorMessage(error, "Check the name and try again."), variant: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create theme"
      description="Define the curriculum theme and build its Sub-theme and Topic structure side-by-side."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={busy || !name.trim()} onClick={() => void create()}>
            {busy ? "Creating…" : "Create theme"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Theme Details */}
        <div className="space-y-4 pr-2">
          <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-3">Theme Metadata</h4>
          <label className="block text-sm font-semibold text-slate-800">
            Theme name
            <Input
              autoFocus
              className="mt-2 font-semibold"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Growing and Changing"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Description <span className="font-normal text-slate-400">(optional)</span>
            <Textarea
              className="mt-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What children will explore"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-800">
            Icon <span className="font-normal text-slate-400">(optional emoji)</span>
            <Input
              className="mt-2"
              value={emoji}
              onChange={(event) => setEmoji(event.target.value)}
              placeholder="🌱"
              maxLength={8}
            />
          </label>
          <PrimaryHeroImagePicker
            value={resolvedHero}
            onChange={setHero}
            uploadHero={backendApi.schoolAdminUploadThemeHero}
            compact
          />
        </div>

        {/* Right Column: Subtheme & Topic Builder */}
        <div className="flex flex-col h-full min-h-[400px] md:border-l md:border-slate-100 md:pl-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Curriculum Flow</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Map the Theme ➔ Sub-theme ➔ Topic sequence.</p>
            </div>
            <Button type="button" size="sm" className="h-8 text-xs px-2.5 bg-violet-600 hover:bg-violet-700 font-bold" onClick={addSubtheme}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Sub-theme
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-4 pr-1">
            {/* Standalone Topics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Standalone Topics</h5>
              </div>

              <div className="space-y-2">
                {standaloneTopics.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800">
                    <span className="truncate">{t.name}</span>
                    <button type="button" onClick={() => removeStandaloneTopic(t.id)} className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}

                <AddInlineTopicForm onAdd={addStandaloneTopic} placeholder="Add a standalone topic..." />
              </div>
            </div>

            {/* Sub-themes and nested Topics */}
            {subthemes.map((sub, index) => (
              <div key={sub.id} className="rounded-2xl border border-[#e9e6fd] bg-[#faf9fe] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-violet-600 text-[10px] font-bold text-white shrink-0">{index + 1}</span>
                    <Input
                      value={sub.name}
                      onChange={(e) => updateSubthemeName(sub.id, e.target.value)}
                      placeholder="Sub-theme Name (e.g. Anatomy)"
                      className="h-8 text-xs font-bold bg-white border-slate-200"
                    />
                  </div>
                  <button type="button" onClick={() => removeSubtheme(sub.id)} className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-100/50 transition shrink-0"><Trash2 className="h-4 w-4" /></button>
                </div>

                <div className="ml-8 border-l border-slate-200 pl-4 space-y-2">
                  {sub.topics.map((child) => (
                    <div key={child.id} className="flex items-center justify-between gap-2 rounded-xl bg-white border border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                      <span className="truncate">{child.name}</span>
                      <button type="button" onClick={() => removeTopicFromSubtheme(sub.id, child.id)} className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}

                  <AddInlineTopicForm onAdd={(topicName) => addTopicToSubtheme(sub.id, topicName)} placeholder="Add topic under sub-theme..." size="sm" />
                </div>
              </div>
            ))}

            {subthemes.length === 0 && standaloneTopics.length === 0 && (
              <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 bg-slate-50/50">
                Build your curriculum hierarchy. Add sub-themes or standalone topics.
              </div>
            )}
          </div>
        </div>
      </div>
    </ActionDialog>
  );
}

function EmptyThemes({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Palette className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 text-lg font-semibold text-slate-950">{filtered ? "No matching themes" : "Create your first school theme"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{filtered ? "Try a different search." : "School themes sit alongside TeachPad's master themes and stay owned by your school."}</p>{!filtered ? <Button className="mt-5" onClick={onCreate}><Plus className="h-4 w-4" /> Create theme</Button> : null}</div>; }
