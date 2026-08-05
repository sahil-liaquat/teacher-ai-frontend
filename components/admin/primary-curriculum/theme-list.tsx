"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { backendApi, type PrimaryCurriculumTheme, type PrimaryLevel } from "@/lib/api";
import { AdminPanel, EmptyState, LoadingState, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { builtInHeroForThemeName, DEFAULT_PRIMARY_HERO_URL } from "@/lib/primary-hero-library";
import { PrimaryHeroImagePicker } from "./hero-image-picker";

export const LEVEL_OPTIONS: { value: PrimaryLevel; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "lkg", label: "LKG" },
  { value: "ukg", label: "UKG" },
  { value: "class_1", label: "Class 1" },
  { value: "class_2", label: "Class 2" },
  { value: "class_3", label: "Class 3" },
  { value: "class_4", label: "Class 4" },
  { value: "class_5", label: "Class 5" },
];

export const ADMIN_PRIMARY_THEMES_QUERY_KEY = "admin-primary-themes";

const emptyThemeForm = { name: "", description: "" };

export function CreateThemeForm({
  onCreated,
  onCancel,
}: {
  onCreated: (theme: PrimaryCurriculumTheme) => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [themeForm, setThemeForm] = useState(emptyThemeForm);
  const [heroImage, setHeroImage] = useState(DEFAULT_PRIMARY_HERO_URL);
  const [heroTouched, setHeroTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!heroTouched) setHeroImage(builtInHeroForThemeName(themeForm.name).src);
  }, [heroTouched, themeForm.name]);

  async function createTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const created = await backendApi.adminCreatePrimaryTheme({
        name: themeForm.name.trim(),
        emoji: null,
        description: themeForm.description.trim() || null,
        hero_image_url: heroImage,
      });
      await queryClient.invalidateQueries({ queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY] });
      toast({ title: "Theme created", description: `"${created.name}" is ready — add topics and dashboard visuals next.` });
      onCreated(created);
    } catch (error) {
      toast({ title: "Couldn't create theme", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={createTheme} className="space-y-3">
      <Field label="Name">
        <Input
          value={themeForm.name}
          onChange={(event) => setThemeForm({ ...themeForm, name: event.target.value })}
          placeholder="My Family"
          required
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={themeForm.description}
          onChange={(event) => setThemeForm({ ...themeForm, description: event.target.value })}
          placeholder="Optional — shown to teachers browsing themes."
          rows={2}
        />
      </Field>
      <PrimaryHeroImagePicker
        value={heroImage}
        onChange={(value) => {
          setHeroTouched(true);
          setHeroImage(value);
        }}
        compact
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={creating || !themeForm.name.trim()}>
          <Sparkles className="h-4 w-4" />
          {creating ? "Creating..." : "Create theme"}
        </Button>
        {onCancel ? <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  );
}

export function ThemeList({
  level,
  onLevelChange,
  selectedThemeId,
  onSelect,
}: {
  level: PrimaryLevel;
  onLevelChange: (level: PrimaryLevel) => void;
  selectedThemeId?: string;
  onSelect: (theme: PrimaryCurriculumTheme | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTheme, setShowNewTheme] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteTheme(event: React.MouseEvent, theme: PrimaryCurriculumTheme) {
    event.stopPropagation();
    if (!window.confirm(`Permanently delete ${theme.name}? This only succeeds when it has no lesson history.`)) return;
    setDeletingId(theme.id);
    try {
      await backendApi.adminDeletePrimaryTheme(theme.id);
      await queryClient.invalidateQueries({ queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY] });
      toast({ title: "Theme deleted permanently" });
      if (selectedThemeId === theme.id) {
        onSelect(null);
      }
    } catch (error) {
      toast({
        title: "Couldn't delete theme",
        description: getErrorMessage(error, "Archive themes that already have lesson history."),
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const themes = useQuery({
    queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY, level],
    queryFn: () => backendApi.adminPrimaryThemes(level),
  });

  const items = themes.data ?? [];
  const needsContent = items.filter((theme) => !theme.has_published_lesson).length;
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((theme) => [theme.name, theme.description, ...theme.keywords, ...theme.aliases]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [items, search]);

  // Keep the parent's selected theme fresh after topics or visuals are edited
  // elsewhere. Storing the original object left the lesson editor with an old
  // topics array even though React Query had fetched the updated theme.
  useEffect(() => {
    if (!selectedThemeId) return;
    const fresh = items.find((theme) => theme.id === selectedThemeId);
    if (fresh) onSelect(fresh);
  }, [items, onSelect, selectedThemeId]);

  return (
    <AdminPanel
      title="1. Choose class & theme"
      description="The class controls lesson difficulty. Themes control the classroom presentation."
      actions={
        <Select
          value={level}
          onChange={(event) => onLevelChange(event.target.value as PrimaryLevel)}
          className="w-full sm:w-40"
        >
          {LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      }
      contentClassName="p-0"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold text-gray-500">
          {items.length} theme{items.length === 1 ? "" : "s"} · {needsContent} need{needsContent === 1 ? "s" : ""} content
        </p>
        <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewTheme((value) => !value)}>
          {showNewTheme ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showNewTheme ? "Cancel" : "New theme"}
        </Button>
      </div>

      {showNewTheme ? (
        <div className="border-b border-gray-100 bg-gray-50 p-4">
          <CreateThemeForm
            onCreated={(created) => {
              setShowNewTheme(false);
              onSelect(created);
            }}
          />
        </div>
      ) : null}

      <div className="border-b border-gray-100 p-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search themes"
            className="pl-9"
          />
        </label>
      </div>

      {themes.isLoading ? <div className="p-6"><LoadingState label="Loading themes" /></div> : null}
      {!themes.isLoading && !items.length ? (
        <div className="p-6"><EmptyState title="No themes yet" description="Create one above to get started." /></div>
      ) : null}
      {!themes.isLoading && items.length > 0 && !visibleItems.length ? (
        <div className="p-6"><EmptyState title="No matching themes" description="Try another search term." /></div>
      ) : null}

      <ul className="max-h-[620px] divide-y divide-gray-100 overflow-y-auto">
        {visibleItems.map((theme) => (
          <li
            key={theme.id}
            className={cn(
              "flex items-center justify-between gap-2 transition-colors hover:bg-blue-50/40",
              selectedThemeId === theme.id && "bg-blue-50"
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(theme)}
              className="flex-1 min-w-0 px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-semibold text-gray-900">
                  {theme.emoji ? <span aria-hidden="true">{theme.emoji}</span> : null}
                  {theme.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {theme.topics.filter((topic) => topic.is_active).length} topic{theme.topics.filter((topic) => topic.is_active).length === 1 ? "" : "s"}
                </p>
              </div>
            </button>
            <div className="flex items-center gap-2 pr-4 shrink-0">
              <StatusPill status={theme.has_published_lesson ? "success" : "warning"}>
                {theme.has_published_lesson ? "Published" : "Needs content"}
              </StatusPill>
              <button
                type="button"
                onClick={(e) => void deleteTheme(e, theme)}
                disabled={deletingId === theme.id}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-40"
                title="Delete theme"
                aria-label={`Delete ${theme.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </AdminPanel>
  );
}
