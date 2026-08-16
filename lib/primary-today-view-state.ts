export type PrimaryTodayViewState =
  | "loading"
  | "generating"
  | "error"
  | "no-teaching"
  | "empty"
  | "plan";

export type PrimaryTodayViewInput = {
  contextLoading: boolean;
  dayLoading: boolean;
  dayFailed: boolean;
  generating: boolean;
  activityCount: number;
  /**
   * What the school calendar says this date is. Undefined when the backend
   * sent nothing — an older API, or a caller with no school to resolve — in
   * which case the page behaves exactly as it did before this state existed.
   *
   * ⚠ `is_teaching_day` is the server's derived answer, not a weekday check.
   * A "no curriculum" day is a TEACHING day: the school is open and the
   * curriculum has a gap, so the teacher still gets the plan surface.
   */
  isTeachingDay?: boolean;
};

/**
 * ⚠ `no-teaching` sits ABOVE `empty` and below `plan`, and both placements are
 * deliberate.
 *
 * Above `empty`: "no activities planned" invites the teacher to generate one,
 * which on a Sunday is an invitation to a request the server will decline. The
 * honest state is "your school isn't teaching today, here's the next day that
 * is".
 *
 * Below `plan`: a day that already HAS a plan keeps showing it. A teacher who
 * planned a Saturday catch-up class, or whose school marked a date closed after
 * they generated it, must not have their work hidden by a calendar rule.
 */
export function primaryTodayViewState(input: PrimaryTodayViewInput): PrimaryTodayViewState {
  if (input.generating) return "generating";
  if (input.contextLoading || input.dayLoading) return "loading";
  if (input.dayFailed && input.activityCount === 0) return "error";
  if (input.activityCount > 0) return "plan";
  return input.isTeachingDay === false ? "no-teaching" : "empty";
}
