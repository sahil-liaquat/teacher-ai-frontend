// Pure helpers for the admin curriculum-feedback panel. No imports, no
// backend calls — everything here is a plain function of a skip_rate value,
// tested without a DOM or a network mock.

export type SkipSeverity = "danger" | "warning" | "neutral" | "unknown";

/** null means "no resolved attempts yet" — always the least alarming tone,
 *  never rendered as if it were a clean 0%. */
export function skipSeverity(skipRate: number | null): SkipSeverity {
  if (skipRate === null) return "unknown";
  if (skipRate >= 50) return "danger";
  if (skipRate >= 25) return "warning";
  return "neutral";
}

export function formatSkipRate(skipRate: number | null): string {
  return skipRate === null ? "No data yet" : `${skipRate}% skipped`;
}

