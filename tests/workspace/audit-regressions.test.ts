import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(relativePath: string) {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

test("Saved Resources dashboard actions use the saved library route", () => {
  const dashboard = source("components/dashboard/dashboard-client.tsx");
  const savedResourceLines = dashboard
    .split("\n")
    .filter((line) => line.includes('"Saved Resources"'));

  assert.ok(savedResourceLines.length >= 2);
  assert.ok(savedResourceLines.every((line) => line.includes('href: "/dashboard/resources"')));
});

test("dashboard does not request the missing lesson plan summary endpoint", () => {
  assert.doesNotMatch(source("lib/api.ts"), /lesson-plans\/summary/);
  assert.doesNotMatch(source("components/dashboard/dashboard-client.tsx"), /lessonPlanSummary/);
});

test("unfinished reports UI redirects instead of showing placeholder analytics", () => {
  const config = source("next.config.mjs");
  const reports = source("app/dashboard/reports/page.tsx");

  assert.match(config, /source: "\/dashboard\/reports"/);
  assert.match(config, /destination: "\/dashboard"/);
  assert.doesNotMatch(reports, /Total Generations|Export Report|Apply Filters/);
});

test("Google OAuth renders consistently during server and client rendering", () => {
  const button = source("components/auth/google-button.tsx");
  const supabase = source("lib/supabase.ts");

  assert.match(button, /if \(!isSupabaseConfigured\(\)\) return null/);
  assert.match(supabase, /export function isSupabaseConfigured/);
  assert.match(button, /const supabase = getSupabaseClient\(\);/);
});

test("Webpack ignores pptxgenjs Node-only browser-incompatible imports", () => {
  const config = source("next.config.mjs");

  assert.match(config, /IgnorePlugin/);
  assert.match(config, /\^node:\(fs\|https\)\$/);
});

test("public account pages have specific document titles", () => {
  assert.match(source("app/login/layout.tsx"), /title: "Log in \| TeachPad"/);
  assert.match(source("app/signup/layout.tsx"), /title: "Create account \| TeachPad"/);
  assert.match(source("app/academy/layout.tsx"), /title: "Teacher Growth Hub \| TeachPad"/);
});

test("settings never invents or shares an unassigned referral code", () => {
  const settings = source("app/dashboard/settings/page.tsx");

  assert.doesNotMatch(settings, /TEACH14/);
  assert.match(settings, /primaryCode \?/);
  assert.match(settings, /Your referral code is being set up/);
});

test("chapter page no longer exposes Elif, sharing or three-dot controls", () => {
  const chapter = source("app/dashboard/my-workspace/topic/[workspaceId]/[topicId]/page.tsx");
  const resourceCard = source("components/workspace/resource-card.tsx");

  assert.doesNotMatch(chapter, /Elif|View Suggestions|Share with Team|MoreVertical/);
  assert.doesNotMatch(resourceCard, /MoreHorizontal|More options|<details/);
  assert.match(chapter, /Back to Workspace/);
});

test("shared Select renders one accessible native combobox", () => {
  const select = source("components/ui/select.tsx");
  const nativeSelects = select.match(/<select\b/g) || [];

  assert.equal(nativeSelects.length, 1);
  assert.doesNotMatch(select, /@radix-ui\/react-select|SelectPrimitive/);
});

test("Saved Resources uses explicit proper plural labels", () => {
  const resources = source("app/dashboard/resources/page.tsx");

  assert.match(resources, /pluralLabel: "Notes"/);
  assert.match(resources, /pluralLabel: "Activities"/);
  assert.doesNotMatch(resources, /\{m\.label\}s/);
});

test("workspace surfaces use the shared generation-ranked chapter feed", () => {
  const dashboardClasses = source("components/dashboard/my-classes-section.tsx");
  const workspaceHome = source("components/workspace/workspace-home.tsx");
  assert.match(dashboardClasses, /recentChapters\.slice\(0, 3\)/);
  assert.match(workspaceHome, /recent_chapters\?\.slice\(0, 5\)/);
});

test("header notifications keep a visible unread badge until an item is opened", () => {
  const notifications = source("components/notifications/notification-center.tsx");
  const appShell = source("components/app-shell.tsx");

  assert.match(notifications, /text-\[#0B73FF\]/);
  assert.match(notifications, /unreadCount > 0/);
  assert.match(notifications, /bg-red-600/);
  assert.match(notifications, /onClick=\{\(\) => read\(item\)\}/);
  assert.match(appShell, /border-2 border-white bg-white shadow-sm ring-4 ring-blue-100/);
});

test("dashboard identity controls render only on the role home page", () => {
  const appShell = source("components/app-shell.tsx");

  assert.match(appShell, /const isHomeDashboard = pathname === homeHref/);
  assert.match(appShell, /\{isHomeDashboard \? \(/);
  assert.match(appShell, /\{isHomeDashboard && \(/);
});

test("preparation progress uses a rounded SVG ring", () => {
  const continueCard = source("components/workspace/continue-preparing-card.tsx");

  assert.match(continueCard, /strokeLinecap="round"/);
  assert.match(continueCard, /strokeWidth="18"/);
  assert.match(continueCard, /const progressColor = \["#ef4444".+"#10b981"\]/);
  assert.doesNotMatch(continueCard, /\{progress\.percentage\}% complete/);
  assert.doesNotMatch(continueCard, /preparation-progress-gradient/);
  assert.doesNotMatch(continueCard, /conic-gradient/);
});

test("sidebar uses the requested Workspace and Saved icon colors", () => {
  const appShell = source("components/app-shell.tsx");

  assert.match(appShell, /Workspace: "text-green-500"/);
  assert.match(appShell, /Saved: "text-red-500"/);
});
