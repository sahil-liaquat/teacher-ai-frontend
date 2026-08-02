"use client";

import { useState } from "react";
import type { PrimaryCurriculumTheme, PrimaryLevel } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState } from "@/components/admin/admin-ui";
import { LessonEditor } from "@/components/admin/primary-curriculum/lesson-editor";
import { LEVEL_OPTIONS, ThemeList } from "@/components/admin/primary-curriculum/theme-list";

export default function AdminPrimaryCurriculumPage() {
  const [level, setLevel] = useState<PrimaryLevel>(LEVEL_OPTIONS[0].value);
  const [selectedTheme, setSelectedTheme] = useState<PrimaryCurriculumTheme | null>(null);

  return (
    <>
      <AdminPageHeader
        eyebrow="TeachPad Primary"
        title="Curriculum authoring"
        description="Author and edit the theme lessons Primary teachers get on their daily plan. Themes marked 'Needs content' have no published lesson at the selected level yet."
      />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
        <ThemeList
          level={level}
          onLevelChange={(nextLevel) => {
            setLevel(nextLevel);
            setSelectedTheme(null);
          }}
          selectedThemeId={selectedTheme?.id}
          onSelect={setSelectedTheme}
        />

        {selectedTheme ? (
          <LessonEditor key={`${selectedTheme.id}:${level}`} theme={selectedTheme} level={level} />
        ) : (
          <AdminPanel>
            <EmptyState
              title="Pick a theme to start"
              description="Select a level and theme on the left. Themes with the “Needs content” badge have no published lesson yet — that's the backlog to work through."
            />
          </AdminPanel>
        )}
      </div>
    </>
  );
}
