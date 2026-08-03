/**
 * Pure helpers behind /primary/roster and the per-child profile.
 *
 * IMPORT-FREE ON PURPOSE. This module is executed by
 * `node --experimental-strip-types --test`, which resolves neither the `@/*`
 * path alias nor a transitive module graph. It therefore OWNS the two wire
 * vocabularies (ratings, trends) as runtime arrays, and `lib/api.ts`
 * type-imports them from here — not the other way round. Same arrangement as
 * lib/primary-coverage.ts.
 *
 * `toLocalISODate` is duplicated from lib/primary-coverage.ts for the same
 * reason. Both copies are pinned to identical literal outputs by their tests,
 * which is the only coupling an import-free module can have.
 *
 * tsconfig is `target: "es5"` with no `downlevelIteration`: never iterate or
 * spread a Set/Map in this file. Arrays only.
 *
 * No `toLocaleDateString` anywhere: its output varies with the runtime's ICU
 * build, which would make these labels untestable.
 */

export const OBSERVATION_RATINGS = ["not_yet", "emerging", "secure"] as const;
export type ObservationRating = (typeof OBSERVATION_RATINGS)[number];

export const OBSERVATION_TRENDS = [
  "single",
  "improving",
  "steady",
  "slipping",
] as const;
export type ObservationTrend = (typeof OBSERVATION_TRENDS)[number];

export type RatingTone = { dot: string; chip: string; text: string };

export const RATING_LABELS: Record<ObservationRating, string> = {
  not_yet: "Not yet",
  emerging: "Emerging",
  secure: "Secure",
};

/** For the per-child chips in the activity drawer, where space is tight. */
export const RATING_SHORT_LABELS: Record<ObservationRating, string> = {
  not_yet: "Not yet",
  emerging: "Emerging",
  secure: "Secure",
};

export const TREND_LABELS: Record<ObservationTrend, string> = {
  single: "One observation",
  improving: "Improving",
  steady: "Steady",
  slipping: "Slipping",
};

const RATING_TONES: Record<ObservationRating, RatingTone> = {
  not_yet: { dot: "bg-rose-400", chip: "bg-rose-50 border-rose-200", text: "text-rose-700" },
  emerging: { dot: "bg-amber-400", chip: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  secure: { dot: "bg-emerald-500", chip: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
};

export function ratingTone(rating: ObservationRating): RatingTone {
  return RATING_TONES[rating];
}

export function ratingOrdinal(rating: string): number {
  return OBSERVATION_RATINGS.indexOf(rating as ObservationRating);
}

/**
 * Direction of travel across `ratings`, which must be chronological.
 *
 * First versus last, deliberately — the same rule the backend applies in
 * services/primary_roster.trend_from. Duplicated rather than only trusted from
 * the wire so the drawer can show a direction before the profile is fetched.
 */
export function trendFrom(ratings: readonly string[]): ObservationTrend {
  if (ratings.length <= 1) return "single";
  const first = ratingOrdinal(ratings[0]);
  const last = ratingOrdinal(ratings[ratings.length - 1]);
  if (last > first) return "improving";
  if (last < first) return "slipping";
  return "steady";
}

export function summariseRatings(ratings: readonly string[]): {
  not_yet: number;
  emerging: number;
  secure: number;
  total: number;
} {
  const summary = { not_yet: 0, emerging: 0, secure: 0, total: 0 };
  for (let index = 0; index < ratings.length; index += 1) {
    const rating = ratings[index];
    if (rating === "not_yet") summary.not_yet += 1;
    else if (rating === "emerging") summary.emerging += 1;
    else if (rating === "secure") summary.secure += 1;
    summary.total += 1;
  }
  return summary;
}

/** Trim, collapse internal whitespace, and cut to the column width (40). */
export function normaliseStudentCode(raw: string): string {
  return String(raw == null ? "" : raw)
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")
    .slice(0, 40);
}

export function isValidStudentCode(raw: string): boolean {
  return normaliseStudentCode(raw).length > 0;
}

export function toLocalISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * The Indian academic year containing `today`: 1 April to 31 March.
 *
 * TeachPad has no terms table and JKBOSE school calendars do not agree on term
 * boundaries, so "the year" is the widest window a teacher would call a term,
 * and they can narrow it with the date inputs.
 */
export function defaultTermRange(today: Date): { start: string; end: string } {
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    start: toLocalISODate(new Date(startYear, 3, 1)),
    end: toLocalISODate(new Date(startYear + 1, 2, 31)),
  };
}

/** "1 Apr 2026 - 31 Mar 2027". ASCII only — a plain hyphen, never an en dash. */
export function formatTermLabel(start: string, end: string): string {
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatShortDate(iso: string): string {
  const parts = iso.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return `${day} ${MONTH_ABBREVIATIONS[month - 1]} ${year}`;
}
