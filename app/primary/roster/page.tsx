import { PrimaryApp } from "@/components/primary/primary-app";

/**
 * The roster route.
 *
 * ⚠ This directory existed with no page in it. `primary-roster-page.tsx` and
 * `primary-student-profile.tsx` were complete, 13 endpoints served them, and
 * `components/primary/CLAUDE.md` documented `/primary/roster` as live — but
 * nothing rendered them, so the whole per-child observation feature was
 * unreachable. Worse, `PrimarySection` is the teacher's only notion of a class
 * and this was the only screen that could create one, which left the Today
 * page's class picker permanently empty.
 */
export default function RosterPage() {
  return <PrimaryApp page="roster" />;
}
