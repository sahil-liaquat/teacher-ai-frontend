/**
 * Colours for charts.
 *
 * Recharts takes paint values, not class names, so chart colours cannot be
 * Tailwind utilities the way the rest of the app's colours are. Keeping them
 * here means retokenising a chart is an edit in one place rather than a hunt
 * through every chart component.
 *
 * Every value must mirror a step on the Tailwind ramp in tailwind.config.ts.
 */

/** theme.colors.brand / blue-500. Was three different blues across the admin charts. */
export const BRAND_BLUE = "#1677ff";

/** Grid lines behind the plot. slate-100. */
export const CHART_GRID = "#f1f5f9";

/** Axis rules and tooltip borders. gray-200. */
export const CHART_AXIS = "#e5e7eb";

/**
 * Axis tick labels. gray-500. The admin charts previously used #6b7280 and
 * #64748b for this same job, two greys apart by nothing a reader could name.
 */
export const CHART_LABEL = "#6b7280";

/** Category labels and bar value labels, which carry more weight. slate-600. */
export const CHART_LABEL_STRONG = "#475569";

/** Pass/fail colouring on the activation-rate figures. green-600 / red-600. */
export const CHART_GOOD = "#16a34a";
export const CHART_BAD = "#dc2626";
