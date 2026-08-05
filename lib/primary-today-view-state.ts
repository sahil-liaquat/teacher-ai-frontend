export type PrimaryTodayViewState = "loading" | "generating" | "error" | "empty" | "plan";

export type PrimaryTodayViewInput = {
  contextLoading: boolean;
  dayLoading: boolean;
  dayFailed: boolean;
  generating: boolean;
  activityCount: number;
};

export function primaryTodayViewState(input: PrimaryTodayViewInput): PrimaryTodayViewState {
  if (input.generating) return "generating";
  if (input.contextLoading || input.dayLoading) return "loading";
  if (input.dayFailed && input.activityCount === 0) return "error";
  return input.activityCount === 0 ? "empty" : "plan";
}
