/**
 * Display face for /school-excellence.
 *
 * A single shared module so the page and the (portalled) lead-form dialog use
 * the same self-hosted font instance. `next/font` inlines the files at build
 * time — no runtime request to Google, no layout shift.
 *
 * Newsreader is an editorial serif: it gives the page the weight of a school
 * prospectus rather than a SaaS landing page. Only the single weight the page
 * uses is requested — a second weight would be preloaded and never painted.
 */

import { Newsreader } from "next/font/google";

export const seDisplay = Newsreader({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  display: "swap",
  variable: "--font-se-display",
  fallback: ["ui-serif", "Iowan Old Style", "Georgia", "Times New Roman", "serif"],
});
