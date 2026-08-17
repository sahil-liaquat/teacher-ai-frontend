import { SetupShell } from "@/components/school-admin/onboarding/setup-shell";

/**
 * Guided setup renders OUTSIDE the School Admin shell.
 *
 * ⚠ This is the whole point of the `(shell)` route group beside it. Setup used
 * to be a child of the shell layout, so a school on step 1 saw the complete ERP
 * sidebar — Curriculum, Calendar, Teachers, Resources, Assessments, Progress —
 * before it had a framework, a level or an academic year. Every one of those
 * was a dead end.
 *
 * The URL is unchanged: a route group carries no path segment.
 */
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <SetupShell>{children}</SetupShell>;
}
