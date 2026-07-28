const baseUrl = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const routes = [
  "/dashboard",
  "/dashboard/my-workspace",
  "/dashboard/classroom-tools",
  "/dashboard/workshops",
  "/dashboard/recent-generations",
  "/dashboard/resources",
  "/dashboard/textbooks",
  "/dashboard/billing",
  "/dashboard/settings",
  "/dashboard/reports",
  "/dashboard/lesson-plans/smoke-test",
  "/dashboard/worksheets/smoke-test",
  "/dashboard/presentation-generator/output?id=smoke-test",
  "/dashboard/notes-generator?id=smoke-test",
  "/dashboard/activity-generator?id=smoke-test"
];

const failures = [];

for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(60_000)
    });
    const passed = response.status >= 200 && response.status < 400;
    process.stdout.write(`${passed ? "PASS" : "FAIL"} ${response.status} ${route}\n`);
    if (!passed) failures.push(`${route} returned ${response.status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`FAIL --- ${route} (${message})\n`);
    failures.push(`${route}: ${message}`);
  }
}

if (failures.length) {
  process.stderr.write(`\n${failures.length} route smoke test(s) failed:\n${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`\nAll ${routes.length} routes passed at ${baseUrl}.\n`);
}
