/**
 * Which of the Today page's five mutually-exclusive bodies to render.
 *
 * This lived inline as a chain of ternaries that had no branch for a failed
 * fetch at all: `data` came back undefined, `planner_activities` defaulted to
 * `[]`, and the page told the teacher there was nothing planned for a day that
 * was in fact already planned.
 */
export type PrimaryTodayViewState =
  | "loading"
  | "generating"
  | "error"
  | "empty"
  | "plan";

export type PrimaryTodayViewInput = {
  /** The teaching context (class/subject/theme) is still resolving. */
  contextLoading: boolean;
  /** First load of GET /primary/today for this date + section. */
  dayLoading: boolean;
  /** That query is in an error state. */
  dayFailed: boolean;
  /** A generate/regenerate round-trip is in flight. */
  generating: boolean;
  activityCount: number;
};

export function primaryTodayViewState(
  input: PrimaryTodayViewInput
): PrimaryTodayViewState {
  // Generating outranks everything: the success path invalidates the query, so
  // deferring to `dayLoading` here would swap the "building your plan" panel
  // for a bare spinner halfway through, and deferring to `dayFailed` would
  // re-show the failure the teacher is already retrying.
  if (input.generating) return "generating";
  if (input.contextLoading || input.dayLoading) return "loading";
  // A failed refetch that left usable data behind is not worth an error panel —
  // the teacher is mid-class and the plan on screen is still teachable.
  if (input.dayFailed && input.activityCount === 0) return "error";
  return input.activityCount === 0 ? "empty" : "plan";
}
