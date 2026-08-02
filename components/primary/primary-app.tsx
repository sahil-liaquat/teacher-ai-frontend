"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronDown, ClipboardCheck, FileText,
  Search, Sparkles, BarChart3, NotebookPen, Puzzle, CircleHelp, Download, Eye, X, Pencil,
} from "lucide-react";
import { type PrimaryResource } from "@/lib/primary-resource-catalog";
import { usePrimaryActivityHistory, useTrackActivity } from "@/lib/primary-activity";
import { useSavedResourceIds, useToggleSavePrimaryResource } from "@/lib/primary-saved-resources";
import { usePrimaryResources, USE_BACKEND_CATALOGUE } from "@/lib/use-primary-resources";
import { PRIMARY_LEVELS, PRIMARY_LANGUAGES, generatorHref, quickIdeaText, themeContent, themesForSubject, subjectsForClass, skillsForContext, type QuickIdeaKind } from "@/lib/primary-theme-content";
import { PrimaryTeachingContextProvider, usePrimaryTeachingContext, type PrimaryTeachingContext } from "@/lib/primary-teaching-context";
import { cn } from "@/lib/utils";

export type PrimaryPage = "home" | "today" | "library" | "create" | "saved" | "settings";

import PrimaryHomePage from "./pages/primary-home-page";
import PrimaryTodayPage from "./pages/primary-today-page";
import PrimaryLibraryPage from "./pages/primary-library-page";
import PrimaryCreatePage from "./pages/primary-create-page";
import PrimarySavedPage from "./pages/primary-saved-page";
import PrimarySettingsPage from "./pages/primary-settings-page";

// Sidebar/topbar chrome for /primary/* comes from <AppShell> (components/app-shell.tsx),
// which wraps every page via app/primary/layout.tsx — this component only owns page content.
const title: Record<PrimaryPage, [string, string]> = {
  home: ["Let’s make today wonderful! 💜", "Plan, teach and inspire young minds with NEP 2020 aligned resources."],
  today: ["Today’s Schedule ☀️", "Track your daily teaching plan and activities."],
  library: ["Resource Library 📚", "Explore and search educational activities and worksheets."],
  create: ["Creative Studio ✨", "Design custom worksheets, stories, and class resources."],
  saved: ["Saved Content ❤️", "Your personal workspace of bookmarked files and generated kits."],
  settings: ["Settings ⚙️", "Configure your Primary Teaching context and preferences."],
};

export function PrimaryApp({ page }: { page: PrimaryPage }) {
  return <PrimaryTeachingContextProvider><PrimaryAppContent page={page} /></PrimaryTeachingContextProvider>;
}

function PrimaryAppContent({ page }: { page: PrimaryPage }) {
  const [toast, setToast] = useState("");
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  return <>
    <div className="primary-shell min-h-screen text-teachpad-ink">
    <main className="primary-main min-h-screen p-4 lg:p-7">
      {page !== "home" && page !== "today" && (
        <section className="primary-hero relative overflow-hidden px-1 pt-4 lg:px-2">
          <Link href="/primary" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold shadow-sm ring-1 ring-[#eeeeff] hover:text-[#6e41f5]"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
          <div className="relative z-10 mt-3 max-w-2xl">
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-[38px]">{title[page][0]}</h1>
            <p className="mt-2 text-sm font-medium text-[#29317c]">{title[page][1]}</p>
          </div>
          <Image src="/assets/sidebar-mascot.png" alt="Elif, your teaching companion" width={310} height={510} className="primary-hero-elif pointer-events-none absolute right-12 top-[-42px] hidden h-[280px] w-auto object-contain lg:block" priority />
        </section>
      )}

      {page === "home" && <PrimaryHomePage notify={notify} />}
      {page === "today" && <PrimaryTodayPage notify={notify} />}
      {page === "library" && <PrimaryLibraryPage Resources={Resources} notify={notify} />}
      {page === "create" && <PrimaryCreatePage AiStudio={AiStudio} notify={notify} />}
      {page === "saved" && <PrimarySavedPage Resources={Resources} notify={notify} />}
      {page === "settings" && <PrimarySettingsPage />}
    </main>
    {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#17206a] px-5 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
    </div>
  </>;
}


export function TopicBar({ action = "Change Topic", href, notify }: { action?: string; href?: string; notify?: (message: string) => void }) {
  const { context, updateContext, syncStatus, retrySync } = usePrimaryTeachingContext();
  const [draft, setDraft] = useState<PrimaryTeachingContext>(context);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (!editing) setDraft(context);
  }, [context, editing]);
  
  const themeOptions = useMemo(() => {
    const themes = themesForSubject(draft.subject);
    return themes.includes(draft.theme ?? "") ? themes : [draft.theme ?? "", ...themes].filter(Boolean);
  }, [draft.subject, draft.theme]);

  const skillOptions = useMemo(() => {
    return skillsForContext(draft.level, draft.subject, draft.theme);
  }, [draft.level, draft.subject, draft.theme]);

  const onLevelChange = (level: string) => {
    const validSubjects = subjectsForClass(level);
    const subject = validSubjects.includes(draft.subject) ? draft.subject : validSubjects[0];
    const themes = themesForSubject(subject);
    const theme = themes[0];
    setDraft({
      ...draft,
      level: level as any,
      subject,
      theme,
      topic: theme,
      skill: undefined
    });
  };

  const onSubjectChange = (subject: string) => {
    const themes = themesForSubject(subject);
    const theme = themes[0];
    setDraft({
      ...draft,
      subject,
      theme,
      topic: theme,
      skill: undefined
    });
  };

  const onThemeChange = (theme: string) => {
    setDraft({
      ...draft,
      theme,
      topic: theme,
      skill: undefined
    });
  };

  const save = async () => {
    setSaving(true);
    const synced = await updateContext({
      level: draft.level,
      subject: draft.subject.trim() || context.subject,
      theme: draft.theme || context.theme,
      topic: draft.topic || draft.theme || context.topic,
      skill: draft.skill || undefined,
      language: draft.language,
    });
    setSaving(false);
    setEditing(false);
    notify?.(synced ? "Teaching context saved — all Primary pages updated" : "Teaching context saved on this device — sign in to sync it");
  };

  const buttonClass = "rounded-xl border border-blue-100 bg-white px-5 py-3 text-sm font-bold text-[#3b82f6]";
  const selectClass = "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
  
  return <div className="primary-card mt-7 p-5">{editing ? <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="grid gap-3 md:grid-cols-5 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] md:items-end"><label className="text-xs font-bold text-slate-600">Class<select value={draft.level} onChange={(event) => onLevelChange(event.target.value)} className={selectClass}>{PRIMARY_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Learning Area<select value={draft.subject} onChange={(event) => onSubjectChange(event.target.value)} className={selectClass}>{subjectsForClass(draft.level).map((subject: string) => <option key={subject} value={subject}>{subject}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Theme<select value={draft.theme ?? ""} onChange={(event) => onThemeChange(event.target.value)} className={selectClass}>{themeOptions.map((theme) => <option key={theme} value={theme}>{theme}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Focus Skill<select value={draft.skill ?? ""} onChange={(event) => setDraft({ ...draft, skill: event.target.value || undefined })} className={selectClass}><option value="">All Skills</option>{skillOptions.map((skill: string) => <option key={skill} value={skill}>{skill}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Language<select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value as PrimaryTeachingContext["language"] })} className={selectClass}>{PRIMARY_LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}</select></label><div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-xl bg-[#3b82f6] px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : "Save"}</button><button type="button" disabled={saving} onClick={() => { setDraft(context); setEditing(false); }} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-60">Cancel</button></div></form> : <div className="grid gap-4 md:grid-cols-5 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] md:items-center"><Topic icon="🎓" label="Class" value={context.level} onClick={() => setEditing(true)} /><Topic icon="📖" label="Learning Area" value={context.subject} onClick={() => setEditing(true)} /><Topic icon="🌿" label="Theme" value={context.theme ?? "—"} onClick={() => setEditing(true)} /><Topic icon="🎯" label="Focus Skill" value={context.skill ?? "All Skills"} onClick={() => setEditing(true)} /><Topic icon="🌐" label="Language" value={context.language} onClick={() => setEditing(true)} /><div className="flex flex-wrap items-center gap-2">{syncStatus === "syncing" && <span className="text-xs font-semibold text-slate-500 animate-pulse mr-2">Saving</span>}{syncStatus === "synced" && <span className="text-xs font-semibold text-emerald-600 mr-2">Saved</span>}{syncStatus === "unsynced" && <span className="text-xs font-semibold text-rose-600 mr-2">Not synced — <button type="button" onClick={() => void retrySync()} className="underline font-bold hover:text-rose-800">Retry</button></span>}<button type="button" onClick={() => setEditing(true)} className={buttonClass}>Change context <span aria-hidden="true">✎</span></button>{href && <Link href={href} className={buttonClass}>{action} <ArrowRight className="inline h-4 w-4" /></Link>}</div></div>}</div>;
}
function Topic({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick?: () => void }) {
  const content = <><span className="text-3xl">{icon}</span><span className="min-w-0 text-left"><small className="block text-[11px] text-[#5c6399]">{label}</small><b className="block truncate">{value}</b></span>{onClick && <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[#633df4]" />}</>;
  return onClick ? <button type="button" onClick={onClick} className="flex min-w-0 items-center gap-3 border-r border-[#eceaff] pr-3 text-left transition hover:text-[#633df4] last:border-0" aria-label={`Change ${label}`}>{content}</button> : <div className="flex min-w-0 items-center gap-3 border-r border-[#eceaff] pr-3 last:border-0">{content}</div>;
}
function PrimaryTabs({ labels, active, onChange }: { labels: string[]; active?: string; onChange?: (label: string) => void }) { const [internalActive, setInternalActive] = useState(labels[0]); const current = active ?? internalActive; return <div className="primary-card mt-5 flex gap-2 overflow-x-auto p-2" role="tablist">{labels.map((label) => <button key={label} onClick={() => { setInternalActive(label); onChange?.(label); }} role="tab" aria-selected={current === label} className={cn("whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold", current === label ? "bg-blue-50 text-[#2563eb] shadow-sm" : "text-slate-600")}>{label}</button>)}</div> }
function SectionCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) { return <section className={cn("primary-card p-5", className)}>{title && <h2 className="mb-4 text-lg font-extrabold">{title}</h2>}{children}</section> }
function ActionButton({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) { const c = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-[#0969e8]"; return href ? <Link href={href} className={c}>{children}<ArrowRight className="h-4 w-4" /></Link> : <button onClick={onClick} className={c}>{children}<ArrowRight className="h-4 w-4" /></button> }


const RESOURCE_TABS = ["All Resources", "Worksheets", "Colouring Pages", "Tracing Sheets", "Matching Activities", "Flashcards", "Picture Talk Cards", "Story Cards", "Vocabulary Cards", "Circle Time Prompts", "Calendar Activities"];
const resourceCategorySlug = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const PAGE_SIZE = 24;

export function Resources({
  notify,
  resourceCategory,
  isSavedDefault,
  hideCategoryTabs,
}: {
  notify: (s: string) => void;
  resourceCategory?: string;
  isSavedDefault?: boolean;
  /** Suppress the inline category tab-switcher — used when a parent page (e.g. the
   * Library's category/type drill-down) already owns navigation via breadcrumbs. */
  hideCategoryTabs?: boolean;
}) {
  const { context, updateContext } = usePrimaryTeachingContext();
  const router = useRouter();
  const track = useTrackActivity();
  const content = useMemo(() => themeContent(context.theme, context.subject), [context.theme, context.subject]);
  const searchParams = useSearchParams();
  const isSavedView = isSavedDefault || searchParams.get("view") === "saved";
  const initialCategory = RESOURCE_TABS.find((category) => resourceCategorySlug(category) === resourceCategory) ?? "All Resources";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const query = searchInput.trim().toLowerCase();
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [matchTopic, setMatchTopic] = useState(true);
  const [matchSubject, setMatchSubject] = useState(false);
  const [matchLevel, setMatchLevel] = useState(false);
  const [matchLanguage, setMatchLanguage] = useState(false);
  const [previewResource, setPreviewResource] = useState<PrimaryResource | null>(null);
  const isCategoryPage = Boolean(resourceCategory && initialCategory !== "All Resources");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const saved = useSavedResourceIds();
  const { save, unsave } = useToggleSavePrimaryResource();
  const pendingResourceId = save.isPending ? save.variables : unsave.isPending ? unsave.variables : null;

  const customizeWithAI = (resource: PrimaryResource) => {
    void updateContext({
      subject: resource.subjects[0] ?? context.subject,
      theme: resource.themes[0] ?? context.theme,
      level: (resource.levels[0] as PrimaryTeachingContext["level"] | undefined) ?? context.level,
    });
    track("resource", resource.id, "edited");
    notify(`Opening Create Studio to customize “${resource.title}” ✨`);
    router.push("/primary/create");
  };

  const toggleSave = (resource: PrimaryResource) => {
    const wasSaved = saved.ids.has(resource.id);
    const onError = () => notify(wasSaved ? `Couldn't remove “${resource.title}” from saved resources.` : `Couldn't save “${resource.title}”. Please try again.`);
    if (wasSaved) {
      unsave.mutate(resource.id, { onError });
    } else {
      save.mutate(resource.id, { onError });
    }
  };

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [query, activeCategory, matchTopic, matchSubject, matchLevel, matchLanguage]);

  const filters = useMemo(() => {
    return {
      search: query || undefined,
      category: activeCategory || undefined,
      subject: matchSubject ? context.subject : undefined,
      theme: matchTopic ? context.theme : undefined,
      level: matchLevel ? context.level : undefined,
      language: matchLanguage ? context.language : undefined,
      isSavedView,
      savedIds: saved.ids,
    };
  }, [query, activeCategory, matchSubject, context.subject, matchTopic, context.theme, matchLevel, context.level, matchLanguage, context.language, isSavedView, saved.ids]);

  const {
    resources: visible,
    total,
    isLoading: catalogLoading,
    isError: catalogError,
    hasMore,
    fetchNextPage,
    refetch: refetchCatalog,
    unresolvedIds,
  } = usePrimaryResources(filters);

  useEffect(() => {
    if (unresolvedIds.length > 0) {
      console.warn(`[Saved Resources Audit] Found ${unresolvedIds.length} saved resource IDs that are missing from the current catalog: ${unresolvedIds.join(", ")}`);
    }
  }, [unresolvedIds]);

  const displayed = useMemo(() => {
    return USE_BACKEND_CATALOGUE ? visible : visible.slice(0, visibleLimit);
  }, [visible, visibleLimit]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          if (USE_BACKEND_CATALOGUE) {
            if (hasMore) {
              fetchNextPage();
            }
          } else {
            setVisibleLimit((current) => (current < visible.length ? Math.min(current + PAGE_SIZE, visible.length) : current));
          }
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible.length, hasMore, fetchNextPage]);

  if (catalogLoading) {
    return (
      <>
        <TopicBar notify={notify} />
        <div className="mt-5">
          <SectionCard title={isSavedView ? "Saved Resources" : "Resources"}>
            <div className="rounded-2xl bg-[#f7f4ff] p-10 text-center text-sm font-medium text-[#454c86]">
              {isSavedView ? "Loading your saved resources…" : "Loading resources from catalogue…"}
            </div>
          </SectionCard>
        </div>
      </>
    );
  }

  if (catalogError) {
    return (
      <>
        <TopicBar notify={notify} />
        <div className="mt-5">
          <SectionCard title={isSavedView ? "Saved Resources" : "Resources"}>
            <div className="rounded-2xl bg-[#f7f4ff] p-10 text-center">
              <p className="text-base font-extrabold text-[#2f377e]">
                {isSavedView ? "Couldn't load your saved resources" : "Couldn't load resources from catalogue"}
              </p>
              <button
                type="button"
                onClick={() => refetchCatalog()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1677ff] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200"
              >
                Try again
              </button>
            </div>
          </SectionCard>
        </div>
      </>
    );
  }

  const heading = isSavedView
    ? `Saved Resources (${total})`
    : query
      ? `Search results for “${searchParams.get("search")}” (${total})`
      : `${matchTopic ? `Resources for ${context.theme}` : activeCategory} (${total})`;

  return (
    <>
      <TopicBar notify={notify} />
      <div className="mt-5">
        {!hideCategoryTabs && (
          <nav className="primary-card flex gap-2 overflow-x-auto p-2" aria-label="Resource categories">
            {RESOURCE_TABS.map((category) => (
              <Link
                key={category}
                href={category === "All Resources" ? "/primary/resource-library" : `/primary/resource-library/${resourceCategorySlug(category)}`}
                onClick={() => setActiveCategory(category)}
                className={cn("whitespace-nowrap rounded-xl px-4 py-3 text-xs font-bold", activeCategory === category ? "bg-blue-50 text-[#2563eb] shadow-sm" : "text-slate-600")}
              >
                {category}
              </Link>
            ))}
          </nav>
        )}
        <div className={cn("flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-[#e8e7fb]", !hideCategoryTabs && "mt-3")}>
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={isSavedView ? "Search your saved resources…" : `Search ${activeCategory === "All Resources" ? "resources" : activeCategory.toLowerCase()}…`}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            aria-label="Search resources"
          />
          {searchInput && (
            <button type="button" onClick={() => setSearchInput("")} className="shrink-0 text-xs font-bold text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[["🎓", context.level], ["📖", context.subject], ["🌿", context.theme ?? "—"], ["🌐", context.language]].map(([icon, value]) => (
            <span key={value} className="rounded-full bg-[#f0ecff] px-3 py-2 text-xs font-bold text-[#633df4]">{icon} {value}</span>
          ))}
          <button type="button" onClick={() => setMatchTopic((current) => !current)} className={cn("rounded-full px-3 py-2 text-xs font-bold transition", matchTopic ? "bg-[#1677ff] text-white" : "bg-white text-[#454c86] ring-1 ring-[#e8e7fb]")}>
            🎯 Only {context.theme} matches
          </button>
          <button type="button" onClick={() => setMatchSubject((current) => !current)} className={cn("rounded-full px-3 py-2 text-xs font-bold transition", matchSubject ? "bg-[#1677ff] text-white" : "bg-white text-[#454c86] ring-1 ring-[#e8e7fb]")}>
            📖 Only {context.subject}
          </button>
          <button type="button" onClick={() => setMatchLevel((current) => !current)} className={cn("rounded-full px-3 py-2 text-xs font-bold transition", matchLevel ? "bg-[#1677ff] text-white" : "bg-white text-[#454c86] ring-1 ring-[#e8e7fb]")}>
            🎓 Only {context.level}
          </button>
          <button type="button" onClick={() => setMatchLanguage((current) => !current)} className={cn("rounded-full px-3 py-2 text-xs font-bold transition", matchLanguage ? "bg-[#1677ff] text-white" : "bg-white text-[#454c86] ring-1 ring-[#e8e7fb]")}>
            🌐 Only {context.language}
          </button>
        </div>
        {isCategoryPage && (
          <p className="mt-4 text-sm font-medium text-[#454c86]">
            {total} resources in <b>{activeCategory}</b> — showing {USE_BACKEND_CATALOGUE ? `the first ${displayed.length}` : (visibleLimit >= total ? "all of them" : `the first ${visibleLimit}`)}.
          </p>
        )}
        <SectionCard title={heading} className="mt-4">
          {total ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {displayed.map((resource, index) => (
                  <article key={resource.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#e8e7fb] bg-white hover:border-[#bca5ff]">
                    <button
                      type="button"
                      onClick={() => { setPreviewResource(resource); track("resource", resource.id, "viewed"); }}
                      aria-label={`Preview ${resource.title}`}
                      className={cn("relative grid h-44 w-full place-items-center overflow-hidden", index % 3 === 0 ? "bg-[#fff4f8]" : index % 3 === 1 ? "bg-[#eef9ff]" : "bg-[#f8f4df]")}
                    >
                      {resource.fileType === "pdf" ? (
                        <FileText className="h-14 w-14 text-[#663df5]" aria-label="PDF resource" />
                      ) : (
                        <Image src={resource.thumbnailUrl ?? resource.fileUrl} alt={`${resource.title} preview`} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw" className="object-contain" loading="lazy" />
                      )}
                    </button>
                    <div className="flex flex-1 flex-col p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold leading-snug text-slate-900">{resource.title}</h3>
                        <span className="shrink-0 rounded-md bg-[#f1f3ff] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#6a72a8]">{resource.fileType}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-[#454c86]">{resource.category}</p>
                      {(resource.themes.length || resource.skills.length) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {resource.themes.slice(0, 2).map((theme) => <span key={theme} className="rounded-full bg-[#eef9ff] px-2 py-0.5 text-[9px] font-bold text-[#1677ff]">{theme}</span>)}
                          {resource.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-[#f7f1ff] px-2 py-0.5 text-[9px] font-bold text-[#8b5cf6]">{skill}</span>)}
                        </div>
                      )}
                      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3">
                        <button type="button" onClick={() => { setPreviewResource(resource); track("resource", resource.id, "viewed"); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#454c86] hover:underline">
                          <Eye className="h-3 w-3" /> Preview
                        </button>
                        <a href={resource.fileUrl} download onClick={() => { track("resource", resource.id, "downloaded"); notify(`${resource.title} download started`); }} className="text-[11px] font-bold text-[#1677ff] hover:underline">Download</a>
                        <button type="button" onClick={() => customizeWithAI(resource)} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9333ea] hover:underline">
                          <Sparkles className="h-3 w-3" /> Customize with AI
                        </button>
                        <button
                          type="button"
                          disabled={pendingResourceId === resource.id}
                          onClick={() => toggleSave(resource)}
                          aria-label={saved.ids.has(resource.id) ? `Remove ${resource.title} from saved resources` : `Save ${resource.title}`}
                          className={cn(
                            "ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition",
                            saved.ids.has(resource.id) ? "bg-[#e4f8ec] text-[#0b8a4c]" : "bg-white text-[#454c86] ring-1 ring-[#e8e7fb] hover:bg-[#f7f4ff]",
                            pendingResourceId === resource.id && "cursor-wait opacity-60",
                          )}
                        >
                          {pendingResourceId === resource.id ? "Saving…" : saved.ids.has(resource.id) ? "✓ Saved" : "Save"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {((USE_BACKEND_CATALOGUE && hasMore) || (!USE_BACKEND_CATALOGUE && visibleLimit < total)) && (
                <>
                  <div ref={sentinelRef} aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => {
                      if (USE_BACKEND_CATALOGUE) {
                        fetchNextPage();
                      } else {
                        setVisibleLimit((current) => Math.min(current + PAGE_SIZE, total));
                      }
                    }}
                    className="mt-6 block w-full rounded-xl border border-[#d9dcf5] bg-white px-4 py-3 text-sm font-bold text-[#454c86] hover:bg-[#f7f4ff]"
                  >
                    Load {USE_BACKEND_CATALOGUE ? "more" : `${Math.min(PAGE_SIZE, total - visibleLimit)} more (${total - visibleLimit} remaining)`}
                  </button>
                </>
              )}
            </>
          ) : isSavedView && saved.ids.size === 0 ? (
            <div className="rounded-2xl bg-[#f7f4ff] p-10 text-center">
              <p className="text-base font-extrabold text-[#2f377e]">You have not saved any resources yet.</p>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#454c86]">Save worksheets, flashcards and activities to find them here.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#f7f4ff] p-8 text-center text-sm font-medium text-[#454c86]">{isSavedView ? "No saved resources match these filters. Try turning off the 🎯 or 📖 filter." : "No resources match these filters. Try turning off the 🎯 or 📖 filter."}</div>
          )}
          {isSavedView && unresolvedIds.length > 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d9dcf5] p-5 bg-[#faf9ff]">
              <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Unavailable Saved Items ({unresolvedIds.length})</h4>
              <p className="text-xs text-slate-500 mb-3">These resources are no longer in the catalog and can be removed:</p>
              <div className="flex flex-wrap gap-2">
                {unresolvedIds.map((id) => (
                  <div key={id} className="flex items-center gap-2 rounded-lg bg-white border border-[#e8e7fb] px-2.5 py-1.5 text-xs text-slate-700 shadow-sm">
                    <span className="font-mono text-[10px] text-slate-500">{id}</span>
                    <button
                      type="button"
                      disabled={pendingResourceId === id}
                      onClick={() => unsave.mutate(id, { onError: () => notify(`Couldn't remove missing resource ${id}`) })}
                      className="text-[#1677ff] hover:text-red-600 font-bold hover:underline ml-1"
                    >
                      {pendingResourceId === id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {previewResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview of ${previewResource.title}`}
          onClick={() => setPreviewResource(null)}
        >
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black text-slate-900">{previewResource.title}</h3>
                <p className="text-[11px] font-bold text-[#454c86]">{previewResource.category}</p>
              </div>
              <button type="button" onClick={() => setPreviewResource(null)} aria-label="Close preview" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative flex-1 overflow-auto bg-[#f7f4ff] p-6">
              {previewResource.fileType === "pdf" ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <FileText className="h-16 w-16 text-[#663df5]" />
                  <p className="text-sm font-bold text-[#454c86]">PDF preview opens in a new tab.</p>
                  <a href={previewResource.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#1677ff] px-4 py-2 text-xs font-bold text-white shadow-sm">Open PDF</a>
                </div>
              ) : (
                <div className="relative mx-auto h-[55vh] max-w-full">
                  <Image src={previewResource.thumbnailUrl ?? previewResource.fileUrl} alt={`${previewResource.title} full preview`} fill sizes="90vw" className="object-contain" />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-4">
              <a href={previewResource.fileUrl} download onClick={() => { track("resource", previewResource.id, "downloaded"); notify(`${previewResource.title} download started`); }} className="rounded-xl bg-[#1677ff] px-4 py-2 text-xs font-bold text-white shadow-sm">Download</a>
              <button type="button" onClick={() => { customizeWithAI(previewResource); setPreviewResource(null); }} className="inline-flex items-center gap-1.5 rounded-xl bg-[#9333ea] px-4 py-2 text-xs font-bold text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Customize with AI
              </button>
              <button type="button" onClick={() => toggleSave(previewResource)} className="ml-auto rounded-xl border border-[#e8e7fb] bg-white px-4 py-2 text-xs font-bold text-[#454c86] hover:bg-[#f7f4ff]">
                {saved.ids.has(previewResource.id) ? "✓ Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AiStudio({ notify }: { notify: (s: string) => void }) {
  const { context } = usePrimaryTeachingContext();
  const track = useTrackActivity();
  const content = useMemo(() => themeContent(context.theme, context.subject), [context.theme, context.subject]);
  const { events } = usePrimaryActivityHistory(100);
  // One card per tool that actually exists. Dropped in Phase 0:
  //   "Generate Quiz"            → /primary/assessment, a route that never existed (hard 404)
  //   "Generate Story"           → duplicate link to /dashboard/activity-generator
  //   "Generate Classroom Games" → duplicate link to /dashboard/activity-generator
  const options = [["Generate Lesson Plan", "Create detailed, NEP 2020 aligned lesson plans.", ClipboardCheck, generatorHref("/dashboard/lesson-plans/new", context)], ["Generate Worksheet", "Create engaging worksheets in seconds.", Pencil, generatorHref("/dashboard/worksheets/new", context)], ["Generate Activity", "Fun classroom activities for every learning objective.", Puzzle, "/dashboard/activity-generator"], ["Generate Teaching Notes", "Quick notes, key points and teaching tips.", NotebookPen, "/dashboard/notes-generator"], ["Generate Presentation", "Beautiful slides for your lessons in seconds.", BarChart3, "/dashboard/presentation-generator"]] as const;
  const ideas = [
    ["warmup", "🎵", "Suggest a warm-up"],
    ["activity", "🧩", "Suggest a classroom activity"],
    ["oral", "🗣️", "Suggest an oral assessment"],
    ["homework", "✏️", "Suggest homework"],
    ["movement", "🏃", "Suggest a movement break"],
  ] as const;
  const [selectedIdea, setSelectedIdea] = useState<string>("");
  const [reply, setReply] = useState("");
  const creationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      if (event.entity_type !== "ai_creation") continue;
      const label = event.entity_id.trim() || "AI Creation";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [events]);
  const runIdea = (kind: string) => {
    setSelectedIdea(kind);
    setReply(quickIdeaText(kind as QuickIdeaKind, content, context));
  };
  return <div className="mt-9 space-y-5"><SectionCard title="Choose what you want to create ✨"><p className="-mt-3 mb-4 rounded-xl bg-white px-4 py-3 text-xs font-bold text-[#633df4] ring-1 ring-[#eeeaff]">Creating for: 🎓 {context.level} · 📖 {context.subject} · 🌿 {context.theme} · 🌐 {context.language}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{options.map(([name, description, Icon, href]) => <Link key={name} href={href} onClick={() => track("ai_creation", name, "created")} className="primary-tool-card p-5 text-center"><span className="relative z-10 mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#eef6ff] text-[#3b82f6] shadow-[0_14px_30px_rgba(59,130,246,.24),inset_0_1px_0_rgba(255,255,255,.92)] ring-1 ring-blue-100"><Icon className="h-8 w-8" /></span><b className="relative z-10 mt-4 block text-sm text-slate-900">{name}</b><p className="relative z-10 mt-2 text-[11px] leading-4 text-slate-600">{description}</p><ArrowRight className="relative z-10 mx-auto mt-3 h-5 w-5 text-[#3b82f6]" /></Link>)}</div></SectionCard><section className="rounded-2xl bg-gradient-to-r from-[#eff6ff] to-white p-5"><b className="text-lg">Quick Teaching Ideas 💡</b><p className="mt-1 text-xs">Based on your selected class and theme</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{ideas.map(([kind, emoji, label]) => <button key={kind} onClick={() => runIdea(kind)} className={cn("rounded-xl px-3 py-2.5 text-xs font-bold transition", selectedIdea === kind ? "bg-[#1677ff] text-white shadow-md" : "bg-white text-[#3b82f6] ring-1 ring-blue-100 hover:bg-[#f0f7ff]")}>{emoji} {label}</button>)}</div>{reply && <p role="status" className="mt-3 whitespace-pre-line rounded-xl bg-white/80 p-3 text-xs leading-5 text-[#303777]">{reply}</p>}</section></div>;
}
