import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const PAGE = "app/admin/organizations/page.tsx";

/** helper name -> URL literals in its definition, parsed from lib/api.ts */
function apiHelperUrls(): Map<string, string[]> {
  const lines = read("lib/api.ts").split("\n");
  const urls = new Map<string, string[]>();
  let current: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (!current) return;
    const found = buffer.join("\n").match(/["'`](\/[A-Za-z0-9_\-/${}.?=&]*)/g) ?? [];
    urls.set(current, found.map((u) => u.slice(1)));
  };
  for (const line of lines) {
    const start = line.match(/^ {2}([A-Za-z][A-Za-z0-9_]*):/);
    if (start) {
      flush();
      current = start[1];
      buffer = [line];
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();
  return urls;
}

const HELPERS = apiHelperUrls();
const urlsFor = (helper: string) => HELPERS.get(helper) ?? [];

/** the body of one helper definition, for asserting on method/payload */
function helperSource(helper: string): string {
  const source = read("lib/api.ts");
  const start = source.indexOf(`\n  ${helper}:`);
  assert.notEqual(start, -1, `${helper} is missing from lib/api.ts`);
  const rest = source.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[A-Za-z][A-Za-z0-9_]*:/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

// ---- API helpers ---------------------------------------------------------

test("organization helpers hit the platform-admin organization routes", () => {
  assert.ok(urlsFor("adminOrganizations")[0].startsWith("/admin/organizations"));
  assert.ok(urlsFor("adminOrganization")[0].startsWith("/admin/organizations/"));
  assert.deepEqual(urlsFor("adminCreateOrganization"), ["/admin/organizations"]);
  assert.ok(urlsFor("adminUpdateOrganization")[0].startsWith("/admin/organizations/"));
  assert.ok(urlsFor("adminDeleteOrganization")[0].startsWith("/admin/organizations/"));
});

test("membership helpers hit the platform-admin user routes", () => {
  assert.ok(urlsFor("adminAssignUserOrganization")[0].includes("/admin/users/"));
  assert.ok(urlsFor("adminAssignUserOrganization")[0].endsWith("/organization"));
  assert.ok(urlsFor("adminUnassignUserOrganization")[0].endsWith("/organization"));
  assert.ok(urlsFor("adminPromoteOrgAdmin")[0].endsWith("/promote-org-admin"));
  assert.ok(urlsFor("adminDemoteOrgAdmin")[0].endsWith("/demote-org-admin"));
});

test("each helper uses the HTTP method its route is mounted with", () => {
  // A wrong verb here is a 405 the UI would surface as a generic failure.
  assert.match(helperSource("adminCreateOrganization"), /method: "POST"/);
  assert.match(helperSource("adminUpdateOrganization"), /method: "PATCH"/); // PATCH, not PUT
  assert.match(helperSource("adminDeleteOrganization"), /method: "DELETE"/);
  assert.match(helperSource("adminAssignUserOrganization"), /method: "PUT"/); // PUT, not POST
  assert.match(helperSource("adminUnassignUserOrganization"), /method: "DELETE"/);
  assert.match(helperSource("adminPromoteOrgAdmin"), /method: "POST"/);
  assert.match(helperSource("adminDemoteOrgAdmin"), /method: "POST"/);
});

test("mutating helpers send the exact body their schema requires", () => {
  // OrganizationAssignmentRequest / OrgAdminPromotionRequest: organization_id.
  assert.match(helperSource("adminAssignUserOrganization"), /organization_id: organizationId/);
  assert.match(helperSource("adminPromoteOrgAdmin"), /organization_id: organizationId/);
  // OrgAdminDemotionRequest: unassign, defaulting to false.
  assert.match(helperSource("adminDemoteOrgAdmin"), /unassign = false/);
  assert.match(helperSource("adminDemoteOrgAdmin"), /JSON\.stringify\(\{ unassign \}\)/);
});

test("organization helpers never touch the school-admin surface", () => {
  // Managing tenants is platform-admin work. A helper reaching /school-admin
  // here would be inverting the ownership model.
  for (const helper of [
    "adminOrganizations", "adminOrganization", "adminCreateOrganization",
    "adminUpdateOrganization", "adminDeleteOrganization",
    "adminAssignUserOrganization", "adminUnassignUserOrganization",
    "adminPromoteOrgAdmin", "adminDemoteOrgAdmin",
  ]) {
    for (const url of urlsFor(helper)) {
      assert.ok(!url.startsWith("/school-admin"), `${helper} points at ${url}`);
    }
  }
});

test("ApiUser carries organization_id so membership can be resolved", () => {
  // GET /users returns it (AdminUserListItem); the type used to omit it, which
  // would have made the whole grouping silently empty.
  assert.match(read("lib/api.ts"), /organization_id\?: string \| null;/);
});

// ---- the page ------------------------------------------------------------

test("the organizations page exists and is inside the platform-admin shell", () => {
  assert.equal(existsSync(`${root}/${PAGE}`), true);
  // Everything under app/admin is wrapped by AdminShell, which renders an auth
  // screen unless role === "admin". That is the gate for this page.
  assert.match(read("app/admin/layout.tsx"), /AdminShell/);
  assert.match(read("components/admin/admin-shell.tsx"), /currentUser\.role !== "admin"/);
});

test("the page is reachable from the platform-admin navigation", () => {
  const shell = read("components/admin/admin-shell.tsx");
  assert.match(shell, /href: "\/admin\/organizations", label: "Schools"/);
});

test("the page uses the admin design system rather than bespoke chrome", () => {
  const page = read(PAGE);
  for (const component of ["AdminPageHeader", "AdminPanel", "EmptyState", "LoadingState", "MetricCard", "StatusPill"]) {
    assert.match(page, new RegExp(component), `page does not use ${component}`);
  }
});

test("the page covers loading, empty, error and success states", () => {
  const page = read(PAGE);
  assert.match(page, /isLoading \?/, "no loading state");
  assert.match(page, /isError \?/, "no error state");
  assert.match(page, /EmptyState/, "no empty state");
  assert.match(page, /variant: "success"/, "no success feedback");
  assert.match(page, /variant: "error"/, "no error feedback");
  assert.match(page, /getErrorMessage/, "raw errors would reach the UI");
});

// ---- the flows that matter ----------------------------------------------

test("the page performs tenant onboarding without becoming a staffing console", () => {
  const page = read(PAGE);
  assert.match(page, /backendApi\.adminOrganizations\(/, "cannot list schools");
  assert.match(page, /backendApi\.adminCreateOrganization\(/, "cannot create");
  assert.match(page, /backendApi\.adminDeleteOrganization\(/, "cannot delete");
  assert.match(page, /backendApi\.adminInviteInitialSchoolAdmin\(/, "cannot invite the initial School Admin");
  assert.match(page, /curriculum_starting_point/);
  assert.match(page, /curriculum_entitlement/);
});

test("platform admins cannot assign or unassign normal teachers", () => {
  const page = read(PAGE);
  assert.doesNotMatch(page, /backendApi\.adminAssignUserOrganization\(/);
  assert.doesNotMatch(page, /backendApi\.adminUnassignUserOrganization\(/);
  assert.doesNotMatch(page, /Assign a teacher/);
});

test("initial School Admin access is consent-driven", () => {
  const page = read(PAGE);
  assert.match(page, /Invite a School Admin/);
  assert.match(page, /Acceptance links the account to this school/);
});

test("teacher membership is only displayed as read-only support data", () => {
  const page = read(PAGE);
  assert.match(page, /Operational school data is read-only here/);
  assert.doesNotMatch(page, /Teacher assigned/);
});

test("School Admins are visually distinguished from teachers", () => {
  const page = read(PAGE);
  assert.match(page, /role === "org_admin"/);
  assert.match(page, /School Admin/);
  assert.match(page, /ShieldCheck/);
});

test("a school with no School Admin is called out", () => {
  const page = read(PAGE);
  assert.match(page, /No School Admin/);
});

test("the delete conflict is explained rather than shown as a raw failure", () => {
  // DELETE 409s while any user is still assigned.
  assert.match(read(PAGE), /Schools with members or curriculum cannot be deleted/);
});

test("the page uses the real tenancy model, not the legacy schools record", () => {
  const page = read(PAGE);
  // The onboarding `School` model is self-asserted metadata that grants no
  // access; mixing it in here would misrepresent who owns what.
  assert.doesNotMatch(page, /backendApi\.(createSchool|updateSchool|deleteSchool|schoolTemplates)\b/);
  assert.doesNotMatch(page, /["'`]\/schools/);
  assert.match(page, /organization_id/);
});
