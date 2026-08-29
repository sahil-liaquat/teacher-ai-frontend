/**
 * Collapse an arbitrary pixel font size onto the eight-step scale.
 *
 * Anything below 12px is raised to the floor rather than preserved: 258
 * instances of 7-11px type exist, and on a 360px Android phone they are not
 * readable at all.
 */
const BANDS: { max: number; token: string }[] = [
  { max: 12.9, token: "text-micro" },
  { max: 15.9, token: "text-sm" },
  { max: 17.9, token: "text-base" },
  { max: 21.9, token: "text-lead" },
  { max: 27.9, token: "text-h3" },
  { max: 33.9, token: "text-h2" },
  { max: 43.9, token: "text-h1" }
];

export function mapFontSize(px: number): string {
  for (const band of BANDS) if (px <= band.max) return band.token;
  return "text-display";
}
