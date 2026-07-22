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

test("Google OAuth cleanup preserves the refresh token used by the app session", () => {
  const callback = source("app/auth/callback/page.tsx");
  const supabase = source("lib/supabase.ts");

  assert.match(callback, /clearSupabaseOAuthStorage\(\)/);
  assert.doesNotMatch(callback, /auth\.signOut/);
  assert.match(supabase, /localStorage\.removeItem\(SUPABASE_OAUTH_STORAGE_KEY\)/);
  assert.match(supabase, /localStorage\.removeItem\(`\$\{SUPABASE_OAUTH_STORAGE_KEY\}-code-verifier`\)/);
});

test("desktop login logo stays clickable above the testimonial panel", () => {
  const login = source("app/login/page.tsx");

  assert.match(login, /relative z-20 flex items-center justify-between[\s\S]*aria-label="TeachPad home"/);
  assert.match(login, /relative z-10 mx-auto flex max-w-2xl/);
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

test("dashboard profile icons open the account screen directly", () => {
  const shell = source("components/app-shell.tsx");
  const settings = source("app/dashboard/settings/page.tsx");

  assert.match(shell, /const profileHref = "\/dashboard\/settings\?section=account"/);
  assert.equal((shell.match(/href=\{profileHref\}/g) || []).length, 2);
  assert.match(settings, /settingsScreenFromQuery\(searchParams\.get\("section"\)\)/);
  assert.match(settings, /router\.replace\("\/dashboard\/settings", \{ scroll: false \}\)/);
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

test("admin workshop previews can render the user-facing detail route", () => {
  const workshopsAdmin = source("app/admin/workshops/page.tsx");
  const appShell = source("components/app-shell.tsx");

  assert.match(workshopsAdmin, /dashboard\/workshops\/\$\{w\.id\}\?preview=user/);
  assert.match(appShell, /const allowsAdminWorkshopPreview/);
  assert.match(appShell, /pathname\.startsWith\("\/dashboard\/workshops\/"\)/);
  assert.match(appShell, /currentUser\.role === "admin" && !allowsAdminWorkshopPreview/);
});

test("workshop editing loads hosts within the API limit and preserves assigned hosts", () => {
  const workshopsAdmin = source("app/admin/workshops/page.tsx");

  assert.match(workshopsAdmin, /backendApi\.hosts\(false, 0, 100\)/);
  assert.match(workshopsAdmin, /const workshopHostOptions = useMemo/);
  assert.match(workshopsAdmin, /editingWorkshop\?\.hosts \|\| \[\]/);
  assert.match(workshopsAdmin, /workshopHostOptions\.map/);
  assert.doesNotMatch(workshopsAdmin, /backendApi\.hosts\(false, 0, 150\)/);
});

test("teacher workshop views render uploaded banners with image fallback", () => {
  const workshopImage = source("components/workshop-image.tsx");
  const workshopList = source("app/dashboard/workshops/page.tsx");
  const workshopDetail = source("app/dashboard/workshops/[id]/page.tsx");
  const academy = source("app/academy/page.tsx");

  assert.match(workshopImage, /resolveUploadUrl\(bannerUrl\)/);
  assert.match(workshopImage, /onError=\{\(\) => setFailedUrl\(src\)\}/);
  assert.match(workshopImage, /object-cover object-center/);
  assert.match(workshopImage, /h-full w-full/);
  for (const page of [workshopList, workshopDetail, academy]) {
    assert.match(page, /bannerUrl=\{workshop\.banner_url\}/);
    assert.doesNotMatch(page, /thumbnailUrl|prefer=/);
  }
});

test("workshops use one centered 16 by 9 banner everywhere", () => {
  const api = source("lib/api.ts");
  const workshopImage = source("components/workshop-image.tsx");
  const workshopsAdmin = source("app/admin/workshops/page.tsx");
  const workshopList = source("app/dashboard/workshops/page.tsx");
  const workshopDetail = source("app/dashboard/workshops/[id]/page.tsx");
  const academy = source("app/academy/page.tsx");

  for (const file of [api, workshopImage, workshopsAdmin, workshopList, workshopDetail, academy]) {
    assert.doesNotMatch(file, /thumbnail_url|thumbnailUrl|Thumbnail Image|Upload Thumb/);
  }
  assert.match(workshopsAdmin, /Recommended: 1600 × 900 px \(16:9\)/);
  assert.match(workshopList, /aspect-video/);
  assert.match(workshopDetail, /aspect-video/);
  assert.ok((academy.match(/aspect-video/g) || []).length >= 2);
});

test("workshop cards use 12-hour times and a prominent registration action", () => {
  const workshopList = source("app/dashboard/workshops/page.tsx");
  const workshopDetail = source("app/dashboard/workshops/[id]/page.tsx");
  const academy = source("app/academy/page.tsx");

  for (const page of [workshopList, workshopDetail, academy]) {
    assert.match(page, /hour12: true/);
  }
  assert.match(workshopList, /grid grid-cols-2 gap-2\.5[\s\S]*View Details[\s\S]*Register Now/);
  assert.match(workshopList, /h-12 w-full[\s\S]*View Details/);
  assert.match(workshopList, /h-12 w-full rounded-\[16px\][\s\S]*Register Now/);
  assert.match(academy, /h-12 flex-1 rounded-full[\s\S]*Register Now/);
});

test("workshop status labels stay outside banner image areas", () => {
  const workshopList = source("app/dashboard/workshops/page.tsx");
  const academy = source("app/academy/page.tsx");

  assert.doesNotMatch(workshopList, /absolute right-3 top-3[\s\S]*modeLabel/);
  assert.doesNotMatch(academy, /absolute left-4 top-4[\s\S]*Featured/);
  assert.doesNotMatch(academy, /absolute right-3 top-3[\s\S]*ModeBadge/);
});

test("registered workshop cards only show a meeting action for an admin-provided link", () => {
  const workshopList = source("app/dashboard/workshops/page.tsx");

  assert.match(workshopList, /const meetingLink = workshop\.meeting_link\?\.trim\(\) \|\| null/);
  assert.match(workshopList, /meetingLink \? \([\s\S]*href=\{meetingLink\}[\s\S]*Join Meeting/);
  assert.match(workshopList, /variant="danger"[\s\S]*Cancel/);
  assert.doesNotMatch(workshopList, /> Join Link/);
});

test("workshop media accepts permanent absolute cloud URLs", () => {
  const api = source("lib/api.ts");
  const workshopsAdmin = source("app/admin/workshops/page.tsx");
  const workshopList = source("app/dashboard/workshops/page.tsx");
  const workshopDetail = source("app/dashboard/workshops/[id]/page.tsx");
  const academy = source("app/academy/page.tsx");

  assert.match(api, /if \(\/\^https\?:\\\/\\\/\/i\.test\(value\)\) return value/);
  for (const page of [workshopsAdmin, workshopList, workshopDetail, academy]) {
    assert.match(page, /resolveUploadUrl/);
    assert.doesNotMatch(page, /BACKEND_ROOT\}\/uploads\/\$\{/);
  }
});

test("admin workshop ledger uses readable icon controls", () => {
  const workshopsAdmin = source("app/admin/workshops/page.tsx");

  assert.match(workshopsAdmin, /title="Preview as user"[\s\S]*h-\[18px\] w-\[18px\]/);
  assert.match(workshopsAdmin, /size="icon"[\s\S]*title="Duplicate"/);
  assert.match(workshopsAdmin, /size="icon"[\s\S]*title="Edit"/);
  assert.match(workshopsAdmin, /size="icon"[\s\S]*title="Delete"/);
});

test("admin signup activity appears immediately before product activity", () => {
  const dashboard = source("app/admin/page.tsx");
  const signup = dashboard.indexOf('title="30-day signup activity"');
  const product = dashboard.indexOf('title="30-day product activity"');

  assert.ok(signup >= 0);
  assert.ok(product > signup);
  assert.doesNotMatch(dashboard.slice(signup, product), /title="Teaching streak impact"/);
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
