"use client";

import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, X } from "lucide-react";
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

const emptyThemeForm = { name: "", subject: "", language: "English", emoji: "", description: "" };

export function ThemeList({
  level,
  onLevelChange,
  selectedThemeId,
  onSelect,
}: {
  level: PrimaryLevel;
  onLevelChange: (level: PrimaryLevel) => void;
  selectedThemeId?: string;
  onSelect: (theme: PrimaryCurriculumTheme) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewTheme, setShowNewTheme] = useState(false);
  const [themeForm, setThemeForm] = useState(emptyThemeForm);
  const [creating, setCreating] = useState(false);

  const themes = useQuery({
    queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY, level],
    queryFn: () => backendApi.adminPrimaryThemes(level),
  });

  const items = themes.data ?? [];
  const needsContent = items.filter((theme) => !theme.has_published_lesson).length;

  async function createTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const created = await backendApi.adminCreatePrimaryTheme({
        name: themeForm.name.trim(),
        subject: themeForm.subject.trim(),
        language: themeForm.language.trim() || "English",
        emoji: themeForm.emoji.trim() || null,
        description: themeForm.description.trim() || null,
      });
      setThemeForm(emptyThemeForm);
      setShowNewTheme(false);
      toast({ title: "Theme created", description: `"${created.name}" is ready — add a lesson for it below.` });
      queryClient.invalidateQueries({ queryKey: [ADMIN_PRIMARY_THEMES_QUERY_KEY] });
    } catch (error) {
      toast({ title: "Couldn't create theme", description: getErrorMessage(error, "Try again."), variant: "error" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <AdminPanel
      title="Themes"
      description="Pick a level, then a theme, to author or edit its lesson."
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
        <form onSubmit={createTheme} className="space-y-3 border-b border-gray-100 bg-gray-50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={themeForm.name}
                onChange={(event) => setThemeForm({ ...themeForm, name: event.target.value })}
                placeholder="My Family"
                required
              />
            </Field>
            <Field label="Subject">
              <Input
                value={themeForm.subject}
                onChange={(event) => setThemeForm({ ...themeForm, subject: event.target.value })}
                placeholder="EVS"
                required
              />
            </Field>
            <Field label="Language">
              <Input
                value={themeForm.language}
                onChange={(event) => setThemeForm({ ...themeForm, language: event.target.value })}
                placeholder="English"
              />
            </Field>
            <Field label="Emoji">
              <Input
                value={themeForm.emoji}
                onChange={(event) => setThemeForm({ ...themeForm, emoji: event.target.value })}
                placeholder="👨‍👩‍👧"
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={themeForm.description}
              onChange={(event) => setThemeForm({ ...themeForm, description: event.target.value })}
              placeholder="Optional — shown to teachers browsing themes."
              rows={2}
            />
          </Field>
          <Button type="submit" size="sm" disabled={creating || !themeForm.name.trim() || !themeForm.subject.trim()}>
            <Sparkles className="h-4 w-4" />
            {creating ? "Creating..." : "Create theme"}
          </Button>
        </form>
      ) : null}

      {themes.isLoading ? <div className="p-6"><LoadingState label="Loading themes" /></div> : null}
      {!themes.isLoading && !items.length ? (
        <div className="p-6"><EmptyState title="No themes yet" description="Create one above to get started." /></div>
      ) : null}

      <ul className="divide-y divide-gray-100">
        {items.map((theme) => (
          <li key={theme.id}>
            <button
              type="button"
              onClick={() => onSelect(theme)}
              className={cn(
                "flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-blue-50/60",
                selectedThemeId === theme.id && "bg-blue-50"
              )}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-semibold text-gray-900">
                  {theme.emoji ? <span aria-hidden="true">{theme.emoji}</span> : null}
                  {theme.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{theme.subject} · {theme.language}</p>
              </div>
              <StatusPill status={theme.has_published_lesson ? "success" : "warning"}>
                {theme.has_published_lesson ? "Published" : "Needs content"}
              </StatusPill>
            </button>
          </li>
        ))}
      </ul>
    </AdminPanel>
  );
}
