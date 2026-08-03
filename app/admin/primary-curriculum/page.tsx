"use client";

import { useState } from "react";
import type { PrimaryCurriculumTheme, PrimaryLevel } from "@/lib/api";
import { AdminPageHeader, AdminPanel, EmptyState } from "@/components/admin/admin-ui";
import { LessonEditor } from "@/components/admin/primary-curriculum/lesson-editor";
import { LEVEL_OPTIONS, ThemeList } from "@/components/admin/primary-curriculum/theme-list";
import { FeedbackPanel } from "@/components/admin/primary-curriculum/feedback-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "authoring" | "feedback";

export default function AdminPrimaryCurriculumPage() {
  const [tab, setTab] = useState<Tab>("authoring");
  const [level, setLevel] = useState<PrimaryLevel>(LEVEL_OPTIONS[0].value);
  const [selectedTheme, setSelectedTheme] = useState<PrimaryCurriculumTheme | null>(null);

  return (
    <>
      <AdminPageHeader
        eyebrow="TeachPad Primary"
        title="Curriculum authoring"
        description="Author and edit the theme lessons Primary teachers get on their daily plan. Themes marked 'Needs content' have no published lesson at the selected level yet."
        actions={
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={tab === "authoring" ? "default" : "ghost"} onClick={() => setTab("authoring")}>
              Authoring
            </Button>
            <Button type="button" size="sm" variant={tab === "feedback" ? "default" : "ghost"} onClick={() => setTab("feedback")}>
              Feedback
            </Button>
          </div>
        }
      />

      {tab === "feedback" ? (
        <div className="mt-6">
          <FeedbackPanel />
        </div>
      ) : (
        <div className={cn("grid gap-6 xl:grid-cols-[380px_1fr] xl:items-start", "mt-6")}>
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
      )}
    </>
  );
}
