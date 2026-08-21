/**
 * The /school-excellence photography.
 *
 * The page's diagrams are drawn in `visuals.tsx` rather than imported as
 * renders — they have to name exactly what the copy names, and a raster file
 * cannot be kept honest against edited copy. What remains here is the one thing
 * that genuinely has to be a photograph.
 *
 * Intrinsic dimensions live next to the path so a full-width image cannot ship
 * with a wrong aspect ratio and shift the layout on load.
 *
 * The wider illustration set still lives in `public/landing/se/` and can be
 * re-imported with `node scripts/import-se-images.mjs`.
 */

export type SeImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

const dir = "/landing/se";

export const seImages = {
  /** The one photograph on the page — the principals' section. */
  leadership: {
    src: `${dir}/school-leadership.jpg`,
    width: 1600,
    height: 900,
    alt: "A school principal standing in front of a classroom of students working with their teacher.",
  },
} satisfies Record<string, SeImage>;
